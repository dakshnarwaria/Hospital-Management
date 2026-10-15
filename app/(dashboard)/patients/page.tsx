'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit2, Trash2, Eye, UserPlus } from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface Patient {
  patient_id: number;
  name: string;
  email: string;
  phone: string | null;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  blood_group: string | null;
  address: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '',
    blood_group: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Dialog States
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/patients?limit=100');
      if (!res.ok) throw new Error('Failed to load patients');
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading patient list');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleOpenAdd = () => {
    setEditingPatient(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      gender: 'Male',
      dob: '1995-01-01',
      blood_group: 'O+',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setEditingPatient(p);
    setFormData({
      name: p.name,
      email: p.email,
      phone: p.phone || '',
      gender: p.gender,
      dob: p.dob,
      blood_group: p.blood_group || '',
      address: p.address || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingPatient ? `/api/patients/${editingPatient.patient_id}` : '/api/patients';
      const method = editingPatient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save patient');

      toast.success(editingPatient ? 'Patient updated successfully' : 'Patient registered successfully');
      setIsModalOpen(false);
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || 'Error submitting patient details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/patients/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete patient');

      toast.success('Patient deleted successfully');
      setDeleteId(null);
      fetchPatients();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete patient');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Patient>[] = [
    {
      key: 'patient_id',
      label: 'ID',
      sortable: true,
      className: 'w-16 font-mono text-xs text-gray-500',
    },
    {
      key: 'name',
      label: 'Patient Name',
      sortable: true,
      render: (p) => (
        <div>
          <Link
            href={`/patients/${p.patient_id}`}
            className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
          >
            {p.name}
          </Link>
          <span className="text-xs text-gray-400">{p.email}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (p) => p.phone || <span className="text-gray-400 italic">None</span>,
    },
    {
      key: 'gender',
      label: 'Gender',
      sortable: true,
      render: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.gender === 'Male'
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
              : p.gender === 'Female'
              ? 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
          }`}
        >
          {p.gender}
        </span>
      ),
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      sortable: true,
      className: 'font-mono text-xs',
    },
    {
      key: 'blood_group',
      label: 'Blood Group',
      render: (p) =>
        p.blood_group ? (
          <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs">
            {p.blood_group}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        ),
    },
    {
      key: 'address',
      label: 'Address',
      className: 'text-xs text-gray-500 truncate max-w-[150px]',
      render: (p) => p.address || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/patients/${p.patient_id}`}
            title="View Patient Medical Profile"
            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleOpenEdit(p)}
            title="Edit Patient Details"
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteId(p.patient_id)}
            title="Delete Patient Record"
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
            Patient Directory
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registered patients index with indexed name search and comprehensive records.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Patients DataTable */}
      <DataTable
        columns={columns}
        data={patients}
        isLoading={isLoading}
        searchPlaceholder="Search by name, email, phone, blood group..."
        searchKey={(p) => `${p.name} ${p.email} ${p.phone} ${p.blood_group} ${p.address}`}
        defaultSortKey="patient_id"
        defaultSortOrder="desc"
        pageSize={10}
        emptyTitle="No patients found"
        emptyDescription="Add a new patient using the button above to seed the hospital registry."
        emptyAction={
          <button
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-lg gradient-green-btn text-xs font-semibold"
          >
            Add First Patient
          </button>
        }
      />

      {/* Add / Edit Patient Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPatient ? `Edit Patient: ${editingPatient.name}` : 'Register New Patient'}
        description="Fill in patient demographics. Triggers and unique constraints apply."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address * (Unique)
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. aarav@example.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Gender *
              </label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Blood Group
              </label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select...</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Residential Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 104 Civil Lines, Jaipur"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-emerald-950/40">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-emerald-900/40 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg gradient-green-btn text-sm font-semibold shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Patient Record"
        message="Are you sure you want to delete this patient? If the patient has existing appointments, admissions, or bills, MySQL foreign key constraints will block deletion."
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
