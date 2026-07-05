import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../lib/utils';

export function NotificationBell() {
  const { notifications, unreadCount, markNotificationsRead } = useData();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) markNotificationsRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className={cn(
          'relative p-2.5 rounded-xl transition-colors',
          open ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'
        )}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-blue-100 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-gray-400">{notifications.length} total</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No notifications</div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id} className={cn('px-4 py-3 border-b border-gray-50 last:border-0', !n.isRead && 'bg-blue-50/40')}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">
                      {n.type === 'new_submission' ? '📬' : '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
