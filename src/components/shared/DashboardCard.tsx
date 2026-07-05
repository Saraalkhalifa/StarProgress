import React from 'react';
import { cn } from '../../lib/utils';
import { Card } from '../ui';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  color?: string;
  bgColor?: string;
  trend?: number;
  className?: string;
}

export function DashboardCard({ title, value, icon, subtitle, color = 'text-blue-600', bgColor = 'bg-blue-50', trend, className }: DashboardCardProps) {
  return (
    <Card className={cn('p-5 hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{title}</p>
          <p className={cn('text-2xl font-bold', color)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0', bgColor)}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
          <span>{trend >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend)}% vs last month</span>
        </div>
      )}
    </Card>
  );
}
