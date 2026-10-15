'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  BedDouble,
  UserPlus,
  LogOut,
  History,
} from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface ActiveAdmission {
  admission_id: number;
  patient: string;
  doctor: string;
  room_number: string;
  room_type: string;
  admit_date: string;
  diagnosis: string;
}

interface HistoricalAdmission {
  admission_id: number;
  patient_id: number;
  room_id: number;
  doctor_id: number;
  patient_name: string;
  doctor_name: string;
  room_number: string;
  room_type: string;
  admit_date: string;
  discharge_date: string | null;
  diagnosis: string;
  status: 'Active' | 'Discharged';
}

interface RoomLookup {
  room_id: number;
  room_number: string;
  room_type: string;
  capacity: number;
  occupied: number;
  available: number;
}

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<'current_view' | 'history'>('current_view');
  const [activeAdmissions, setActiveAdmissions] = useState<ActiveAdmission[]>([]);
  const [historyAdmissions, setHistoryAdmissions] = useState<HistoricalAdmission[]>([]);
  const [rooms, setRooms] = useState<RoomLookup[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admit Modal State
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [admitForm, setAdmitForm] = useState({
    patient_id: '',
    room_id: '',
    doctor_id: '',
    diagnosis: '',
  });
  const [isAdmitting, setIsAdmitting] = useState(false);

  // Discharge Dialog State
  const [dischargeTarget, setDischargeTarget] = useState<{ id: number; patient: string; room: string } | null>(null);
  const [isDischarging, setIsDischarging] = useState(false);

  const fetchAdmissionsData = async () => {
    setIsLoading(true);
    try {
      const [viewRes, allRes, roomRes] = await Promise.all([
        fetch('/api/admissions?view=current'),
        fetch('/api/admissions'),
        fetch('/api/rooms'),
      ]);

      const viewJson = await viewRes.json();
      const allJson = await allRes.json();
      const roomJson = await roomRes.json();

      setActiveAdmissions(viewJson.admissions || []);
      setHistoryAdmissions(allJson.admissions || []);
      setRooms(roomJson.rooms || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading admissions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [patRes, docRes] = await Promise.all([
        fetch('/api/patients?limit=100'),
        fetch('/api/doctors'),
      ]);
      const patJson = await patRes.json();
      const docJson = await docRes.json();

      setPatients(patJson.patients || []);
      setDoctors(docJson.doctors || []);

      if (patJson.patients?.length && !admitForm.patient_id) {
        setAdmitForm((prev) => ({ ...prev, patient_id: String(patJson.patients[0].patient_id) }));
      }
      if (docJson.doctors?.length && !admitForm.doctor_id) {
        setAdmitForm((prev) => ({ ...prev, doctor_id: String(docJson.doctors[0].doctor_id) }));
      }
    } catch {
      // Lookups error handled silently
    }
  };

  useEffect(() => {
    fetchAdmissionsData();
    fetchLookups();
  }, []);

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdmitting(true);
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admitForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to admit patient');
      }

      toast.success('Patient admitted via CALL admit_patient(). Bed count increased!');
      setIsAdmitModalOpen(false);
      setAdmitForm((prev) => ({ ...prev, diagnosis: '' }));
      fetchAdmissionsData();
    } catch (err: any) {
      toast.error(err.message || 'Admit failed');
    } finally {
      setIsAdmitting(false);
    }
  };

  const handleDischargeConfirm = async () => {
    if (!dischargeTarget) return;
    setIsDischarging(true);
    try {
      const res = await fetch('/api/admissions/discharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admission_id: dischargeTarget.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to discharge patient');

      toast.success(
        `Patient ${dischargeTarget.patient} discharged! Trigger after_discharge freed a bed in Room ${dischargeTarget.room}.`
      );
      setDischargeTarget(null);
      fetchAdmissionsData();
    } catch (err: any) {
      toast.error(err.message || 'Discharge error');
    } finally {
      setIsDischarging(false);
    }
  };

  const viewColumns: Column<ActiveAdmission>[] = [
    {
      key: 'admission_id',
      label: 'Admission #',
      sortable: true,
      className: 'w-24 font-mono text-xs',
    },
    {
      key: 'patient',
      label: 'Inpatient Name',
      sortable: true,
      render: (a) => (
        <span className="font-bold text-gray-900 dark:text-white">{a.patient}</span>
      ),
    },
    {
      key: 'room_number',
      label: 'Room & Category',
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-gray-900 dark:text-white">
            {a.room_number}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              a.room_type === 'ICU'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                : a.room_type === 'Private'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
          >
            {a.room_type}
          </span>
        </div>
      ),
    },
    {
      key: 'doctor',
      label: 'Attending Doctor',
      sortable: true,
      render: (a) => (
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{a.doctor}</span>
      ),
    },
    {
      key: 'diagnosis',
      label: 'Primary Diagnosis',
      render: (a) => <span className="italic text-xs text-gray-600 dark:text-gray-300">{a.diagnosis}</span>,
    },
    {
      key: 'admit_date',
      label: 'Admitted On',
      sortable: true,
      className: 'font-mono text-xs text-gray-500',
    },
    {
      key: 'actions',
      label: 'Action',
      className: 'text-right',
      render: (a) => (
        <button
          onClick={() =>
            setDischargeTarget({
              id: a.admission_id,
              patient: a.patient,
              room: a.room_number,
            })
          }
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Discharge</span>
        </button>
      ),
    },
  ];

  const historyColumns: Column<HistoricalAdmission>[] = [
    {
      key: 'admission_id',
      label: 'ID',
      sortable: true,
      className: 'w-16 font-mono text-xs',
    },
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
      render: (h) => (
        <Link
          href={`/patients/${h.patient_id}`}
          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {h.patient_name}
        </Link>
      ),
    },
    {
      key: 'room_number',
      label: 'Room',
      render: (h) => `${h.room_number} (${h.room_type})`,
    },
    {
      key: 'doctor_name',
      label: 'Doctor',
      render: (h) => h.doctor_name,
    },
    {
      key: 'diagnosis',
      label: 'Diagnosis',
      render: (h) => h.diagnosis,
    },
    {
      key: 'admit_date',
      label: 'Admitted',
      className: 'font-mono text-xs',
    },
    {
      key: 'discharge_date',
      label: 'Discharged',
      className: 'font-mono text-xs',
      render: (h) => h.discharge_date || <span className="text-emerald-600 font-semibold">Active</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (h) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            h.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {h.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Patient Admissions & Bed Tracking
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by MySQL VIEW <code className="text-emerald-500 font-mono">current_admissions</code> and stored procedures <code className="text-emerald-500 font-mono">admit_patient()</code> / <code className="text-emerald-500 font-mono">discharge_patient()</code>.
          </p>
        </div>
        <button
          onClick={() => {
            if (rooms.length && !admitForm.room_id) {
              const freeRoom = rooms.find((r) => r.available > 0) || rooms[0];
              setAdmitForm((prev) => ({ ...prev, room_id: String(freeRoom.room_id) }));
            }
            setIsAdmitModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Admit Patient</span>
        </button>
      </div>

      {/* Live Room Occupancy Mini-Ticker */}
      <div className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
            <BedDouble className="w-4 h-4 text-emerald-500" />
            <span>Real-Time Bed Occupancy</span>
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            Triggers before_admission & after_admission active
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rooms.map((r) => {
            const isFull = r.occupied >= r.capacity;
            return (
              <div
                key={r.room_id}
                className={`p-3 rounded-xl border transition-all ${
                  isFull
                    ? 'bg-rose-50/40 border-rose-300 dark:bg-rose-950/20 dark:border-rose-900/40'
                    : 'bg-emerald-50/40 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-900/40'
                }`}
              >
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-900 dark:text-white">
                    Room {r.room_number} ({r.room_type})
                  </span>
                  <span className={isFull ? 'text-rose-600' : 'text-emerald-600'}>
                    {r.occupied} / {r.capacity} Beds
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isFull ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (r.occupied / r.capacity) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 dark:border-emerald-950/60 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('current_view')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'current_view'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Active Inpatients (current_admissions View) ({activeAdmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Complete Admissions History ({historyAdmissions.length})</span>
        </button>
      </div>

      {/* TAB 1: VIEW current_admissions */}
      {activeTab === 'current_view' && (
        <DataTable
          columns={viewColumns}
          data={activeAdmissions}
          isLoading={isLoading}
          searchPlaceholder="Search active inpatients by name, doctor, diagnosis, room..."
          searchKey={(a) => `${a.patient} ${a.doctor} ${a.room_number} ${a.diagnosis}`}
          defaultSortKey="admit_date"
          defaultSortOrder="desc"
          emptyTitle="No patients currently admitted"
          emptyDescription="All hospital beds are currently vacant or all admitted patients have been discharged."
          emptyAction={
            <button
              onClick={() => setIsAdmitModalOpen(true)}
              className="px-3 py-1.5 rounded-lg gradient-green-btn text-xs font-semibold"
            >
              Admit a Patient
            </button>
          }
        />
      )}

      {/* TAB 2: COMPLETE HISTORY */}
      {activeTab === 'history' && (
        <DataTable
          columns={historyColumns}
          data={historyAdmissions}
          isLoading={isLoading}
          searchPlaceholder="Search historical admissions..."
          searchKey={(h) => `${h.patient_name} ${h.doctor_name} ${h.room_number} ${h.diagnosis}`}
          defaultSortKey="admission_id"
          defaultSortOrder="desc"
        />
      )}

      {/* Admit Patient Modal */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title="Admit Patient to Room"
        description="Calls CALL admit_patient(). Triggers enforce room capacity limit and auto-increment occupancy."
      >
        <form onSubmit={handleAdmitSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={admitForm.patient_id}
              onChange={(e) => setAdmitForm({ ...admitForm, patient_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Choose patient...</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.name} ({p.gender}, DOB: {p.dob})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Room *
            </label>
            <select
              required
              value={admitForm.room_id}
              onChange={(e) => setAdmitForm({ ...admitForm, room_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Choose room...</option>
              {rooms.map((r) => {
                const isFull = r.occupied >= r.capacity;
                return (
                  <option key={r.room_id} value={r.room_id}>
                    Room {r.room_number} ({r.room_type}) — {r.occupied}/{r.capacity} beds {isFull ? '[FULL - TRIGGER WILL BLOCK]' : `[${r.available} Available]`}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Selecting a full room will intentionally trigger SQLSTATE 45000 &quot;Room is full&quot;.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Attending Doctor *
            </label>
            <select
              required
              value={admitForm.doctor_id}
              onChange={(e) => setAdmitForm({ ...admitForm, doctor_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Choose doctor...</option>
              {doctors.map((d) => (
                <option key={d.doctor_id} value={d.doctor_id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Clinical Diagnosis *
            </label>
            <input
              type="text"
              required
              value={admitForm.diagnosis}
              onChange={(e) => setAdmitForm({ ...admitForm, diagnosis: e.target.value })}
              placeholder="e.g. Acute Appendicitis, Cardiac Observation, Post-op Recovery"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-emerald-950/40">
            <button
              type="button"
              onClick={() => setIsAdmitModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-950/40 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdmitting}
              className="px-4 py-2 gradient-green-btn text-sm font-semibold rounded-lg shadow-xs disabled:opacity-50"
            >
              {isAdmitting ? 'Executing CALL admit_patient()...' : 'Admit Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Discharge Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dischargeTarget !== null}
        onClose={() => setDischargeTarget(null)}
        onConfirm={handleDischargeConfirm}
        title="Discharge Inpatient"
        message={`Are you sure you want to discharge "${dischargeTarget?.patient}" from Room ${dischargeTarget?.room}? This will call discharge_patient() and fire database trigger after_discharge to free a bed.`}
        confirmText="Confirm Discharge"
        isDangerous={false}
        isLoading={isDischarging}
      />
    </div>
  );
}
