import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { appointmentBookingSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctor_id');
    const patientId = searchParams.get('patient_id');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let sql = `
      SELECT a.appointment_id, a.patient_id, a.doctor_id,
             DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
             TIME_FORMAT(a.appointment_time, '%H:%i') as appointment_time,
             a.status, a.reason,
             p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email,
             d.name AS doctor_name, d.specialization, d.consultation_fee,
             dept.dept_name,
             (SELECT COUNT(*) FROM prescriptions pr WHERE pr.appointment_id = a.appointment_id) AS prescription_count
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN departments dept ON d.dept_id = dept.dept_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (doctorId) {
      sql += ' AND a.doctor_id = ?';
      params.push(parseInt(doctorId, 10));
    }

    if (patientId) {
      sql += ' AND a.patient_id = ?';
      params.push(parseInt(patientId, 10));
    }

    if (date) {
      sql += ' AND a.appointment_date = ?';
      params.push(date);
    }

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC';

    const appointments = await query<any[]>(sql, params);
    return NextResponse.json({ appointments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = appointmentBookingSchema.parse(body);

    // Call stored procedure: book_appointment(p_patient, p_doctor, p_date, p_time, p_reason)
    await execute('CALL book_appointment(?, ?, ?, ?, ?)', [
      validated.patient_id,
      validated.doctor_id,
      validated.appointment_date,
      validated.appointment_time,
      validated.reason || 'General Checkup',
    ]);

    return NextResponse.json(
      {
        message: 'Appointment booked successfully via stored procedure book_appointment',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
