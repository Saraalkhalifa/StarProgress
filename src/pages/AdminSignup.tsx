import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { Button, Card, toast } from '../components/ui';
import { simpleHash, AVATAR_COLORS } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, 'Letters, numbers, underscores, dots only'),
  phoneNumber: z.string().min(7, 'Please enter a valid phone number'),
  age: z.number().min(18, 'Admin age must be at least 18').max(100),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  signupMessage: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export function AdminSignup() {
  const { addUser, users } = useData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const avatarColor = AVATAR_COLORS[users.length % AVATAR_COLORS.length];

    if (isSupabaseConfigured) {
      // ── SUPABASE MODE: sign up via Supabase Auth; trigger creates the profile ─
      const appUrl = ((import.meta.env.VITE_APP_URL as string | undefined) ?? '').trim()
        || 'http://localhost:5173';
      const { error } = await supabase!.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${appUrl}/#/auth/callback`,
          data: {
            name: data.name,
            username: data.username,
            phone_number: data.phoneNumber,
            age: String(data.age),
            date_of_birth: data.dateOfBirth,
            signup_message: data.signupMessage ?? '',
            role: 'admin',
            avatar_color: avatarColor,
          },
        },
      });

      if (error) {
        const msg = (error as { message?: string }).message ?? '';
        const errorName = (error as { name?: string }).name ?? '';
        // HTTP 500 from Supabase: account was created but SMTP/server failed.
        // _getErrorMessage() on a Response object produces '{}', so we check name too.
        if (
          errorName === 'AuthRetryableFetchError' ||
          msg === '{}' ||
          msg.toLowerCase().includes('confirmation email') ||
          msg.toLowerCase().includes('sending') ||
          (error as { code?: string }).code === 'unexpected_failure'
        ) {
          setSubmitted(true);
          return;
        }
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already')) {
          toast.error(t('validation.emailTaken'));
        } else if (msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate')) {
          toast.error(t('validation.usernameTaken'));
        } else {
          toast.error(msg || 'Signup failed. Please try again.');
        }
        return;
      }

      setSubmitted(true);
      return;
    }

    // ── DEMO MODE: store everything locally ──────────────────────────────────
    if (users.some(u => u.username?.toLowerCase() === data.username.toLowerCase())) {
      toast.error(t('validation.usernameTaken')); return;
    }
    if (users.some(u => u.email.toLowerCase() === data.email.toLowerCase())) {
      toast.error(t('validation.emailTaken')); return;
    }
    if (users.some(u => u.phoneNumber === data.phoneNumber)) {
      toast.error(t('validation.phoneTaken')); return;
    }

    await addUser({
      name: data.name,
      email: data.email,
      username: data.username,
      phoneNumber: data.phoneNumber,
      age: data.age,
      dateOfBirth: data.dateOfBirth,
      signupMessage: data.signupMessage,
      passwordHash: simpleHash(data.password),
      role: 'admin',
      accountStatus: 'pending',
      avatarColor,
    });

    setSubmitted(true);
  };

  const field = (id: string, label: string, type: string, placeholder: string, reg: Parameters<typeof register>[0]) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input type={type} placeholder={placeholder} autoComplete={id}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none transition"
        {...register(reg)} />
      {errors[reg as keyof FormData] && <p className="text-xs text-red-500">{errors[reg as keyof FormData]?.message}</p>}
    </div>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center p-4">
        <motion.div className="w-full max-w-md" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="shadow-2xl border-0 text-center p-10">
            <div className="text-6xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.checkEmailTitle')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('auth.checkEmailDesc')}</p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              {t('auth.checkEmailNote')}
            </p>
            <Button className="w-full" onClick={() => navigate('/login/admin')}>
              {t('auth.backToHome')}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 start-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <motion.div className="w-full max-w-lg relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
          {t('auth.backToHome')}
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">{t('auth.adminSignup')}</h1>
          <p className="text-indigo-100 mt-2">{t('home.adminSignupDesc')}</p>
        </div>

        <Card className="shadow-2xl border-0">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {field('name', t('auth.fullName'), 'text', 'Ahmed Al-Ghamdi', 'name')}
                {field('username', t('auth.username'), 'text', 'ahmed_admin', 'username')}
              </div>
              {field('email', t('auth.email'), 'email', 'ahmed@example.com', 'email')}
              {field('phoneNumber', t('auth.phoneNumber'), 'tel', '+966 5xx xxx xxxx', 'phoneNumber')}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">{t('auth.age')}</label>
                  <input type="number" placeholder="25" min="18" max="100"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none transition"
                    {...register('age', { valueAsNumber: true })} />
                  {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
                </div>
                {field('dateOfBirth', t('auth.dateOfBirth'), 'date', '', 'dateOfBirth')}
              </div>

              {/* Optional reason */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('auth.signupReason')}</label>
                <textarea rows={3} placeholder="Briefly describe why you need admin access..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none transition resize-none"
                  {...register('signupMessage')} />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none pe-10"
                    {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none pe-10"
                    {...register('confirmPassword')} />
                  <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700" size="lg" loading={isSubmitting}>
                <Shield className="w-4 h-4" />
                {t('auth.requestAccount')}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login/admin" className="text-indigo-600 hover:underline font-medium">{t('auth.signIn')}</Link>
            </p>
            <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <p className="text-xs text-indigo-600">
                🛡 {t('auth.pendingApproval')} {t('auth.pendingDesc')}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
