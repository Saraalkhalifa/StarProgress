export type QuizStatus = 'draft' | 'active' | 'closed' | 'archived' | 'hidden';
export type QuizSubject = 'math' | 'science' | 'english';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer';
export type PointsMode = 'best_attempt' | 'first_attempt' | 'every_attempt';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  subject: QuizSubject;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  availableDate?: string;
  endDate?: string;
  allowRetries: boolean;
  maxAttempts: number;
  pointsMode: PointsMode;
  showAnswersAfterSubmit: boolean;
  showExplanationsAfterSubmit: boolean;
  fullScoreBonusPoints: number;
  minimumScoreForPoints: number;
  timeLimitMinutes?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
  totalPoints?: number;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: QuestionType;
  points: number;
  correctAnswer?: string;
  explanation?: string;
  hint?: string;
  imageUrl?: string;
  orderIndex: number;
  active: boolean;
  requiresManualReview: boolean;
  allowPartialCredit: boolean;
  caseSensitive: boolean;
  createdAt: string;
  updatedAt: string;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  participantId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  pendingReviewCount: number;
  pointsEarned: number;
  isBestAttempt: boolean;
  pointsAwarded: boolean;
  timeSpentSeconds?: number;
  quizTitle?: string;
  quizSubject?: QuizSubject;
  quizDifficulty?: QuizDifficulty;
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  isCorrect?: boolean;
  pointsEarned: number;
  needsManualReview: boolean;
  adminFeedback?: string;
}
