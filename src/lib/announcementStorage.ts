import type { Announcement } from '../types';

const KEY = 'ah_announcements';

function lsGet(): Announcement[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Announcement[]; }
  catch { return []; }
}
function lsSet(data: Announcement[]): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export const announcementStorage = {
  getAll: (): Announcement[] => lsGet().filter(a => !a.expiresAt || new Date(a.expiresAt) > new Date()),
  getAllAdmin: (): Announcement[] => lsGet(),
  add: (a: Announcement): void => { lsSet([a, ...lsGet()]); },
  update: (id: string, data: Partial<Announcement>): void => {
    lsSet(lsGet().map(a => a.id === id ? { ...a, ...data } : a));
  },
  remove: (id: string): void => { lsSet(lsGet().filter(a => a.id !== id)); },
};
