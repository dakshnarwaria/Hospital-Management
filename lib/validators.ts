import { z } from 'zod';

export const departmentSchema = z.object({
  dept_name: z.string().min(2, 'Department name is required').max(50),
  location: z.string().max(50).optional().nullable(),
});

export const doctorSchema = z.object({
  name: z.string().min(2, 'Doctor name is required').max(100),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string().max(15).optional().nullable(),
  specialization: z.string().max(50).optional().nullable(),
  dept_id: z.coerce.number().int().positive('Please select a department'),
  consultation_fee: z.coerce.number().min(0, 'Consultation fee must be >= 0'),
});

export const patientSchema = z.object({
  name: z.string().min(2, 'Patient name is required').max(100),
  email: z.string().email('Invalid email address').max(100),
  phone: z.string().max(15).optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other'], {
    error: () => ({ message: 'Gender must be Male, Female, or Other' }),
  }),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  blood_group: z.string().max(5).optional().nullable(),
  address: z.string().max(150).optional().nullable(),
});

export const roomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required').max(10),
  room_type: z.enum(['General', 'Private', 'ICU'], {
    error: () => ({ message: 'Room type must be General, Private, or ICU' }),
  }),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  daily_charge: z.coerce.number().min(0, 'Daily charge must be >= 0'),
});

export const appointmentBookingSchema = z.object({
  patient_id: z.coerce.number().int().positive('Patient is required'),
  doctor_id: z.coerce.number().int().positive('Doctor is required'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  appointment_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be HH:MM or HH:MM:SS'),
  reason: z.string().max(200).optional().default('General Checkup'),
});

export const appointmentUpdateSchema = z.object({
  status: z.enum(['Scheduled', 'Completed', 'Cancelled']),
  reason: z.string().max(200).optional(),
});

export const admissionSchema = z.object({
  patient_id: z.coerce.number().int().positive('Patient is required'),
  room_id: z.coerce.number().int().positive('Room is required'),
  doctor_id: z.coerce.number().int().positive('Doctor is required'),
  diagnosis: z.string().min(1, 'Diagnosis is required').max(200),
});

export const dischargeSchema = z.object({
  admission_id: z.coerce.number().int().positive('Admission ID is required'),
});

export const prescriptionSchema = z.object({
  appointment_id: z.coerce.number().int().positive('Appointment ID is required'),
  medicine: z.string().min(1, 'Medicine name is required').max(100),
  dosage: z.string().max(50).optional().nullable(),
  duration_days: z.coerce.number().int().positive('Duration must be at least 1 day'),
});

export const billSchema = z.object({
  patient_id: z.coerce.number().int().positive('Patient is required'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  bill_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  bill_type: z.enum(['Consultation', 'Admission', 'Medicine', 'Lab']),
  status: z.enum(['Paid', 'Pending']).default('Pending'),
});

export const billStatusUpdateSchema = z.object({
  status: z.enum(['Paid', 'Pending']),
});
