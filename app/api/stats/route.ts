import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const [
      patientCountRes,
      doctorCountRes,
      todayApptRes,
      currentAdmitRes,
      roomCapRes,
      pendingBillsRes,
      doctorApptRes,
      roomTypeRes,
      recentApptRes,
      recentAdmitRes,
    ] = await Promise.all([
      query<[{ total: number }]>('SELECT COUNT(*) AS total FROM patients'),
      query<[{ total: number }]>('SELECT COUNT(*) AS total FROM doctors'),
      query<[{ total: number }]>('SELECT COUNT(*) AS total FROM appointments WHERE appointment_date = CURDATE()'),
      // Querying the MySQL VIEW: current_admissions
      query<[{ total: number }]>('SELECT COUNT(*) AS total FROM current_admissions'),
      query<[{ total_capacity: number; total_occupied: number }]>(
        'SELECT COALESCE(SUM(capacity), 0) AS total_capacity, COALESCE(SUM(occupied), 0) AS total_occupied FROM rooms'
      ),
      query<[{ total: number }]>('SELECT COALESCE(SUM(amount), 0) AS total FROM bills WHERE status = "Pending"'),
      // Bar chart: appointments per doctor
      query<any[]>(
        `SELECT d.doctor_id, d.name AS doctor_name, dept.dept_name,
                COUNT(a.appointment_id) AS appointment_count
         FROM doctors d
         JOIN departments dept ON d.dept_id = dept.dept_id
         LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
         GROUP BY d.doctor_id, d.name, dept.dept_name
         ORDER BY appointment_count DESC, d.name ASC`
      ),
      // Pie chart: room occupancy by type
      query<any[]>(
        `SELECT room_type,
                COALESCE(SUM(capacity), 0) AS capacity,
                COALESCE(SUM(occupied), 0) AS occupied,
                COALESCE(SUM(capacity) - SUM(occupied), 0) AS available
         FROM rooms
         GROUP BY room_type`
      ),
      // Recent appointments
      query<any[]>(
        `SELECT a.appointment_id,
                DATE_FORMAT(a.appointment_date, '%Y-%m-%d') as appointment_date,
                TIME_FORMAT(a.appointment_time, '%H:%i') as appointment_time,
                a.status, a.reason,
                p.name AS patient_name, d.name AS doctor_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         JOIN doctors d ON a.doctor_id = d.doctor_id
         ORDER BY a.appointment_date DESC, a.appointment_time DESC
         LIMIT 5`
      ),
      // Recent admissions
      query<any[]>(
        `SELECT a.admission_id,
                DATE_FORMAT(a.admit_date, '%Y-%m-%d') as admit_date,
                a.diagnosis,
                p.name AS patient_name, d.name AS doctor_name,
                r.room_number, r.room_type,
                CASE WHEN a.discharge_date IS NULL THEN 'Active' ELSE 'Discharged' END AS status
         FROM admissions a
         JOIN patients p ON a.patient_id = p.patient_id
         JOIN doctors d ON a.doctor_id = d.doctor_id
         JOIN rooms r ON a.room_id = r.room_id
         ORDER BY (a.discharge_date IS NULL) DESC, a.admit_date DESC
         LIMIT 5`
      ),
    ]);

    const totalPatients = Number(patientCountRes[0]?.total || 0);
    const totalDoctors = Number(doctorCountRes[0]?.total || 0);
    const todayAppointments = Number(todayApptRes[0]?.total || 0);
    const currentAdmissions = Number(currentAdmitRes[0]?.total || 0);
    const totalCapacity = Number(roomCapRes[0]?.total_capacity || 0);
    const totalOccupied = Number(roomCapRes[0]?.total_occupied || 0);
    const occupancyRate = totalCapacity > 0 ? Number(((totalOccupied / totalCapacity) * 100).toFixed(1)) : 0;
    const pendingBillTotal = Number(pendingBillsRes[0]?.total || 0);

    return NextResponse.json({
      summary: {
        totalPatients,
        totalDoctors,
        todayAppointments,
        currentAdmissions,
        totalCapacity,
        totalOccupied,
        occupancyRate,
        pendingBillTotal,
      },
      charts: {
        appointmentsPerDoctor: doctorApptRes,
        occupancyByType: roomTypeRes,
      },
      recent: {
        appointments: recentApptRes,
        admissions: recentAdmitRes,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
