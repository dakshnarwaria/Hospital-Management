import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { billStatusUpdateSchema } from '@/lib/validators';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
    }

    const rows = await query<any[]>(
      `SELECT b.bill_id, b.patient_id, b.amount,
              DATE_FORMAT(b.bill_date, '%Y-%m-%d') as bill_date,
              b.bill_type, b.status,
              p.name AS patient_name, p.phone AS patient_phone
       FROM bills b
       JOIN patients p ON b.patient_id = p.patient_id
       WHERE b.bill_id = ?`,
      [billId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ bill: rows[0] });
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
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = billStatusUpdateSchema.parse(body);

    const result = await execute<any>('UPDATE bills SET status = ? WHERE bill_id = ?', [
      validated.status,
      billId,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ message: `Bill status updated to ${validated.status}` });
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
    const billId = parseInt(id, 10);
    if (isNaN(billId)) {
      return NextResponse.json({ error: 'Invalid bill ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM bills WHERE bill_id = ?', [billId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
