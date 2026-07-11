import type { Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer } from '../types/quiz';
import { supabase, isSupabaseConfigured } from './supabase';
import { generateId } from './utils';

// ─── Mappers (Supabase snake_case → camelCase) ────────────────────────────────

const mapQuiz = (r: Record<string, unknown>): Quiz => ({
  id: r.id as string,
  title: r.title as string,
  description: (r.description as string) ?? undefined,
  subject: r.subject as Quiz['subject'],
  difficulty: r.difficulty as Quiz['difficulty'],
  status: r.status as Quiz['status'],
  availableDate: (r.available_date as string) ?? undefined,
  endDate: (r.end_date as string) ?? undefined,
  allowRetries: r.allow_retries as boolean,
  maxAttempts: r.max_attempts as number,
  pointsMode: r.points_mode as Quiz['pointsMode'],
  showAnswersAfterSubmit: r.show_answers_after_submit as boolean,
  showExplanationsAfterSubmit: r.show_explanations_after_submit as boolean,
  fullScoreBonusPoints: r.full_score_bonus_points as number,
  minimumScoreForPoints: r.minimum_score_for_points as number,
  timeLimitMinutes: (r.time_limit_minutes as number) ?? undefined,
  randomizeQuestions: r.randomize_questions as boolean,
  randomizeOptions: r.randomize_options as boolean,
  createdBy: r.created_by as string,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

const toQuizDb = (q: Partial<Quiz>) => {
  const o: Record<string, unknown> = {};
  if (q.id                          !== undefined) o.id                              = q.id;
  if (q.title                       !== undefined) o.title                           = q.title;
  if (q.description                 !== undefined) o.description                     = q.description;
  if (q.subject                     !== undefined) o.subject                         = q.subject;
  if (q.difficulty                  !== undefined) o.difficulty                      = q.difficulty;
  if (q.status                      !== undefined) o.status                          = q.status;
  if (q.availableDate               !== undefined) o.available_date                  = q.availableDate || null;
  if (q.endDate                     !== undefined) o.end_date                        = q.endDate || null;
  if (q.allowRetries                !== undefined) o.allow_retries                   = q.allowRetries;
  if (q.maxAttempts                 !== undefined) o.max_attempts                    = q.maxAttempts;
  if (q.pointsMode                  !== undefined) o.points_mode                     = q.pointsMode;
  if (q.showAnswersAfterSubmit      !== undefined) o.show_answers_after_submit       = q.showAnswersAfterSubmit;
  if (q.showExplanationsAfterSubmit !== undefined) o.show_explanations_after_submit  = q.showExplanationsAfterSubmit;
  if (q.fullScoreBonusPoints        !== undefined) o.full_score_bonus_points         = q.fullScoreBonusPoints;
  if (q.minimumScoreForPoints       !== undefined) o.minimum_score_for_points        = q.minimumScoreForPoints;
  if (q.timeLimitMinutes            !== undefined) o.time_limit_minutes              = q.timeLimitMinutes || null;
  if (q.randomizeQuestions          !== undefined) o.randomize_questions             = q.randomizeQuestions;
  if (q.randomizeOptions            !== undefined) o.randomize_options               = q.randomizeOptions;
  if (q.createdBy                   !== undefined) o.created_by                      = q.createdBy;
  if (q.createdAt                   !== undefined) o.created_at                      = q.createdAt;
  if (q.updatedAt                   !== undefined) o.updated_at                      = q.updatedAt;
  return o;
};

const mapQuestion = (r: Record<string, unknown>): QuizQuestion => ({
  id: r.id as string,
  quizId: r.quiz_id as string,
  questionText: r.question_text as string,
  questionType: r.question_type as QuizQuestion['questionType'],
  points: r.points as number,
  correctAnswer: (r.correct_answer as string) ?? undefined,
  explanation: (r.explanation as string) ?? undefined,
  hint: (r.hint as string) ?? undefined,
  imageUrl: (r.image_url as string) ?? undefined,
  orderIndex: r.order_index as number,
  active: r.active as boolean,
  requiresManualReview: r.requires_manual_review as boolean,
  allowPartialCredit: r.allow_partial_credit as boolean,
  caseSensitive: r.case_sensitive as boolean,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

const toQuestionDb = (q: Partial<QuizQuestion>) => {
  const o: Record<string, unknown> = {};
  if (q.id                   !== undefined) o.id                    = q.id;
  if (q.quizId               !== undefined) o.quiz_id               = q.quizId;
  if (q.questionText         !== undefined) o.question_text         = q.questionText;
  if (q.questionType         !== undefined) o.question_type         = q.questionType;
  if (q.points               !== undefined) o.points                = q.points;
  if (q.correctAnswer        !== undefined) o.correct_answer        = q.correctAnswer;
  if (q.explanation          !== undefined) o.explanation           = q.explanation;
  if (q.hint                 !== undefined) o.hint                  = q.hint;
  if (q.imageUrl             !== undefined) o.image_url             = q.imageUrl;
  if (q.orderIndex           !== undefined) o.order_index           = q.orderIndex;
  if (q.active               !== undefined) o.active                = q.active;
  if (q.requiresManualReview !== undefined) o.requires_manual_review = q.requiresManualReview;
  if (q.allowPartialCredit   !== undefined) o.allow_partial_credit  = q.allowPartialCredit;
  if (q.caseSensitive        !== undefined) o.case_sensitive        = q.caseSensitive;
  if (q.createdAt            !== undefined) o.created_at            = q.createdAt;
  if (q.updatedAt            !== undefined) o.updated_at            = q.updatedAt;
  return o;
};

const mapOption = (r: Record<string, unknown>): QuizOption => ({
  id: r.id as string,
  questionId: r.question_id as string,
  optionText: r.option_text as string,
  isCorrect: r.is_correct as boolean,
  orderIndex: r.order_index as number,
});

const toOptionDb = (o: Partial<QuizOption>) => {
  const out: Record<string, unknown> = {};
  if (o.id          !== undefined) out.id          = o.id;
  if (o.questionId  !== undefined) out.question_id = o.questionId;
  if (o.optionText  !== undefined) out.option_text = o.optionText;
  if (o.isCorrect   !== undefined) out.is_correct  = o.isCorrect;
  if (o.orderIndex  !== undefined) out.order_index = o.orderIndex;
  return out;
};

const mapAttempt = (r: Record<string, unknown>): QuizAttempt => ({
  id: r.id as string,
  quizId: r.quiz_id as string,
  participantId: r.participant_id as string,
  attemptNumber: r.attempt_number as number,
  status: r.status as QuizAttempt['status'],
  startedAt: r.started_at as string,
  submittedAt: (r.submitted_at as string) ?? undefined,
  score: r.score as number,
  correctCount: r.correct_count as number,
  wrongCount: r.wrong_count as number,
  pendingReviewCount: r.pending_review_count as number,
  pointsEarned: r.points_earned as number,
  isBestAttempt: r.is_best_attempt as boolean,
  pointsAwarded: r.points_awarded as boolean,
  timeSpentSeconds: (r.time_spent_seconds as number) ?? undefined,
});

const toAttemptDb = (a: Partial<QuizAttempt>) => {
  const o: Record<string, unknown> = {};
  if (a.id                 !== undefined) o.id                   = a.id;
  if (a.quizId             !== undefined) o.quiz_id              = a.quizId;
  if (a.participantId      !== undefined) o.participant_id       = a.participantId;
  if (a.attemptNumber      !== undefined) o.attempt_number       = a.attemptNumber;
  if (a.status             !== undefined) o.status               = a.status;
  if (a.startedAt          !== undefined) o.started_at           = a.startedAt;
  if (a.submittedAt        !== undefined) o.submitted_at         = a.submittedAt;
  if (a.score              !== undefined) o.score                = a.score;
  if (a.correctCount       !== undefined) o.correct_count        = a.correctCount;
  if (a.wrongCount         !== undefined) o.wrong_count          = a.wrongCount;
  if (a.pendingReviewCount !== undefined) o.pending_review_count = a.pendingReviewCount;
  if (a.pointsEarned       !== undefined) o.points_earned        = a.pointsEarned;
  if (a.isBestAttempt      !== undefined) o.is_best_attempt      = a.isBestAttempt;
  if (a.pointsAwarded      !== undefined) o.points_awarded       = a.pointsAwarded;
  if (a.timeSpentSeconds   !== undefined) o.time_spent_seconds   = a.timeSpentSeconds;
  return o;
};

const mapAnswer = (r: Record<string, unknown>): QuizAnswer => ({
  id: r.id as string,
  attemptId: r.attempt_id as string,
  questionId: r.question_id as string,
  selectedOptionId: (r.selected_option_id as string) ?? undefined,
  answerText: (r.answer_text as string) ?? undefined,
  isCorrect: (r.is_correct as boolean) ?? undefined,
  pointsEarned: r.points_earned as number,
  needsManualReview: r.needs_manual_review as boolean,
  adminFeedback: (r.admin_feedback as string) ?? undefined,
});

const toAnswerDb = (a: Partial<QuizAnswer>) => {
  const o: Record<string, unknown> = {};
  if (a.id                !== undefined) o.id                  = a.id;
  if (a.attemptId         !== undefined) o.attempt_id          = a.attemptId;
  if (a.questionId        !== undefined) o.question_id         = a.questionId;
  if (a.selectedOptionId  !== undefined) o.selected_option_id  = a.selectedOptionId;
  if (a.answerText        !== undefined) o.answer_text         = a.answerText;
  if (a.isCorrect         !== undefined) o.is_correct          = a.isCorrect;
  if (a.pointsEarned      !== undefined) o.points_earned       = a.pointsEarned;
  if (a.needsManualReview !== undefined) o.needs_manual_review = a.needsManualReview;
  if (a.adminFeedback     !== undefined) o.admin_feedback      = a.adminFeedback;
  return o;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function isQuizActive(q: Quiz): boolean {
  if (q.status !== 'active') return false;
  const today = new Date().toISOString().slice(0, 10);
  if (q.availableDate && q.availableDate > today) return false;
  if (q.endDate && q.endDate < today) return false;
  return true;
}

// ─── LS keys ──────────────────────────────────────────────────────────────────

const LS = {
  quizzes:   'sp_quizzes',
  questions: 'sp_quiz_questions',
  options:   'sp_quiz_options',
  attempts:  'sp_quiz_attempts',
  answers:   'sp_quiz_answers',
};

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}
function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── localStorage store ───────────────────────────────────────────────────────

const localQuizStore = {
  getQuizzes: async (): Promise<Quiz[]> => lsGet<Quiz>(LS.quizzes),

  getActiveQuizzes: async (): Promise<Quiz[]> =>
    lsGet<Quiz>(LS.quizzes).filter(isQuizActive),

  getQuiz: async (id: string): Promise<Quiz | null> =>
    lsGet<Quiz>(LS.quizzes).find(q => q.id === id) ?? null,

  createQuiz: async (q: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quiz> => {
    const now = new Date().toISOString();
    const quiz: Quiz = { ...q, id: generateId(), createdAt: now, updatedAt: now };
    lsSet(LS.quizzes, [...lsGet<Quiz>(LS.quizzes), quiz]);
    return quiz;
  },

  updateQuiz: async (id: string, data: Partial<Quiz>): Promise<void> => {
    const list = lsGet<Quiz>(LS.quizzes);
    lsSet(LS.quizzes, list.map(q => q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q));
  },

  deleteQuiz: async (id: string): Promise<void> => {
    lsSet(LS.quizzes, lsGet<Quiz>(LS.quizzes).filter(q => q.id !== id));
    // cascade: questions → options handled by deleting questions
    const questions = lsGet<QuizQuestion>(LS.questions).filter(q => q.quizId === id);
    const questionIds = questions.map(q => q.id);
    lsSet(LS.questions, lsGet<QuizQuestion>(LS.questions).filter(q => q.quizId !== id));
    lsSet(LS.options, lsGet<QuizOption>(LS.options).filter(o => !questionIds.includes(o.questionId)));
    // cascade: attempts → answers
    const attempts = lsGet<QuizAttempt>(LS.attempts).filter(a => a.quizId === id);
    const attemptIds = attempts.map(a => a.id);
    lsSet(LS.attempts, lsGet<QuizAttempt>(LS.attempts).filter(a => a.quizId !== id));
    lsSet(LS.answers, lsGet<QuizAnswer>(LS.answers).filter(a => !attemptIds.includes(a.attemptId)));
  },

  getQuizQuestions: async (quizId: string): Promise<QuizQuestion[]> => {
    const questions = lsGet<QuizQuestion>(LS.questions)
      .filter(q => q.quizId === quizId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const options = lsGet<QuizOption>(LS.options);
    return questions.map(q => ({
      ...q,
      options: options.filter(o => o.questionId === q.id).sort((a, b) => a.orderIndex - b.orderIndex),
    }));
  },

  createQuestion: async (q: Omit<QuizQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuizQuestion> => {
    const now = new Date().toISOString();
    const question: QuizQuestion = { ...q, id: generateId(), createdAt: now, updatedAt: now };
    lsSet(LS.questions, [...lsGet<QuizQuestion>(LS.questions), question]);
    return question;
  },

  updateQuestion: async (id: string, data: Partial<QuizQuestion>): Promise<void> => {
    const list = lsGet<QuizQuestion>(LS.questions);
    lsSet(LS.questions, list.map(q => q.id === id ? { ...q, ...data, updatedAt: new Date().toISOString() } : q));
  },

  deleteQuestion: async (id: string): Promise<void> => {
    lsSet(LS.questions, lsGet<QuizQuestion>(LS.questions).filter(q => q.id !== id));
    lsSet(LS.options, lsGet<QuizOption>(LS.options).filter(o => o.questionId !== id));
  },

  createOption: async (o: Omit<QuizOption, 'id'>): Promise<QuizOption> => {
    const option: QuizOption = { ...o, id: generateId() };
    lsSet(LS.options, [...lsGet<QuizOption>(LS.options), option]);
    return option;
  },

  updateOption: async (id: string, data: Partial<QuizOption>): Promise<void> => {
    lsSet(LS.options, lsGet<QuizOption>(LS.options).map(o => o.id === id ? { ...o, ...data } : o));
  },

  deleteOption: async (id: string): Promise<void> => {
    lsSet(LS.options, lsGet<QuizOption>(LS.options).filter(o => o.id !== id));
  },

  deleteOptionsForQuestion: async (questionId: string): Promise<void> => {
    lsSet(LS.options, lsGet<QuizOption>(LS.options).filter(o => o.questionId !== questionId));
  },

  getAttempts: async (quizId: string): Promise<QuizAttempt[]> =>
    lsGet<QuizAttempt>(LS.attempts).filter(a => a.quizId === quizId),

  getParticipantAttempts: async (participantId: string): Promise<QuizAttempt[]> =>
    lsGet<QuizAttempt>(LS.attempts).filter(a => a.participantId === participantId),

  getParticipantQuizAttempts: async (participantId: string, quizId: string): Promise<QuizAttempt[]> =>
    lsGet<QuizAttempt>(LS.attempts).filter(a => a.participantId === participantId && a.quizId === quizId),

  createAttempt: async (a: Omit<QuizAttempt, 'id' | 'startedAt'>): Promise<QuizAttempt> => {
    const attempt: QuizAttempt = { ...a, id: generateId(), startedAt: new Date().toISOString() };
    lsSet(LS.attempts, [...lsGet<QuizAttempt>(LS.attempts), attempt]);
    return attempt;
  },

  updateAttempt: async (id: string, data: Partial<QuizAttempt>): Promise<void> => {
    lsSet(LS.attempts, lsGet<QuizAttempt>(LS.attempts).map(a => a.id === id ? { ...a, ...data } : a));
  },

  saveAnswer: async (a: Omit<QuizAnswer, 'id'>): Promise<QuizAnswer> => {
    const answer: QuizAnswer = { ...a, id: generateId() };
    lsSet(LS.answers, [...lsGet<QuizAnswer>(LS.answers), answer]);
    return answer;
  },

  getAttemptAnswers: async (attemptId: string): Promise<QuizAnswer[]> =>
    lsGet<QuizAnswer>(LS.answers).filter(a => a.attemptId === attemptId),

  updateAnswer: async (id: string, data: Partial<QuizAnswer>): Promise<void> => {
    lsSet(LS.answers, lsGet<QuizAnswer>(LS.answers).map(a => a.id === id ? { ...a, ...data } : a));
  },
};

// ─── Supabase store ───────────────────────────────────────────────────────────

// Thrown when quiz tables don't exist yet (migration 015 not run).
export class QuizMigrationNeededError extends Error {
  constructor() {
    super('Quiz tables not found. Run supabase/migrations/015_daily_quizzes.sql in your Supabase SQL Editor.');
    this.name = 'QuizMigrationNeededError';
  }
}

function isMissingTable(error: { code?: string; message?: string }): boolean {
  const code = error.code ?? '';
  const msg  = error.message ?? '';
  return code === '42P01' || code === 'PGRST205'
    || msg.includes('does not exist')
    || msg.includes('schema cache');
}

function handleMissing(error: { code?: string; message?: string }): never {
  if (isMissingTable(error)) throw new QuizMigrationNeededError();
  throw error;
}

const supabaseQuizStore = {
  getQuizzes: async (): Promise<Quiz[]> => {
    const { data, error } = await supabase!.from('quizzes').select('*').order('created_at', { ascending: false });
    if (error) { handleMissing(error); }
    return (data ?? []).map(r => mapQuiz(r as Record<string, unknown>));
  },

  getActiveQuizzes: async (): Promise<Quiz[]> => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase!
      .from('quizzes')
      .select('*')
      .eq('status', 'active')
      .or(`available_date.is.null,available_date.lte.${today}`)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('created_at', { ascending: false });
    if (error) { handleMissing(error); }
    return (data ?? []).map(r => mapQuiz(r as Record<string, unknown>));
  },

  getQuiz: async (id: string): Promise<Quiz | null> => {
    const { data, error } = await supabase!.from('quizzes').select('*').eq('id', id).single();
    if (error) return null;
    return data ? mapQuiz(data as Record<string, unknown>) : null;
  },

  createQuiz: async (q: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quiz> => {
    const now = new Date().toISOString();
    const row = toQuizDb({ ...q, createdAt: now, updatedAt: now });
    const { data, error } = await supabase!.from('quizzes').insert(row).select().single();
    if (error) throw error;
    return mapQuiz(data as Record<string, unknown>);
  },

  updateQuiz: async (id: string, data: Partial<Quiz>): Promise<void> => {
    const { error } = await supabase!.from('quizzes').update({ ...toQuizDb(data), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  deleteQuiz: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('quizzes').delete().eq('id', id);
    if (error) throw error;
  },

  getQuizQuestions: async (quizId: string): Promise<QuizQuestion[]> => {
    const { data: qData, error: qErr } = await supabase!
      .from('quiz_questions').select('*').eq('quiz_id', quizId).order('order_index');
    if (qErr) { handleMissing(qErr); }
    const questions = (qData ?? []).map(r => mapQuestion(r as Record<string, unknown>));
    if (questions.length === 0) return [];
    const qIds = questions.map(q => q.id);
    const { data: oData, error: oErr } = await supabase!
      .from('quiz_options').select('*').in('question_id', qIds).order('order_index');
    if (oErr) throw oErr;
    const options = (oData ?? []).map(r => mapOption(r as Record<string, unknown>));
    return questions.map(q => ({ ...q, options: options.filter(o => o.questionId === q.id) }));
  },

  createQuestion: async (q: Omit<QuizQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuizQuestion> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase!.from('quiz_questions').insert(toQuestionDb({ ...q, createdAt: now, updatedAt: now })).select().single();
    if (error) throw error;
    return mapQuestion(data as Record<string, unknown>);
  },

  updateQuestion: async (id: string, data: Partial<QuizQuestion>): Promise<void> => {
    const { error } = await supabase!.from('quiz_questions').update({ ...toQuestionDb(data), updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('quiz_questions').delete().eq('id', id);
    if (error) throw error;
  },

  createOption: async (o: Omit<QuizOption, 'id'>): Promise<QuizOption> => {
    const { data, error } = await supabase!.from('quiz_options').insert(toOptionDb(o)).select().single();
    if (error) throw error;
    return mapOption(data as Record<string, unknown>);
  },

  updateOption: async (id: string, data: Partial<QuizOption>): Promise<void> => {
    const { error } = await supabase!.from('quiz_options').update(toOptionDb(data)).eq('id', id);
    if (error) throw error;
  },

  deleteOption: async (id: string): Promise<void> => {
    const { error } = await supabase!.from('quiz_options').delete().eq('id', id);
    if (error) throw error;
  },

  deleteOptionsForQuestion: async (questionId: string): Promise<void> => {
    const { error } = await supabase!.from('quiz_options').delete().eq('question_id', questionId);
    if (error) throw error;
  },

  getAttempts: async (quizId: string): Promise<QuizAttempt[]> => {
    const { data, error } = await supabase!.from('quiz_attempts').select('*').eq('quiz_id', quizId).order('started_at', { ascending: false });
    if (error) { handleMissing(error); }
    return (data ?? []).map(r => mapAttempt(r as Record<string, unknown>));
  },

  getParticipantAttempts: async (participantId: string): Promise<QuizAttempt[]> => {
    const { data, error } = await supabase!.from('quiz_attempts').select('*').eq('participant_id', participantId).order('started_at', { ascending: false });
    if (error) { handleMissing(error); }
    return (data ?? []).map(r => mapAttempt(r as Record<string, unknown>));
  },

  getParticipantQuizAttempts: async (participantId: string, quizId: string): Promise<QuizAttempt[]> => {
    const { data, error } = await supabase!.from('quiz_attempts').select('*').eq('participant_id', participantId).eq('quiz_id', quizId).order('attempt_number');
    if (error) { handleMissing(error); }
    return (data ?? []).map(r => mapAttempt(r as Record<string, unknown>));
  },

  createAttempt: async (a: Omit<QuizAttempt, 'id' | 'startedAt'>): Promise<QuizAttempt> => {
    const { data, error } = await supabase!.from('quiz_attempts').insert(toAttemptDb({ ...a, startedAt: new Date().toISOString() })).select().single();
    if (error) throw error;
    return mapAttempt(data as Record<string, unknown>);
  },

  updateAttempt: async (id: string, data: Partial<QuizAttempt>): Promise<void> => {
    const { error } = await supabase!.from('quiz_attempts').update(toAttemptDb(data)).eq('id', id);
    if (error) throw error;
  },

  saveAnswer: async (a: Omit<QuizAnswer, 'id'>): Promise<QuizAnswer> => {
    const { data, error } = await supabase!.from('quiz_answers').insert(toAnswerDb(a)).select().single();
    if (error) throw error;
    return mapAnswer(data as Record<string, unknown>);
  },

  getAttemptAnswers: async (attemptId: string): Promise<QuizAnswer[]> => {
    const { data, error } = await supabase!.from('quiz_answers').select('*').eq('attempt_id', attemptId);
    if (error) { handleMissing(error); }
    return (data ?? []).map(r => mapAnswer(r as Record<string, unknown>));
  },

  updateAnswer: async (id: string, data: Partial<QuizAnswer>): Promise<void> => {
    const { error } = await supabase!.from('quiz_answers').update(toAnswerDb(data)).eq('id', id);
    if (error) throw error;
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────
export const quizStorage = isSupabaseConfigured ? supabaseQuizStore : localQuizStore;
