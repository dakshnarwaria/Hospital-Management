import React, { Suspense } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] flex items-center justify-center" />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
