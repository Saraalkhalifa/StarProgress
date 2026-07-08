import React from 'react';
import { Flame, CheckCircle, Clock, Trophy } from 'lucide-react';
import type { ParticipantStreakSummary } from '../../contexts/StreakContext';

interface Props {
  summaries: ParticipantStreakSummary[];
}

export function StreakProgress({ summaries }: Props) {
  if (summaries.length === 0) return null;

  return (
    <div className="space-y-3">
      {summaries.map(({ rule, record, todayCompleted, nextMilestone, daysToNextMilestone }) => {
        const pct = nextMilestone
          ? Math.min(100, Math.round((record.currentStreak / nextMilestone.daysRequired) * 100))
          : 100;

        return (
          <div
            key={rule.id}
            className="bg-white rounded-2xl border border-orange-100 shadow-sm p-4 space-y-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span className="font-semibold text-gray-800 text-sm">{rule.name}</span>
              </div>
              <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                todayCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {todayCompleted ? (
                  <><CheckCircle className="w-3 h-3" /> Done today</>
                ) : (
                  <><Clock className="w-3 h-3" /> Not done yet</>
                )}
              </div>
            </div>

            {/* Streak count */}
            <div className="flex items-end gap-3">
              <div>
                <span className="text-3xl font-bold text-orange-500">
                  {record.currentStreak}
                </span>
                <span className="text-sm text-gray-500 ml-1">day streak</span>
              </div>
              {record.bestStreak > 0 && record.bestStreak > record.currentStreak && (
                <span className="text-xs text-gray-400 mb-0.5">
                  Best: {record.bestStreak}
                </span>
              )}
            </div>

            {/* Progress bar to next milestone */}
            {nextMilestone && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    Next reward: +{nextMilestone.bonusPoints} pts at {nextMilestone.daysRequired} days
                  </span>
                  <span className="font-medium text-orange-600">
                    {daysToNextMilestone > 0 ? `${daysToNextMilestone} to go` : 'Claim pending!'}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {/* No milestones left */}
            {!nextMilestone && record.currentStreak > 0 && (
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <Trophy className="w-3 h-3" /> All milestones unlocked!
              </p>
            )}

            {/* Description */}
            {rule.description && (
              <p className="text-xs text-gray-400 leading-relaxed">{rule.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
