import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { patientSchema } from '@/lib/validators';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    // 1. Patient basic info
    const patientRows = await query<any[]>(
      `SELECT patient_id, name, email, phone, gender, DATE_FORMAT(dob, '%Y-%m-%d') as dob, blood_group, address
       FROM patients WHERE patient_id = ?`,
      [patientId]
    );

    if (patientRows.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const patient = patientRows[0];

    // 2. Appointments
    const appointments = await query<any[]>(
      `SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status, a.reason,
              d.doctor_id, d.name AS doctor_name, d.specialization, dept.dept_name
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN departments dept ON d.dept_id = dept.dept_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [patientId]
    );

    // 3. Admissions
    const admissions = await query<any[]>(
      `SELECT adm.admission_id, adm.admit_date, adm.discharge_date, adm.diagnosis,
              r.room_id, r.room_number, r.room_type,
              d.doctor_id, d.name AS doctor_name
       FROM admissions adm
       JOIN rooms r ON adm.room_id = r.room_id
       JOIN doctors d ON adm.doctor_id = d.doctor_id
       WHERE adm.patient_id = ?
       ORDER BY adm.admit_date DESC`,
      [patientId]
    );

    // 4. Prescriptions (via appointments)
    const prescriptions = await query<any[]>(
      `SELECT p.prescription_id, p.medicine, p.dosage, p.duration_days,
              a.appointment_id, a.appointment_date, d.name AS doctor_name
       FROM prescriptions p
       JOIN appointments a ON p.appointment_id = a.appointment_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC`,
      [patientId]
    );

    // 5. Bills
    const bills = await query<any[]>(
      `SELECT bill_id, amount, DATE_FORMAT(bill_date, '%Y-%m-%d') as bill_date, bill_type, status
       FROM bills
       WHERE patient_id = ?
       ORDER BY bill_date DESC`,
      [patientId]
    );

    // Summary pending
    const totalPending = bills
      .filter((b) => b.status === 'Pending')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return NextResponse.json({
      patient,
      appointments,
      admissions,
      prescriptions,
      bills,
      totalPending,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = patientSchema.parse(body);

    const result = await execute<any>(
      `UPDATE patients
       SET name = ?, email = ?, phone = ?, gender = ?, dob = ?, blood_group = ?, address = ?
       WHERE patient_id = ?`,
      [
        validated.name,
        validated.email,
        validated.phone || null,
        validated.gender,
        validated.dob,
        validated.blood_group || null,
        validated.address || null,
        patientId,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient updated successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patientId = parseInt(id, 10);
    if (isNaN(patientId)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM patients WHERE patient_id = ?', [patientId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
