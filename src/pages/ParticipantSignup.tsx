import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Star, UserPlus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Button, Card, toast } from '../components/ui';
import { simpleHash, AVATAR_COLORS } from '../lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type FormData = z.infer<typeof schema>;

export function ParticipantSignup() {
  const { addUser, users } = useData();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const usernameTaken = users.some(
      u => u.username?.toLowerCase() === data.username.toLowerCase()
    );
    if (usernameTaken) {
      toast.error('Username is already taken. Please choose another.');
      return;
    }

    await addUser({
      name: data.name,
      email: `${data.username.toLowerCase()}@starprogress.local`,
      username: data.username,
      passwordHash: simpleHash(data.password),
      role: 'participant',
      accountStatus: 'pending',
      avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-2xl border-0 text-center p-10">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Your account is pending approval. An admin will review your request
              and activate your account shortly.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
              You will not be able to log in until your account is approved.
            </p>
            <Button className="w-full" onClick={() => navigate('/login/participant')}>
              Back to Login
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate('/login/participant')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Create Account</h1>
          <p className="text-blue-100 mt-2">Sign up to start tracking your progress</p>
        </div>

        <Card className="shadow-2xl border-0">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm transition focus:outline-none"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  placeholder="e.g. sara_2026"
                  autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm transition focus:outline-none"
                  {...register('username')}
                />
                {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm transition focus:outline-none pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm transition focus:outline-none pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full py-3" size="lg" loading={isSubmitting}>
                <Star className="w-4 h-4" />
                Request Account
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login/participant" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-600">
                Your account requires admin approval before you can log in.
              </p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
