import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Globe, Shield, Star, Trophy, Flame, Gift, BarChart2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isSupabaseConfigured } from '../lib/supabase';

// ── Floating hero decorations ─────────────────────────────────────────────────
const heroFloaters = [
  { emoji: '⭐', x: '6%',  y: '18%', size: 'text-4xl', delay: 0,   dur: 4.2 },
  { emoji: '🏆', x: '86%', y: '14%', size: 'text-5xl', delay: 0.5, dur: 5.0 },
  { emoji: '🌟', x: '12%', y: '72%', size: 'text-3xl', delay: 0.3, dur: 4.5 },
  { emoji: '🎖️', x: '88%', y: '68%', size: 'text-3xl', delay: 0.8, dur: 3.8 },
  { emoji: '✨', x: '46%', y: '7%',  size: 'text-2xl', delay: 0.2, dur: 5.2 },
  { emoji: '🥇', x: '74%', y: '82%', size: 'text-4xl', delay: 1.0, dur: 4.3 },
  { emoji: '💫', x: '4%',  y: '46%', size: 'text-2xl', delay: 0.6, dur: 3.6 },
  { emoji: '🏅', x: '55%', y: '88%', size: 'text-3xl', delay: 0.4, dur: 4.8 },
];

// ── Animal companions ─────────────────────────────────────────────────────────
const companions = [
  {
    emoji: '🦁',
    name: 'Leo',
    title: 'Brave Lion',
    gradient: 'from-amber-50 to-orange-100',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    points: '500',
  },
  {
    emoji: '🐱',
    name: 'Mimi',
    title: 'Clever Cat',
    gradient: 'from-purple-50 to-pink-100',
    border: 'border-purple-200',
    badge: 'bg-purple-100 text-purple-700',
    points: '200',
  },
  {
    emoji: '🦉',
    name: 'Ollie',
    title: 'Wise Owl',
    gradient: 'from-sky-50 to-blue-100',
    border: 'border-sky-200',
    badge: 'bg-sky-100 text-sky-700',
    points: '350',
  },
  {
    emoji: '🐶',
    name: 'Max',
    title: 'Loyal Dog',
    gradient: 'from-green-50 to-emerald-100',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    points: '150',
  },
];

// ── How-it-works steps ────────────────────────────────────────────────────────
const steps = [
  { num: 1, emoji: '👤', label: 'Sign Up',          desc: 'Create your free hero account' },
  { num: 2, emoji: '📝', label: 'Submit an Action', desc: 'Tell us about a good deed' },
  { num: 3, emoji: '✅', label: 'Admin Reviews',    desc: 'A trusted adult checks it' },
  { num: 4, emoji: '⭐', label: 'Earn Points',      desc: 'Points land in your account' },
  { num: 5, emoji: '🎁', label: 'Unlock Rewards',   desc: 'Badges, animals & prizes!' },
];

// ── Feature cards ─────────────────────────────────────────────────────────────
const features = [
  { emoji: '⭐', icon: Star,     title: 'Earn Hero Points',    desc: 'Every good action adds points to your hero account.',         bg: 'bg-yellow-50',  border: 'border-yellow-100', accent: 'text-yellow-500' },
  { emoji: '🦁', icon: Users,    title: 'Unlock Companions',   desc: 'Adopt adorable animals as you hit new point milestones.',     bg: 'bg-orange-50',  border: 'border-orange-100', accent: 'text-orange-500' },
  { emoji: '🏆', icon: Trophy,   title: 'Reach Hero Levels',   desc: 'Climb through 20 exciting levels from Rookie to Legend.',    bg: 'bg-amber-50',   border: 'border-amber-100',  accent: 'text-amber-500'  },
  { emoji: '📊', icon: BarChart2,title: 'Join the Hero Board', desc: 'See your rank shine among other heroes on the leaderboard.', bg: 'bg-blue-50',    border: 'border-blue-100',   accent: 'text-blue-500'   },
  { emoji: '🔥', icon: Flame,    title: 'Build Streaks',       desc: 'Submit daily to build streaks and earn awesome bonuses.',    bg: 'bg-red-50',     border: 'border-red-100',    accent: 'text-red-500'    },
  { emoji: '🎁', icon: Gift,     title: 'Request Rewards',     desc: 'Spend points on fun rewards approved by your parents.',      bg: 'bg-purple-50',  border: 'border-purple-100', accent: 'text-purple-500' },
];

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: 'easeOut' as const },
  }),
};

export function Home() {
  const navigate   = useNavigate();
  const { t, i18n } = useTranslation();
  const toggleLang  = () => {
    const next = i18n.language === 'ar' ? 'en' : 'ar';
    void i18n.changeLanguage(next);
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen bg-gradient-to-br from-blue-700 via-sky-500 to-blue-600 flex flex-col overflow-hidden">

        {/* ── Soft blob shapes ── */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-800/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-sky-400/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

        {/* ── Floating decorations ── */}
        {heroFloaters.map((f, i) => (
          <motion.div
            key={i}
            className={`absolute ${f.size} select-none pointer-events-none opacity-[0.22]`}
            style={{ left: f.x, top: f.y }}
            animate={{ y: [0, -12, 0], rotate: [0, 6, -6, 0] }}
            transition={{ duration: f.dur, repeat: Infinity, delay: f.delay, ease: 'easeInOut' }}
          >
            {f.emoji}
          </motion.div>
        ))}

        {/* ── Top bar ── */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 text-white font-extrabold text-lg tracking-tight">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            Action Heroes
          </div>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-xl border border-white/25 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {/* ── Main hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-4">

          {/* Logo badge */}
          <motion.div
            className="w-20 h-20 bg-white rounded-2xl shadow-2xl shadow-blue-900/30 flex items-center justify-center mb-6"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Shield className="w-10 h-10 text-blue-600 fill-blue-100" />
          </motion.div>

          {/* Headline */}
          <motion.div
            className="text-center mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight drop-shadow-lg leading-tight">
              Action Heroes
            </h1>
            <p className="mt-4 text-blue-50 text-xl sm:text-2xl font-bold">
              Do good actions. Earn Hero Points. Become a hero!
            </p>
            <p className="mt-3 text-blue-200 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
              Every good deed earns you points, unlocks adorable animal companions,
              and turns you into a real-life legend.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <button
              onClick={() => navigate('/signup')}
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-900 font-extrabold text-base px-7 py-3 rounded-2xl shadow-lg shadow-yellow-500/30 transition-all hover:-translate-y-0.5"
            >
              ⭐ Join as a Hero
            </button>
            <button
              onClick={() => navigate('/login/participant')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-sm text-white font-bold text-base px-6 py-3 rounded-2xl border border-white/40 transition-all hover:-translate-y-0.5"
            >
              🦸 Hero Login
            </button>
            <button
              onClick={() => navigate('/login/parent')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-sm text-white font-semibold text-sm px-5 py-3 rounded-2xl border border-white/30 transition-all hover:-translate-y-0.5"
            >
              💜 Parent Access
            </button>
            <button
              onClick={() => navigate('/login/admin')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white/80 hover:text-white font-medium text-sm px-5 py-3 rounded-2xl border border-white/20 transition-all"
            >
              🛡️ Admin
            </button>
          </motion.div>

          {/* Feature badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-2.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { e: '🛡️', l: '20 Hero Levels' },
              { e: '🏆', l: 'Hero Board' },
              { e: '🦁', l: 'Animal Companions' },
              { e: '🎁', l: 'Hero Rewards' },
              { e: '🔥', l: 'Daily Streaks' },
            ].map(({ e, l }) => (
              <span
                key={l}
                className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/20"
              >
                {e} {l}
              </span>
            ))}
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            className="mt-12 flex flex-col items-center gap-1 text-white/50 text-xs select-none"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span>Discover more</span>
            <span className="text-base">↓</span>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-white to-sky-50">
        <div className="max-w-5xl mx-auto px-4">

          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Your Hero Journey in 5 Steps
            </h2>
            <p className="text-gray-500 mt-3 text-base max-w-sm mx-auto">
              Simple, fun, and rewarding. Here is how to become an Action Hero!
            </p>
          </motion.div>

          {/* Steps grid with connecting line on desktop */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-8 left-[8%] right-[8%] h-0.5 bg-blue-100 z-0" />

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 relative z-10">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col items-center text-center"
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center text-3xl">
                      {step.emoji}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-extrabold shadow-md">
                      {step.num}
                    </div>
                  </div>
                  <p className="font-bold text-gray-800 text-sm">{step.label}</p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-sky-50">
        <div className="max-w-5xl mx-auto px-4">

          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Why Action Heroes?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Amazing Things Await You
            </h2>
            <p className="text-gray-500 mt-3 text-base max-w-sm mx-auto">
              Explore everything that makes Action Heroes exciting.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className={`${f.bg} border ${f.border} rounded-2xl p-5 flex items-start gap-4`}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className="w-11 h-11 bg-white rounded-xl shadow-sm flex items-center justify-center text-2xl flex-shrink-0">
                  {f.emoji}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          ANIMAL COMPANIONS
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">

          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block bg-orange-100 text-orange-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">
              Animal Companions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              Meet Your Hero Friends
            </h2>
            <p className="text-gray-500 mt-3 text-base max-w-sm mx-auto">
              Earn Hero Points to adopt adorable companions who cheer you on!
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {companions.map((c, i) => (
              <motion.div
                key={i}
                className={`bg-gradient-to-b ${c.gradient} border ${c.border} rounded-2xl p-6 flex flex-col items-center text-center`}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                whileHover={{ scale: 1.04, transition: { type: 'spring', stiffness: 300, damping: 18 } }}
              >
                <motion.div
                  className="text-5xl mb-3"
                  animate={{ y: [0, -7, 0] }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }}
                >
                  {c.emoji}
                </motion.div>
                <p className="font-extrabold text-gray-800 text-base">{c.name}</p>
                <p className="text-gray-400 text-xs mb-3">{c.title}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badge}`}>
                  🔒 {c.points} pts
                </span>
              </motion.div>
            ))}
          </div>

          <motion.p
            className="text-center text-gray-400 text-sm mt-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            + many more companions waiting to be discovered!
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-sky-500 to-blue-600 relative overflow-hidden">
        {/* Decorative floaters */}
        <div className="absolute inset-0 pointer-events-none">
          {['⭐', '🌟', '✨', '💫', '🏆'].map((e, i) => (
            <motion.span
              key={i}
              className="absolute text-2xl opacity-20 select-none"
              style={{
                left: `${[8, 22, 50, 72, 88][i]}%`,
                top:  `${[20, 68, 12, 58, 28][i]}%`,
              }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
            >
              {e}
            </motion.span>
          ))}
        </div>

        <div className="relative z-10 max-w-xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="text-6xl mb-5 select-none"
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              🏆
            </motion.div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
              Start Your Hero Journey Today!
            </h2>
            <p className="text-blue-100 text-base mb-8 max-w-sm mx-auto">
              Join young heroes making the world better, one good action at a time.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => navigate('/signup')}
                className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-900 font-extrabold text-base px-8 py-3.5 rounded-2xl shadow-lg shadow-yellow-500/30 transition-all hover:-translate-y-0.5"
              >
                ⭐ Sign Up Free
              </button>
              <button
                onClick={() => navigate('/login/participant')}
                className="bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-sm text-white font-bold text-base px-8 py-3.5 rounded-2xl border border-white/40 transition-all hover:-translate-y-0.5"
              >
                🦸 Log In
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="py-6 bg-gray-900">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-gray-500 text-xs mb-2">
          <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
          <span className="text-gray-700">·</span>
          <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms of Safe Use</Link>
          <span className="text-gray-700">·</span>
          <Link to="/signup/admin" className="hover:text-gray-300 transition-colors flex items-center gap-1">
            <Shield className="w-3 h-3" /> Admin Sign Up
          </Link>
        </div>
        {isSupabaseConfigured && (
          <p className="text-center text-gray-600 text-xs mb-1">🟢 Connected to shared database</p>
        )}
        <p className="text-center text-gray-700 text-xs">© 2026 Action Heroes · All rights reserved</p>
      </footer>

    </div>
  );
}
