import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, ProgressBar } from '../../components/ui';
import { cn } from '../../lib/utils';

export function Achievements() {
  const { currentUser } = useAuth();
  const { badges, getAcceptedPoints, submissions } = useData();
  const totalPoints = getAcceptedPoints(currentUser!.id);
  const sortedBadges = [...badges].sort((a, b) => a.requiredPoints - b.requiredPoints);
  const acceptedCount = submissions.filter(s => s.participantId === currentUser!.id && s.status === 'accepted').length;
  const totalSubmissions = submissions.filter(s => s.participantId === currentUser!.id).length;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Achievements 🏅</h1>
        <p className="text-gray-500 text-sm mt-1">Your badge journey and milestones</p>
      </div>

      {/* Current status */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0 text-white p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-100 text-sm">Your total points</p>
            <p className="text-5xl font-extrabold">{totalPoints}</p>
            <div className="flex gap-4 mt-3 text-sm text-blue-100">
              <span>✅ {acceptedCount} activities completed</span>
              <span>📬 {totalSubmissions} total submissions</span>
            </div>
          </div>
          {(() => {
            const current = sortedBadges.filter(b => totalPoints >= b.requiredPoints).pop();
            if (!current) return <div className="text-6xl opacity-50">🎯</div>;
            return (
              <div className="text-center">
                <div className="text-6xl">{current.icon}</div>
                <p className="font-bold mt-1">{current.name}</p>
                <p className="text-blue-200 text-xs">Current Badge</p>
              </div>
            );
          })()}
        </div>
      </Card>

      {/* Badge collection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Badge Collection</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {sortedBadges.map((badge, i) => {
            const earned = totalPoints >= badge.requiredPoints;
            const isNext = !earned && (i === 0 || totalPoints >= sortedBadges[i-1].requiredPoints);
            const prevRequired = i > 0 ? sortedBadges[i-1].requiredPoints : 0;
            const progress = isNext
              ? Math.min(100, ((totalPoints - prevRequired) / (badge.requiredPoints - prevRequired)) * 100)
              : earned ? 100 : 0;

            return (
              <div
                key={badge.id}
                className={cn(
                  'p-5 rounded-2xl border-2 transition-all',
                  earned ? `${badge.bgColor} border-transparent shadow-sm` :
                  isNext ? 'bg-white border-blue-300 shadow-md' :
                  'bg-gray-50 border-transparent opacity-60'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-3xl', earned ? 'shadow-sm' : 'bg-gray-100 grayscale')}>
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('font-bold text-lg', earned ? badge.color : 'text-gray-400')}>{badge.name}</p>
                      {earned && <span className="text-green-500 text-sm">✓ Earned</span>}
                      {isNext && <span className="text-blue-500 text-xs font-medium animate-pulse">Next!</span>}
                    </div>
                    <p className="text-sm text-gray-500">{badge.requiredPoints} points required</p>
                    {(isNext || earned) && (
                      <div className="mt-2 space-y-1">
                        <ProgressBar value={progress} max={100} color={earned ? 'bg-green-500' : 'bg-blue-500'} />
                        {isNext && (
                          <p className="text-xs text-gray-400">{totalPoints}/{badge.requiredPoints} pts — {badge.requiredPoints - totalPoints} more to go!</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestones */}
      <Card className="p-6">
        <h2 className="font-semibold text-gray-700 mb-4">🎯 Activity Milestones</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'First Step', icon: '👣', desc: 'Submit 1 activity', done: totalSubmissions >= 1 },
            { label: 'Getting Started', icon: '🌱', desc: 'Get 5 approved', done: acceptedCount >= 5 },
            { label: 'Dedicated', icon: '💪', desc: 'Get 15 approved', done: acceptedCount >= 15 },
            { label: 'Superstar', icon: '🌟', desc: 'Earn 200+ points', done: totalPoints >= 200 },
          ].map(m => (
            <div key={m.label} className={cn('p-3 rounded-xl text-center', m.done ? 'bg-green-50' : 'bg-gray-50')}>
              <div className={cn('text-3xl mb-1', !m.done && 'grayscale opacity-40')}>{m.icon}</div>
              <p className={cn('font-semibold text-sm', m.done ? 'text-green-700' : 'text-gray-400')}>{m.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              {m.done && <p className="text-xs text-green-500 mt-1">✓ Achieved!</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
