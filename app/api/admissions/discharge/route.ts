import { NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { dischargeSchema } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = dischargeSchema.parse(body);

    // Verify admission exists and is still active
    const existing = await query<any[]>(
      'SELECT admission_id, room_id, discharge_date FROM admissions WHERE admission_id = ?',
      [validated.admission_id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Admission record not found' }, { status: 404 });
    }

    if (existing[0].discharge_date !== null) {
      return NextResponse.json({ error: 'Patient has already been discharged' }, { status: 400 });
    }

    // Call stored procedure: discharge_patient(p_admission)
    // Note: Database trigger 'after_discharge' automatically decreases rooms.occupied by 1.
    await execute('CALL discharge_patient(?)', [validated.admission_id]);

    // Fetch updated room occupancy for instant client verification
    const updatedRoom = await query<any[]>(
      'SELECT room_id, room_number, capacity, occupied FROM rooms WHERE room_id = ?',
      [existing[0].room_id]
    );

    return NextResponse.json({
      message: 'Patient discharged successfully via stored procedure discharge_patient',
      admission_id: validated.admission_id,
      room: updatedRoom[0],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
