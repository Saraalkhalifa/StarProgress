import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, Tabs } from '../../components/ui';
import { LeaderboardTable } from '../../components/shared/LeaderboardTable';
import { getMonth, getYear } from 'date-fns';

export function Leaderboard() {
  const { currentUser } = useAuth();
  const { getLeaderboard } = useData();
  const now = new Date();
  const [tab, setTab] = useState('overall');
  const [month, setMonth] = useState(getMonth(now));
  const [year, setYear] = useState(getYear(now));
  const [yearFilter, setYearFilter] = useState(getYear(now));

  const entries =
    tab === 'overall' ? getLeaderboard('overall') :
    tab === 'monthly' ? getLeaderboard('monthly', month, year) :
    getLeaderboard('yearly', undefined, yearFilter);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years = [getYear(now), getYear(now)-1, getYear(now)-2];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-yellow-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leaderboard 🏆</h1>
          <p className="text-gray-500 text-sm">See how you rank against other participants</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'overall', label: 'Overall', icon: '🏆' },
          { id: 'monthly', label: 'Monthly', icon: '📅' },
          { id: 'yearly', label: 'Yearly', icon: '📆' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'monthly' && (
        <div className="flex gap-3 flex-wrap">
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {tab === 'yearly' && (
        <div className="flex gap-3">
          <select
            value={yearFilter}
            onChange={e => setYearFilter(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            if (!entry) return <div key={i} />;
            const podiumColors = ['bg-gray-100', 'bg-gradient-to-b from-yellow-50 to-amber-100 border-2 border-yellow-300', 'bg-orange-50'];
            const icons = ['🥈', '🥇', '🥉'];
            return (
              <div key={entry.user.id} className={`p-4 rounded-2xl text-center ${podiumColors[i]} ${i === 1 ? 'transform -translate-y-2' : ''}`}>
                <div className="text-3xl mb-1">{icons[i]}</div>
                <p className="font-bold text-gray-800 text-sm truncate">{entry.user.name}</p>
                {entry.badge && <p className="text-xs">{entry.badge.icon} {entry.badge.name}</p>}
                <p className={`text-xl font-extrabold mt-1 ${i === 1 ? 'text-yellow-600' : 'text-gray-600'}`}>{entry.points}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
            );
          })}
        </div>
      )}

      <Card className="p-4">
        <LeaderboardTable entries={entries} currentUserId={currentUser?.id} />
      </Card>
    </div>
  );
}
