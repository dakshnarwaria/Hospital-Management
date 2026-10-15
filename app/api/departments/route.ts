import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { departmentSchema } from '@/lib/validators';

export async function GET() {
  try {
    const departments = await query<any[]>(
      `SELECT d.dept_id, d.dept_name, d.location,
              COUNT(doc.doctor_id) AS total_doctors
       FROM departments d
       LEFT JOIN doctors doc ON d.dept_id = doc.dept_id
       GROUP BY d.dept_id, d.dept_name, d.location
       ORDER BY d.dept_name ASC`
    );

    return NextResponse.json({ departments });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = departmentSchema.parse(body);

    const result = await execute<any>(
      `INSERT INTO departments (dept_name, location) VALUES (?, ?)`,
      [validated.dept_name, validated.location || null]
    );

    return NextResponse.json(
      {
        message: 'Department created successfully',
        dept_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
