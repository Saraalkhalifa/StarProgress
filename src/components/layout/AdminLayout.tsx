import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Activity, ClipboardList, CheckSquare, Shield,
  Award, LogOut, Star, Menu, X, UserCheck, Globe, Settings, Flame, Archive,
  TrendingUp, Megaphone, Heart, ShoppingBag, BookOpen, Ribbon, AlertTriangle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Avatar } from '../ui';
import { NotificationBell } from '../shared/NotificationBell';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

type NavEntry =
  | { type: 'link'; to: string; label: string; icon: React.ElementType; end?: boolean; badge?: number }
  | { type: 'section'; label: string };

interface SidebarProps {
  mobile?: boolean;
  currentUser: User | null;
  isMainAdmin: boolean;
  navEntries: NavEntry[];
  onNavClick: () => void;
  onLogout: () => void;
}

function AdminSidebar({ mobile = false, currentUser, isMainAdmin, navEntries, onNavClick, onLogout }: SidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', mobile && 'pt-4')}>
      <div className="px-6 py-5 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-md">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-blue-900 text-lg leading-none">Action Heroes</h1>
            <p className="text-xs text-blue-400">
              {isMainAdmin ? '👑 Main Admin' : '⚙️ Admin Panel'}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navEntries.map((entry, i) => {
          if (entry.type === 'section') {
            return (
              <div key={`section-${i}`} className="px-3 pt-4 pb-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.label}</p>
              </div>
            );
          }
          const { to, label, icon: Icon, end, badge } = entry;
          return (
            <NavLink key={to} to={to} end={end} onClick={onNavClick}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5',
                isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
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
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-blue-100 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar name={currentUser?.name || ''} color={currentUser?.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.name}</p>
            <p className="text-xs text-blue-500 capitalize">{currentUser?.role?.replace('_', ' ')}</p>
          </div>
        </div>
        <NavLink to="/admin/settings" onClick={onNavClick}
          className={({ isActive }) => cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
            isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
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
  const { i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pendingReviews   = submissions.filter(s => s.status === 'pending').length;
  const pendingSignups   = pendingAccounts.length;

  const handleLogout  = () => { logout(); navigate('/', { replace: true }); };
  const handleNavClick = () => setMobileOpen(false);
  const toggleLang    = () => void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');

  const navEntries: NavEntry[] = [
    { type: 'link', to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },

    { type: 'section', label: 'Participants' },
    { type: 'link', to: '/admin/participants',      label: 'Participant Management', icon: Users },
    { type: 'link', to: '/admin/account-requests',  label: 'Account Requests',       icon: UserCheck,
      badge: pendingSignups > 0 ? pendingSignups : undefined },

    { type: 'section', label: 'Hero Actions' },
    { type: 'link', to: '/admin/approvals',  label: 'Action Review', icon: CheckSquare,
      badge: pendingReviews > 0 ? pendingReviews : undefined },
    { type: 'link', to: '/admin/activities', label: 'Activity Types', icon: Activity },

    ...(isMainAdmin ? [
      { type: 'section' as const, label: 'Quizzes' },
      { type: 'link' as const, to: '/admin/quizzes', label: 'Quiz Management', icon: BookOpen },
    ] : []),

    { type: 'section', label: 'Points & Progress' },
    { type: 'link', to: '/admin/progress', label: 'Points & Progress', icon: ClipboardList },
    { type: 'link', to: '/admin/behavioral-deductions', label: 'Behavioral Incidents', icon: AlertTriangle },

    { type: 'section', label: 'Settings' },
    { type: 'link', to: '/admin/badges',        label: 'Badge Settings',  icon: Ribbon },
    { type: 'link', to: '/admin/streak',         label: 'Streak Settings', icon: Flame },
    { type: 'link', to: '/admin/levels',         label: 'Hero Levels',     icon: TrendingUp },
    { type: 'link', to: '/admin/avatar-shop',    label: 'Avatar Shop',     icon: ShoppingBag },
    { type: 'link', to: '/admin/announcements',  label: 'Announcements',   icon: Megaphone },

    ...(isMainAdmin ? [
      { type: 'section' as const, label: 'Admin' },
      { type: 'link' as const, to: '/admin/admins',    label: 'Admin Management',  icon: Shield },
      { type: 'link' as const, to: '/admin/parents',   label: 'Parent Management', icon: Heart },
      { type: 'link' as const, to: '/admin/archived',  label: 'Archived Users',    icon: Archive },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 bg-white border-e border-blue-100 flex-col fixed h-full">
        <AdminSidebar currentUser={currentUser} isMainAdmin={isMainAdmin} navEntries={navEntries} onNavClick={handleNavClick} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside className="absolute start-0 top-0 h-full w-72 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 end-4">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar mobile currentUser={currentUser} isMainAdmin={isMainAdmin} navEntries={navEntries} onNavClick={handleNavClick} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ms-64 min-h-screen">
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-blue-100 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-blue-900">Action Heroes</span>
          <div className="flex items-center gap-2">
            <button onClick={toggleLang} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-medium">
              <Globe className="w-4 h-4" />
            </button>
            <NotificationBell />
          </div>
        </div>

        <div className="p-4 lg:p-8">
          <div className="hidden lg:flex items-center justify-end gap-3 mb-6">
            <button onClick={toggleLang}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {i18n.language === 'ar' ? 'English' : 'العربية'}
            </button>
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
