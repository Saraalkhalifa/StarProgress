import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useData } from '../../contexts/DataContext';
import { Card, CardHeader, CardContent } from '../../components/ui';
import { DashboardCard } from '../../components/shared/DashboardCard';
import { format, getMonth, getYear, subMonths } from 'date-fns';

export function AdminDashboard() {
  const { users, submissions, activities, getAcceptedPoints } = useData();
  const now = new Date();

  const participants = users.filter(u => u.role === 'participant');
  const totalAcceptedPts = participants.reduce((sum, u) => sum + getAcceptedPoints(u.id), 0);
  const pending = submissions.filter(s => s.status === 'pending').length;

  const topOverall = [...participants]
    .map(u => ({ user: u, pts: getAcceptedPoints(u.id) }))
    .sort((a, b) => b.pts - a.pts)[0];

  const topMonthly = [...participants]
    .map(u => {
      const pts = submissions
        .filter(s => s.participantId === u.id && s.status === 'accepted')
        .filter(s => getMonth(new Date(s.submittedAt)) === getMonth(now) && getYear(new Date(s.submittedAt)) === getYear(now))
        .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
      return { user: u, pts };
    })
    .sort((a, b) => b.pts - a.pts)[0];

  // Activity frequency
  const activityFreq = activities.map(a => ({
    name: a.icon + ' ' + (a.name.length > 12 ? a.name.slice(0, 12) + '…' : a.name),
    count: submissions.filter(s => s.activityId === a.id && s.status === 'accepted').length,
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  const mostPopular = activities.find(a => a.id === (() => {
    const freq: Record<string, number> = {};
    submissions.filter(s => s.status === 'accepted').forEach(s => { freq[s.activityId] = (freq[s.activityId] || 0) + 1; });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  })());

  // Monthly trend (last 6 months)
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, 5 - i);
    const pts = submissions
      .filter(s => s.status === 'accepted' && getMonth(new Date(s.submittedAt)) === getMonth(date) && getYear(new Date(s.submittedAt)) === getYear(date))
      .reduce((sum, s) => sum + s.pointsValueAtSubmission, 0);
    return { month: format(date, 'MMM'), points: pts };
  });

  const recentActivity = submissions
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard 📊</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of Star Progress program</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard title="Total Participants" value={participants.length} icon="👥" color="text-blue-600" bgColor="bg-blue-50" />
        <DashboardCard title="Total Points Earned" value={totalAcceptedPts} icon="⭐" color="text-yellow-600" bgColor="bg-yellow-50" />
        <DashboardCard title="Pending Approvals" value={pending} icon="⏳" subtitle={pending > 0 ? 'Needs attention!' : 'All clear'} color={pending > 0 ? 'text-red-600' : 'text-green-600'} bgColor={pending > 0 ? 'bg-red-50' : 'bg-green-50'} />
        <DashboardCard title="Total Submissions" value={submissions.length} icon="📬" color="text-purple-600" bgColor="bg-purple-50" />
      </div>

      {/* Top participants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">🏆 Top Overall</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{topOverall?.user.name || '—'}</p>
          <p className="text-3xl font-extrabold text-amber-600">{topOverall?.pts || 0} pts</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">📅 Top This Month</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{topMonthly?.user.name || '—'}</p>
          <p className="text-3xl font-extrabold text-blue-600">{topMonthly?.pts || 0} pts</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">🌟 Most Popular Activity</p>
          <p className="text-lg font-bold text-gray-800 mt-1">{mostPopular ? `${mostPopular.icon} ${mostPopular.name}` : '—'}</p>
          <p className="text-sm text-green-600 mt-1">
            {mostPopular ? `${submissions.filter(s => s.activityId === mostPopular.id && s.status === 'accepted').length} completions` : ''}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-700">Points Trend (Last 6 Months)</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="points" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-700">Activity Frequency</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={activityFreq} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#60A5FA" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity timeline */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-700">Recent Activity Timeline</h3>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-sm">No submissions yet</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentActivity.map(sub => {
                const participant = users.find(u => u.id === sub.participantId);
                const activity = activities.find(a => a.id === sub.activityId);
                const statusColor = { pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-green-100 text-green-700', denied: 'bg-red-100 text-red-700' }[sub.status];
                return (
                  <div key={sub.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50/50">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {activity?.icon || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        <span className="text-blue-600">{participant?.name}</span> → {activity?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{sub.note}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{sub.status}</span>
                      <span className="text-xs text-gray-400 hidden sm:block">{format(new Date(sub.submittedAt), 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
