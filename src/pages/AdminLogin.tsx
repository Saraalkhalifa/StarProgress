import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, toast } from '../components/ui';

const schema = z.object({
  identifier: z.string().min(1, 'required'),
  password: z.string().min(1, 'required'),
});
type FormData = z.infer<typeof schema>;

export function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const result = await login(data.identifier, data.password);
    if (result.success && result.user) {
      if (result.user.role === 'admin' || result.user.role === 'main_admin') {
        navigate('/admin');
      } else {
        logout();
        toast.error('This is not an admin account. Please use Participant login.');
      }
    } else {
      toast.error(result.error || t('errors.loginFailed'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 end-0 w-80 h-80 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 start-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

      {['🛡️', '📊', '✅', '🏆', '⚙️'].map((emoji, i) => (
        <motion.div key={i}
          className="absolute text-3xl opacity-15 pointer-events-none select-none"
          style={{ left: `${[10, 82, 48, 18, 78][i]}%`, top: `${[12, 8, 6, 78, 72][i]}%` }}
          animate={{ y: [0, -12, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >{emoji}</motion.div>
      ))}

      <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
          {t('auth.backToHome')}
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🛡️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">{t('auth.adminLogin')}</h1>
          <p className="text-indigo-200 mt-2">{t('home.adminDesc')}</p>
        </div>

        <Card className="shadow-2xl border-0">
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('auth.usernameOrEmail')}</label>
                <input type="text" placeholder="MainAdmin" autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none"
                  {...register('identifier')} />
                {errors.identifier && <p className="text-xs text-red-500">{t('validation.required')}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 text-sm focus:outline-none pe-10"
                    {...register('password')} />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{t('validation.required')}</p>}
              </div>

              <Button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700" size="lg" loading={loading}>
                <Shield className="w-4 h-4" />
                {t('auth.signInAsAdmin')}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between gap-3 p-4 bg-indigo-50 rounded-xl">
              <div>
                <p className="text-xs text-indigo-600 font-medium">🔒 {t('auth.restrictedAccess')}</p>
                <p className="text-xs text-indigo-500 mt-0.5">{t('auth.restrictedNote')}</p>
              </div>
              <Link to="/signup/admin" className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors">
                {t('home.signUp')}
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
