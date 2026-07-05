import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, toast } from '../components/ui';

const schema = z.object({
  identifier: z.string().min(1, 'Please enter your username or email'),
  password: z.string().min(1, 'Please enter your password'),
});
type FormData = z.infer<typeof schema>;

export function ParticipantLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    setLoading(true);
    setTimeout(() => {
      const result = login(data.identifier, data.password);
      if (result.success && result.user) {
        if (result.user.role === 'participant') {
          navigate('/participant');
        } else {
          logout();
          toast.error('This account is not a participant account. Please use the Admin login.');
        }
      } else {
        toast.error(result.error || 'Login failed. Please check your details.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {['📚', '✏️', '⭐', '🎯', '📝'].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-3xl opacity-15 pointer-events-none select-none"
          style={{ left: `${[8, 85, 50, 15, 80][i]}%`, top: `${[15, 10, 5, 75, 75][i]}%` }}
          animate={{ y: [0, -12, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >
          {emoji}
        </motion.div>
      ))}

      <motion.div
        className="w-full max-w-md relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎒</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Participant Login</h1>
          <p className="text-blue-100 mt-2">Sign in to track your progress and earn stars!</p>
        </div>

        <Card className="shadow-2xl border-0">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Username or Email</label>
                <input
                  type="text"
                  placeholder="sara"
                  autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm transition focus:outline-none"
                  {...register('identifier')}
                />
                {errors.identifier && <p className="text-xs text-red-500">{errors.identifier.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
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

              <Button type="submit" className="w-full py-3" size="lg" loading={loading}>
                <Star className="w-4 h-4" />
                Sign In as Participant
              </Button>
            </form>

            <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-blue-600 font-medium mb-0.5">💡 First time?</p>
                <p className="text-xs text-blue-500">Create an account and wait for admin approval.</p>
              </div>
              <Link
                to="/signup"
                className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
