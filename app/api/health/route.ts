import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const result = await query<{ healthy: number }[]>('SELECT 1 AS healthy');
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      result: result[0],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
