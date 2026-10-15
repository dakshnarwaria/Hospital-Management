import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { patientSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'patient_id';
    const order = searchParams.get('order')?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10', 10)));
    const offset = (page - 1) * limit;

    // Allowed sort columns to prevent SQL injection
    const allowedSort = ['patient_id', 'name', 'email', 'gender', 'dob', 'blood_group'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'patient_id';

    let countSql = 'SELECT COUNT(*) as total FROM patients';
    let dataSql = `SELECT patient_id, name, email, phone, gender, DATE_FORMAT(dob, '%Y-%m-%d') as dob, blood_group, address FROM patients`;
    const params: any[] = [];

    if (search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      const whereClause = ' WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? OR blood_group LIKE ?';
      countSql += whereClause;
      dataSql += whereClause;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    dataSql += ` ORDER BY ${safeSort} ${order} LIMIT ? OFFSET ?`;
    const dataParams = [...params, limit, offset];

    const [countRows, patients] = await Promise.all([
      query<[{ total: number }]>(countSql, params),
      query<any[]>(dataSql, dataParams),
    ]);

    const total = countRows[0]?.total || 0;

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = patientSchema.parse(body);

    const result = await execute<any>(
      `INSERT INTO patients (name, email, phone, gender, dob, blood_group, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validated.name,
        validated.email,
        validated.phone || null,
        validated.gender,
        validated.dob,
        validated.blood_group || null,
        validated.address || null,
      ]
    );

    return NextResponse.json(
      {
        message: 'Patient registered successfully',
        patient_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
