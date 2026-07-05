import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Star, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Card } from '../components/ui';
import { toast } from '../components/ui';

const schema = z.object({
  email: z.string().min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setTimeout(() => {
      const result = login(data.email, data.password);
      if (result.success) {
        const role = JSON.parse(localStorage.getItem('sp_current_user') || '{}').role;
        if (role === 'participant') navigate('/participant');
        else navigate('/admin');
      } else {
        toast.error(result.error || 'Login failed');
      }
      setLoading(false);
    }, 400);
  };

  const demoAccounts = [
    { label: 'Main Admin', email: 'admin@star.com', password: 'admin123', color: 'bg-purple-100 text-purple-700' },
    { label: 'Admin', email: 'sara@star.com', password: 'admin123', color: 'bg-blue-100 text-blue-700' },
    { label: 'Participant', email: 'fatima@star.com', password: 'test123', color: 'bg-green-100 text-green-700' },
    { label: 'Participant', email: 'omar@star.com', password: 'test123', color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['⭐', '📚', '🏆', '✏️', '🎯', '💡', '🌟', '📖'].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-white/10 text-6xl animate-float"
            style={{
              left: `${(i * 13 + 5) % 100}%`,
              top: `${(i * 17 + 10) % 90}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-blue-600 fill-blue-100" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-1">Star Progress</h1>
          <p className="text-blue-100 text-lg">Your Growth, Your Stars ✨</p>
        </div>

        <Card className="shadow-2xl border-0">
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Sign In to Continue</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="you@star.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-sm transition focus:outline-none pr-10"
                    {...register('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full py-3" size="lg" loading={loading}>
                <Star className="w-4 h-4" />
                Sign In
              </Button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3 flex items-center gap-2">
                <BookOpen className="w-3 h-3" />
                Demo accounts — click to fill
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      (document.querySelector('input[type="email"]') as HTMLInputElement).value = acc.email;
                      const pwdInput = document.querySelector('input[type="password"], input[type="text"]') as HTMLInputElement;
                      if (pwdInput) pwdInput.value = acc.password;
                      login(acc.email, acc.password);
                      const role = JSON.parse(localStorage.getItem('sp_current_user') || '{}').role;
                      if (role === 'participant') navigate('/participant');
                      else navigate('/admin');
                    }}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all hover:shadow-sm ${acc.color}`}
                  >
                    <div className="font-bold">{acc.label}</div>
                    <div className="opacity-70 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <p className="text-center text-blue-200 text-xs mt-4">
          ⚠️ Demo mode — localStorage only, not secure for production
        </p>
      </div>
    </div>
  );
}
