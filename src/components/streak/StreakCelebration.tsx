import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface StreakCelebrationProps {
  visible: boolean;
  streak: number;
  bonusPoints: number;
  onClose: () => void;
}

export function StreakCelebration({ visible, streak, bonusPoints, onClose }: StreakCelebrationProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!visible || firedRef.current) return;
    firedRef.current = true;

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.6 },
        ...opts,
        particleCount: Math.floor(200 * particleRatio),
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });

    const timer = setTimeout(onClose, 5000);
    return () => { clearTimeout(timer); };
  }, [visible, onClose]);

  useEffect(() => {
    if (!visible) firedRef.current = false;
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="pointer-events-auto">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="bg-white rounded-3xl shadow-2xl px-10 py-8 text-center max-w-sm mx-4"
            >
              <div className="text-6xl mb-3">🔥</div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-1">
                {streak}-Day Streak!
              </h2>
              <p className="text-gray-500 mb-4 text-sm">
                Incredible consistency! You&apos;ve earned a bonus reward.
              </p>
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl px-6 py-3 mb-5 shadow-md">
                <p className="text-3xl font-extrabold">+{bonusPoints}</p>
                <p className="text-sm font-medium opacity-90">bonus points added!</p>
              </div>
              <button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline"
              >
                Continue
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
