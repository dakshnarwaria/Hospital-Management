import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { prescriptionSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointment_id');

    let sql = `
      SELECT pr.prescription_id, pr.appointment_id, pr.medicine, pr.dosage, pr.duration_days,
             DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
             p.name AS patient_name, p.patient_id,
             d.name AS doctor_name
      FROM prescriptions pr
      JOIN appointments a ON pr.appointment_id = a.appointment_id
      JOIN patients p ON a.patient_id = p.patient_id
      JOIN doctors d ON a.doctor_id = d.doctor_id
    `;
    const params: any[] = [];

    if (appointmentId) {
      sql += ' WHERE pr.appointment_id = ?';
      params.push(parseInt(appointmentId, 10));
    }

    sql += ' ORDER BY pr.prescription_id DESC';

    const prescriptions = await query<any[]>(sql, params);
    return NextResponse.json({ prescriptions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = prescriptionSchema.parse(body);

    const result = await execute<any>(
      `INSERT INTO prescriptions (appointment_id, medicine, dosage, duration_days)
       VALUES (?, ?, ?, ?)`,
      [validated.appointment_id, validated.medicine, validated.dosage || null, validated.duration_days]
    );

    return NextResponse.json(
      {
        message: 'Prescription added successfully',
        prescription_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
