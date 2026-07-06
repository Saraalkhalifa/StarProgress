import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { Globe, Key, Download, RefreshCw, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { storage } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sampleActivities, sampleBadges, sampleUsers, clearDemoData } from '../lib/sampleData';
import { useAuthStore } from '../store/useAuthStore';
import { Card, Button, toast } from '../components/ui';
import { simpleHash } from '../lib/utils';

const pwSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmNewPassword: z.string(),
}).refine(d => d.newPassword === d.confirmNewPassword, {
  message: 'Passwords do not match', path: ['confirmNewPassword'],
});
type PwForm = z.infer<typeof pwSchema>;

export function Settings() {
  const { t, i18n } = useTranslation();
  const { currentUser, refreshCurrentUser } = useAuth();
  const { users, submissions } = useData();
  const [resetConfirm, setResetConfirm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
  });

  const onChangePassword = async (data: PwForm) => {
    if (!currentUser) return;

    if (isSupabaseConfigured) {
      // Verify current password by re-authenticating, then update via Supabase Auth
      const { error: verifyError } = await supabase!.auth.signInWithPassword({
        email: currentUser.email,
        password: data.currentPassword,
      });
      if (verifyError) { toast.error('Current password is incorrect.'); return; }
      const { error: updateError } = await supabase!.auth.updateUser({ password: data.newPassword });
      if (updateError) { toast.error(updateError.message); return; }
      toast.success(t('settings.saved'));
      reset();
      return;
    }

    // Demo mode: check hash then update stored hash
    if (currentUser.passwordHash !== simpleHash(data.currentPassword)) {
      toast.error('Current password is incorrect.'); return;
    }
    await storage.updateUser(currentUser.id, { passwordHash: simpleHash(data.newPassword) });
    await refreshCurrentUser();
    toast.success(t('settings.saved'));
    reset();
  };

  const handleResetDemo = async () => {
    if (!resetConfirm) { setResetConfirm(true); return; }

    // 1. Wipe all demo localStorage keys
    clearDemoData();

    // 2. Re-seed with only Main Admin + activities + badges
    await Promise.all([
      storage.setUsers(sampleUsers),
      storage.setActivities(sampleActivities),
      storage.setBadges(sampleBadges),
    ]);

    // 3. Reset Zustand auth to the fresh Main Admin object
    useAuthStore.setState({ currentUser: sampleUsers[0] });

    toast.success('Reset complete — only Main Admin remains. Reloading…');
    setResetConfirm(false);
    setTimeout(() => window.location.reload(), 900);
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Username', 'Email', 'Phone', 'Role', 'Status', 'Points', 'Joined'],
      ...users
        .filter(u => u.role === 'participant')
        .map(u => {
          const pts = submissions
            .filter(s => s.participantId === u.id && s.status === 'accepted')
            .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
          return [u.name, u.username ?? '', u.email, u.phoneNumber ?? '', u.role, u.accountStatus, pts, u.createdAt.slice(0, 10)];
        }),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'star-progress-participants.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Export ready!');
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'main_admin';
  const isMainAdmin = currentUser?.role === 'main_admin';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">⚙️ {t('settings.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{currentUser?.name}</p>
      </div>

      {/* Security warning for Main Admin with default password */}
      {isMainAdmin && !isSupabaseConfigured && currentUser?.passwordHash === simpleHash('MainAdmin@2026') && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Default password detected</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You are using the default demo password. Change it below before sharing this app with others.
              Do not use this password for a real public deployment.
            </p>
          </div>
        </div>
      )}
      {isMainAdmin && isSupabaseConfigured && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-300 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Change your password</p>
            <p className="text-xs text-amber-700 mt-0.5">
              If you signed up with a temporary password, change it now using the form below.
              Keep your Main Admin credentials secure.
            </p>
          </div>
        </div>
      )}

      {/* Language */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800">{t('settings.language')}</h2>
        </div>
        <div className="flex gap-3">
          {(['en', 'ar'] as const).map(lang => (
            <button key={lang}
              onClick={() => void i18n.changeLanguage(lang)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                i18n.language === lang
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-200 hover:border-blue-300 text-gray-700'
              }`}
            >
              {lang === 'en' ? '🇬🇧 English' : '🇸🇦 العربية'}
            </button>
          ))}
        </div>
      </Card>

      {/* Profile info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800">{t('settings.profile')}</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">{t('auth.fullName')}</span><p className="font-medium text-gray-800 mt-0.5">{currentUser?.name}</p></div>
          <div><span className="text-gray-500">{t('auth.username')}</span><p className="font-medium text-gray-800 mt-0.5">{currentUser?.username ?? '—'}</p></div>
          <div><span className="text-gray-500">{t('auth.email')}</span><p className="font-medium text-gray-800 mt-0.5">{currentUser?.email}</p></div>
          <div><span className="text-gray-500">{t('auth.phoneNumber')}</span><p className="font-medium text-gray-800 mt-0.5">{currentUser?.phoneNumber ?? '—'}</p></div>
        </div>
      </Card>

      {/* Change password */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Key className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-800">{t('settings.changePassword')}</h2>
        </div>
        <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3">
          {[
            { key: 'currentPassword', label: t('settings.currentPassword') },
            { key: 'newPassword',     label: t('settings.newPassword') },
            { key: 'confirmNewPassword', label: t('settings.confirmNewPassword') },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">{label}</label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm focus:outline-none"
                {...register(key as keyof PwForm)} />
              {errors[key as keyof PwForm] && <p className="text-xs text-red-500">{errors[key as keyof PwForm]?.message}</p>}
            </div>
          ))}
          <Button type="submit" loading={isSubmitting} className="mt-2">{t('settings.saveChanges')}</Button>
        </form>
      </Card>

      {/* Admin-only: Export + Reset Demo */}
      {isAdmin && (
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">🛡 Admin Tools</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportCSV} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {t('settings.exportCSV')}
            </Button>

            {!isSupabaseConfigured && (
              <Button
                variant={resetConfirm ? 'danger' : 'secondary'}
                onClick={handleResetDemo}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {resetConfirm ? '⚠ Confirm Reset' : t('settings.resetDemoData')}
              </Button>
            )}
          </div>

          {resetConfirm && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              This will delete ALL users (except Main Admin), submissions, notifications, streaks, and avatar data.
              Click again to confirm.{' '}
              <button onClick={() => setResetConfirm(false)} className="ms-2 underline">Cancel</button>
            </p>
          )}

          {!isSupabaseConfigured && (
            <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠ {t('home.demoMode')}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
