import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, ChevronDown } from 'lucide-react';

// ─── Toast — powered by Sonner ───────────────────────────────────────────────
export { toast } from 'sonner';
// ToastProvider kept for backward-compatibility; Sonner's <Toaster /> is in App.tsx
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Button ──────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost: 'hover:bg-blue-50 text-blue-600',
  outline: 'border-2 border-blue-200 hover:border-blue-400 text-blue-600 hover:bg-blue-50',
};
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  )
);

// ─── Card ──────────────────────────────────────────────
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm border border-blue-100', className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4 border-b border-blue-50', className)} {...props}>{children}</div>;
}
export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4', className)} {...props}>{children}</div>;
}

// ─── Input ──────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, label, id, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
    <input
      ref={ref}
      id={id}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2',
        error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

// ─── Textarea ──────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, label, id, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
    <textarea
      ref={ref}
      id={id}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl border text-sm transition focus:outline-none focus:ring-2 resize-none',
        error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200',
        className
      )}
      {...props}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

// ─── Select ──────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, label, id, children, ...props }, ref) => (
  <div className="space-y-1">
    {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>}
    <div className="relative">
      <select
        ref={ref}
        id={id}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border text-sm appearance-none transition focus:outline-none focus:ring-2 bg-white',
          error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:border-blue-400 focus:ring-blue-200',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
));

// ─── Badge (status/label) ──────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
interface StatusBadgeProps { variant?: BadgeVariant; children: React.ReactNode; className?: string; }
const badgeVariants: Record<BadgeVariant, string> = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
};
export function StatusBadge({ variant = 'blue', children, className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', badgeVariants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Progress ──────────────────────────────────────────────
interface ProgressBarProps { value: number; max?: number; className?: string; color?: string; }
export function ProgressBar({ value, max = 100, className, color = 'bg-blue-500' }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={cn('h-2.5 bg-gray-100 rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Dialog ──────────────────────────────────────────────
interface DialogProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; maxWidth?: string; }
export function Dialog({ open, onClose, title, children, maxWidth = 'max-w-lg' }: DialogProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className={cn('relative bg-white rounded-2xl shadow-2xl w-full', maxWidth)} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────
interface TabsProps { tabs: { id: string; label: string; icon?: React.ReactNode }[]; active: string; onChange: (id: string) => void; className?: string; }
export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 bg-blue-50 p-1 rounded-xl', className)}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            active === t.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────
interface ConfirmDialogProps { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; }
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Delete' }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-gray-600 text-sm mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    </Dialog>
  );
}

// ─── Empty State ──────────────────────────────────────────────
interface EmptyStateProps { icon?: string; title: string; description?: string; action?: React.ReactNode; }
export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────
interface AvatarProps { name: string; color?: string; size?: 'sm' | 'md' | 'lg'; }
export function Avatar({ name, color = 'bg-blue-500', size = 'md' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold text-white flex-shrink-0', color, sizes[size])}>
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <div className={cn('w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin', className)} />;
}
