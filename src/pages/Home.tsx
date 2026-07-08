import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Globe, Shield, Star, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured } from '../lib/supabase';

const floaters = [
  { emoji: '⭐', x: '5%',  y: '10%', size: 'text-4xl', delay: 0 },
  { emoji: '📚', x: '88%', y: '8%',  size: 'text-3xl', delay: 0.4 },
  { emoji: '🏆', x: '92%', y: '55%', size: 'text-4xl', delay: 0.8 },
  { emoji: '🤝', x: '3%',  y: '60%', size: 'text-3xl', delay: 0.3 },
  { emoji: '🌟', x: '50%', y: '4%',  size: 'text-3xl', delay: 0.6 },
  { emoji: '🦁', x: '80%', y: '80%', size: 'text-3xl', delay: 1.0 },
  { emoji: '🎖️', x: '15%', y: '80%', size: 'text-3xl', delay: 0.5 },
  { emoji: '🏃', x: '40%', y: '88%', size: 'text-4xl', delay: 0.9 },
  { emoji: '💡', x: '70%', y: '15%', size: 'text-2xl', delay: 0.2 },
  { emoji: '🎨', x: '20%', y: '20%', size: 'text-2xl', delay: 0.7 },
];

const howItWorks = [
  { icon: '👤', text: 'Create your hero account' },
  { icon: '📝', text: 'Submit a good action' },
  { icon: '✅', text: 'Admin reviews it' },
  { icon: '⭐', text: 'Earn Hero Points' },
  { icon: '🏆', text: 'Unlock levels, companions & rewards!' },
];

export function Home() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toggleLang = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    void i18n.changeLanguage(next);
  };

  const cards = [
    {
      icon: '🦸',
      title: t('home.participantLogin'),
      desc: t('home.participantDesc'),
      path: '/login/participant',
      btnColor: 'bg-blue-600 hover:bg-blue-700',
      borderHover: 'hover:border-blue-200',
      label: t('home.enter'),
    },
    {
      icon: '✨',
      title: t('home.participantSignup'),
      desc: t('home.participantSignupDesc'),
      path: '/signup',
      btnColor: 'bg-sky-500 hover:bg-sky-600',
      borderHover: 'hover:border-sky-200',
      label: t('home.signUp'),
    },
    {
      icon: '💜',
      title: t('home.parentLogin'),
      desc: t('home.parentDesc'),
      path: '/login/parent',
      btnColor: 'bg-purple-600 hover:bg-purple-700',
      borderHover: 'hover:border-purple-200',
      label: t('home.enter'),
    },
    {
      icon: '🛡️',
      title: t('home.adminLogin'),
      desc: t('home.adminDesc'),
      path: '/login/admin',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700',
      borderHover: 'hover:border-indigo-200',
      label: t('home.enter'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 flex flex-col items-center justify-center p-4 overflow-hidden relative">

      {/* Floating background decorations */}
      {floaters.map((f, i) => (
        <motion.div
          key={i}
          className={`absolute ${f.size} select-none pointer-events-none opacity-20`}
          style={{ left: f.x, top: f.y }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
        >
          {f.emoji}
        </motion.div>
      ))}

      {/* Soft cloud blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      {/* Language toggle + admin signup */}
      <div className="absolute top-4 end-4 z-10 flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium px-3 py-2 rounded-xl border border-white/30 transition-colors"
        >
          <Globe className="w-4 h-4" />
          {i18n.language === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center gap-8">

        {/* Logo + Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mx-auto mb-5"
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-12 h-12 text-blue-600 fill-blue-100" />
          </motion.div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
            {t('app.name')}
          </h1>
          <p className="mt-3 text-blue-100 text-lg sm:text-xl font-medium max-w-lg mx-auto leading-relaxed">
            {t('app.tagline')}
          </p>
        </motion.div>

        {/* How it works - minimal horizontal flow */}
        <motion.div
          className="flex flex-wrap justify-center items-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {howItWorks.map((step, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full border border-white/20">
                <span>{step.icon}</span> {step.text}
              </div>
              {i < howItWorks.length - 1 && <span className="text-white/40 text-sm">→</span>}
            </React.Fragment>
          ))}
        </motion.div>

        {/* Entry cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {cards.map((card, i) => (
            <motion.button
              key={i}
              onClick={() => navigate(card.path)}
              className={`group bg-white rounded-3xl p-6 text-start shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer border-2 border-transparent ${card.borderHover}`}
              whileTap={{ scale: 0.97 }}
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <h2 className="text-base font-bold text-gray-800 mb-1.5">{card.title}</h2>
              <p className="text-gray-500 text-xs leading-relaxed mb-4">{card.desc}</p>
              <div className={`inline-flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${card.btnColor}`}>
                {card.label} <ChevronRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: '🛡️', label: '20 Hero Levels' },
            { icon: '🏆', label: 'Hero Board' },
            { icon: '🦁', label: 'Hero Companions' },
            { icon: '🎁', label: 'Hero Rewards' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/30">
              <span>{icon}</span> {label}
            </div>
          ))}
        </motion.div>

        {/* Footer links */}
        <div className="flex items-center gap-4 text-blue-200 text-xs">
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Safe Use</Link>
          <span>·</span>
          <Link to="/signup/admin" className="hover:text-white transition-colors flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin Sign Up
          </Link>
        </div>

        {isSupabaseConfigured && (
          <p className="text-blue-200 text-xs">🟢 {t('home.liveMode')}</p>
        )}
      </div>
    </div>
  );
}
