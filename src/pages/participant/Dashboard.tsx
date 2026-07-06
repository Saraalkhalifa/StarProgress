import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useStreakSafe } from '../../contexts/StreakContext';
import { Card, Button, StatusBadge } from '../../components/ui';
import { DashboardCard } from '../../components/shared/DashboardCard';
import { BadgeDisplay } from '../../components/shared/BadgeDisplay';
import { AnimalAvatar } from '../../components/avatar/AnimalAvatar';
import { StreakCelebration } from '../../components/streak/StreakCelebration';
import { useAvatarSafe } from '../../contexts/AvatarContext';
import { getMoodFromPoints } from '../../types/avatar';
import { DEFAULT_ANIMAL_ID } from '../../lib/avatarData';
import { getMonth, getYear, formatDistanceToNow } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', variant: 'yellow' as const, icon: <Clock className="w-3 h-3" /> },
  accepted: { label: 'Accepted', variant: 'green' as const, icon: <CheckCircle className="w-3 h-3" /> },
  denied: { label: 'Denied', variant: 'red' as const, icon: <XCircle className="w-3 h-3" /> },
};

export function ParticipantDashboard() {
  const { currentUser } = useAuth();
  const { submissions, activities, getAcceptedPoints, getMonthlyPoints, getYearlyPoints, getBadgeForPoints, getNextBadge, getLeaderboard } = useData();
  const streakCtx = useStreakSafe();
  const avatarCtx = useAvatarSafe();
  const now = new Date();
  const userId = currentUser!.id;

  const totalPoints = getAcceptedPoints(userId);
  const monthlyPoints = getMonthlyPoints(userId, getMonth(now), getYear(now));
  const yearlyPoints = getYearlyPoints(userId, getYear(now));
  const badge = getBadgeForPoints(totalPoints);
  const nextBadge = getNextBadge(totalPoints);

  const overallLB = getLeaderboard('overall');
  const monthlyLB = getLeaderboard('monthly');
  const yearlyLB = getLeaderboard('yearly');
  const overallRank = overallLB.find(e => e.user.id === userId)?.rank ?? '-';
  const monthlyRank = monthlyLB.find(e => e.user.id === userId)?.rank ?? '-';
  const yearlyRank = yearlyLB.find(e => e.user.id === userId)?.rank ?? '-';

  const mySubmissions = submissions
    .filter(s => s.participantId === userId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 8);

  const pendingCount = submissions.filter(s => s.participantId === userId && s.status === 'pending').length;

  const myStreak = streakCtx?.getParticipantStreak(userId);
  const daysToBonus = streakCtx?.getDaysToNextBonus(userId) ?? -1;

  // Derived: show celebration overlay when this user just earned a streak bonus
  const showCelebration = streakCtx?.newBonusFor === userId;
  const handleCloseCelebration = () => streakCtx?.clearNewBonus();

  const avatarAnimalId = avatarCtx?.settings?.equippedAnimalId ?? DEFAULT_ANIMAL_ID;
  const avatarColorId  = avatarCtx?.settings?.equippedColorId ?? null;
  const avatarAccIds   = avatarCtx?.settings?.equippedAccessoryIds ?? [];
  const mood = getMoodFromPoints(totalPoints);

  const motivations = [
    "Keep going! Every activity brings you closer to your goal! 🚀",
    "You're doing amazing! Consistency is the key to success! ⭐",
    "Great work! Small steps every day lead to big achievements! 💪",
    "You're on fire! Keep submitting those great activities! 🔥",
  ];
  const motivation = motivations[userId.charCodeAt(0) % motivations.length];

  return (
    <div className="space-y-8">
      <StreakCelebration
        visible={showCelebration}
        streak={myStreak?.currentStreak ?? 0}
        bonusPoints={streakCtx?.settings.bonusPoints ?? 30}
        onClose={handleCloseCelebration}
      />

      {/* Welcome header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <AnimalAvatar
            animalId={avatarAnimalId}
            mood={mood}
            colorThemeId={avatarColorId}
            accessoryIds={avatarAccIds}
            size={88}
            animated
          />
          <div>
            <p className="text-sm text-gray-500">Welcome back,</p>
            <h1 className="text-2xl font-bold text-gray-800">{currentUser!.name} 👋</h1>
            <p className="text-sm text-blue-500 mt-0.5">{motivation}</p>
          </div>
        </div>
        <Link to="/participant/submit">
          <Button size="lg">
            <PlusCircle className="w-4 h-4" />
            Submit Activity
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Points" value={totalPoints} icon="⭐" subtitle="All time" color="text-blue-600" bgColor="bg-blue-50" />
        <DashboardCard title="This Month" value={monthlyPoints} icon="📅" subtitle={now.toLocaleString('default', { month: 'long' })} color="text-green-600" bgColor="bg-green-50" />
        <DashboardCard title="This Year" value={yearlyPoints} icon="📆" subtitle={String(getYear(now))} color="text-purple-600" bgColor="bg-purple-50" />
        <DashboardCard title="Pending" value={pendingCount} icon="⏳" subtitle="Awaiting review" color="text-amber-600" bgColor="bg-amber-50" />
      </div>

      {/* Streak card — only shown when streak ≥ 2 */}
      {myStreak && myStreak.currentStreak >= 2 && (
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white shadow-md flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🔥</div>
            <div>
              <p className="text-sm font-medium opacity-80">Daily Top Streak</p>
              <p className="text-3xl font-extrabold">{myStreak.currentStreak} days</p>
              {myStreak.bestStreak > myStreak.currentStreak && (
                <p className="text-xs opacity-70 mt-0.5">Best: {myStreak.bestStreak} days</p>
              )}
            </div>
          </div>
          <div className="text-end">
            {daysToBonus > 0 && streakCtx?.settings.enabled && (
              <>
                <p className="text-2xl font-extrabold">{daysToBonus}</p>
                <p className="text-sm opacity-80">more day{daysToBonus !== 1 ? 's' : ''} for</p>
                <p className="text-sm font-bold">+{streakCtx.settings.bonusPoints} pts!</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Ranks + Badge */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ranks */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Your Rankings
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Overall Rank', rank: overallRank, icon: '🏆', color: 'text-yellow-600 bg-yellow-50' },
              { label: 'Monthly Rank', rank: monthlyRank, icon: '📅', color: 'text-blue-600 bg-blue-50' },
              { label: 'Yearly Rank', rank: yearlyRank, icon: '📆', color: 'text-purple-600 bg-purple-50' },
            ].map(({ label, rank, icon, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm text-gray-600 flex items-center gap-2"><span>{icon}</span>{label}</span>
                <span className={`font-bold text-lg px-3 py-1 rounded-lg ${color}`}>#{rank}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/participant/leaderboard">
              <Button variant="outline" className="w-full" size="sm">View Full Leaderboard</Button>
            </Link>
          </div>
        </Card>

        {/* Badge */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h2 className="font-semibold text-gray-700 mb-4 w-full text-left">🎖️ Your Achievement</h2>
          <BadgeDisplay badge={badge} nextBadge={nextBadge} currentPoints={totalPoints} showProgress size="lg" />
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Recent Submissions</h2>
          <Link to="/participant/history">
            <Button variant="ghost" size="sm">View All →</Button>
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {mySubmissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-gray-500 text-sm">No submissions yet.</p>
              <Link to="/participant/submit" className="mt-3 inline-block">
                <Button size="sm">Submit your first activity!</Button>
              </Link>
            </div>
          ) : (
            mySubmissions.map(sub => {
              const activity = activities.find(a => a.id === sub.activityId);
              const cfg = statusConfig[sub.status];
              return (
                <div key={sub.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                    {activity?.icon || '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{activity?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{sub.note}</p>
                    {sub.status === 'denied' && sub.adminComment && (
                      <p className="text-xs text-red-400 mt-0.5">💬 {sub.adminComment}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge variant={cfg.variant}>
                      {cfg.icon}{cfg.label}
                    </StatusBadge>
                    {sub.status === 'accepted' && (
                      <span className="text-sm font-bold text-green-600">+{sub.pointsValueAtSubmission}</span>
                    )}
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {formatDistanceToNow(new Date(sub.submittedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
