import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    // Current demo state check
    const [rooms, activeAdmissions, doctors, patients] = await Promise.all([
      query<any[]>('SELECT room_id, room_number, room_type, capacity, occupied FROM rooms ORDER BY room_id ASC'),
      query<any[]>('SELECT * FROM current_admissions ORDER BY admission_id DESC'),
      query<any[]>('SELECT doctor_id, name FROM doctors ORDER BY doctor_id ASC LIMIT 3'),
      query<any[]>('SELECT patient_id, name FROM patients ORDER BY patient_id ASC LIMIT 4'),
    ]);

    return NextResponse.json({
      rooms,
      activeAdmissions,
      doctors,
      patients,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'book_appointment') {
      // Find an available doctor and patient
      const doctors = await query<any[]>('SELECT doctor_id, name FROM doctors LIMIT 1');
      const patients = await query<any[]>('SELECT patient_id, name FROM patients LIMIT 1');

      if (!doctors.length || !patients.length) {
        return NextResponse.json({ error: 'Doctors or patients not found for demo' }, { status: 400 });
      }

      // Generate a distinct time today
      const now = new Date();
      const minutes = String(Math.floor(Math.random() * 59)).padStart(2, '0');
      const timeStr = `16:${minutes}:00`;
      const dateStr = now.toISOString().slice(0, 10);

      // Execute CALL book_appointment
      await execute('CALL book_appointment(?, ?, ?, ?, ?)', [
        patients[0].patient_id,
        doctors[0].doctor_id,
        dateStr,
        timeStr,
        'Demo Routine Checkup',
      ]);

      const [newAppt] = await query<any[]>(
        `SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status, a.reason,
                p.name AS patient_name, d.name AS doctor_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         JOIN doctors d ON a.doctor_id = d.doctor_id
         ORDER BY a.appointment_id DESC LIMIT 1`
      );

      return NextResponse.json({
        success: true,
        step: 'book_appointment',
        message: 'Successfully executed CALL book_appointment()',
        appointment: newAppt,
      });
    }

    if (action === 'fill_room') {
      // Find a room with available capacity (e.g., I301 or any room with occupied < capacity)
      const availableRooms = await query<any[]>(
        'SELECT room_id, room_number, room_type, capacity, occupied FROM rooms WHERE occupied < capacity LIMIT 1'
      );

      if (!availableRooms.length) {
        // All rooms full already, return current state
        const allRooms = await query<any[]>('SELECT room_id, room_number, capacity, occupied FROM rooms');
        return NextResponse.json({
          success: true,
          step: 'fill_room',
          message: 'All rooms are already at full capacity.',
          rooms: allRooms,
        });
      }

      const targetRoom = availableRooms[0];
      const patient = await query<any[]>('SELECT patient_id, name FROM patients ORDER BY RAND() LIMIT 1');
      const doctor = await query<any[]>('SELECT doctor_id, name FROM doctors LIMIT 1');

      // Call admit_patient to fill the spot
      await execute('CALL admit_patient(?, ?, ?, ?)', [
        patient[0].patient_id,
        targetRoom.room_id,
        doctor[0].doctor_id,
        'Admitted for ICU/Observation during demo',
      ]);

      // Fetch updated room occupancy
      const [updatedRoom] = await query<any[]>(
        'SELECT room_id, room_number, capacity, occupied FROM rooms WHERE room_id = ?',
        [targetRoom.room_id]
      );

      return NextResponse.json({
        success: true,
        step: 'fill_room',
        message: `Executed CALL admit_patient(). Trigger 'after_admission' auto-incremented occupied to ${updatedRoom.occupied}/${updatedRoom.capacity}.`,
        room: updatedRoom,
      });
    }

    if (action === 'trigger_room_full') {
      // Find a room where occupied >= capacity
      const fullRooms = await query<any[]>(
        'SELECT room_id, room_number, room_type, capacity, occupied FROM rooms WHERE occupied >= capacity LIMIT 1'
      );

      if (!fullRooms.length) {
        return NextResponse.json({
          error: 'No full room found. Please click "Fill Room" first to reach maximum capacity.',
        }, { status: 400 });
      }

      const room = fullRooms[0];
      const patient = await query<any[]>('SELECT patient_id FROM patients LIMIT 1');
      const doctor = await query<any[]>('SELECT doctor_id FROM doctors LIMIT 1');

      try {
        // Intentionally call admit_patient on a full room to test the database trigger 'before_admission'
        await execute('CALL admit_patient(?, ?, ?, ?)', [
          patient[0].patient_id,
          room.room_id,
          doctor[0].doctor_id,
          'Trigger Test Admission',
        ]);

        return NextResponse.json({
          success: false,
          message: 'Admission unexpectedly succeeded; trigger did not fire.',
        });
      } catch (triggerError: any) {
        if (triggerError.sqlState === '45000') {
          return NextResponse.json({
            success: true,
            expectedErrorCaught: true,
            sqlState: '45000',
            errorMessage: triggerError.message || 'Room is full',
            proof: `Trigger 'before_admission' successfully threw SQLSTATE 45000: "${triggerError.message}" when attempting to admit into room ${room.room_number} (Capacity: ${room.capacity}, Occupied: ${room.occupied})`,
            room,
          });
        }
        throw triggerError;
      }
    }

    if (action === 'discharge') {
      // Find any currently active admission
      const active = await query<any[]>(
        `SELECT a.admission_id, a.room_id, r.room_number, r.capacity, r.occupied, p.name AS patient_name
         FROM admissions a
         JOIN rooms r ON a.room_id = r.room_id
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE a.discharge_date IS NULL
         ORDER BY a.admission_id DESC LIMIT 1`
      );

      if (!active.length) {
        return NextResponse.json({
          error: 'No active admissions to discharge.',
        }, { status: 400 });
      }

      const toDischarge = active[0];

      // Execute CALL discharge_patient
      await execute('CALL discharge_patient(?)', [toDischarge.admission_id]);

      // Check updated room occupancy
      const [updatedRoom] = await query<any[]>(
        'SELECT room_id, room_number, capacity, occupied FROM rooms WHERE room_id = ?',
        [toDischarge.room_id]
      );

      return NextResponse.json({
        success: true,
        step: 'discharge',
        message: `Executed CALL discharge_patient(${toDischarge.admission_id}). Trigger 'after_discharge' decremented room ${updatedRoom.room_number} occupied count from ${toDischarge.occupied} to ${updatedRoom.occupied}!`,
        patientDischarged: toDischarge.patient_name,
        room: updatedRoom,
      });
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
