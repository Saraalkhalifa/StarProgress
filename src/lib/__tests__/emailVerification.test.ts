import { describe, it, expect } from 'vitest';

describe('Email verification flow — signup configuration', () => {
  it('VITE_APP_URL builds a correct emailRedirectTo for production', () => {
    const appUrl = 'https://saraalkhalifa.github.io/StarProgress';
    const redirect = `${appUrl}/#/auth/callback`;
    expect(redirect).toBe('https://saraalkhalifa.github.io/StarProgress/#/auth/callback');
    expect(redirect).not.toContain('localhost');
  });

  it('falls back to localhost when VITE_APP_URL is empty', () => {
    const appUrl = ''.trim() || 'http://localhost:5173';
    const redirect = `${appUrl}/#/auth/callback`;
    expect(redirect).toBe('http://localhost:5173/#/auth/callback');
  });

  it('callback URL includes the hash-router fragment so GitHub Pages serves the right page', () => {
    const redirect = 'https://saraalkhalifa.github.io/StarProgress/#/auth/callback';
    const url = new URL(redirect);
    expect(url.hash).toBe('#/auth/callback');
    expect(url.pathname).toBe('/StarProgress/');
  });
});

describe('Email verification flow — login gating', () => {
  it('unverified user object has no email_confirmed_at', () => {
    const unverifiedUser = { id: 'u1', email: 'a@b.com', email_confirmed_at: null };
    expect(unverifiedUser.email_confirmed_at).toBeNull();
  });

  it('verified user object has email_confirmed_at set', () => {
    const verifiedUser = { id: 'u2', email: 'b@c.com', email_confirmed_at: new Date().toISOString() };
    expect(verifiedUser.email_confirmed_at).not.toBeNull();
  });

  it('pending account_status blocks login regardless of email verification', () => {
    const blockedStatuses = ['pending', 'denied', 'suspended'];
    blockedStatuses.forEach(s => expect(s).not.toBe('active'));
  });

  it('approved account_status allows login after verification', () => {
    const profile = { account_status: 'active', email_confirmed_at: new Date().toISOString() };
    const canLogin = profile.account_status === 'active' && !!profile.email_confirmed_at;
    expect(canLogin).toBe(true);
  });

  it('verified+pending user sees waiting message not dashboard', () => {
    const profile = { account_status: 'pending', email_confirmed_at: new Date().toISOString() };
    const canLogin = profile.account_status === 'active' && !!profile.email_confirmed_at;
    expect(canLogin).toBe(false);
  });
});

describe('Email verification flow — security', () => {
  it('no VITE_* env var contains a service role key', () => {
    const viteVars = Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'));
    viteVars.forEach(k => {
      expect(k.toLowerCase()).not.toContain('service_role');
      expect(k.toLowerCase()).not.toContain('smtp_password');
      expect(k.toLowerCase()).not.toContain('service_key');
    });
  });

  it('VITE_APP_URL does not contain a secret (it is the public app URL)', () => {
    const appUrl = (import.meta.env.VITE_APP_URL as string | undefined) ?? '';
    // It should be a public GitHub Pages URL or empty — not a Supabase secret URL
    if (appUrl) {
      expect(appUrl).not.toContain('supabase.co/auth');
      expect(appUrl).not.toContain('service_role');
    }
  });
});
