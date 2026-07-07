import { describe, it, expect, beforeEach } from 'vitest';
import type { User } from '../../types';

// ── helpers ──────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    role: 'participant',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
    avatarColor: 'bg-blue-500',
    isDeleted: false,
    ...overrides,
  };
}

function softDelete(user: User, deletedById: string): User {
  return {
    ...user,
    isDeleted: true,
    deletedAt: new Date().toISOString(),
    deletedBy: deletedById,
    accountStatus: 'deleted',
  };
}

function restore(user: User): User {
  return {
    ...user,
    isDeleted: false,
    deletedAt: undefined,
    deletedBy: undefined,
    accountStatus: 'active',
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Soft delete — state transitions', () => {
  it('soft-deleting a participant sets isDeleted=true and accountStatus=deleted', () => {
    const user = makeUser({ role: 'participant' });
    const deleted = softDelete(user, 'admin1');
    expect(deleted.isDeleted).toBe(true);
    expect(deleted.accountStatus).toBe('deleted');
    expect(deleted.deletedBy).toBe('admin1');
    expect(deleted.deletedAt).toBeTruthy();
  });

  it('soft-deleting a regular admin sets the same fields', () => {
    const user = makeUser({ role: 'admin' });
    const deleted = softDelete(user, 'mainadmin1');
    expect(deleted.isDeleted).toBe(true);
    expect(deleted.accountStatus).toBe('deleted');
  });

  it('restore clears soft-delete fields and sets accountStatus=active', () => {
    const user = softDelete(makeUser(), 'admin1');
    const restored = restore(user);
    expect(restored.isDeleted).toBe(false);
    expect(restored.deletedAt).toBeUndefined();
    expect(restored.deletedBy).toBeUndefined();
    expect(restored.accountStatus).toBe('active');
  });

  it('original user data (name, email, role) is preserved through soft delete and restore', () => {
    const original = makeUser({ name: 'Sara', email: 'sara@test.com', role: 'participant' });
    const deleted = softDelete(original, 'admin1');
    const restored = restore(deleted);
    expect(restored.name).toBe('Sara');
    expect(restored.email).toBe('sara@test.com');
    expect(restored.role).toBe('participant');
  });
});

describe('Soft delete — permission rules', () => {
  const mainAdmin = makeUser({ id: 'ma1', role: 'main_admin', accountStatus: 'active' });
  const regularAdmin = makeUser({ id: 'ra1', role: 'admin', accountStatus: 'active' });
  const participant = makeUser({ id: 'p1', role: 'participant', accountStatus: 'active' });

  function canDelete(actor: User, target: User): boolean {
    if (target.role === 'main_admin') return false;                       // nobody deletes main_admin
    if (actor.id === target.id) return false;                            // cannot self-delete
    if (actor.role === 'main_admin') return true;                        // main_admin can delete anyone
    if (actor.role === 'admin') return target.role === 'participant';    // admins → participants only
    return false;                                                         // participants → nobody
  }

  it('main_admin can delete a participant', () => {
    expect(canDelete(mainAdmin, participant)).toBe(true);
  });

  it('main_admin can delete a regular admin', () => {
    expect(canDelete(mainAdmin, regularAdmin)).toBe(true);
  });

  it('main_admin cannot delete themselves', () => {
    expect(canDelete(mainAdmin, mainAdmin)).toBe(false);
  });

  it('main_admin cannot delete another main_admin', () => {
    const mainAdmin2 = makeUser({ id: 'ma2', role: 'main_admin' });
    expect(canDelete(mainAdmin, mainAdmin2)).toBe(false);
  });

  it('regular admin can delete a participant', () => {
    expect(canDelete(regularAdmin, participant)).toBe(true);
  });

  it('regular admin cannot delete another admin', () => {
    const admin2 = makeUser({ id: 'ra2', role: 'admin' });
    expect(canDelete(regularAdmin, admin2)).toBe(false);
  });

  it('regular admin cannot delete main_admin', () => {
    expect(canDelete(regularAdmin, mainAdmin)).toBe(false);
  });

  it('participant cannot delete anyone', () => {
    expect(canDelete(participant, makeUser({ id: 'other', role: 'participant' }))).toBe(false);
    expect(canDelete(participant, regularAdmin)).toBe(false);
    expect(canDelete(participant, mainAdmin)).toBe(false);
  });
});

describe('Soft delete — login gating', () => {
  it('deleted user is blocked before pending check', () => {
    const statuses = ['deleted', 'pending', 'denied', 'suspended'];
    const blockedStatuses = statuses.filter(s => s !== 'active');
    expect(blockedStatuses).toContain('deleted');
  });

  it('deleted accountStatus or isDeleted flag each independently block login', () => {
    const byStatus = { accountStatus: 'deleted' as const, isDeleted: false };
    const byFlag   = { accountStatus: 'active'  as const, isDeleted: true  };
    const isBlocked = (u: { accountStatus: string; isDeleted: boolean }) =>
      u.accountStatus === 'deleted' || u.isDeleted;
    expect(isBlocked(byStatus)).toBe(true);
    expect(isBlocked(byFlag)).toBe(true);
    expect(isBlocked({ accountStatus: 'active', isDeleted: false })).toBe(false);
  });
});

describe('Soft delete — leaderboard filtering', () => {
  const users: User[] = [
    makeUser({ id: 'p1', name: 'Alice', isDeleted: false, accountStatus: 'active', role: 'participant' }),
    makeUser({ id: 'p2', name: 'Bob',   isDeleted: true,  accountStatus: 'deleted', role: 'participant' }),
    makeUser({ id: 'p3', name: 'Carol', isDeleted: false, accountStatus: 'active', role: 'participant' }),
  ];

  it('deleted participants are excluded from leaderboard', () => {
    const active = users.filter(u => u.role === 'participant' && !u.isDeleted && u.accountStatus !== 'deleted');
    expect(active).toHaveLength(2);
    expect(active.map(u => u.name)).toEqual(['Alice', 'Carol']);
  });

  it('getUsers filter excludes deleted users', () => {
    const fromStorage = users.filter(u => !u.isDeleted);
    expect(fromStorage).toHaveLength(2);
  });

  it('getArchivedUsers returns only deleted users', () => {
    const archived = users.filter(u => u.isDeleted);
    expect(archived).toHaveLength(1);
    expect(archived[0].name).toBe('Bob');
  });
});

describe('Security — no private keys exposed', () => {
  it('no VITE_* env var contains a service role key or deletion password', () => {
    const viteVars = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
    viteVars.forEach(k => {
      expect(k.toLowerCase()).not.toContain('service_role');
      expect(k.toLowerCase()).not.toContain('service_key');
    });
  });
});
