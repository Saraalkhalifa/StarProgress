import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Send, CheckCircle, XCircle, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, Button, toast } from '../../components/ui';
import { quizStorage } from '../../lib/quizStorage';
import type { Quiz, QuizQuestion, QuizAttempt, QuizAnswer } from '../../types/quiz';

type UserAnswers = Record<string, string>; // questionId → answer string or optionId

export function TakeQuiz() {
  const { id: quizId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const { addAcceptedSubmission } = useData();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultAttempt, setResultAttempt] = useState<QuizAttempt | null>(null);
  const [savedAnswers, setSavedAnswers] = useState<QuizAnswer[]>([]);

  const loadQuiz = useCallback(async () => {
    if (!quizId || !currentUser) return;
    try {
      setLoading(true);
      const [q, qs] = await Promise.all([
        quizStorage.getQuiz(quizId),
        quizStorage.getQuizQuestions(quizId),
      ]);
      if (!q) { toast.error('Quiz not found.'); navigate('/participant/quizzes'); return; }

      // Check existing attempts
      const existing = await quizStorage.getParticipantQuizAttempts(currentUser.id, quizId);
      const inProgress = existing.find(a => a.status === 'in_progress');
      const graded = existing.filter(a => a.status === 'graded' || a.status === 'submitted');

      // If already fully completed and no retries, show last result
      if (graded.length > 0 && (!q.allowRetries || (q.maxAttempts > 0 && graded.length >= q.maxAttempts))) {
        const best = graded.reduce((b, a) => a.pointsEarned > b.pointsEarned ? a : b, graded[0]);
        const ans = await quizStorage.getAttemptAnswers(best.id);
        setQuiz(q);
        setQuestions(qs.filter(qu => qu.active));
        setResultAttempt(best);
        setSavedAnswers(ans);
        setSubmitted(true);
        setLoading(false);
        return;
      }

      // Resume or create attempt
      let att = inProgress;
      if (!att) {
        att = await quizStorage.createAttempt({
          quizId,
          participantId: currentUser.id,
          attemptNumber: existing.length + 1,
          status: 'in_progress',
          score: 0,
          correctCount: 0,
          wrongCount: 0,
          pendingReviewCount: 0,
          pointsEarned: 0,
          isBestAttempt: false,
          pointsAwarded: false,
        });
      } else {
        // Restore saved in-progress answers if any
        const prevAnswers = await quizStorage.getAttemptAnswers(att.id);
        const restored: UserAnswers = {};
        for (const a of prevAnswers) {
          restored[a.questionId] = a.selectedOptionId ?? a.answerText ?? '';
        }
        setAnswers(restored);
      }

      const activeQs = qs.filter(qu => qu.active);
      const finalQs = q.randomizeQuestions ? shuffle(activeQs) : activeQs;
      setQuiz(q);
      setQuestions(finalQs);
      setAttempt(att);
    } catch {
      toast.error('Failed to load quiz.');
    } finally {
      setLoading(false);
    }
  }, [quizId, currentUser, navigate]);

  useEffect(() => { void loadQuiz(); }, [loadQuiz]);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    if (!quiz || !attempt || !currentUser) return;
    if (submitting) return;

    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const ok = window.confirm(`You have ${unanswered.length} unanswered question${unanswered.length !== 1 ? 's' : ''}. Submit anyway?`);
      if (!ok) return;
    }

    try {
      setSubmitting(true);

      // Grade each question
      let correctCount = 0;
      let wrongCount = 0;
      let pendingReviewCount = 0;
      let pointsEarned = 0;
      const answerRecords: Omit<QuizAnswer, 'id'>[] = [];

      for (const q of questions) {
        const userAns = answers[q.id] ?? '';
        let isCorrect: boolean | undefined;
        let qPoints = 0;
        let needsManualReview = false;

        if (q.requiresManualReview) {
          needsManualReview = true;
          pendingReviewCount++;
        } else if (q.questionType === 'multiple_choice') {
          const correctOpt = q.options?.find(o => o.isCorrect);
          isCorrect = correctOpt ? correctOpt.id === userAns : false;
          if (isCorrect) { correctCount++; qPoints = q.points; pointsEarned += qPoints; }
          else if (userAns) wrongCount++;
        } else if (q.questionType === 'true_false') {
          const correct = q.correctAnswer?.toLowerCase() ?? '';
          isCorrect = userAns.toLowerCase() === correct;
          if (isCorrect) { correctCount++; qPoints = q.points; pointsEarned += qPoints; }
          else if (userAns) wrongCount++;
        } else if (q.questionType === 'fill_blank' || q.questionType === 'short_answer') {
          const correct = q.correctAnswer ?? '';
          const cmp = (s: string) => q.caseSensitive ? s.trim() : s.trim().toLowerCase();
          isCorrect = correct !== '' && cmp(userAns) === cmp(correct);
          if (isCorrect) { correctCount++; qPoints = q.points; pointsEarned += qPoints; }
          else if (userAns) wrongCount++;
        }

        const isMultiChoice = q.questionType === 'multiple_choice';
        answerRecords.push({
          attemptId: attempt.id,
          questionId: q.id,
          selectedOptionId: isMultiChoice ? userAns : undefined,
          answerText: !isMultiChoice ? userAns : undefined,
          isCorrect,
          pointsEarned: qPoints,
          needsManualReview,
        });
      }

      // Full-score bonus
      if (correctCount === questions.length && quiz.fullScoreBonusPoints > 0) {
        pointsEarned += quiz.fullScoreBonusPoints;
      }

      const totalPossible = questions.reduce((s, q) => s + q.points, 0);
      const score = totalPossible > 0 ? Math.round((pointsEarned / (totalPossible + quiz.fullScoreBonusPoints || totalPossible)) * 100) : 0;

      // Check minimum score threshold
      const meetsMinimum = score >= quiz.minimumScoreForPoints;

      // Best-attempt points delta
      const prevAttempts = await quizStorage.getParticipantQuizAttempts(currentUser.id, quizId!);
      const prevAwarded = prevAttempts
        .filter(a => a.pointsAwarded)
        .reduce((max, a) => Math.max(max, a.pointsEarned), 0);

      let pointsToAward = 0;
      if (meetsMinimum && pointsEarned > 0) {
        if (quiz.pointsMode === 'best_attempt') {
          pointsToAward = Math.max(0, pointsEarned - prevAwarded);
        } else if (quiz.pointsMode === 'first_attempt') {
          pointsToAward = prevAttempts.filter(a => a.pointsAwarded).length === 0 ? pointsEarned : 0;
        } else {
          pointsToAward = pointsEarned;
        }
      }

      // Update attempt
      const now = new Date().toISOString();
      await quizStorage.updateAttempt(attempt.id, {
        status: 'graded',
        submittedAt: now,
        score,
        correctCount,
        wrongCount,
        pendingReviewCount,
        pointsEarned,
        isBestAttempt: pointsEarned >= prevAwarded,
        pointsAwarded: pointsToAward > 0,
      });

      // Save all answers
      const savedAns = await Promise.all(answerRecords.map(a => quizStorage.saveAnswer(a)));

      // Award points via Hero Points ledger
      if (pointsToAward > 0) {
        try {
          await addAcceptedSubmission({
            participantId: currentUser.id,
            activityId: quiz.id, // quiz ID used as activityId; FK relaxed in migration
            note: `Completed "${quiz.title}" — ${correctCount}/${questions.length} correct`,
            pointsValueAtSubmission: pointsToAward,
            sourceType: 'quiz_reward',
          });
        } catch {
          // Non-fatal: points award failed; mark attempt as not awarded
          await quizStorage.updateAttempt(attempt.id, { pointsAwarded: false });
        }
      }

      const finalAttempt: QuizAttempt = {
        ...attempt,
        status: 'graded',
        submittedAt: now,
        score,
        correctCount,
        wrongCount,
        pendingReviewCount,
        pointsEarned,
        isBestAttempt: pointsEarned >= prevAwarded,
        pointsAwarded: pointsToAward > 0,
      };

      setResultAttempt(finalAttempt);
      setSavedAnswers(savedAns);
      setSubmitted(true);
    } catch (err) {
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <Card className="p-12 text-center max-w-md mx-auto">
        <p className="text-5xl mb-4">📭</p>
        <p className="font-semibold text-gray-700">This quiz has no questions yet.</p>
        <Button className="mt-4" onClick={() => navigate('/participant/quizzes')}>
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </Button>
      </Card>
    );
  }

  // ── Result screen ─────────────────────────────────────────────────────────────
  if (submitted && resultAttempt) {
    const pct = resultAttempt.score;
    const earned = resultAttempt.pointsEarned;
    const total = questions.length;
    const correct = resultAttempt.correctCount;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero result card */}
        <Card className="overflow-hidden">
          <div className={`px-6 py-8 text-center ${pct >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : pct >= 50 ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
            <p className="text-6xl mb-3">{pct >= 80 ? '🌟' : pct >= 50 ? '⭐' : '💪'}</p>
            <h2 className="text-2xl font-extrabold text-white mb-1">
              {pct >= 80 ? 'Amazing!' : pct >= 50 ? 'Good Job!' : 'Keep Trying!'}
            </h2>
            <p className="text-white/80 text-sm">{quiz.title}</p>
          </div>
          <div className="px-6 py-6 space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 rounded-2xl py-3">
                <p className="text-2xl font-bold text-blue-700">{pct}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Score</p>
              </div>
              <div className="bg-green-50 rounded-2xl py-3">
                <p className="text-2xl font-bold text-green-700">{correct}/{total}</p>
                <p className="text-xs text-gray-500 mt-0.5">Correct</p>
              </div>
              <div className="bg-yellow-50 rounded-2xl py-3">
                <p className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Star className="w-4 h-4" />{earned}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Hero Points</p>
              </div>
            </div>
            {resultAttempt.pointsAwarded && earned > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-sm font-medium text-green-700">
                  You earned <strong>{earned} Hero Points</strong> from this quiz!
                </p>
              </div>
            )}
            {resultAttempt.pendingReviewCount > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-700">
                ⏳ {resultAttempt.pendingReviewCount} answer{resultAttempt.pendingReviewCount !== 1 ? 's' : ''} need admin review before points are added.
              </div>
            )}
          </div>
        </Card>

        {/* Answer review */}
        {quiz.showAnswersAfterSubmit && savedAnswers.length > 0 && (
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-gray-700">📋 Answer Review</h3>
            {questions.map((q, i) => {
              const ans = savedAnswers.find(a => a.questionId === q.id);
              const isCorrect = ans?.isCorrect;
              const userText = ans?.answerText ?? (q.options?.find(o => o.id === ans?.selectedOptionId)?.optionText ?? '—');
              const correctText = q.questionType === 'multiple_choice'
                ? q.options?.find(o => o.isCorrect)?.optionText ?? '?'
                : q.correctAnswer ?? '?';

              return (
                <div key={q.id} className={`border rounded-2xl p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                  <div className="flex items-start gap-2">
                    {isCorrect
                      ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">Q{i + 1}. {q.questionText}</p>
                      <p className={`text-xs mt-1 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                        Your answer: {userText || '(no answer)'}
                      </p>
                      {!isCorrect && <p className="text-xs text-gray-500">Correct: {correctText}</p>}
                      {quiz.showExplanationsAfterSubmit && q.explanation && (
                        <p className="text-xs text-blue-600 mt-1 italic">💡 {q.explanation}</p>
                      )}
                    </div>
                    <span className={`text-xs font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                      {isCorrect ? `+${ans?.pointsEarned ?? 0}` : '0'} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/participant/quizzes')} className="flex-1">
            <ArrowLeft className="w-4 h-4" /> All Quizzes
          </Button>
          {quiz.allowRetries && (quiz.maxAttempts === 0 || (resultAttempt.attemptNumber ?? 1) < quiz.maxAttempts) && (
            <Button onClick={() => { setSubmitted(false); setResultAttempt(null); setAnswers({}); setCurrentIdx(0); void loadQuiz(); }} className="flex-1">
              Try Again
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── Quiz taking screen ────────────────────────────────────────────────────────
  const q = questions[currentIdx];
  if (!q) return null;

  const isFirst = currentIdx === 0;
  const isLast = currentIdx === questions.length - 1;
  const answered = answers[q.id] !== undefined && answers[q.id] !== '';
  const allAnswered = questions.every(qu => answers[qu.id]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/participant/quizzes')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <p className="font-bold text-gray-800">{quiz.title}</p>
          <p className="text-xs text-gray-400">Question {currentIdx + 1} of {questions.length}</p>
        </div>
        <div className="w-16" />
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <Card className="p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Q{currentIdx + 1}</span>
            <span className="text-xs text-gray-400 capitalize">{q.questionType.replace('_', ' ')}</span>
            <span className="text-xs text-yellow-600 ml-auto">+{q.points} pts</span>
          </div>
          <p className="text-base font-semibold text-gray-800">{q.questionText}</p>
          {q.hint && (
            <p className="text-xs text-blue-500 mt-2 italic">💡 Hint: {q.hint}</p>
          )}
        </div>

        {/* Multiple choice */}
        {q.questionType === 'multiple_choice' && q.options && (
          <div className="space-y-2">
            {(quiz.randomizeOptions ? shuffle(q.options) : q.options).map(opt => (
              <button
                key={opt.id}
                onClick={() => setAnswer(q.id, opt.id)}
                className={`w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all ${
                  answers[q.id] === opt.id
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                }`}
              >
                {opt.optionText}
              </button>
            ))}
          </div>
        )}

        {/* True / False */}
        {q.questionType === 'true_false' && (
          <div className="flex gap-3">
            {['true', 'false'].map(val => (
              <button
                key={val}
                onClick={() => setAnswer(q.id, val)}
                className={`flex-1 py-3 rounded-2xl border-2 font-bold capitalize text-sm transition-all ${
                  answers[q.id] === val
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-blue-300 text-gray-600'
                }`}
              >
                {val === 'true' ? '✅ True' : '❌ False'}
              </button>
            ))}
          </div>
        )}

        {/* Fill in the blank */}
        {q.questionType === 'fill_blank' && (
          <input
            type="text"
            value={answers[q.id] ?? ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            placeholder="Type your answer here…"
            className="w-full border-2 border-gray-200 focus:border-blue-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors"
          />
        )}

        {/* Short answer */}
        {q.questionType === 'short_answer' && (
          <textarea
            value={answers[q.id] ?? ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            placeholder="Write your answer here…"
            rows={3}
            className="w-full border-2 border-gray-200 focus:border-blue-400 rounded-2xl px-4 py-3 text-sm outline-none transition-colors resize-none"
          />
        )}

        {answered && <p className="text-xs text-green-500 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Answer saved</p>}
      </Card>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={isFirst}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        {!isLast ? (
          <Button onClick={() => setCurrentIdx(i => Math.min(questions.length - 1, i + 1))} className="flex-1">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={() => void handleSubmit()}
            loading={submitting}
            disabled={submitting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Checking answers…' : (<><Send className="w-4 h-4" /> Submit Quiz</>)}
          </Button>
        )}
      </div>

      {/* Quick nav dots */}
      <div className="flex gap-1.5 justify-center flex-wrap">
        {questions.map((qu, i) => (
          <button
            key={qu.id}
            onClick={() => setCurrentIdx(i)}
            className={`w-6 h-6 rounded-full text-xs font-bold transition-all ${
              i === currentIdx
                ? 'bg-blue-600 text-white scale-110'
                : answers[qu.id]
                ? 'bg-green-400 text-white'
                : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {allAnswered && isLast && (
        <p className="text-center text-xs text-green-600 font-medium">✅ All questions answered! Ready to submit.</p>
      )}
    </div>
  );
}
