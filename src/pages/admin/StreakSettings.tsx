import React, { useState } from 'react';
import { Flame, RefreshCw, Trophy, Users } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useStreak } from '../../contexts/StreakContext';
import { Card, Button, toast } from '../../components/ui';
import { StreakBadge } from '../../components/streak/StreakBadge';
import { loadBonuses } from '../../lib/streakStorage';

export function StreakSettings() {
  const { users } = useData();
  const { streaks, dailyWinners, settings, updateSettings, recalculate } = useStreak();

  const [lengthInput, setLengthInput] = useState(String(settings.streakLengthForBonus));
  const [pointsInput, setPointsInput] = useState(String(settings.bonusPoints));
  const [recalculating, setRecalculating] = useState(false);

  const participants = users.filter(u => u.role === 'participant');
  const bonuses = loadBonuses();

  const handleSave = () => {
    const len = parseInt(lengthInput, 10);
    const pts = parseInt(pointsInput, 10);
    if (isNaN(len) || len < 2 || len > 365) {
      toast.error('Streak length must be between 2 and 365');
      return;
    }
    if (isNaN(pts) || pts < 1 || pts > 10000) {
      toast.error('Bonus points must be between 1 and 10,000');
      return;
    }
    updateSettings({ streakLengthForBonus: len, bonusPoints: pts });
    toast.success('Streak settings saved!');
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    await recalculate();
    setRecalculating(false);
    toast.success('Streaks recalculated successfully!');
  };

  const getStreak = (userId: string) =>
    streaks.find(s => s.participantId === userId);

  const getUserBonuses = (userId: string) =>
    bonuses.filter(b => b.participantId === userId).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Flame className="w-7 h-7 text-orange-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Streak Settings</h1>
          <p className="text-sm text-gray-500">Manage daily top-performer streak bonuses</p>
        </div>
      </div>

      {/* Master toggle + rules */}
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Daily Winner Streaks</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              The participant with the most approved points each day earns the daily top spot.
              Consecutive days trigger a streak.
            </p>
          </div>
          <button
            onClick={() => updateSettings({ enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.enabled ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="border-t border-gray-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Streak length for bonus (days)
            </label>
            <input
              type="number"
              min={2}
              max={365}
              value={lengthInput}
              onChange={e => setLengthInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Default: 7 days</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bonus points per milestone
            </label>
            <input
              type="number"
              min={1}
              max={10000}
              value={pointsInput}
              onChange={e => setPointsInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Default: 30 points</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave}>Save Settings</Button>
          <Button
            variant="outline"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
            Recalculate All Streaks
          </Button>
        </div>
      </Card>

      {/* Rule summary */}
      <Card className="p-5 bg-orange-50 border-orange-100">
        <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          How It Works
        </h3>
        <ul className="text-sm text-orange-700 space-y-1.5 list-disc ms-4">
          <li>Every day, the participant with the most approved points earns the <strong>daily top</strong> spot.</li>
          <li>A streak starts after <strong>2 consecutive days</strong> at the top.</li>
          <li>Every <strong>{settings.streakLengthForBonus} consecutive days</strong> earns <strong>+{settings.bonusPoints} bonus points</strong>.</li>
          <li>Tie-break: earliest accepted submission time wins the day.</li>
          <li>Only approved activity submissions count (not streak bonuses).</li>
          <li>Streak resets if a different participant tops the daily ranking.</li>
        </ul>
      </Card>

      {/* Per-participant streak table */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Participant Streaks
        </h3>

        {participants.length === 0 ? (
          <p className="text-gray-400 text-sm">No participants yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-start py-2 px-3 text-gray-500 font-medium">Participant</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Current Streak</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Best Streak</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Last Win</th>
                  <th className="text-center py-2 px-3 text-gray-500 font-medium">Bonuses Earned</th>
                </tr>
              </thead>
              <tbody>
                {participants.map(user => {
                  const streak = getStreak(user.id);
                  const bonusCount = getUserBonuses(user.id);
                  return (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-800">{user.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        {streak && streak.currentStreak >= 2 ? (
                          <StreakBadge streak={streak.currentStreak} size="sm" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {streak && streak.bestStreak >= 2 ? (
                          <span className="font-semibold text-orange-600">🏅 {streak.bestStreak}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-500">
                        {streak?.lastWinDate || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {bonusCount > 0 ? (
                          <span className="font-semibold text-green-600">
                            {bonusCount} × +{settings.bonusPoints}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Daily winners log */}
      <Card className="p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Daily Winners Log</h3>
        {dailyWinners.length === 0 ? (
          <p className="text-gray-400 text-sm">No daily winners recorded yet. Winners are determined when submissions are approved.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-start py-2 px-3 text-gray-500 font-medium">Date</th>
                  <th className="text-start py-2 px-3 text-gray-500 font-medium">Winner</th>
                  <th className="text-end py-2 px-3 text-gray-500 font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {[...dailyWinners]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 30)
                  .map(w => {
                    const user = users.find(u => u.id === w.winnerId);
                    return (
                      <tr key={w.date} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium text-gray-700">{w.date}</td>
                        <td className="py-2 px-3 text-gray-600">
                          🥇 {user?.name ?? w.winnerId}
                        </td>
                        <td className="py-2 px-3 text-end font-semibold text-blue-600">
                          {w.points} pts
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
