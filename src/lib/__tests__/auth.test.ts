import { describe, it, expect } from 'vitest';
import { simpleHash } from '../utils';
import type { User } from '../../types';

// ── Replicate auth logic for unit testing (no React context needed) ─────────

function loginLogic(users: User[], identifier: string, password: string) {
  if (!identifier || !password) return { success: false, error: 'Please enter your credentials.' };
  const lower = identifier.toLowerCase();
  const user = users.find(
    u => u.email.toLowerCase() === lower || (u.username && u.username.toLowerCase() === lower)
  );
  if (!user) return { success: false, error: 'No account found. Check your username or email.' };
  if (user.passwordHash !== simpleHash(password)) return { success: false, error: 'Incorrect password.' };
  return { success: true, user };
}

const DEMO_USERS: User[] = [
  { id: 'u_main', name: 'Main Admin',   email: 'mainadmin@starprogress.demo', username: 'Mainadmin', passwordHash: simpleHash('MainAdmin@2026'), role: 'main_admin',  accountStatus: 'active', createdAt: '', avatarColor: '' },
  { id: 'u_adm2', name: 'AdminUser',    email: 'admin2@starprogress.demo',    username: 'admin2',    passwordHash: simpleHash('Admin@2026'),     role: 'admin',       accountStatus: 'active', createdAt: '', avatarColor: '' },
  { id: 'u_p1',   name: 'Participant1', email: 'p1@starprogress.demo',        username: 'p1user',    passwordHash: simpleHash('P1@2026'),        role: 'participant', accountStatus: 'active', createdAt: '', avatarColor: '' },
  { id: 'u_p2',   name: 'Participant2', email: 'p2@starprogress.demo',        username: 'p2user',    passwordHash: simpleHash('P2@2026'),        role: 'participant', accountStatus: 'active', createdAt: '', avatarColor: '' },
];

describe('login logic — username support', () => {
  it('logs in with username (Mainadmin)', () => {
    const result = loginLogic(DEMO_USERS, 'Mainadmin', 'MainAdmin@2026');
    expect(result.success).toBe(true);
    expect((result as { success: boolean; user: User; error?: string }).user.role).toBe('main_admin');
  });

  it('login is case-insensitive for username', () => {
    const result = loginLogic(DEMO_USERS, 'mainadmin', 'MainAdmin@2026');
    expect(result.success).toBe(true);
  });

  it('logs in admin2 as regular admin', () => {
    const result = loginLogic(DEMO_USERS, 'admin2', 'Admin@2026');
    expect(result.success).toBe(true);
    expect((result as { success: boolean; user: User; error?: string }).user.role).toBe('admin');
  });

  it('logs in p1user as participant', () => {
    const result = loginLogic(DEMO_USERS, 'p1user', 'P1@2026');
    expect(result.success).toBe(true);
    expect((result as { success: boolean; user: User; error?: string }).user.role).toBe('participant');
  });

  it('logs in p2user as participant', () => {
    const result = loginLogic(DEMO_USERS, 'p2user', 'P2@2026');
    expect(result.success).toBe(true);
    expect((result as { success: boolean; user: User; error?: string }).user.role).toBe('participant');
  });

  it('fails with wrong password', () => {
    const result = loginLogic(DEMO_USERS, 'Mainadmin', 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/[Ii]ncorrect/);
  });

  it('fails with unknown username', () => {
    const result = loginLogic(DEMO_USERS, 'ghost', 'password');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/No account found/);
  });

  it('fails with empty credentials', () => {
    expect(loginLogic(DEMO_USERS, '', '').success).toBe(false);
    expect(loginLogic(DEMO_USERS, 'Mainadmin', '').success).toBe(false);
  });
});

describe('login logic — email support', () => {
  it('also works with email address', () => {
    const result = loginLogic(DEMO_USERS, 'p1@starprogress.demo', 'P1@2026');
    expect(result.success).toBe(true);
  });

  it('email matching is case-insensitive', () => {
    const result = loginLogic(DEMO_USERS, 'P1@STARPROGRESS.DEMO', 'P1@2026');
    expect(result.success).toBe(true);
  });
});

describe('role-based access control expectations', () => {
  it('main_admin role allows admin panel access', () => {
    const result = loginLogic(DEMO_USERS, 'Mainadmin', 'MainAdmin@2026');
    const user = (result as { success: boolean; user: User; error?: string }).user as User;
    const isAdmin = user.role === 'admin' || user.role === 'main_admin';
    expect(isAdmin).toBe(true);
  });

  it('regular admin role allows admin panel access', () => {
    const result = loginLogic(DEMO_USERS, 'admin2', 'Admin@2026');
    const user = (result as { success: boolean; user: User; error?: string }).user as User;
    const isAdmin = user.role === 'admin' || user.role === 'main_admin';
    expect(isAdmin).toBe(true);
  });

  it('participant role does not have admin access', () => {
    const result = loginLogic(DEMO_USERS, 'p1user', 'P1@2026');
    const user = (result as { success: boolean; user: User; error?: string }).user as User;
    const isAdmin = user.role === 'admin' || user.role === 'main_admin';
    expect(isAdmin).toBe(false);
  });

  it('only main_admin has manage-admins permission', () => {
    const adminResult = loginLogic(DEMO_USERS, 'admin2', 'Admin@2026');
    const mainAdminResult = loginLogic(DEMO_USERS, 'Mainadmin', 'MainAdmin@2026');
    expect((adminResult as any).user.role).not.toBe('main_admin');
    expect((mainAdminResult as any).user.role).toBe('main_admin');
  });
});
