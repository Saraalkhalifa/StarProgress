import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Card, Button } from '../components/ui';

type Status = 'loading' | 'success' | 'error';

export function AuthCallback() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      if (!supabase) {
        // Demo mode — no Supabase, nothing to verify
        navigate('/', { replace: true });
        return;
      }

      try {
        // PKCE flow: Supabase appends ?code=... to the redirect URL.
        // The code ends up in window.location.search even with HashRouter
        // because the hash fragment (#/auth/callback) comes after the query string.
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href,
        );

        if (cancelled) return;

        if (error) {
          setStatus('error');
          setErrorMessage(
            error.message.toLowerCase().includes('expired')
              ? t('auth.verificationExpired')
              : t('auth.verificationError'),
          );
          return;
        }

        if (data.session) {
          setStatus('success');
          setTimeout(() => {
            if (!cancelled) navigate('/login/participant', { replace: true });
          }, 2500);
          return;
        }

        // Fallback: implicit flow — tokens in URL hash (rare with modern Supabase)
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) return;

        if (sessionData.session) {
          setStatus('success');
          setTimeout(() => {
            if (!cancelled) navigate('/login/participant', { replace: true });
          }, 2500);
        } else {
          setStatus('error');
          setErrorMessage(t('auth.verificationError'));
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(t('auth.verificationError'));
        }
      }
    }

    void handleCallback();
    return () => { cancelled = true; };
  }, [navigate, t]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <Star className="w-10 h-10 text-blue-600 fill-blue-100" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">Star Progress</h1>
        </div>

        <Card className="shadow-2xl border-0 text-center p-10">
          {status === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600 font-medium">{t('auth.verifying')}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.emailVerified')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('auth.emailVerifiedDesc')}</p>
              <p className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                {t('auth.checkEmailNote')}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('auth.verificationFailed')}</h2>
              <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
              <div className="space-y-3">
                <Link to="/signup">
                  <Button className="w-full">{t('auth.trySignupAgain')}</Button>
                </Link>
                <Link to="/" className="block text-sm text-blue-600 hover:underline mt-2">
                  {t('auth.backToHome')}
                </Link>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
