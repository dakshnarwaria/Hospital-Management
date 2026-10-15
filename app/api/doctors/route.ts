import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { doctorSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const deptId = searchParams.get('dept_id');

    let sql = `
      SELECT d.doctor_id, d.name, d.email, d.phone, d.specialization,
             d.dept_id, dept.dept_name, d.consultation_fee
      FROM doctors d
      JOIN departments dept ON d.dept_id = dept.dept_id
    `;
    const params: any[] = [];

    if (deptId) {
      sql += ' WHERE d.dept_id = ?';
      params.push(parseInt(deptId, 10));
    }

    sql += ' ORDER BY d.name ASC';

    const doctors = await query<any[]>(sql, params);
    return NextResponse.json({ doctors });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = doctorSchema.parse(body);

    const result = await execute<any>(
      `INSERT INTO doctors (name, email, phone, specialization, dept_id, consultation_fee)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        validated.name,
        validated.email,
        validated.phone || null,
        validated.specialization || null,
        validated.dept_id,
        validated.consultation_fee,
      ]
    );

    return NextResponse.json(
      {
        message: 'Doctor added successfully',
        doctor_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
