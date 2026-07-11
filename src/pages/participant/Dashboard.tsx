import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Trophy, Clock, CheckCircle, XCircle, Gift, AlertCircle, Flag, MessageSquare, Copy, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { getConnectionCode, generateConnectionCode } from '../../lib/parentStorage';
import type { ChildConnectionCode } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useStreakSafe } from '../../contexts/StreakContext';
import { Card, Button, StatusBadge, toast } from '../../components/ui';
import { DashboardCard } from '../../components/shared/DashboardCard';
import { BadgeDisplay } from '../../components/shared/BadgeDisplay';
import { HeroLevelBadge } from '../../components/shared/HeroLevelBadge';
import { AnimalAvatar } from '../../components/avatar/AnimalAvatar';
import { StreakCelebration } from '../../components/streak/StreakCelebration';
import { StreakProgress } from '../../components/streak/StreakProgress';
import { useAvatarSafe } from '../../contexts/AvatarContext';
import { useAnnouncements } from '../../contexts/AnnouncementContext';
import { AnnouncementDetailModal } from '../../components/shared/AnnouncementDetailModal';
import type { Announcement } from '../../types';
import { getMoodFromPoints } from '../../types/avatar';
import { DEFAULT_ANIMAL_ID } from '../../lib/avatarData';
import { getMonth, getYear, formatDistanceToNow } from 'date-fns';
import type { SubmissionStatus } from '../../types';

const statusConfig: Record<SubmissionStatus, { label: string; variant: 'yellow' | 'green' | 'red' | 'blue' | 'gray'; icon: React.ReactNode }> = {
  pending: { label: 'Pending', variant: 'yellow', icon: <Clock className="w-3 h-3" /> },
  accepted: { label: 'Accepted', variant: 'green', icon: <CheckCircle className="w-3 h-3" /> },
  denied: { label: 'Denied', variant: 'red', icon: <XCircle className="w-3 h-3" /> },
  flagged: { label: 'Flagged', variant: 'red', icon: <Flag className="w-3 h-3" /> },
  needs_info: { label: 'Needs More Info', variant: 'blue', icon: <MessageSquare className="w-3 h-3" /> },
};

export function ParticipantDashboard() {
  const { currentUser } = useAuth();
  const { submissions, activities, getAcceptedPoints, getMonthlyPoints, getYearlyPoints, getBadgeForPoints, getNextBadge, getLeaderboard } = useData();
  const streakCtx = useStreakSafe();
  const avatarCtx = useAvatarSafe();
  const { announcements } = useAnnouncements();
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
  const needsInfoCount = submissions.filter(s => s.participantId === userId && s.status === 'needs_info').length;

  const myStreak = streakCtx?.getParticipantStreak(userId);
  const daysToBonus = streakCtx?.getDaysToNextBonus(userId) ?? -1;
  const activeStreaks = streakCtx?.getActiveStreaksForParticipant(userId) ?? [];

  const showCelebration = streakCtx?.newBonusFor === userId;
  const handleCloseCelebration = () => streakCtx?.clearNewBonus();

  const avatarAnimalId = avatarCtx?.settings?.equippedAnimalId ?? DEFAULT_ANIMAL_ID;
  const avatarColorId  = avatarCtx?.settings?.equippedColorId ?? null;
  const avatarAccIds   = avatarCtx?.settings?.equippedAccessoryIds ?? [];
  const mood = getMoodFromPoints(totalPoints);

  const activeAnnouncements = announcements.filter(a => a.isActive);

  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);

  const [codeOpen,       setCodeOpen]      = useState(false);
  const [connCode,       setConnCode]      = useState<ChildConnectionCode | null>(null);
  const [codeLoading,    setCodeLoading]   = useState(false);

  useEffect(() => {
    if (!codeOpen || connCode !== null) return;
    setCodeLoading(true);
    void getConnectionCode(userId).then(c => { setConnCode(c); setCodeLoading(false); });
  }, [codeOpen, connCode, userId]);

  const handleGenerate = async () => {
    setCodeLoading(true);
    try {
      const code = await generateConnectionCode(userId);
      const c = await getConnectionCode(userId);
      setConnCode(c ?? { id: '', participantId: userId, code, status: 'active', createdAt: new Date().toISOString() });
    } finally {
      setCodeLoading(false);
    }
  };

  const motivations = [
    "Keep going, Hero! Every action brings you closer to your next level! 🚀",
    "You're doing amazing! Consistency is the key to becoming a hero! ⭐",
    "Great work! Small steps every day lead to big achievements! 💪",
    "You're on fire! Keep submitting those hero actions! 🔥",
    "Every good deed makes you a better hero. Keep it up! 🦸",
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

      {/* Needs More Info alert */}
      {needsInfoCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-blue-700">Admin needs more information</p>
            <p className="text-sm text-blue-600">You have {needsInfoCount} submission{needsInfoCount !== 1 ? 's' : ''} that need additional details.</p>
          </div>
          <Link to="/participant/history">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">View</Button>
          </Link>
        </div>
      )}

      {/* Announcements */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-2">
          {activeAnnouncements.map(a => (
            <button
              key={a.id}
              type="button"
              className="w-full text-left bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 hover:border-amber-300 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
              onClick={() => setSelectedAnn(a)}
            >
              <span className="text-2xl flex-shrink-0 leading-none mt-0.5">📢</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-amber-800">{a.title}</p>
                  <span className="text-xs text-amber-500 flex-shrink-0 mt-0.5 font-medium">Read more →</span>
                </div>
                <p className="text-sm text-amber-700 mt-0.5 line-clamp-2">{a.message}</p>
                {a.imageUrl && (
                  <img
                    src={a.imageUrl}
                    alt={a.title}
                    className="mt-3 w-full max-h-28 rounded-xl object-cover"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      <AnnouncementDetailModal
        announcement={selectedAnn}
        onClose={() => setSelectedAnn(null)}
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
            <p className="text-sm text-gray-500">Welcome back, Hero!</p>
            <h1 className="text-2xl font-bold text-gray-800">{currentUser!.name} 👋</h1>
            <p className="text-sm text-blue-500 mt-0.5">{motivation}</p>
          </div>
        </div>
        <Link to="/participant/submit">
          <Button size="lg">
            <PlusCircle className="w-4 h-4" />
            Submit Hero Action
          </Button>
        </Link>
      </div>

      {/* Hero Level */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-4 text-white">
          <p className="text-sm text-blue-100 font-medium">Your Hero Level</p>
          <div className="mt-2">
            <HeroLevelBadge points={totalPoints} size="lg" showProgress />
          </div>
        </div>
        <div className="px-6 py-3 bg-blue-50/50">
          <p className="text-xs text-blue-600">Level is based on total earned Hero Points and never goes down.</p>
        </div>
      </Card>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Hero Points" value={totalPoints} icon="⭐" subtitle="All time" color="text-blue-600" bgColor="bg-blue-50" />
        <DashboardCard title="This Month" value={monthlyPoints} icon="📅" subtitle={now.toLocaleString('default', { month: 'long' })} color="text-green-600" bgColor="bg-green-50" />
        <DashboardCard title="This Year" value={yearlyPoints} icon="📆" subtitle={String(getYear(now))} color="text-purple-600" bgColor="bg-purple-50" />
        <DashboardCard title="Pending" value={pendingCount} icon="⏳" subtitle="Awaiting review" color="text-amber-600" bgColor="bg-amber-50" />
      </div>

      {/* Streak card */}
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

      {/* Activity-based streak progress cards */}
      {activeStreaks.length > 0 && (
        <StreakProgress summaries={activeStreaks} />
      )}

      {/* Daily Quizzes card */}
      <Link to="/participant/quizzes" className="block">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white cursor-pointer hover:from-purple-600 hover:to-purple-800 transition-all shadow-lg flex items-center gap-4">
          <div className="text-4xl">🧩</div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Daily Quizzes</h3>
            <p className="text-purple-100 text-sm mt-0.5">Answer questions and earn Hero Points!</p>
          </div>
          <div className="ml-auto text-purple-200 text-2xl">→</div>
        </div>
      </Link>

      {/* Ranks + Badge + Hero Rewards card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ranks */}
        <Card className="p-6">
          <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Hero Board Ranks
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
              <Button variant="outline" className="w-full" size="sm">View Hero Board</Button>
            </Link>
          </div>
        </Card>

        {/* Badge */}
        <Card className="p-6 flex flex-col items-center justify-center text-center">
          <h2 className="font-semibold text-gray-700 mb-4 w-full text-left">🎖️ Hero Badge</h2>
          <BadgeDisplay badge={badge} nextBadge={nextBadge} currentPoints={totalPoints} showProgress size="lg" />
        </Card>

        {/* Hero Rewards quick card */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-500" /> Hero Rewards
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Spend your Hero Points to request real-life rewards from your parent or guardian!
          </p>
          <p className="text-2xl font-extrabold text-purple-700 mb-1">{totalPoints} <span className="text-base font-normal text-gray-500">pts available</span></p>
          {!currentUser?.parentEmail && (
            <p className="text-xs text-amber-600 mb-3 flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Add your parent's email in Settings to unlock rewards.
            </p>
          )}
          <Link to="/participant/rewards">
            <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
              <Gift className="w-3.5 h-3.5" /> View Hero Rewards
            </Button>
          </Link>
        </Card>
      </div>

      {/* Parent Connection Code */}
      <Card className="overflow-hidden">
        <button
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          onClick={() => setCodeOpen(o => !o)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🔑</span>
            <span className="font-semibold text-gray-700">Parent Connection Code</span>
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">For parents</span>
          </div>
          {codeOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {codeOpen && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-50">
            <p className="text-sm text-gray-500 mt-3">
              Share this code with your parent or guardian so they can request access to follow your progress.
              The code expires in 30 days.
            </p>
            {codeLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
                Loading...
              </div>
            ) : connCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                    <p className="font-mono text-2xl font-bold text-purple-700 tracking-widest text-center">{connCode.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      void navigator.clipboard.writeText(connCode.code);
                      toast.success('Code copied!');
                    }}
                    className="p-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors"
                    title="Copy code"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                {connCode.expiresAt && (
                  <p className="text-xs text-gray-400">
                    Expires: {new Date(connCode.expiresAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
                <button
                  onClick={() => void handleGenerate()}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Generate new code
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">No active code yet.</p>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => void handleGenerate()}
                  loading={codeLoading}
                >
                  Generate Connection Code
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

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
              <p className="text-4xl mb-2">🦸</p>
              <p className="text-gray-500 text-sm">No hero actions yet.</p>
              <Link to="/participant/submit" className="mt-3 inline-block">
                <Button size="sm">Submit your first hero action!</Button>
              </Link>
            </div>
          ) : (
            mySubmissions.map(sub => {
              const activity = activities.find(a => a.id === sub.activityId);
              const cfg = statusConfig[sub.status] ?? statusConfig.pending;
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
                    {sub.status === 'needs_info' && sub.adminComment && (
                      <p className="text-xs text-blue-500 mt-0.5">💬 {sub.adminComment}</p>
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
