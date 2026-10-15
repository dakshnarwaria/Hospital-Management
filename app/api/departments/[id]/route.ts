import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { departmentSchema } from '@/lib/validators';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deptId = parseInt(id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    const rows = await query<any[]>(
      `SELECT d.dept_id, d.dept_name, d.location,
              COUNT(doc.doctor_id) AS total_doctors
       FROM departments d
       LEFT JOIN doctors doc ON d.dept_id = doc.dept_id
       WHERE d.dept_id = ?
       GROUP BY d.dept_id, d.dept_name, d.location`,
      [deptId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ department: rows[0] });
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
    const deptId = parseInt(id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = departmentSchema.parse(body);

    const result = await execute<any>(
      `UPDATE departments SET dept_name = ?, location = ? WHERE dept_id = ?`,
      [validated.dept_name, validated.location || null, deptId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Department updated successfully' });
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
    const deptId = parseInt(id, 10);
    if (isNaN(deptId)) {
      return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM departments WHERE dept_id = ?', [deptId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
