import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { billSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const billType = searchParams.get('type');
    const patientId = searchParams.get('patient_id');

    let sql = `
      SELECT b.bill_id, b.patient_id, b.amount,
             DATE_FORMAT(b.bill_date, '%Y-%m-%d') as bill_date,
             b.bill_type, b.status,
             p.name AS patient_name, p.phone AS patient_phone
      FROM bills b
      JOIN patients p ON b.patient_id = p.patient_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      sql += ' AND b.status = ?';
      params.push(status);
    }

    if (billType) {
      sql += ' AND b.bill_type = ?';
      params.push(billType);
    }

    if (patientId) {
      sql += ' AND b.patient_id = ?';
      params.push(parseInt(patientId, 10));
    }

    sql += ' ORDER BY b.bill_date DESC, b.bill_id DESC';

    const [bills, pendingSummary] = await Promise.all([
      query<any[]>(sql, params),
      query<any[]>(
        `SELECT p.patient_id, p.name AS patient_name, SUM(b.amount) AS pending_total
         FROM bills b
         JOIN patients p ON b.patient_id = p.patient_id
         WHERE b.status = 'Pending'
         GROUP BY p.patient_id, p.name
         ORDER BY pending_total DESC`
      ),
    ]);

    const totalPending = bills
      .filter((b) => b.status === 'Pending')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    const totalPaid = bills
      .filter((b) => b.status === 'Paid')
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return NextResponse.json({
      bills,
      totalPending,
      totalPaid,
      pendingByPatient: pendingSummary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = billSchema.parse(body);

    const billDate = validated.bill_date || new Date().toISOString().slice(0, 10);

    const result = await execute<any>(
      `INSERT INTO bills (patient_id, amount, bill_date, bill_type, status)
       VALUES (?, ?, ?, ?, ?)`,
      [validated.patient_id, validated.amount, billDate, validated.bill_type, validated.status]
    );

    return NextResponse.json(
      {
        message: 'Bill created successfully',
        bill_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
