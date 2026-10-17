'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Code,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Terminal,
  Activity,
  BedDouble,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  id: string;
  title: string;
  description: string;
  sql: string;
  data: any[];
}

export default function InsightsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [activeReportId, setActiveReportId] = useState<string>('pending_dues');
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Demo Mode States
  const [demoState, setDemoState] = useState<any>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoLogs, setDemoLogs] = useState<Array<{ time: string; type: 'info' | 'success' | 'trigger' | 'error'; message: string; sql?: string }>>([]);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('Failed to load SQL reports');
      const json = await res.json();
      setReports(json.reports || []);
    } catch (err: any) {
      toast.error(err.message || 'Error loading DBMS reports');
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchDemoState = async () => {
    try {
      const res = await fetch('/api/demo');
      const json = await res.json();
      setDemoState(json);
    } catch {
      // Non-critical demo state polling failure handled silently
    }
  };

  useEffect(() => {
    fetchReports();
    fetchDemoState();
    setDemoLogs([
      {
        time: new Date().toLocaleTimeString(),
        type: 'info',
        message: 'Demo Engine initialized. Ready to trigger stored procedures and database triggers.',
      },
    ]);
  }, []);

  const addLog = (type: 'info' | 'success' | 'trigger' | 'error', message: string, sql?: string) => {
    setDemoLogs((prev) => [
      {
        time: new Date().toLocaleTimeString(),
        type,
        message,
        sql,
      },
      ...prev.slice(0, 20),
    ]);
  };

  const runDemoAction = async (action: string) => {
    setIsDemoRunning(true);
    try {
      if (action === 'book_appointment') {
        addLog('info', 'Executing CALL book_appointment(patient_id, doctor_id, CURDATE(), time, reason)...');
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'book_appointment' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to book appointment');

        addLog(
          'success',
          `Successfully executed CALL book_appointment(). Created appointment #${json.appointment?.appointment_id} for ${json.appointment?.patient_name} with ${json.appointment?.doctor_name} at ${json.appointment?.appointment_time}.`,
          "CALL book_appointment(1, 1, CURDATE(), '16:00:00', 'Demo Routine Checkup');"
        );
        toast.success('Step 1 Complete: Appointment booked via stored procedure!');
      } else if (action === 'fill_room') {
        addLog('info', 'Executing CALL admit_patient() to allocate available room bed...');
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fill_room' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to admit patient');

        addLog(
          'success',
          json.message,
          "CALL admit_patient(p_patient, p_room, p_doctor, 'Admitted for observation');"
        );
        toast.success('Step 2 Complete: Patient admitted. Trigger updated room.occupied!');
      } else if (action === 'trigger_room_full') {
        addLog('info', 'Attempting CALL admit_patient() on a full room to test trigger before_admission...');
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'trigger_room_full' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Action failed');

        if (json.expectedErrorCaught) {
          addLog(
            'trigger',
            `TRIGGER BLOCKED WRITE: ${json.proof}`,
            "SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Room is full';"
          );
          toast.success(
            'Step 3 Verified! MySQL Trigger before_admission rejected write: "Room is full" (SQLSTATE 45000)'
          );
        }
      } else if (action === 'discharge') {
        addLog('info', 'Executing CALL discharge_patient() to discharge an active inpatient...');
        const res = await fetch('/api/demo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'discharge' }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to discharge patient');

        addLog(
          'success',
          json.message,
          'CALL discharge_patient(p_admission);'
        );
        toast.success('Step 4 Complete: Patient discharged! Trigger after_discharge freed a bed.');
      }

      fetchDemoState();
      fetchReports();
    } catch (err: any) {
      addLog('error', err.message || 'Demo action error');
      toast.error(err.message || 'Demo error');
    } finally {
      setIsDemoRunning(false);
    }
  };

  const handleCopySql = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('SQL query copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentReport = reports.find((r) => r.id === activeReportId) || reports[0];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              DBMS Group Project
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              MySQL 8.0+
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mt-1">
            Database Insights & Live Demo Engine
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Interactive verification of stored procedures, database triggers, views, constraints, and analytical SQL.
          </p>
        </div>

        <button
          onClick={() => {
            fetchReports();
            fetchDemoState();
            toast.success('Database reports re-executed against MySQL');
          }}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-emerald-500/30 bg-white dark:bg-[#0a130e] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-run All Queries</span>
        </button>
      </div>

      {/* SECTION 1: INTERACTIVE DEMO MODE PANEL */}
      <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/30 via-white to-white dark:from-[#0a1810] dark:via-[#07110a] dark:to-[#0a130e] p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Interactive DBMS Demo Mode
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Follow this 4-step sequence to demonstrate stored procedures and trigger constraints live:
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Triggers Active
            </span>
          </div>
        </div>

        {/* 4 Interactive Walkthrough Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="rounded-xl border border-emerald-500/20 bg-white/80 dark:bg-[#0a130e]/80 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Step 1
                </span>
                <span className="text-[10px] font-mono text-gray-400">PROCEDURE</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                Book Appointment
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calls <code className="text-emerald-600 font-mono text-[11px]">book_appointment()</code> with unique slot checking.
              </p>
            </div>
            <button
              onClick={() => runDemoAction('book_appointment')}
              disabled={isDemoRunning}
              className="w-full py-2 px-3 rounded-lg gradient-green-btn text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. Book Appt</span>
            </button>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-emerald-500/20 bg-white/80 dark:bg-[#0a130e]/80 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Step 2
                </span>
                <span className="text-[10px] font-mono text-gray-400">TRIGGER</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                Fill a Room Bed
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Executes <code className="text-emerald-600 font-mono text-[11px]">admit_patient()</code>. Trigger <code className="text-emerald-600 font-mono text-[11px]">after_admission</code> auto-increments occupied count.
              </p>
            </div>
            <button
              onClick={() => runDemoAction('fill_room')}
              disabled={isDemoRunning}
              className="w-full py-2 px-3 rounded-lg gradient-green-btn text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <BedDouble className="w-3.5 h-3.5" />
              <span>2. Fill Room</span>
            </button>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Step 3
                </span>
                <span className="text-[10px] font-mono text-rose-500">SQLSTATE 45000</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                Trigger &quot;Room is full&quot;
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Attempts admit into full room. Trigger <code className="text-rose-500 font-mono text-[11px]">before_admission</code> blocks insertion!
              </p>
            </div>
            <button
              onClick={() => runDemoAction('trigger_room_full')}
              disabled={isDemoRunning}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>3. Trigger Error</span>
            </button>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-emerald-500/20 bg-white/80 dark:bg-[#0a130e]/80 p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Step 4
                </span>
                <span className="text-[10px] font-mono text-gray-400">DISCHARGE TRIGGER</span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                Discharge & Free Bed
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Calls <code className="text-emerald-600 font-mono text-[11px]">discharge_patient()</code>. Trigger <code className="text-emerald-600 font-mono text-[11px]">after_discharge</code> decrements occupied!
              </p>
            </div>
            <button
              onClick={() => runDemoAction('discharge')}
              disabled={isDemoRunning}
              className="w-full py-2 px-3 rounded-lg gradient-green-btn text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>4. Discharge & Drop</span>
            </button>
          </div>
        </div>

        {/* Real-time Room Status Snapshot during Demo */}
        {demoState?.rooms && (
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-white dark:bg-[#0a130e]">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Live Room Capacity State (Auto-synced by Triggers)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {demoState.rooms.map((r: any) => {
                const isFull = r.occupied >= r.capacity;
                return (
                  <div
                    key={r.room_id}
                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                      isFull
                        ? 'border-rose-400/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                        : 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold">Room {r.room_number}</span> ({r.room_type})
                    </div>
                    <span className="font-mono font-black">
                      {r.occupied} / {r.capacity} Beds {isFull ? '🔴 [FULL]' : '🟢 [AVAILABLE]'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Demo Execution Console / Log Terminal */}
        <div className="rounded-xl border border-gray-800 bg-[#050806] p-4 text-xs font-mono text-gray-300 space-y-2">
          <div className="flex items-center justify-between text-gray-500 pb-2 border-b border-gray-800">
            <span className="flex items-center gap-1.5 font-bold text-gray-400">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              DBMS Execution Console
            </span>
            <span className="text-[10px]">Auto-capturing MySQL Engine responses</span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {demoLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                <span className="text-gray-500">[{log.time}] </span>
                {log.type === 'trigger' ? (
                  <span className="text-rose-400 font-bold">
                    💥 {log.message}
                  </span>
                ) : log.type === 'success' ? (
                  <span className="text-emerald-400">
                    ✅ {log.message}
                  </span>
                ) : log.type === 'error' ? (
                  <span className="text-rose-500 font-bold">
                    ❌ {log.message}
                  </span>
                ) : (
                  <span className="text-cyan-400">
                    ℹ️ {log.message}
                  </span>
                )}
                {log.sql && (
                  <div className="text-[11px] text-gray-400 pl-4 bg-white/5 py-0.5 px-2 rounded mt-0.5 border-l-2 border-emerald-500">
                    SQL: {log.sql}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 2: DBMS ANALYTICAL QUERIES WITH SQL TEXT BESIDE RESULTS */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-500" />
            <span>Database Reports (Live Queries &amp; Raw SQL)</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Every report is generated live from MySQL. The raw SQL executed by the API is displayed alongside each dataset.
          </p>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-emerald-950/60 pb-3">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReportId(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeReportId === r.id
                  ? 'gradient-sidebar-active'
                  : 'bg-white dark:bg-[#0a130e] border border-gray-200 dark:border-emerald-950/60 text-gray-600 dark:text-gray-300 hover:bg-emerald-50/50'
              }`}
            >
              {r.title}
            </button>
          ))}
        </div>

        {/* Active Report Display */}
        {isLoadingReports ? (
          <div className="h-96 rounded-2xl bg-gray-100 dark:bg-emerald-950/20 animate-pulse" />
        ) : currentReport ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Raw SQL Box */}
            <div className="lg:col-span-5 rounded-2xl border border-emerald-500/20 bg-[#050806] text-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5" />
                  <span>Executed SQL Query</span>
                </span>
                <button
                  onClick={() => handleCopySql(currentReport.sql, currentReport.id)}
                  className="p-1 rounded text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedId === currentReport.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === currentReport.id ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="font-mono text-xs text-emerald-300/90 whitespace-pre-wrap overflow-x-auto p-3 rounded-lg bg-black/50 border border-gray-800 leading-relaxed">
                {currentReport.sql}
              </pre>

              <div className="pt-2 text-xs text-gray-400">
                <p className="font-semibold text-gray-300">{currentReport.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{currentReport.description}</p>
              </div>
            </div>

            {/* Right: Live Data Table */}
            <div className="lg:col-span-7 rounded-2xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-5 shadow-xs overflow-x-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-emerald-950/40 mb-3">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Live Query Output ({currentReport.data?.length || 0} rows)
                </h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                  Source: hospital_db
                </span>
              </div>

              {currentReport.data && currentReport.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-700 dark:text-gray-300">
                    <thead className="bg-gray-50 dark:bg-emerald-950/30 font-semibold uppercase text-gray-500 dark:text-emerald-300 text-[10px]">
                      <tr>
                        {Object.keys(currentReport.data[0]).map((col) => (
                          <th key={col} className="px-3 py-2.5 whitespace-nowrap">
                            {col.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-emerald-950/30">
                      {currentReport.data.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20">
                          {Object.entries(row).map(([colKey, val]: [string, any], valIdx) => {
                            const isCurrency = ['amount', 'fee', 'revenue', 'billed', 'charge'].some((k) =>
                              colKey.toLowerCase().includes(k)
                            );
                            return (
                              <td key={valIdx} className="px-3 py-2 whitespace-nowrap font-mono">
                                {typeof val === 'number'
                                  ? isCurrency
                                    ? `₹${val.toLocaleString()}`
                                    : val.toLocaleString()
                                  : isCurrency && !isNaN(Number(val)) && val !== null && val !== ''
                                    ? `₹${Number(val).toLocaleString()}`
                                    : String(val ?? '-')}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-6 text-center">
                  Query returned 0 rows.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
