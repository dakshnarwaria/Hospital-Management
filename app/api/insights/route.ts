import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { handleApiError } from '@/lib/errors';

export async function GET() {
  try {
    const report1Sql = `SELECT p.patient_id, p.name, p.phone, SUM(b.amount) AS pending_amount, COUNT(b.bill_id) AS unpaid_bills
FROM bills b
JOIN patients p ON b.patient_id = p.patient_id
WHERE b.status = 'Pending'
GROUP BY p.patient_id, p.name, p.phone
ORDER BY pending_amount DESC;`;

    const report2Sql = `SELECT d.dept_name, d.location, COUNT(doc.doctor_id) AS total_doctors,
       ROUND(COALESCE(AVG(doc.consultation_fee), 0), 2) AS avg_fee
FROM departments d
LEFT JOIN doctors doc ON d.dept_id = doc.dept_id
GROUP BY d.dept_id, d.dept_name, d.location
ORDER BY total_doctors DESC;`;

    const report3Sql = `SELECT bill_type,
       COUNT(*) AS total_invoices,
       COALESCE(SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END), 0) AS collected_revenue,
       COALESCE(SUM(CASE WHEN status = 'Pending' THEN amount ELSE 0 END), 0) AS pending_revenue,
       COALESCE(SUM(amount), 0) AS total_billed
FROM bills
GROUP BY bill_type
ORDER BY total_billed DESC;`;

    const report4Sql = `SELECT d.doctor_id, d.name AS doctor_name, dept.dept_name,
       COUNT(a.appointment_id) AS total_appointments,
       COUNT(CASE WHEN a.status = 'Completed' THEN 1 END) AS completed_appointments,
       COUNT(CASE WHEN a.status = 'Scheduled' THEN 1 END) AS upcoming_appointments
FROM doctors d
JOIN departments dept ON d.dept_id = dept.dept_id
LEFT JOIN appointments a ON d.doctor_id = a.doctor_id
GROUP BY d.doctor_id, d.name, dept.dept_name
ORDER BY total_appointments DESC;`;

    const report5Sql = `SELECT admission_id, patient, doctor, room_number, room_type,
       DATE_FORMAT(admit_date, '%Y-%m-%d') as admit_date, diagnosis
FROM current_admissions
ORDER BY admit_date DESC;`;

    const report6Sql = `SELECT room_number, room_type, capacity, occupied,
       (capacity - occupied) AS available_beds,
       ROUND((occupied / capacity) * 100, 1) AS occupancy_percent,
       daily_charge
FROM rooms
ORDER BY occupancy_percent DESC, room_number ASC;`;

    const [rep1, rep2, rep3, rep4, rep5, rep6] = await Promise.all([
      query<any[]>(report1Sql),
      query<any[]>(report2Sql),
      query<any[]>(report3Sql),
      query<any[]>(report4Sql),
      query<any[]>(report5Sql),
      query<any[]>(report6Sql),
    ]);

    const reports = [
      {
        id: 'pending_dues',
        title: 'Pending Dues Per Patient',
        description: 'Aggregates outstanding unpaid bills grouped by patient using JOIN with bills and status filter.',
        sql: report1Sql,
        data: rep1,
      },
      {
        id: 'doctors_per_dept',
        title: 'Doctors Per Department',
        description: 'Computes doctor headcounts and average consultation fee per medical specialty with LEFT JOIN and GROUP BY.',
        sql: report2Sql,
        data: rep2,
      },
      {
        id: 'revenue_by_type',
        title: 'Revenue By Bill Type',
        description: 'Segmented financial breakdown across Consultation, Admission, Medicine, and Lab charges.',
        sql: report3Sql,
        data: rep3,
      },
      {
        id: 'busiest_doctors',
        title: 'Busiest Doctors (Appointment Load)',
        description: 'Doctor ranking ordered by total appointments scheduled and completed.',
        sql: report4Sql,
        data: rep4,
      },
      {
        id: 'current_admissions',
        title: 'Active Inpatients (Current Admissions View)',
        description: 'Queries the MySQL VIEW current_admissions which joins admissions, patients, doctors, and rooms.',
        sql: report5Sql,
        data: rep5,
      },
      {
        id: 'room_occupancy',
        title: 'Room Capacity & Real-Time Occupancy',
        description: 'Real-time bed utilization automatically maintained by MySQL triggers after_admission and after_discharge.',
        sql: report6Sql,
        data: rep6,
      },
    ];

    return NextResponse.json({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}
