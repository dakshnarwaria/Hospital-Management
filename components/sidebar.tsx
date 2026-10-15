'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  BedDouble,
  Calendar,
  Activity,
  Pill,
  CreditCard,
  Database,
  HeartPulse,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Doctors & Depts', href: '/doctors', icon: Stethoscope },
  { label: 'Rooms', href: '/rooms', icon: BedDouble },
  { label: 'Appointments', href: '/appointments', icon: Calendar },
  { label: 'Admissions', href: '/admissions', icon: Activity },
  { label: 'Prescriptions', href: '/prescriptions', icon: Pill },
  { label: 'Bills', href: '/bills', icon: CreditCard },
  { label: 'DB Insights & Demo', href: '/insights', icon: Database, badge: 'DBMS Star' },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-emerald-950/20 dark:border-emerald-950/60 bg-white/95 dark:bg-[#07110a]/95 backdrop-blur-md flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100 dark:border-emerald-950/40">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-gray-900 dark:text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/25">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent font-extrabold">
                MediCore
              </span>
              <span className="text-xs block text-gray-400 font-medium -mt-1">Hospital DBMS</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-emerald-400/60">
            Hospital Management
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'gradient-sidebar-active'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-emerald-50/60 dark:text-gray-400 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer info: DBMS Project badge */}
        <div className="p-4 border-t border-gray-100 dark:border-emerald-950/40">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/30 p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                MySQL hospital_db
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
              Triggers, Stored Procedures, Views & Foreign Keys active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
