import React, { forwardRef, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X, ChevronDown, CheckCircle, AlertCircle, Info } from 'lucide-react';

// ─── Toast — powered by Sonner ───────────────────────────────────────────────
export { toast } from 'sonner';
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-sm shadow-blue-200',
  secondary: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700',
  danger:    'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm shadow-red-100',
  ghost:     'hover:bg-blue-50 active:bg-blue-100 text-blue-600',
  outline:   'border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 text-blue-600',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm:  'px-3.5 py-1.5 text-sm gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-6 py-2.5 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-semibold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        'hover:-translate-y-px active:translate-y-0 active:scale-[0.97]',
        'cursor-pointer select-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-white rounded-3xl border border-blue-100/80',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.06),0_1px_2px_-1px_rgb(0_0_0/0.06)]',
        'transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-b border-blue-50', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4', className)} {...props}>{children}</div>;
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-150',
          'placeholder:text-gray-400 placeholder:font-normal',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
            : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100 bg-white',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, hint, id, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn(
          'w-full px-4 py-2.5 rounded-2xl border text-sm font-medium transition-all duration-150 resize-none',
          'placeholder:text-gray-400 placeholder:font-normal',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100 bg-red-50/30'
            : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100 bg-white',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, hint, id, children, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2.5 rounded-2xl border text-sm font-medium appearance-none transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-offset-0 bg-white',
            error
              ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
              : 'border-gray-200 focus:border-blue-400 focus:ring-blue-100',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      )}
    </div>
  )
);
Select.displayName = 'Select';

// ─── StatusBadge ─────────────────────────────────────────────────────────────
type BadgeVariant = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange' | 'teal';

interface StatusBadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const badgeVariants: Record<BadgeVariant, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-emerald-100 text-emerald-700',
  red:    'bg-red-100 text-red-600',
  yellow: 'bg-amber-100 text-amber-700',
  purple: 'bg-purple-100 text-purple-700',
  gray:   'bg-gray-100 text-gray-600',
  orange: 'bg-orange-100 text-orange-700',
  teal:   'bg-teal-100 text-teal-700',
};

const dotColors: Record<BadgeVariant, string> = {
  blue:   'bg-blue-500',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  yellow: 'bg-amber-500',
  purple: 'bg-purple-500',
  gray:   'bg-gray-400',
  orange: 'bg-orange-500',
  teal:   'bg-teal-500',
};

export function StatusBadge({ variant = 'blue', children, className, dot }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold',
        badgeVariants[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  color?: string;
  animated?: boolean;
  label?: string;
}

export function ProgressBar({
  value, max = 100, className, color = 'bg-blue-500', animated = false, label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 font-medium">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className={cn('h-2.5 bg-gray-100 rounded-full overflow-hidden', className)}>
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', color, animated && 'animate-shimmer')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export function Dialog({ open, onClose, title, children, maxWidth = 'max-w-lg', footer }: DialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handler);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <div
        className={cn(
          'relative bg-white rounded-3xl shadow-2xl w-full animate-scale-in',
          'border border-blue-100/50',
          maxWidth
        )}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 pb-5 border-t border-gray-50 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 bg-blue-50/80 p-1 rounded-2xl', className)}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150',
            active === t.id
              ? 'bg-white text-blue-600 shadow-sm shadow-blue-100'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          )}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmText = 'Delete', confirmVariant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-gray-600 text-sm leading-relaxed mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </Button>
      </div>
    </Dialog>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon = '📭', title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      <div className="text-5xl mb-4 animate-bounce-in">{icon}</div>
      <h3 className="text-lg font-bold text-gray-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-5 max-w-xs leading-relaxed">{description}</p>}
      {action}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  color?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function Avatar({ name, color = 'bg-blue-500', size = 'md' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const sizes = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 shadow-sm',
        color,
        sizes[size]
      )}
    >
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn('w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin', className)}
    />
  );
}

// ─── AlertBanner ─────────────────────────────────────────────────────────────
type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertBannerProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const alertStyles: Record<AlertType, { wrapper: string; icon: React.ReactNode }> = {
  info:    { wrapper: 'bg-blue-50 border-blue-200 text-blue-800',    icon: <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" /> },
  success: { wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> },
  warning: { wrapper: 'bg-amber-50 border-amber-200 text-amber-800', icon: <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" /> },
  error:   { wrapper: 'bg-red-50 border-red-200 text-red-800',       icon: <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" /> },
};

export function AlertBanner({ type = 'info', title, children, className, onDismiss }: AlertBannerProps) {
  const { wrapper, icon } = alertStyles[type];
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-2xl border', wrapper, className)}>
      {icon}
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-50 hover:opacity-80 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-gray-200 rounded-2xl', className)} />
  );
}

// ─── Toggle ──────────────────────────────────────────────────────────────────
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const track = size === 'sm' ? 'w-8 h-4' : 'w-11 h-6';
  const thumb = size === 'sm' ? 'w-3 h-3' : 'w-5 h-5';
  const translate = size === 'sm' ? (checked ? 'translate-x-4' : 'translate-x-0.5') : (checked ? 'translate-x-5' : 'translate-x-0.5');

  return (
    <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
          track,
          checked ? 'bg-blue-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'inline-block bg-white rounded-full shadow-sm transition-transform duration-200',
            thumb, translate
          )}
        />
      </button>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h1>
        {description && <p className="text-gray-500 text-sm mt-1 font-medium">{description}</p>}
      </div>
      {action}
    </div>
  );
}
