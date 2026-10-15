import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { roomSchema } from '@/lib/validators';

export async function GET() {
  try {
    const rooms = await query<any[]>(
      `SELECT room_id, room_number, room_type, capacity, occupied, daily_charge,
              (capacity - occupied) AS available,
              ROUND((occupied / capacity) * 100, 1) AS occupancy_percentage
       FROM rooms
       ORDER BY room_number ASC`
    );

    return NextResponse.json({ rooms });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = roomSchema.parse(body);

    const result = await execute<any>(
      `INSERT INTO rooms (room_number, room_type, capacity, daily_charge)
       VALUES (?, ?, ?, ?)`,
      [validated.room_number, validated.room_type, validated.capacity, validated.daily_charge]
    );

    return NextResponse.json(
      {
        message: 'Room created successfully',
        room_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
