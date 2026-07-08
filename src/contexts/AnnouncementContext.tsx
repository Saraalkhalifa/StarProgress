import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Announcement } from '../types';
import { announcementStorage } from '../lib/announcementStorage';
import { generateId } from '../lib/utils';

interface AnnouncementContextType {
  announcements: Announcement[];
  adminAnnouncements: Announcement[];
  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt'>) => void;
  updateAnnouncement: (id: string, data: Partial<Announcement>) => void;
  removeAnnouncement: (id: string) => void;
  refresh: () => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | null>(null);

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [adminAnnouncements, setAdminAnnouncements] = useState<Announcement[]>([]);

  const refresh = useCallback(() => {
    setAnnouncements(announcementStorage.getAll());
    setAdminAnnouncements(announcementStorage.getAllAdmin());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addAnnouncement = useCallback((data: Omit<Announcement, 'id' | 'createdAt'>) => {
    const a: Announcement = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    announcementStorage.add(a);
    refresh();
  }, [refresh]);

  const updateAnnouncement = useCallback((id: string, data: Partial<Announcement>) => {
    announcementStorage.update(id, data);
    refresh();
  }, [refresh]);

  const removeAnnouncement = useCallback((id: string) => {
    announcementStorage.remove(id);
    refresh();
  }, [refresh]);

  return (
    <AnnouncementContext.Provider value={{ announcements, adminAnnouncements, addAnnouncement, updateAnnouncement, removeAnnouncement, refresh }}>
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) throw new Error('useAnnouncements must be used inside AnnouncementProvider');
  return ctx;
}
