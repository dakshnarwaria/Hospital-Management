'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Activity,
  Pill,
  CreditCard,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface PatientDetailData {
  patient: {
    patient_id: number;
    name: string;
    email: string;
    phone: string | null;
    gender: string;
    dob: string;
    blood_group: string | null;
    address: string | null;
  };
  appointments: Array<{
    appointment_id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason: string;
    doctor_name: string;
    specialization: string;
    dept_name: string;
  }>;
  admissions: Array<{
    admission_id: number;
    admit_date: string;
    discharge_date: string | null;
    diagnosis: string;
    room_number: string;
    room_type: string;
    doctor_name: string;
  }>;
  prescriptions: Array<{
    prescription_id: number;
    medicine: string;
    dosage: string | null;
    duration_days: number;
    appointment_date: string;
    doctor_name: string;
  }>;
  bills: Array<{
    bill_id: number;
    amount: number;
    bill_date: string;
    bill_type: string;
    status: 'Paid' | 'Pending';
  }>;
  totalPending: number;
}

function PatientDetailInner({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);

  const [data, setData] = useState<PatientDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'admissions' | 'prescriptions' | 'bills'>('appointments');

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Patient not found');
        throw new Error('Failed to load patient profile');
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      toast.error(err.message || 'Error loading patient details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleToggleBillStatus = async (billId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'Pending' ? 'Paid' : 'Pending';
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update bill');

      toast.success(`Bill marked as ${nextStatus}`);
      fetchDetail();
    } catch (err: any) {
      toast.error(err.message || 'Error updating bill');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-emerald-950/40 rounded" />
        <div className="h-44 bg-gray-200 dark:bg-emerald-950/40 rounded-2xl" />
        <div className="h-96 bg-gray-200 dark:bg-emerald-950/40 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Patient Record Not Found</h3>
        <p className="text-sm text-gray-500">The patient ID requested does not exist in hospital_db.</p>
        <Link
          href="/patients"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-green-btn text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patients Directory</span>
        </Link>
      </div>
    );
  }

  const { patient, appointments, admissions, prescriptions, bills, totalPending } = data;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patients</span>
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-emerald-500/20">
              {patient.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">{patient.name}</h2>
                {patient.blood_group && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-extrabold text-xs">
                    {patient.blood_group}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-emerald-950/40 text-gray-600 dark:text-gray-300 font-mono text-xs">
                  ID #{patient.patient_id}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {patient.email}
                </span>
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {patient.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {patient.gender} &bull; Born {patient.dob}
                </span>
                {patient.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    {patient.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pending Due Badge */}
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30 text-right">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 block uppercase">
              Total Outstanding Balance
            </span>
            <span
              className={`text-xl font-black ${
                totalPending > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ₹{totalPending.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-emerald-950/60 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'admissions'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Inpatient Admissions ({admissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>Prescriptions ({prescriptions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'bills'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Billing Records ({bills.length})</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-6 shadow-xs">
        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Clinical Appointments History
              </h3>
              <Link
                href="/appointments"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book Appointment</span>
              </Link>
            </div>

            {appointments.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No appointment records for this patient.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-emerald-950/40">
                {appointments.map((a) => (
                  <div key={a.appointment_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {a.doctor_name}{' '}
                        <span className="font-normal text-xs text-gray-500">
                          ({a.specialization} &bull; {a.dept_name})
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Reason: <span className="text-gray-700 dark:text-gray-200">{a.reason || 'General'}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-gray-500">
                        {a.appointment_date} at {a.appointment_time}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          a.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : a.status === 'Cancelled'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admissions Tab */}
        {activeTab === 'admissions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Inpatient Admission & Stay History
              </h3>
              <Link
                href="/admissions"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Admit to Room</span>
              </Link>
            </div>

            {admissions.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No admission records for this patient.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-emerald-950/40">
                {admissions.map((adm) => (
                  <div key={adm.admission_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          Room {adm.room_number} ({adm.room_type})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            adm.discharge_date === null
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {adm.discharge_date === null ? 'Currently Admitted' : 'Discharged'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Attending: {adm.doctor_name} &bull; Diagnosis: <span className="italic">{adm.diagnosis}</span>
                      </p>
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                      Admitted: {adm.admit_date}{' '}
                      {adm.discharge_date ? `| Discharged: ${adm.discharge_date}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Medication & Prescription History
            </h3>

            {prescriptions.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No prescriptions on record for this patient.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prescriptions.map((pr) => (
                  <div
                    key={pr.prescription_id}
                    className="p-4 rounded-xl border border-emerald-500/15 bg-emerald-50/20 dark:bg-emerald-950/20"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          {pr.medicine}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Dosage: <span className="font-semibold">{pr.dosage || 'As directed'}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Duration: {pr.duration_days} days &bull; Prescribed by {pr.doctor_name}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">{pr.appointment_date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bills Tab */}
        {activeTab === 'bills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Billing Statements & Invoices
              </h3>
              <Link
                href="/bills"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Bill</span>
              </Link>
            </div>

            {bills.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center">No bills generated for this patient.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-emerald-950/40">
                {bills.map((b) => (
                  <div key={b.bill_id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {b.bill_type} Charge
                      </p>
                      <p className="text-xs text-gray-400 font-mono">Date: {b.bill_date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-gray-900 dark:text-white">
                        ₹{Number(b.amount).toFixed(2)}
                      </span>
                      <button
                        onClick={() => handleToggleBillStatus(b.bill_id, b.status)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          b.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {b.status}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-emerald-950/40 rounded" />
          <div className="h-44 bg-gray-200 dark:bg-emerald-950/40 rounded-2xl" />
          <div className="h-96 bg-gray-200 dark:bg-emerald-950/40 rounded-2xl" />
        </div>
      }
    >
      <PatientDetailInner params={params} />
    </Suspense>
  );
}
