import React from 'react';
import { motion } from 'framer-motion';
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
  pulse?: boolean;
}

export function DashboardCard({
  title, value, icon, subtitle,
  color = 'text-blue-600',
  bgColor = 'bg-blue-50',
  trend, className, pulse = false,
}: DashboardCardProps) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <Card
        className={cn(
          'p-5 hover:shadow-[0_4px_16px_0_rgb(59_130_246/0.12)] transition-shadow duration-200 overflow-hidden relative',
          className
        )}
      >
        {/* Subtle background blob */}
        <div
          className={cn('absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-20 blur-xl', bgColor)}
          aria-hidden
        />

        <div className="flex items-start justify-between relative">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 truncate">{title}</p>
            <p className={cn('text-3xl font-extrabold leading-none', color)}>{value}</p>
            {subtitle && (
              <p className={cn('text-xs font-semibold mt-1.5', pulse ? 'text-red-500 animate-pulse-soft' : 'text-gray-400')}>
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm',
              bgColor
            )}
          >
            {icon}
          </div>
        </div>

        {trend !== undefined && (
          <div
            className={cn(
              'mt-3 pt-3 border-t border-gray-50 flex items-center gap-1 text-xs font-bold',
              trend >= 0 ? 'text-emerald-600' : 'text-red-500'
            )}
          >
            <span className="text-base leading-none">{trend >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
