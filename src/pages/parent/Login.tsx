import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, toast } from '../../components/ui';

const schema = z.object({
  identifier: z.string().min(1, 'required'),
  password: z.string().min(1, 'required'),
});
type FormData = z.infer<typeof schema>;

export function ParentLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await login(data.identifier, data.password);
    if (result.success && result.user) {
      if (result.user.role === 'parent') {
        navigate('/parent');
      } else {
        logout();
        toast.error('This account is not a parent account. Please use the correct login page.');
      }
    } else {
      toast.error(result.error || 'Login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 start-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 end-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {['💜', '🌟', '🏠', '❤️', '🌈'].map((emoji, i) => (
        <motion.div key={i}
          className="absolute text-3xl opacity-15 pointer-events-none select-none"
          style={{ left: `${[8, 85, 50, 15, 80][i]}%`, top: `${[15, 10, 5, 75, 75][i]}%` }}
          animate={{ y: [0, -12, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >{emoji}</motion.div>
      ))}

      <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <Card className="p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Parent Access</h1>
            <p className="text-gray-500 text-sm mt-1">View your child's progress and manage Hero Rewards</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Username or Email</label>
              <input
                {...register('identifier')}
                type="text"
                autoComplete="username"
                placeholder="Enter your username or email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200"
              />
              {errors.identifier && <p className="text-xs text-red-500">Please enter your username or email</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200 pe-12"
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">Please enter your password</p>}
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" size="lg" loading={loading}>
              Sign In as Parent
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Don't have a parent account?{' '}
              <Link to="/signup/parent" className="text-purple-600 hover:underline font-medium">Create one here</Link>
            </p>
            <p className="text-xs text-gray-400">
              Your child's account must include your email for the parent link to work.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
