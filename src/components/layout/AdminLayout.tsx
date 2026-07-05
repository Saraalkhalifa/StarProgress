import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ClipboardList, CheckSquare, Shield, Award, LogOut, Star, Menu, X, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Avatar } from '../ui';
import { NotificationBell } from '../shared/NotificationBell';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

interface NavItem { to: string; label: string; icon: React.ElementType; end?: boolean; badge?: number }

interface SidebarProps {
  mobile?: boolean;
  currentUser: User | null;
  isMainAdmin: boolean;
  navItems: NavItem[];
  onNavClick: () => void;
  onLogout: () => void;
}

function AdminSidebar({ mobile = false, currentUser, isMainAdmin, navItems, onNavClick, onLogout }: SidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', mobile && 'pt-4')}>
      <div className="px-6 py-5 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-blue-900 text-lg leading-none">Star Progress</h1>
            <p className="text-xs text-blue-400">
              {isMainAdmin ? '👑 Main Admin' : '⚙️ Admin Panel'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavClick}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge !== undefined && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-blue-100 space-y-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <Avatar name={currentUser?.name || ''} color={currentUser?.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.name}</p>
            <p className="text-xs text-blue-500 capitalize">{currentUser?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isMainAdmin, logout } = useAuth();
  const { submissions, pendingAccounts } = useData();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const pendingSignups = pendingAccounts.length;
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const handleNavClick = () => setMobileOpen(false);

  const navItems: NavItem[] = [
    { to: '/admin',              label: 'Dashboard',      icon: LayoutDashboard, end: true },
    { to: '/admin/participants', label: 'Participants',   icon: Users },
    { to: '/admin/activities',  label: 'Activities',     icon: Activity },
    { to: '/admin/progress',    label: 'Progress Records', icon: ClipboardList },
    { to: '/admin/approvals',         label: 'Approvals',        icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
    { to: '/admin/account-requests',  label: 'Account Requests', icon: UserCheck,   badge: pendingSignups > 0 ? pendingSignups : undefined },
    ...(isMainAdmin ? [{ to: '/admin/admins', label: 'Manage Admins', icon: Shield }] : []),
    { to: '/admin/badges',            label: 'Badge Settings',   icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 bg-white border-r border-blue-100 flex-col fixed h-full">
        <AdminSidebar
          currentUser={currentUser}
          isMainAdmin={isMainAdmin}
          navItems={navItems}
          onNavClick={handleNavClick}
          onLogout={handleLogout}
        />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar
              mobile
              currentUser={currentUser}
              isMainAdmin={isMainAdmin}
              navItems={navItems}
              onNavClick={handleNavClick}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-64 min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-blue-100 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-blue-900">Admin Panel</span>
          <NotificationBell />
        </div>

        <div className="p-4 lg:p-8">
          <div className="hidden lg:flex items-center justify-end mb-6">
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
