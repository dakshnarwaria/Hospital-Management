'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Plus,
  Filter,
  Trash2,
  Pill,
} from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface Appointment {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  appointment_time: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  reason: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  doctor_name: string;
  specialization: string;
  dept_name: string;
  prescription_count: number;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterDoctor, setFilterDoctor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '10:00',
    reason: '',
  });
  const [isBooking, setIsBooking] = useState(false);

  // Status Change State
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Cancel/Delete Dialog State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDoctor) params.append('doctor_id', filterDoctor);
      if (filterStatus) params.append('status', filterStatus);
      if (filterDate) params.append('date', filterDate);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        fetch('/api/doctors'),
        fetch('/api/patients?limit=100'),
      ]);
      const docData = await docRes.json();
      const patData = await patRes.json();

      setDoctors(docData.doctors || []);
      setPatients(patData.patients || []);
      if (docData.doctors?.length && !bookingForm.doctor_id) {
        setBookingForm((prev) => ({
          ...prev,
          doctor_id: String(docData.doctors[0].doctor_id),
        }));
      }
      if (patData.patients?.length && !bookingForm.patient_id) {
        setBookingForm((prev) => ({
          ...prev,
          patient_id: String(patData.patients[0].patient_id),
        }));
      }
    } catch {
      // Non-critical lookups failure handled silently
    }
  };

  useEffect(() => {
    fetchLookups();
    setBookingForm((prev) => ({
      ...prev,
      appointment_date: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filterDoctor, filterStatus, filterDate]);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooking(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to book appointment');

      toast.success('Appointment booked via procedure book_appointment()');
      setIsBookModalOpen(false);
      setBookingForm((prev) => ({ ...prev, reason: '' }));
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Error booking appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleStatusChange = async (appointmentId: number, newStatus: string) => {
    setUpdatingId(appointmentId);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Status change failed');

      toast.success(`Appointment status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Error changing appointment status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/appointments/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete appointment');

      toast.success('Appointment removed');
      setDeleteId(null);
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting appointment');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Appointment>[] = [
    {
      key: 'appointment_date',
      label: 'Date & Time',
      sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white font-mono text-xs">
            {a.appointment_date}
          </p>
          <p className="text-xs text-gray-400 font-mono flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-emerald-500" />
            {a.appointment_time}
          </p>
        </div>
      ),
    },
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
      render: (a) => (
        <div>
          <Link
            href={`/patients/${a.patient_id}`}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {a.patient_name}
          </Link>
          <p className="text-xs text-gray-400">{a.patient_phone || a.patient_email}</p>
        </div>
      ),
    },
    {
      key: 'doctor_name',
      label: 'Doctor & Dept',
      sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{a.doctor_name}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {a.specialization} &bull; {a.dept_name}
          </p>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Clinical Reason',
      className: 'max-w-[180px] truncate text-xs text-gray-600 dark:text-gray-300',
      render: (a) => a.reason || 'General Checkup',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <select
            value={a.status}
            disabled={updatingId === a.appointment_id}
            onChange={(e) => handleStatusChange(a.appointment_id, e.target.value)}
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${
              a.status === 'Completed'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300'
                : a.status === 'Cancelled'
                ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300'
                : 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300'
            }`}
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Prescriptions / Delete',
      className: 'text-right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/prescriptions?appointment_id=${a.appointment_id}`}
            title="Prescriptions for this appointment"
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <Pill className="w-4 h-4" />
            <span>({a.prescription_count || 0})</span>
          </Link>
          <button
            onClick={() => setDeleteId(a.appointment_id)}
            title="Delete Appointment"
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Clinical Appointments
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Booking handled exclusively via stored procedure <code className="text-emerald-500 font-mono">book_appointment()</code> with unique slot constraint checks.
          </p>
        </div>
        <button
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-emerald-500/15 bg-white dark:bg-[#0a130e]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <Filter className="w-3.5 h-3.5 text-emerald-500" />
          <span>Filters:</span>
        </div>

        {/* Doctor filter */}
        <select
          value={filterDoctor}
          onChange={(e) => setFilterDoctor(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-emerald-950/60 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Doctors</option>
          {doctors.map((d) => (
            <option key={d.doctor_id} value={d.doctor_id}>
              {d.name} ({d.specialization})
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-emerald-950/60 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Date filter */}
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-emerald-950/60 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        {(filterDoctor || filterStatus || filterDate) && (
          <button
            onClick={() => {
              setFilterDoctor('');
              setFilterStatus('');
              setFilterDate('');
            }}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Appointments DataTable */}
      <DataTable
        columns={columns}
        data={appointments}
        isLoading={isLoading}
        searchPlaceholder="Search by patient, doctor, reason..."
        searchKey={(a) => `${a.patient_name} ${a.doctor_name} ${a.reason} ${a.dept_name}`}
        defaultSortKey="appointment_date"
        defaultSortOrder="desc"
        emptyTitle="No appointments scheduled"
        emptyDescription="Book a clinical appointment using the button above."
        emptyAction={
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="px-3 py-1.5 rounded-lg gradient-green-btn text-xs font-semibold"
          >
            Book Appointment
          </button>
        }
      />

      {/* Booking Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Doctor Appointment"
        description="Calls MySQL stored procedure book_appointment(). Prevents double booking at same date/time."
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={bookingForm.patient_id}
              onChange={(e) => setBookingForm({ ...bookingForm, patient_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a registered patient...</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.name} ({p.phone || p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Doctor *
            </label>
            <select
              required
              value={bookingForm.doctor_id}
              onChange={(e) => setBookingForm({ ...bookingForm, doctor_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a doctor...</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.name} &bull; {d.specialization} (₹{d.consultation_fee})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={bookingForm.appointment_date}
                onChange={(e) => setBookingForm({ ...bookingForm, appointment_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Time Slot *
              </label>
              <select
                required
                value={bookingForm.appointment_time}
                onChange={(e) => setBookingForm({ ...bookingForm, appointment_time: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="09:00">09:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="14:00">02:00 PM</option>
                <option value="15:00">03:00 PM</option>
                <option value="16:00">04:00 PM</option>
                <option value="17:00">05:00 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Reason / Symptoms
            </label>
            <input
              type="text"
              value={bookingForm.reason}
              onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
              placeholder="e.g. Chest pain, followup consultation, knee examination"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-emerald-950/40">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-950/40 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBooking}
              className="px-4 py-2 gradient-green-btn text-sm font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {isBooking ? 'Calling Stored Procedure...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete / Cancel Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Appointment Record"
        message="Are you sure you want to delete this appointment? Any associated prescriptions must be cleared first."
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
