import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiErrorResponse {
  error: string;
  details?: any;
  sqlState?: string;
  code?: string | number;
}

export function handleApiError(error: any): NextResponse<ApiErrorResponse> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const issues = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return NextResponse.json(
      {
        error: `Validation error: ${issues}`,
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  // Handle MySQL errors
  if (error && typeof error === 'object') {
    // Custom SIGNAL from triggers or stored procedures (SQLSTATE 45000)
    if (error.sqlState === '45000') {
      return NextResponse.json(
        {
          error: error.message || 'Operation rejected by database trigger',
          sqlState: '45000',
        },
        { status: 400 }
      );
    }

    // Duplicate key entry (errno 1062)
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
      let message = 'A record with duplicate unique details already exists.';
      if (typeof error.message === 'string') {
        if (error.message.includes('doctor_id') || error.message.includes('appointment_date')) {
          message = 'Doctor is already booked for this specific date and time.';
        } else if (error.message.includes('email')) {
          message = 'Email address is already in use.';
        } else if (error.message.includes('room_number')) {
          message = 'Room number already exists.';
        } else if (error.message.includes('dept_name')) {
          message = 'Department name already exists.';
        }
      }
      return NextResponse.json(
        {
          error: message,
          code: error.code,
        },
        { status: 409 }
      );
    }

    // Foreign key constraint fails on delete/update (errno 1451)
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      let message = 'Cannot delete: this record is referenced by other hospital records.';
      if (typeof error.message === 'string') {
        if (error.message.includes('appointments')) {
          message = 'Cannot delete: record has associated appointments.';
        } else if (error.message.includes('admissions')) {
          message = 'Cannot delete: record has associated admissions.';
        } else if (error.message.includes('prescriptions')) {
          message = 'Cannot delete: record has associated prescriptions.';
        } else if (error.message.includes('bills')) {
          message = 'Cannot delete: record has associated bills.';
        } else if (error.message.includes('doctors')) {
          message = 'Cannot delete: department has assigned doctors.';
        }
      }
      return NextResponse.json(
        {
          error: message,
          code: error.code,
        },
        { status: 409 }
      );
    }

    // Foreign key constraint fails on insert/update (errno 1452)
    if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
      return NextResponse.json(
        {
          error: 'Referenced foreign key entity does not exist.',
          code: error.code,
        },
        { status: 400 }
      );
    }

    // Check constraint violation (errno 3819)
    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || error.errno === 3819) {
      return NextResponse.json(
        {
          error: 'Check constraint violation: values supplied violate database constraints (e.g. negative fee or zero capacity).',
          code: error.code,
        },
        { status: 400 }
      );
    }

    // General MySQL errors
    if (error.sqlMessage) {
      return NextResponse.json(
        {
          error: error.sqlMessage,
          code: error.code,
          sqlState: error.sqlState,
        },
        { status: 400 }
      );
    }
  }

  // Fallback
  const errorMessage = error instanceof Error ? error.message : 'Internal server error occurred';
  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
