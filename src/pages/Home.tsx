import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ChevronRight } from 'lucide-react';

const floaters = [
  { emoji: '⭐', x: '5%',  y: '10%', size: 'text-4xl', delay: 0 },
  { emoji: '📚', x: '88%', y: '8%',  size: 'text-3xl', delay: 0.4 },
  { emoji: '🏆', x: '92%', y: '55%', size: 'text-4xl', delay: 0.8 },
  { emoji: '✏️', x: '3%',  y: '60%', size: 'text-3xl', delay: 0.3 },
  { emoji: '🌟', x: '50%', y: '4%',  size: 'text-3xl', delay: 0.6 },
  { emoji: '🎯', x: '80%', y: '80%', size: 'text-3xl', delay: 1.0 },
  { emoji: '🎖️', x: '15%', y: '80%', size: 'text-3xl', delay: 0.5 },
  { emoji: '☁️', x: '40%', y: '88%', size: 'text-4xl', delay: 0.9 },
  { emoji: '💡', x: '70%', y: '15%', size: 'text-2xl', delay: 0.2 },
  { emoji: '🌈', x: '20%', y: '20%', size: 'text-2xl', delay: 0.7 },
];

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 flex flex-col items-center justify-center p-4 overflow-hidden relative">

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

      <div className="relative w-full max-w-3xl mx-auto flex flex-col items-center gap-8">

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
            <Star className="w-12 h-12 text-blue-600 fill-blue-100" />
          </motion.div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
            Star Progress
          </h1>
          <p className="mt-3 text-blue-100 text-lg sm:text-xl font-medium max-w-md mx-auto leading-relaxed">
            Track your progress, collect points, and climb the leaderboard ✨
          </p>
        </motion.div>

        {/* Two entry cards */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Participant card */}
          <motion.button
            onClick={() => navigate('/login/participant')}
            className="group bg-white rounded-3xl p-8 text-left shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-5 group-hover:scale-110 transition-transform">
              🎒
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">I am a Participant</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Log in to submit activities, earn points, and see your ranking on the leaderboard.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl group-hover:bg-blue-700 transition-colors">
              Enter <ChevronRight className="w-4 h-4" />
            </div>
          </motion.button>

          {/* Admin card */}
          <motion.button
            onClick={() => navigate('/login/admin')}
            className="group bg-white rounded-3xl p-8 text-left shadow-2xl hover:shadow-blue-900/30 hover:-translate-y-1 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-blue-200"
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl mb-5 group-hover:scale-110 transition-transform">
              🛡️
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">I am an Admin</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Log in to manage participants, review submissions, and oversee the competition.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl group-hover:bg-indigo-700 transition-colors">
              Enter <ChevronRight className="w-4 h-4" />
            </div>
          </motion.button>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {[
            { icon: '⭐', label: 'Earn Points' },
            { icon: '🏆', label: 'Climb Rankings' },
            { icon: '🎖️', label: 'Collect Badges' },
            { icon: '📊', label: 'Track Progress' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full border border-white/30">
              <span>{icon}</span> {label}
            </div>
          ))}
        </motion.div>

        <p className="text-blue-200 text-xs">Data is stored locally in your browser</p>
      </div>
    </div>
  );
}
