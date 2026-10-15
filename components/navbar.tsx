'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, PlayCircle, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  '/': 'Executive Dashboard',
  '/patients': 'Patient Directory',
  '/doctors': 'Doctors & Medical Departments',
  '/rooms': 'Room Capacity & Real-Time Availability',
  '/appointments': 'Clinical Appointments',
  '/admissions': 'Patient Admissions & Discharges',
  '/prescriptions': 'Prescription Records',
  '/bills': 'Billing & Financial Accounts',
  '/insights': 'MySQL Schema Insights & Interactive Demo',
};

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const pathname = usePathname();

  // Find matching title
  let currentTitle = 'Hospital Management';
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (route === '/' && pathname === '/') {
      currentTitle = title;
      break;
    }
    if (route !== '/' && pathname.startsWith(route)) {
      currentTitle = title;
      break;
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-emerald-950/20 dark:border-emerald-950/60 bg-white/80 dark:bg-[#07110a]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-emerald-950/40 focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {currentTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Schema Status Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>hospital_db Live</span>
        </div>

        {/* Quick Demo CTA */}
        <Link
          href="/insights"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition-colors"
        >
          <PlayCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Interactive Demo</span>
        </Link>

        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
