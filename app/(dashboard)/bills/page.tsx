'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { DataTable, Column } from '@/components/data-table';
import { Modal } from '@/components/modal';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toast } from 'sonner';

interface Bill {
  bill_id: number;
  patient_id: number;
  patient_name: string;
  patient_phone: string;
  amount: number;
  bill_date: string;
  bill_type: 'Consultation' | 'Admission' | 'Medicine' | 'Lab';
  status: 'Paid' | 'Pending';
}

interface PendingByPatient {
  patient_id: number;
  patient_name: string;
  pending_total: number;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [pendingByPatient, setPendingByPatient] = useState<PendingByPatient[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    amount: '',
    bill_date: '',
    bill_type: 'Consultation' as 'Consultation' | 'Admission' | 'Medicine' | 'Lab',
    status: 'Pending' as 'Paid' | 'Pending',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);

      const res = await fetch(`/api/bills?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load billing statements');
      const data = await res.json();

      setBills(data.bills || []);
      setTotalPending(data.totalPending || 0);
      setTotalPaid(data.totalPaid || 0);
      setPendingByPatient(data.pendingByPatient || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading bills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/patients?limit=100');
      const data = await res.json();
      setPatients(data.patients || []);
      if (data.patients?.length && !formData.patient_id) {
        setFormData((prev) => ({ ...prev, patient_id: String(data.patients[0].patient_id) }));
      }
    } catch {
      // Patients lookup handled silently
    }
  };

  useEffect(() => {
    fetchPatients();
    setFormData((prev) => ({
      ...prev,
      bill_date: new Date().toISOString().slice(0, 10),
    }));
  }, []);

  useEffect(() => {
    fetchBills();
  }, [filterStatus, filterType]);

  const handleToggleStatus = async (billId: number, currentStatus: string) => {
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
      fetchBills();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update bill');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create bill');

      toast.success('Bill generated successfully');
      setIsModalOpen(false);
      setFormData((prev) => ({ ...prev, amount: '' }));
      fetchBills();
    } catch (err: any) {
      toast.error(err.message || 'Bill generation error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/bills/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete bill');

      toast.success('Bill deleted successfully');
      setDeleteId(null);
      fetchBills();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete bill');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Bill>[] = [
    {
      key: 'bill_id',
      label: 'Invoice #',
      sortable: true,
      className: 'w-20 font-mono text-xs',
      render: (b) => `#${b.bill_id}`,
    },
    {
      key: 'patient_name',
      label: 'Patient',
      sortable: true,
      render: (b) => (
        <div>
          <Link
            href={`/patients/${b.patient_id}`}
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {b.patient_name}
          </Link>
          <p className="text-xs text-gray-400">{b.patient_phone}</p>
        </div>
      ),
    },
    {
      key: 'bill_type',
      label: 'Bill Category',
      sortable: true,
      render: (b) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            b.bill_type === 'Consultation'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : b.bill_type === 'Admission'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
              : b.bill_type === 'Medicine'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {b.bill_type}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount ($)',
      sortable: true,
      render: (b) => (
        <span className="font-mono font-black text-gray-900 dark:text-white">
          ${Number(b.amount).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'bill_date',
      label: 'Date',
      sortable: true,
      className: 'font-mono text-xs text-gray-500',
    },
    {
      key: 'status',
      label: 'Status / Action',
      sortable: true,
      render: (b) => (
        <button
          onClick={() => handleToggleStatus(b.bill_id, b.status)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
            b.status === 'Paid'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 hover:bg-emerald-200'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-200'
          }`}
          title="Click to toggle Paid/Pending"
        >
          {b.status === 'Paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          <span>{b.status}</span>
        </button>
      ),
    },
    {
      key: 'actions',
      label: 'Delete',
      className: 'text-right',
      render: (b) => (
        <button
          onClick={() => setDeleteId(b.bill_id)}
          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
          title="Delete Bill"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Billing & Accounts Ledger
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Categorized revenue with CHECK (amount &gt; 0) and patient pending balance rollups.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-green-btn text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Bill</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-50/30 dark:bg-rose-950/10 p-5">
          <span className="text-xs font-bold uppercase text-rose-700 dark:text-rose-400">
            Total Pending Dues
          </span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
            ${totalPending.toLocaleString()}
          </p>
          <p className="text-xs text-rose-600/70 mt-1">Awaiting patient settlement</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/10 p-5">
          <span className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400">
            Total Collected Revenue
          </span>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            ${totalPaid.toLocaleString()}
          </p>
          <p className="text-xs text-emerald-600/70 mt-1">Cleared bills</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-white dark:bg-[#0a130e] p-5">
          <span className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
            Total Invoiced Amount
          </span>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            ${(totalPending + totalPaid).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{bills.length} total invoices issued</p>
        </div>
      </div>

      {/* Pending Balance Per Patient Panel */}
      {pendingByPatient.length > 0 && (
        <div className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Pending Balance Summary Per Patient</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pendingByPatient.map((item) => (
              <div
                key={item.patient_id}
                className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between"
              >
                <div>
                  <Link
                    href={`/patients/${item.patient_id}`}
                    className="font-bold text-xs text-gray-900 dark:text-white hover:underline"
                  >
                    {item.patient_name}
                  </Link>
                  <p className="text-[10px] text-gray-400">Patient #{item.patient_id}</p>
                </div>
                <span className="font-mono font-black text-sm text-rose-600 dark:text-rose-400">
                  ${Number(item.pending_total).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-emerald-500/15 bg-white dark:bg-[#0a130e]">
        <Filter className="w-4 h-4 text-emerald-500" />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Filters:</span>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-emerald-950/60 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Payment Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-emerald-950/60 bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Bill Categories</option>
          <option value="Consultation">Consultation</option>
          <option value="Admission">Admission</option>
          <option value="Medicine">Medicine</option>
          <option value="Lab">Lab</option>
        </select>

        {(filterStatus || filterType) && (
          <button
            onClick={() => {
              setFilterStatus('');
              setFilterType('');
            }}
            className="text-xs text-rose-600 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bills DataTable */}
      <DataTable
        columns={columns}
        data={bills}
        isLoading={isLoading}
        searchPlaceholder="Search invoices by patient name or category..."
        searchKey={(b) => `${b.patient_name} ${b.bill_type} ${b.status} ${b.amount}`}
        defaultSortKey="bill_date"
        defaultSortOrder="desc"
        emptyTitle="No bills found"
        emptyDescription="Generate a bill using the button above."
        emptyAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 rounded-lg gradient-green-btn text-xs font-semibold"
          >
            Generate First Bill
          </button>
        }
      />

      {/* Create Bill Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Patient Invoice / Bill"
        description="Amount must be positive according to schema CHECK (amount > 0)."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Select Patient *
            </label>
            <select
              required
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a patient...</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.name} (#{p.patient_id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Charge Category *
              </label>
              <select
                required
                value={formData.bill_type}
                onChange={(e) => setFormData({ ...formData, bill_type: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Consultation">Consultation</option>
                <option value="Admission">Admission</option>
                <option value="Medicine">Medicine</option>
                <option value="Lab">Lab</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Amount ($) * (Check &gt; 0)
              </label>
              <input
                type="number"
                min="1"
                step="50"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 800"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Bill Date *
              </label>
              <input
                type="date"
                required
                value={formData.bill_date}
                onChange={(e) => setFormData({ ...formData, bill_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Initial Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-emerald-950/60 bg-white dark:bg-[#07110a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
              </select>
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
              {isSubmitting ? 'Generating...' : 'Issue Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Bill"
        message="Are you sure you want to delete this billing statement?"
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
