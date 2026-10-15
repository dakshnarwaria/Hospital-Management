'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Pill, Plus, Trash2, Filter } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface Prescription {
  prescription_id: number;
  appointment_id: number;
  medicine: string;
  dosage: string | null;
  duration_days: number;
  appointment_date: string;
  patient_name: string;
  patient_id: number;
  doctor_name: string;
}

interface AppointmentLookup {
  appointment_id: number;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
}

function PrescriptionsContent() {
  const searchParams = useSearchParams();
  const initialApptId = searchParams.get('appointment_id') || '';

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<AppointmentLookup[]>([]);
  const [selectedApptFilter, setSelectedApptFilter] = useState<string>(initialApptId);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    appointment_id: initialApptId,
    medicine: '',
    dosage: '',
    duration_days: '5',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const url = selectedApptFilter
        ? `/api/prescriptions?appointment_id=${selectedApptFilter}`
        : '/api/prescriptions';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load prescriptions');
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading prescriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data.appointments || []);
      if (!formData.appointment_id && data.appointments?.length) {
        setFormData((prev) => ({
          ...prev,
          appointment_id: String(data.appointments[0].appointment_id),
        }));
      }
    } catch {
      // Non-critical appointment lookup failure handled silently
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [selectedApptFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add prescription');

      toast.success('Prescription recorded successfully');
      setIsModalOpen(false);
      setFormData((prev) => ({ ...prev, medicine: '', dosage: '' }));
      fetchPrescriptions();
    } catch (err: any) {
      toast.error(err.message || 'Error saving prescription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/prescriptions/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to remove prescription');

      toast.success('Prescription deleted');
      setDeleteId(null);
      fetchPrescriptions();
    } catch (err: any) {
      toast.error(err.message || 'Deletion error');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Prescription>[] = [
    {
      key: 'medicine',
      label: 'Medicine & Regimen',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-emerald-500" />
            {p.medicine}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Dosage: <span className="font-semibold text-gray-700 dark:text-gray-200">{p.dosage || 'Standard'}</span>
          </p>
        </div>
      ),
    },
    {
      key: 'duration_days',
      label: 'Duration',
      sortable: true,
      render: (p) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
          {p.duration_days} Days
        </span>
      ),
    },
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
      render: (p) => (
        <Link
          href={`/patients/${p.patient_id}`}
          className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {p.patient_name}
        </Link>
      ),
    },
    {
      key: 'doctor_name',
      label: 'Prescribed By',
      sortable: true,
      render: (p) => p.doctor_name,
    },
    {
      key: 'appointment_date',
      label: 'Consultation Date',
      sortable: true,
      className: 'font-mono text-xs text-gray-500',
    },
    {
      key: 'actions',
      label: 'Action',
      className: 'text-right',
      render: (p) => (
        <button
          onClick={() => setDeleteId(p.prescription_id)}
          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          title="Delete Prescription"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Medication & Prescriptions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Relational prescriptions tied to consultation appointments with CHECK (duration_days &gt; 0).
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Prescription</span>
        </button>
      </div>

      {/* Filter by Appointment */}
      <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-500/15 bg-white dark:bg-[#0a130e]">
        <Filter className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Filter by Appointment:
        </span>
        <select
          value={selectedApptFilter}
          onChange={(e) => setSelectedApptFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-emerald-950/60 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-md"
        >
          <option value="">All Appointments</option>
          {appointments.map((a) => (
            <option key={a.appointment_id} value={a.appointment_id}>
              Appt #{a.appointment_id}: {a.patient_name} with {a.doctor_name} ({a.appointment_date})
            </option>
          ))}
        </select>
        {selectedApptFilter && (
          <button
            onClick={() => setSelectedApptFilter('')}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Prescriptions Table */}
      <DataTable
        columns={columns}
        data={prescriptions}
        isLoading={isLoading}
        searchPlaceholder="Search by medicine, patient, doctor, dosage..."
        searchKey={(p) => `${p.medicine} ${p.patient_name} ${p.doctor_name} ${p.dosage}`}
        defaultSortKey="appointment_date"
        defaultSortOrder="desc"
        emptyTitle="No prescriptions recorded"
        emptyDescription="Add a prescription to an appointment using the button above."
        emptyAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg gradient-green-btn text-xs font-semibold"
          >
            Add Prescription
          </button>
        }
      />

      {/* Add Prescription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Prescription to Appointment"
        description="Prescriptions link directly to appointments and enforce foreign key integrity."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Appointment *
            </label>
            <select
              required
              value={formData.appointment_id}
              onChange={(e) => setFormData({ ...formData, appointment_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Choose an appointment...</option>
              {appointments.map((a) => (
                <option key={a.appointment_id} value={a.appointment_id}>
                  #{a.appointment_id} &bull; {a.patient_name} with {a.doctor_name} ({a.appointment_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Medicine Name *
            </label>
            <input
              type="text"
              required
              value={formData.medicine}
              onChange={(e) => setFormData({ ...formData, medicine: e.target.value })}
              placeholder="e.g. Amoxicillin, Paracetamol 650mg, Atorvastatin"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Dosage Instructions
              </label>
              <input
                type="text"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                placeholder="e.g. 1 tablet twice daily after meals"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Duration (Days) * (Check &gt; 0)
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.duration_days}
                onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-emerald-950/40">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-950/40 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 gradient-green-btn text-sm font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Prescription"
        message="Are you sure you want to remove this prescription record?"
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function PrescriptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 animate-pulse p-4">
          <div className="h-8 w-48 bg-emerald-500/10 rounded-lg" />
          <div className="h-64 bg-gray-100 dark:bg-emerald-950/20 rounded-xl" />
        </div>
      }
    >
      <PrescriptionsContent />
    </Suspense>
  );
}
