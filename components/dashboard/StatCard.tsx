'use client';

import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  bgColor: string;
  iconColor: string;
  trend?: number;
}

export function StatCard({ title, value, icon: Icon, bgColor, iconColor, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: bgColor }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            )}
          >
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{title}</p>
    </div>
  );
}
