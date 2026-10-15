import { NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { handleApiError } from '@/lib/errors';
import { admissionSchema } from '@/lib/validators';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const viewOnly = searchParams.get('view') === 'current' || searchParams.get('active') === 'true';

    if (viewOnly) {
      // Direct query from MySQL VIEW: current_admissions
      const activeAdmissions = await query<any[]>(
        `SELECT admission_id, patient, doctor, room_number, room_type,
                DATE_FORMAT(admit_date, '%Y-%m-%d') as admit_date, diagnosis
         FROM current_admissions
         ORDER BY admit_date DESC`
      );
      return NextResponse.json({ admissions: activeAdmissions, source: 'current_admissions_view' });
    }

    // Complete admissions list (including historical discharged)
    const admissions = await query<any[]>(
      `SELECT a.admission_id, a.patient_id, a.room_id, a.doctor_id,
              DATE_FORMAT(a.admit_date, '%Y-%m-%d') as admit_date,
              DATE_FORMAT(a.discharge_date, '%Y-%m-%d') as discharge_date,
              a.diagnosis,
              p.name AS patient_name,
              d.name AS doctor_name,
              r.room_number, r.room_type,
              CASE WHEN a.discharge_date IS NULL THEN 'Active' ELSE 'Discharged' END AS status
       FROM admissions a
       JOIN patients p ON a.patient_id = p.patient_id
       JOIN doctors d ON a.doctor_id = d.doctor_id
       JOIN rooms r ON a.room_id = r.room_id
       ORDER BY (a.discharge_date IS NULL) DESC, a.admit_date DESC`
    );

    return NextResponse.json({ admissions, source: 'admissions_table' });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = admissionSchema.parse(body);

    // Call stored procedure: admit_patient(p_patient, p_room, p_doctor, p_diagnosis)
    // Note: Database trigger 'before_admission' will raise SQLSTATE 45000 'Room is full' if capacity reached.
    // Database trigger 'after_admission' will automatically increment rooms.occupied.
    await execute('CALL admit_patient(?, ?, ?, ?)', [
      validated.patient_id,
      validated.room_id,
      validated.doctor_id,
      validated.diagnosis,
    ]);

    return NextResponse.json(
      {
        message: 'Patient admitted successfully via stored procedure admit_patient',
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
