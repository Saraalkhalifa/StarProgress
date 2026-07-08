import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Heart } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Button, Card, toast } from '../../components/ui';
import { simpleHash, AVATAR_COLORS, generateId } from '../../lib/utils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const schema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Please enter a valid email address'),
  phoneNumber:     z.string().min(7, 'Please enter a valid phone number'),
  dateOfBirth:     z.string().min(1, 'Date of birth is required'),
  username:        z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.]+$/, 'Letters, numbers, underscores, dots only'),
  password:        z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export function ParentSignup() {
  const { addUser, users } = useData();
  const navigate = useNavigate();
  const [showPassword, setShowPassword]  = useState(false);
  const [showConfirm,  setShowConfirm]   = useState(false);
  const [done,         setDone]          = useState(false);
  const [doneEmail,    setDoneEmail]     = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const emailTaken    = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());
    const usernameTaken = users.some(u => u.username?.toLowerCase() === data.username.toLowerCase());
    if (emailTaken)    { toast.error('This email is already registered'); return; }
    if (usernameTaken) { toast.error('This username is already taken');   return; }

    if (isSupabaseConfigured) {
      const { data: authData, error } = await supabase!.auth.signUp({
        email:    data.email,
        password: data.password,
        options: {
          data: {
            name:         data.name,
            username:     data.username,
            role:         'parent',
            phone_number: data.phoneNumber,
            date_of_birth: data.dateOfBirth,
          },
        },
      });
      if (error) {
        const msg       = (error as { message?: string }).message ?? '';
        const errorName = (error as { name?: string }).name ?? '';
        // Supabase SMTP failure returns message '{}' or AuthRetryableFetchError.
        // The account was still created by the trigger, so treat it as success.
        if (
          errorName === 'AuthRetryableFetchError' ||
          msg === '{}' ||
          msg.toLowerCase().includes('confirmation email') ||
          msg.toLowerCase().includes('sending') ||
          (error as { code?: string }).code === 'unexpected_failure'
        ) {
          toast.success('Parent account created! You can now sign in.');
          navigate('/login/parent');
          return;
        }
        toast.error(msg || 'Signup failed. Please try again.');
        return;
      }

      // The handle_new_auth_user trigger creates the public.users row.
      // Upsert ensures phone/DOB fields are written even if the trigger ran first.
      if (authData.user) {
        await supabase!.from('users').upsert({
          id:             authData.user.id,
          email:          data.email,
          name:           data.name,
          username:       data.username,
          role:           'parent',
          account_status: 'active',
          phone_number:   data.phoneNumber,
          date_of_birth:  data.dateOfBirth,
          avatar_color:   AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
          created_at:     new Date().toISOString(),
        }, { onConflict: 'id', ignoreDuplicates: false });
      }

      // If email confirmation is disabled, a session is returned immediately.
      // If confirmation is required, session is null → show "check email" screen.
      if (authData.session) {
        toast.success('Parent account created! You can now sign in.');
        navigate('/login/parent');
      } else {
        setDoneEmail(data.email);
        setDone(true);
      }
      return;
    }

    // Demo mode
    await addUser({
      id:           generateId(),
      name:         data.name,
      email:        data.email,
      username:     data.username,
      passwordHash: simpleHash(data.password),
      role:         'parent',
      accountStatus: 'active',
      phoneNumber:  data.phoneNumber,
      dateOfBirth:  data.dateOfBirth,
      createdAt:    new Date().toISOString(),
      avatarColor:  AVATAR_COLORS[users.length % AVATAR_COLORS.length],
    } as Parameters<typeof addUser>[0]);

    toast.success('Parent account created! You can now log in.');
    navigate('/login/parent');
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">💜</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Check Your Email!</h2>
          <p className="text-gray-500 text-sm mb-2">
            We sent a verification link to <strong>{doneEmail}</strong>.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Click the link in the email to verify your account. After verification, you can sign in as a parent.
          </p>
          <Button onClick={() => navigate('/login/parent')} className="bg-purple-600 hover:bg-purple-700 w-full">
            Go to Parent Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const fields = [
    { key: 'name',        label: 'Full Name',       type: 'text',  placeholder: 'Your full name' },
    { key: 'email',       label: 'Email Address',   type: 'email', placeholder: 'your@email.com' },
    { key: 'phoneNumber', label: 'Phone Number',    type: 'tel',   placeholder: '+966 5x xxx xxxx' },
    { key: 'dateOfBirth', label: 'Date of Birth',   type: 'date',  placeholder: '' },
    { key: 'username',    label: 'Username',         type: 'text',  placeholder: 'Choose a username' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 start-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 end-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <Card className="p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Create Parent Account</h1>
            <p className="text-gray-500 text-xs mt-1">
              After signing up, request child access from your dashboard. The main admin must approve before you can see any child data.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <input
                  {...register(key)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200"
                />
                {errors[key] && <p className="text-xs text-red-500">{errors[key]?.message}</p>}
              </div>
            ))}

            {[
              { key: 'password',        label: 'Password',         show: showPassword, toggle: () => setShowPassword(p => !p) },
              { key: 'confirmPassword', label: 'Confirm Password', show: showConfirm,  toggle: () => setShowConfirm(p => !p) },
            ].map(({ key, label, show, toggle }) => (
              <div key={key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="relative">
                  <input
                    {...register(key as 'password' | 'confirmPassword')}
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200 pe-12"
                  />
                  <button type="button" onClick={toggle}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors[key as 'password' | 'confirmPassword'] && (
                  <p className="text-xs text-red-500">{errors[key as 'password' | 'confirmPassword']?.message}</p>
                )}
              </div>
            ))}

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" size="lg" loading={isSubmitting}>
              Create Parent Account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login/parent" className="text-purple-600 hover:underline font-medium">Sign In</Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
