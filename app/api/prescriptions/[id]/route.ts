import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prescriptionId = parseInt(id, 10);
    if (isNaN(prescriptionId)) {
      return NextResponse.json({ error: 'Invalid prescription ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM prescriptions WHERE prescription_id = ?', [prescriptionId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
