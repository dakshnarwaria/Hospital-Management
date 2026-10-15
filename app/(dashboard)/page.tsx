'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Stethoscope,
  Calendar,
  Activity,
  BedDouble,
  CreditCard,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { StatCard } from '@/components/stat-card';
import { CardSkeleton } from '@/components/skeleton-loader';
import { toast } from 'sonner';

interface DashboardData {
  summary: {
    totalPatients: number;
    totalDoctors: number;
    todayAppointments: number;
    currentAdmissions: number;
    totalCapacity: number;
    totalOccupied: number;
    occupancyRate: number;
    pendingBillTotal: number;
  };
  charts: {
    appointmentsPerDoctor: Array<{
      doctor_id: number;
      doctor_name: string;
      dept_name: string;
      appointment_count: number;
    }>;
    occupancyByType: Array<{
      room_type: string;
      capacity: number;
      occupied: number;
      available: number;
    }>;
  };
  recent: {
    appointments: Array<{
      appointment_id: number;
      appointment_date: string;
      appointment_time: string;
      status: string;
      reason: string;
      patient_name: string;
      doctor_name: string;
    }>;
    admissions: Array<{
      admission_id: number;
      admit_date: string;
      diagnosis: string;
      patient_name: string;
      doctor_name: string;
      room_number: string;
      room_type: string;
      status: string;
    }>;
  };
}

const PIE_COLORS = ['#10b981', '#059669', '#047857', '#34d399', '#065f46'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
      const json = await res.json();
      setData(json);
      if (isManual) toast.success('Dashboard statistics refreshed');
    } catch (err: any) {
      toast.error(err.message || 'Error loading dashboard');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-emerald-500/10 rounded-lg animate-pulse" />
        <CardSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl bg-emerald-500/10 animate-pulse" />
          <div className="h-80 rounded-xl bg-emerald-500/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/30">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">Unable to load hospital stats</h3>
        <p className="text-sm text-rose-700 dark:text-rose-400 mt-1">Check MySQL connection or API handler.</p>
        <button
          onClick={() => fetchStats(true)}
          className="mt-4 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { summary, charts, recent } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Hospital Operations Center
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time tracking of patients, admissions, beds, appointments, and financial flows.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-500/30 bg-white dark:bg-[#0a130e] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          <Link
            href="/insights"
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl gradient-green-btn shadow-xs"
          >
            <span>DBMS Live Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid (6 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Patients"
          value={summary.totalPatients}
          icon={Users}
          badge="Registered"
        />
        <StatCard
          title="Active Doctors"
          value={summary.totalDoctors}
          icon={Stethoscope}
          badge="Specialists"
        />
        <StatCard
          title="Today's Appts"
          value={summary.todayAppointments}
          icon={Calendar}
          subtitle="Scheduled today"
        />
        <StatCard
          title="Current Inpatients"
          value={summary.currentAdmissions}
          icon={Activity}
          badge="View"
        />
        <StatCard
          title="Room Occupancy"
          value={`${summary.occupancyRate}%`}
          icon={BedDouble}
          subtitle={`${summary.totalOccupied} / ${summary.totalCapacity} beds`}
          trend={summary.occupancyRate >= 80 ? 'Near Capacity' : 'Available'}
          trendDirection={summary.occupancyRate >= 80 ? 'down' : 'up'}
        />
        <StatCard
          title="Pending Dues"
          value={`$${summary.pendingBillTotal.toLocaleString()}`}
          icon={CreditCard}
          trend="Outstanding"
          trendDirection="down"
        />
      </div>

      {/* Analytical Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointments per Doctor Bar Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Appointments by Doctor
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total consultations booked across clinical specialties
              </p>
            </div>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View Schedule
            </Link>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.appointmentsPerDoctor} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="doctor_name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a130e',
                    borderColor: '#183323',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }}
                />
                <Bar
                  dataKey="appointment_count"
                  name="Appointments"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Room Occupancy by Type Pie/Donut Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-emerald-500" />
                Room Utilization by Type
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Occupied vs available beds in General, Private & ICU
              </p>
            </div>
            <Link
              href="/rooms"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              All Rooms
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.occupancyByType}
                  dataKey="occupied"
                  nameKey="room_type"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, value }) => `${name}: ${value} beds`}
                >
                  {charts.occupancyByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a130e',
                    borderColor: '#183323',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-emerald-950/40 text-center">
            {charts.occupancyByType.map((r) => (
              <div key={r.room_type} className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{r.room_type}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {r.occupied} / {r.capacity}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  {r.available} free
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity: Appointments & Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-emerald-950/40">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Latest Appointments
            </h3>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-emerald-950/30 mt-2">
            {recent.appointments.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No recent appointments</p>
            ) : (
              recent.appointments.map((a) => (
                <div key={a.appointment_id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{a.patient_name}</p>
                    <p className="text-gray-500 dark:text-gray-400">
                      With <span className="font-medium text-emerald-600 dark:text-emerald-400">{a.doctor_name}</span> &bull; {a.reason || 'General'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${
                        a.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : a.status === 'Cancelled'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {a.status}
                    </span>
                    <p className="text-gray-400 font-mono text-[11px]">
                      {a.appointment_date} {a.appointment_time}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Admissions */}
        <div className="rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-emerald-950/40">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Recent Admissions (Inpatients)
            </h3>
            <Link
              href="/admissions"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-emerald-950/30 mt-2">
            {recent.admissions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No recent admissions</p>
            ) : (
              recent.admissions.map((adm) => (
                <div key={adm.admission_id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{adm.patient_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px]">
                        Room {adm.room_number} ({adm.room_type})
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                      Doctor: {adm.doctor_name} &bull; <span className="italic">{adm.diagnosis}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1 ${
                        adm.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {adm.status}
                    </span>
                    <p className="text-gray-400 font-mono text-[11px]">{adm.admit_date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
