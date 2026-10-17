'use client';

import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Filter,
} from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface Department {
  dept_id: number;
  dept_name: string;
  location: string | null;
  total_doctors: number;
}

interface Doctor {
  doctor_id: number;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  dept_id: number;
  dept_name: string;
  consultation_fee: number;
}

export default function DoctorsPage() {
  const [activeTab, setActiveTab] = useState<'doctors' | 'departments'>('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Department Modal State
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ dept_name: '', location: '' });

  // Doctor Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Doctor | null>(null);
  const [docForm, setDocForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    dept_id: '',
    consultation_fee: '500',
  });

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'doctor' | 'department'; id: number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, docRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/doctors'),
      ]);
      const deptJson = await deptRes.json();
      const docJson = await docRes.json();

      setDepartments(deptJson.departments || []);
      setDoctors(docJson.doctors || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading clinical data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Department CRUD
  const handleOpenDeptModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ dept_name: dept.dept_name, location: dept.location || '' });
    } else {
      setEditingDept(null);
      setDeptForm({ dept_name: '', location: '' });
    }
    setIsDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDept ? `/api/departments/${editingDept.dept_id}` : '/api/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save department');

      toast.success(editingDept ? 'Department updated' : 'Department created');
      setIsDeptModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Department submission failed');
    }
  };

  // Doctor CRUD
  const handleOpenDocModal = (doc?: Doctor) => {
    if (doc) {
      setEditingDoc(doc);
      setDocForm({
        name: doc.name,
        email: doc.email,
        phone: doc.phone || '',
        specialization: doc.specialization || '',
        dept_id: String(doc.dept_id),
        consultation_fee: String(doc.consultation_fee),
      });
    } else {
      setEditingDoc(null);
      setDocForm({
        name: '',
        email: '',
        phone: '',
        specialization: '',
        dept_id: departments[0]?.dept_id ? String(departments[0].dept_id) : '',
        consultation_fee: '500',
      });
    }
    setIsDocModalOpen(true);
  };

  const handleDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingDoc ? `/api/doctors/${editingDoc.doctor_id}` : '/api/doctors';
      const method = editingDoc ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(docForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save doctor profile');

      toast.success(editingDoc ? 'Doctor profile updated' : 'Doctor registered');
      setIsDocModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Doctor submission failed');
    }
  };

  // Delete Action
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const endpoint =
        deleteTarget.type === 'doctor'
          ? `/api/doctors/${deleteTarget.id}`
          : `/api/departments/${deleteTarget.id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete record');

      toast.success(`${deleteTarget.type === 'doctor' ? 'Doctor' : 'Department'} deleted successfully`);
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Deletion error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDoctors = selectedDeptFilter === 'all'
    ? doctors
    : doctors.filter((d) => String(d.dept_id) === selectedDeptFilter);

  const doctorColumns: Column<Doctor>[] = [
    {
      key: 'name',
      label: 'Doctor Name',
      sortable: true,
      render: (d) => (
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{d.name}</p>
          <p className="text-xs text-gray-400">{d.email}</p>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialty',
      sortable: true,
      render: (d) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
          {d.specialization || 'General'}
        </span>
      ),
    },
    {
      key: 'dept_name',
      label: 'Department',
      sortable: true,
      render: (d) => (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {d.dept_name}
        </span>
      ),
    },
    {
      key: 'consultation_fee',
      label: 'Consultation Fee',
      sortable: true,
      render: (d) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          ₹{Number(d.consultation_fee).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (d) => d.phone || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (d) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDocModal(d)}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteTarget({ type: 'doctor', id: d.doctor_id, name: d.name })}
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
            Doctors & Clinical Departments
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Relational departments schema with foreign keys and doctors-per-department counts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'doctors' ? (
            <button
              onClick={() => handleOpenDocModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Doctor</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenDeptModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-emerald-950/60 gap-4 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('doctors')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'doctors'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>Doctors Registry ({doctors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Medical Departments ({departments.length})</span>
        </button>
      </div>

      {/* TAB 1: DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <DataTable
            columns={doctorColumns}
            data={filteredDoctors}
            isLoading={isLoading}
            searchPlaceholder="Search doctor by name, email, specialization..."
            searchKey={(d) => `${d.name} ${d.email} ${d.specialization} ${d.dept_name}`}
            defaultSortKey="name"
            topAction={
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-emerald-950/60 bg-white dark:bg-[#0a130e] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.dept_id} value={String(dept.dept_id)}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
              </div>
            }
          />
        </div>
      )}

      {/* TAB 2: DEPARTMENTS */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.dept_id}
              className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">
                        {dept.dept_name}
                      </h3>
                      <p className="text-xs text-gray-400">Location: {dept.location || 'Hospital Main'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenDeptModal(dept)}
                      className="p-1 rounded text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'department', id: dept.dept_id, name: dept.dept_name })}
                      className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-emerald-950/20 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    Specialist Doctors
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {dept.total_doctors}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-emerald-950/40 text-[11px] text-gray-400 font-mono">
                Department ID #{dept.dept_id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.dept_name}` : 'Create Medical Department'}
        description="Department names must be unique according to schema constraints."
      >
        <form onSubmit={handleDeptSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={deptForm.dept_name}
              onChange={(e) => setDeptForm({ ...deptForm, dept_name: e.target.value })}
              placeholder="e.g. Neurology"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Building / Location
            </label>
            <input
              type="text"
              value={deptForm.location}
              onChange={(e) => setDeptForm({ ...deptForm, location: e.target.value })}
              placeholder="e.g. Block D, 3rd Floor"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDeptModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-950/40 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 gradient-green-btn text-sm font-semibold rounded-lg shadow-xs"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Doctor Modal */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        title={editingDoc ? `Edit Doctor: ${editingDoc.name}` : 'Register New Doctor'}
        description="Doctor email must be unique and fee must satisfy CHECK (consultation_fee >= 0)."
      >
        <form onSubmit={handleDocSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={docForm.name}
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                placeholder="e.g. Dr. Rajesh Kumar"
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
                value={docForm.email}
                onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                placeholder="e.g. rajesh@hospital.com"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={docForm.phone}
                onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                placeholder="e.g. 9812345678"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={docForm.specialization}
                onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                placeholder="e.g. Neurologist"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Department *
              </label>
              <select
                required
                value={docForm.dept_id}
                onChange={(e) => setDocForm({ ...docForm, dept_id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.dept_id} value={dept.dept_id}>
                    {dept.dept_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Consultation Fee (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={docForm.consultation_fee}
                onChange={(e) => setDocForm({ ...docForm, consultation_fee: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsDocModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:hover:bg-emerald-950/40 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 gradient-green-btn text-sm font-semibold rounded-lg shadow-xs"
            >
              Save Doctor
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'doctor' ? 'Doctor' : 'Department'}`}
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Foreign key constraints will prevent deletion if this entity is referenced by other hospital records.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
