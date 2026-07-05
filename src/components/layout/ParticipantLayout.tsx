import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, Trophy, Award, LogOut, Star, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui';
import { cn } from '../../lib/utils';
import type { User } from '../../types';

const NAV_ITEMS = [
  { to: '/participant',             label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/participant/submit',      label: 'Submit Activity', icon: PlusCircle },
  { to: '/participant/history',     label: 'My Progress',    icon: History },
  { to: '/participant/leaderboard', label: 'Leaderboard',    icon: Trophy },
  { to: '/participant/achievements', label: 'Achievements',  icon: Award },
];

interface SidebarProps {
  mobile?: boolean;
  currentUser: User | null;
  onNavClick: () => void;
  onLogout: () => void;
}

function ParticipantSidebar({ mobile = false, currentUser, onNavClick, onLogout }: SidebarProps) {
  return (
    <div className={cn('flex flex-col h-full', mobile && 'pt-4')}>
      <div className="px-6 py-5 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-blue-900 text-lg leading-none">Star Progress</h1>
            <p className="text-xs text-blue-400">Keep Growing ✨</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-blue-100 space-y-2">
        <div className="flex items-center gap-3 px-4 py-2">
          <Avatar name={currentUser?.name || ''} color={currentUser?.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{currentUser?.name}</p>
            <p className="text-xs text-gray-400 truncate">{currentUser?.email}</p>
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

export function ParticipantLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };
  const handleNavClick = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-blue-50/30 flex">
      <aside className="hidden lg:flex w-64 bg-white border-r border-blue-100 flex-col fixed h-full">
        <ParticipantSidebar
          currentUser={currentUser}
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
            <ParticipantSidebar
              mobile
              currentUser={currentUser}
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
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-blue-900">Star Progress</span>
          </div>
          <Avatar name={currentUser?.name || ''} color={currentUser?.avatarColor} size="sm" />
        </div>

        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
