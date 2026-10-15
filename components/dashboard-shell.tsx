'use client';

import React, { useState, Suspense } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Navbar } from '@/components/navbar';

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar with Suspense boundary for usePathname */}
      <Suspense fallback={<aside className="hidden lg:block w-64 border-r border-emerald-950/20 bg-white/95 dark:bg-[#07110a]/95" />}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </Suspense>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all">
        <Suspense fallback={<header className="h-16 w-full border-b border-emerald-950/20" />}>
          <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-32 bg-gray-200 dark:bg-emerald-950/30 rounded-xl" /></div>}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
