import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { roomSchema } from '@/lib/validators';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }

    const rows = await query<any[]>(
      `SELECT room_id, room_number, room_type, capacity, occupied, daily_charge,
              (capacity - occupied) AS available
       FROM rooms WHERE room_id = ?`,
      [roomId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room: rows[0] });
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
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }

    const body = await request.json();
    const validated = roomSchema.parse(body);

    const result = await execute<any>(
      `UPDATE rooms
       SET room_number = ?, room_type = ?, capacity = ?, daily_charge = ?
       WHERE room_id = ?`,
      [validated.room_number, validated.room_type, validated.capacity, validated.daily_charge, roomId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Room updated successfully' });
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
    const roomId = parseInt(id, 10);
    if (isNaN(roomId)) {
      return NextResponse.json({ error: 'Invalid room ID' }, { status: 400 });
    }

    const result = await execute<any>('DELETE FROM rooms WHERE room_id = ?', [roomId]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Room deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
