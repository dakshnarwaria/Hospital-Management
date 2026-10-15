import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { appointmentUpdateSchema } from '@/lib/validators';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    const rows = await query<any[]>(
      `SELECT a.appointment_id, a.patient_id, a.doctor_id,
              DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
              TIME_FORMAT(a.appointment_time, '%H:%i') as appointment_time,
              a.status, a.reason,
              p.name AS patient_name, p.phone AS patient_phone, p.email AS patient_email,
              d.name AS doctor_name, d.specialization, dept.dept_name
       FROM appointments a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN departments dept ON d.dept_id = dept.dept_id
       WHERE a.appointment_id = ?`,
      [appointmentId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Also get prescriptions for this appointment
    const prescriptions = await query<any[]>(
      `SELECT prescription_id, medicine, dosage, duration_days
       FROM prescriptions WHERE appointment_id = ?`,
      [appointmentId]
    );

    return NextResponse.json({ appointment: rows[0], prescriptions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = appointmentUpdateSchema.parse(body);

    let sql = 'UPDATE appointments SET status = ?';
    const values: any[] = [validated.status];

    if (validated.reason !== undefined) {
      sql += ', reason = ?';
      values.push(validated.reason);
    }

    sql += ' WHERE appointment_id = ?';
    values.push(appointmentId);

    const result = await execute<any>(sql, values);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Appointment status updated successfully' });
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
    const appointmentId = parseInt(id, 10);
    if (isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM appointments WHERE appointment_id = ?', [appointmentId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Appointment cancelled/deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
