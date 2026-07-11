import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Star, ChevronRight, CheckCircle, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, toast } from '../../components/ui';
import { quizStorage, QuizMigrationNeededError } from '../../lib/quizStorage';
import type { Quiz, QuizAttempt, QuizSubject, QuizDifficulty } from '../../types/quiz';

const SUBJECT_META: Record<QuizSubject, { label: string; icon: string; color: string; bg: string }> = {
  math:    { label: 'Math',    icon: '🔢', color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  science: { label: 'Science', icon: '🔬', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  english: { label: 'English', icon: '📚', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

const DIFFICULTY_META: Record<QuizDifficulty, { label: string; color: string }> = {
  easy:   { label: 'Easy',   color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  hard:   { label: 'Hard',   color: 'bg-red-100 text-red-700' },
};

type SubjectFilter = QuizSubject | 'all';
type StatusFilter = 'all' | 'available' | 'completed';

interface QuizWithStatus {
  quiz: Quiz;
  bestAttempt: QuizAttempt | null;
  attemptsUsed: number;
  attemptsRemaining: number;
  quizStatus: 'available' | 'completed' | 'in_progress' | 'closed';
}

export function DailyQuizzes() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizWithStatus[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<QuizDifficulty | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (!currentUser) return;
    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function load() {
    try {
      setLoading(true);
      const [activeQuizzes, myAttempts] = await Promise.all([
        quizStorage.getActiveQuizzes(),
        quizStorage.getParticipantAttempts(currentUser!.id),
      ]);

      const enriched: QuizWithStatus[] = activeQuizzes.map(quiz => {
        const quizAttempts = myAttempts.filter(a => a.quizId === quiz.id);
        const graded = quizAttempts.filter(a => a.status === 'graded' || a.status === 'submitted');
        const inProg = quizAttempts.find(a => a.status === 'in_progress');
        const bestAttempt = graded.length > 0
          ? graded.reduce((best, a) => a.pointsEarned > best.pointsEarned ? a : best, graded[0])
          : null;
        const attemptsUsed = graded.length;
        const attemptsRemaining = quiz.maxAttempts === 0
          ? Infinity
          : Math.max(0, quiz.maxAttempts - attemptsUsed);

        let quizStatus: QuizWithStatus['quizStatus'] = 'available';
        if (inProg) quizStatus = 'in_progress';
        else if (graded.length > 0 && (!quiz.allowRetries || attemptsRemaining === 0)) quizStatus = 'completed';
        else if (graded.length > 0) quizStatus = 'available'; // retries allowed

        return { quiz, bestAttempt, attemptsUsed, attemptsRemaining, quizStatus };
      });

      setQuizzes(enriched);
    } catch (err) {
      if (!(err instanceof QuizMigrationNeededError)) {
        toast.error('Failed to load quizzes.');
      }
    } finally {
      setLoading(false);
    }
  }

  const filtered = quizzes.filter(({ quiz, quizStatus }) => {
    if (subjectFilter !== 'all' && quiz.subject !== subjectFilter) return false;
    if (difficultyFilter !== 'all' && quiz.difficulty !== difficultyFilter) return false;
    if (statusFilter === 'available' && quizStatus !== 'available' && quizStatus !== 'in_progress') return false;
    if (statusFilter === 'completed' && quizStatus !== 'completed') return false;
    return true;
  });

  const handleStart = (id: string) => navigate(`/participant/quizzes/${id}`);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center shadow-md">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Quizzes</h1>
          <p className="text-sm text-gray-500">Answer questions and earn Hero Points! 🦸</p>
        </div>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap">
        {([['all', 'All Quizzes', '🧩'], ['math', 'Math', '🔢'], ['science', 'Science', '🔬'], ['english', 'English', '📚']] as const).map(([val, label, icon]) => (
          <button
            key={val}
            onClick={() => setSubjectFilter(val as SubjectFilter)}
            className={`px-4 py-2 rounded-2xl font-semibold text-sm transition-all flex items-center gap-1.5 ${
              subjectFilter === val
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-blue-100 text-gray-600 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex gap-3 flex-wrap items-center">
        <Filter className="w-4 h-4 text-gray-400" />
        <select
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value as QuizDifficulty | 'all')}
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">All Statuses</option>
          <option value="available">Available</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''}</span>
      </div>

      {/* Quiz cards */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-5xl mb-4">🦸</p>
          <p className="text-lg font-semibold text-gray-700 mb-2">No quizzes available right now.</p>
          <p className="text-gray-400">Check again later for new Hero Challenges!</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(({ quiz, bestAttempt, attemptsUsed, attemptsRemaining, quizStatus }) => {
            const sm = SUBJECT_META[quiz.subject];
            const dm = DIFFICULTY_META[quiz.difficulty];
            const totalPts = quiz.totalPoints ?? ((quiz.questionCount ?? 0));
            const isCompleted = quizStatus === 'completed';
            const isInProgress = quizStatus === 'in_progress';

            return (
              <Card key={quiz.id} className={`p-5 flex flex-col gap-4 ${isCompleted ? 'opacity-90' : ''}`}>
                {/* Top row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-2xl ${sm.bg}`}>
                      {sm.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 leading-tight">{quiz.title}</p>
                      <p className={`text-xs font-medium ${sm.color}`}>{sm.label}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${dm.color}`}>{dm.label}</span>
                </div>

                {quiz.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{quiz.description}</p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {quiz.questionCount !== undefined && (
                    <span className="flex items-center gap-1">📝 {quiz.questionCount} questions</span>
                  )}
                  {totalPts > 0 && (
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{totalPts} Hero Points</span>
                  )}
                  {quiz.endDate && (
                    <span className="flex items-center gap-1 text-orange-500">
                      <Clock className="w-3 h-3" />Due {new Date(quiz.endDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                  {quiz.timeLimitMinutes ? (
                    <span className="flex items-center gap-1">⏱️ {quiz.timeLimitMinutes} min</span>
                  ) : null}
                </div>

                {/* Attempts */}
                {attemptsUsed > 0 && (
                  <div className="text-xs text-gray-400">
                    Attempts used: {attemptsUsed}{quiz.maxAttempts > 0 ? ` / ${quiz.maxAttempts}` : ''}
                    {attemptsRemaining !== Infinity && attemptsRemaining > 0 && ` · ${attemptsRemaining} remaining`}
                  </div>
                )}

                {/* Best score */}
                {bestAttempt && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-semibold text-green-700">Best: {bestAttempt.score}%</span>
                      <span className="text-green-600 ml-2">· +{bestAttempt.pointsEarned} pts earned</span>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="mt-auto">
                  {isCompleted ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStart(quiz.id)}
                    >
                      View Result
                    </Button>
                  ) : isInProgress ? (
                    <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => handleStart(quiz.id)}>
                      Continue Quiz <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={() => handleStart(quiz.id)}>
                      Start Quiz <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
