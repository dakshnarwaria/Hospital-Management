import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  badge?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  badge,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-500/15 bg-white dark:bg-[#0a130e] p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-500/30">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-emerald-300/70">
            {title}
          </p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/20">
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {(trend || badge) && (
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-gray-100 dark:border-emerald-950/40 text-xs">
          {trend && (
            <span
              className={`font-medium ${
                trendDirection === 'up'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trendDirection === 'down'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {trend}
            </span>
          )}
          {badge && (
            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 font-medium text-emerald-800 dark:text-emerald-300 text-[10px]">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
