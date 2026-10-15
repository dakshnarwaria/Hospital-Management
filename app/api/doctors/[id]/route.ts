import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { doctorSchema } from '@/lib/validators';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctorId = parseInt(id, 10);
    if (isNaN(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    const rows = await query<any[]>(
      `SELECT d.doctor_id, d.name, d.email, d.phone, d.specialization,
              d.dept_id, dept.dept_name, d.consultation_fee
       FROM doctors d
       JOIN departments dept ON d.dept_id = dept.dept_id
       WHERE d.doctor_id = ?`,
      [doctorId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ doctor: rows[0] });
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
    const doctorId = parseInt(id, 10);
    if (isNaN(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = doctorSchema.parse(body);

    const result = await execute<any>(
      `UPDATE doctors
       SET name = ?, email = ?, phone = ?, specialization = ?, dept_id = ?, consultation_fee = ?
       WHERE doctor_id = ?`,
      [
        validated.name,
        validated.email,
        validated.phone || null,
        validated.specialization || null,
        validated.dept_id,
        validated.consultation_fee,
        doctorId,
      ]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Doctor updated successfully' });
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
    const doctorId = parseInt(id, 10);
    if (isNaN(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM doctors WHERE doctor_id = ?', [doctorId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
