'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'warning' | 'success';
  className?: string;
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  const variantStyles = {
    default: 'bg-white border-border',
    warning: 'bg-orange-50 border-orange-200',
    success: 'bg-green-50 border-green-200',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-orange-100 text-orange-600',
    success: 'bg-green-100 text-green-600',
  };

  return (
    <div className={cn(
      'rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className={cn('p-2 rounded-lg', iconStyles[variant])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className={cn(
              'text-xs font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-500'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
