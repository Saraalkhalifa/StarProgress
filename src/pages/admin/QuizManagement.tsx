import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Copy, Archive, Power, Eye, ChevronLeft, Save, BookOpen, BarChart2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, toast } from '../../components/ui';
import { quizStorage, QuizMigrationNeededError } from '../../lib/quizStorage';
import type {
  Quiz, QuizQuestion, QuizOption,
  QuizSubject, QuizDifficulty, QuizStatus, QuestionType,
} from '../../types/quiz';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_OPTS: { value: QuizSubject; label: string; icon: string }[] = [
  { value: 'math',    label: 'Math',    icon: '🔢' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'english', label: 'English', icon: '📚' },
];

const DIFFICULTY_OPTS: { value: QuizDifficulty; label: string }[] = [
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
];

const STATUS_COLORS: Record<QuizStatus, string> = {
  draft:    'bg-gray-100 text-gray-700',
  active:   'bg-green-100 text-green-700',
  closed:   'bg-yellow-100 text-yellow-700',
  archived: 'bg-red-100 text-red-700',
  hidden:   'bg-gray-100 text-gray-500',
};

const QTYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: 'Multiple Choice',
  true_false:      'True / False',
  fill_blank:      'Fill in the Blank',
  short_answer:    'Short Answer',
};

// ─── Default form values ──────────────────────────────────────────────────────

const defaultQuizForm = (): Omit<Quiz, 'id' | 'createdAt' | 'updatedAt' | 'questionCount' | 'totalPoints'> => ({
  title: '',
  description: '',
  subject: 'math',
  difficulty: 'medium',
  status: 'draft',
  availableDate: '',
  endDate: '',
  allowRetries: true,
  maxAttempts: 3,
  pointsMode: 'best_attempt',
  showAnswersAfterSubmit: false,
  showExplanationsAfterSubmit: false,
  fullScoreBonusPoints: 0,
  minimumScoreForPoints: 0,
  timeLimitMinutes: 0,
  randomizeQuestions: false,
  randomizeOptions: false,
  createdBy: '',
});

interface QuestionFormState {
  questionText: string;
  questionType: QuestionType;
  points: number;
  correctAnswer: string;
  explanation: string;
  hint: string;
  caseSensitive: boolean;
  requiresManualReview: boolean;
  options: { text: string; isCorrect: boolean }[];
}

const defaultQForm = (): QuestionFormState => ({
  questionText: '',
  questionType: 'multiple_choice',
  points: 1,
  correctAnswer: '',
  explanation: '',
  hint: '',
  caseSensitive: false,
  requiresManualReview: false,
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-gray-700 mb-1">{children}</label>;
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 mt-6 border-t pt-4">{children}</h3>;
}

// ─── QuestionForm ─────────────────────────────────────────────────────────────

interface QuestionFormProps {
  initial?: QuestionFormState;
  onSave: (form: QuestionFormState) => Promise<void>;
  onCancel: () => void;
}

function QuestionForm({ initial, onSave, onCancel }: QuestionFormProps) {
  const [form, setForm] = useState<QuestionFormState>(initial ?? defaultQForm());
  const [saving, setSaving] = useState(false);

  const setField = <K extends keyof QuestionFormState>(k: K, v: QuestionFormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const setOption = (i: number, text: string) =>
    setForm(f => { const opts = [...f.options]; opts[i] = { ...opts[i], text }; return { ...f, options: opts }; });

  const setCorrect = (i: number) =>
    setForm(f => ({ ...f, options: f.options.map((o, idx) => ({ ...o, isCorrect: idx === i })) }));

  const addOption = () =>
    setForm(f => f.options.length < 6 ? { ...f, options: [...f.options, { text: '', isCorrect: false }] } : f);

  const removeOption = (i: number) =>
    setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  async function handleSave() {
    if (!form.questionText.trim()) { toast.error('Question text is required.'); return; }
    if (form.questionType === 'multiple_choice') {
      if (form.options.length < 2) { toast.error('Need at least 2 options.'); return; }
      if (form.options.some(o => !o.text.trim())) { toast.error('All options need text.'); return; }
      if (!form.options.some(o => o.isCorrect)) { toast.error('Mark one option as correct.'); return; }
    }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }

  return (
    <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/40 space-y-4">
      <FieldRow>
        <Label>Question Type</Label>
        <select
          value={form.questionType}
          onChange={e => setField('questionType', e.target.value as QuestionType)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          {Object.entries(QTYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </FieldRow>

      <FieldRow>
        <Label>Question Text *</Label>
        <textarea
          value={form.questionText}
          onChange={e => setField('questionText', e.target.value)}
          rows={2}
          placeholder={form.questionType === 'fill_blank' ? 'e.g. The capital of Saudi Arabia is ____.' : 'Enter question…'}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white"
        />
        {form.questionType === 'fill_blank' && (
          <p className="text-xs text-blue-500 mt-1">Use ____ to mark the blank in the question.</p>
        )}
      </FieldRow>

      <div className="flex gap-3">
        <FieldRow>
          <Label>Points</Label>
          <input
            type="number" min={1} max={100}
            value={form.points}
            onChange={e => setField('points', Math.max(1, parseInt(e.target.value) || 1))}
            className="w-24 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          />
        </FieldRow>
      </div>

      {/* Multiple choice options */}
      {form.questionType === 'multiple_choice' && (
        <FieldRow>
          <Label>Answer Options</Label>
          <div className="space-y-2">
            {form.options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="radio"
                  name="correct"
                  checked={opt.isCorrect}
                  onChange={() => setCorrect(i)}
                  title="Mark as correct"
                  className="w-4 h-4 text-blue-600"
                />
                <input
                  value={opt.text}
                  onChange={e => setOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
                {form.options.length > 2 && (
                  <button onClick={() => removeOption(i)} className="p-1.5 text-red-400 hover:text-red-600">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {form.options.length < 6 && (
            <button onClick={addOption} className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add option
            </button>
          )}
          <p className="text-xs text-gray-400 mt-1">Click the radio button to mark the correct answer.</p>
        </FieldRow>
      )}

      {/* True / False */}
      {form.questionType === 'true_false' && (
        <FieldRow>
          <Label>Correct Answer</Label>
          <div className="flex gap-3">
            {['true', 'false'].map(val => (
              <button
                key={val}
                onClick={() => setField('correctAnswer', val)}
                className={`flex-1 py-2 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                  form.correctAnswer === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {val === 'true' ? '✅ True' : '❌ False'}
              </button>
            ))}
          </div>
        </FieldRow>
      )}

      {/* Fill blank / Short answer */}
      {(form.questionType === 'fill_blank' || form.questionType === 'short_answer') && (
        <>
          <FieldRow>
            <Label>Accepted Answer {form.questionType === 'short_answer' && !form.requiresManualReview ? '*' : '(optional)'}</Label>
            <input
              value={form.correctAnswer}
              onChange={e => setField('correctAnswer', e.target.value)}
              placeholder="Enter accepted answer…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
            />
          </FieldRow>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.caseSensitive}
                onChange={e => setField('caseSensitive', e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Case sensitive
            </label>
            {form.questionType === 'short_answer' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresManualReview}
                  onChange={e => setField('requiresManualReview', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                Requires admin review
              </label>
            )}
          </div>
        </>
      )}

      {/* Optional fields */}
      <FieldRow>
        <Label>Explanation (shown after submit if enabled)</Label>
        <textarea
          value={form.explanation}
          onChange={e => setField('explanation', e.target.value)}
          rows={2}
          placeholder="Why is this the correct answer?"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none bg-white"
        />
      </FieldRow>
      <FieldRow>
        <Label>Hint (optional)</Label>
        <input
          value={form.hint}
          onChange={e => setField('hint', e.target.value)}
          placeholder="Give participants a hint…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
      </FieldRow>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={() => void handleSave()} loading={saving} className="flex-1">
          <Save className="w-4 h-4" /> Save Question
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type ViewMode = 'list' | 'create' | 'edit';

export function QuizManagement() {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizForm, setQuizForm] = useState(defaultQuizForm());
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showQForm, setShowQForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterSubject, setFilterSubject] = useState<QuizSubject | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<QuizStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setMigrationNeeded(false);
      const all = await quizStorage.getQuizzes();
      setQuizzes(all);
      const counts: Record<string, number> = {};
      await Promise.all(all.map(async q => {
        const atts = await quizStorage.getAttempts(q.id);
        counts[q.id] = atts.length;
      }));
      setAttemptCounts(counts);
    } catch (err) {
      if (err instanceof QuizMigrationNeededError) {
        setMigrationNeeded(true);
      } else {
        toast.error('Failed to load quizzes.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadQuizzes(); }, [loadQuizzes]);

  async function loadQuestions(quizId: string) {
    const qs = await quizStorage.getQuizQuestions(quizId);
    setQuestions(qs);
  }

  function openCreate() {
    setEditingQuiz(null);
    setQuizForm({ ...defaultQuizForm(), createdBy: currentUser?.id ?? '' });
    setQuestions([]);
    setShowQForm(false);
    setViewMode('create');
  }

  async function openEdit(quiz: Quiz) {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title,
      description: quiz.description ?? '',
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      status: quiz.status,
      availableDate: quiz.availableDate ?? '',
      endDate: quiz.endDate ?? '',
      allowRetries: quiz.allowRetries,
      maxAttempts: quiz.maxAttempts,
      pointsMode: quiz.pointsMode,
      showAnswersAfterSubmit: quiz.showAnswersAfterSubmit,
      showExplanationsAfterSubmit: quiz.showExplanationsAfterSubmit,
      fullScoreBonusPoints: quiz.fullScoreBonusPoints,
      minimumScoreForPoints: quiz.minimumScoreForPoints,
      timeLimitMinutes: quiz.timeLimitMinutes ?? 0,
      randomizeQuestions: quiz.randomizeQuestions,
      randomizeOptions: quiz.randomizeOptions,
      createdBy: quiz.createdBy,
    });
    setShowQForm(false);
    setViewMode('edit');
    await loadQuestions(quiz.id);
  }

  async function saveQuiz() {
    if (!quizForm.title.trim()) { toast.error('Quiz title is required.'); return; }
    if (quizForm.status === 'active' && viewMode === 'edit' && questions.length === 0) {
      toast.error('Cannot activate a quiz with no questions.'); return;
    }
    setSavingQuiz(true);
    try {
      const payload = {
        ...quizForm,
        availableDate: quizForm.availableDate || undefined,
        endDate: quizForm.endDate || undefined,
        timeLimitMinutes: quizForm.timeLimitMinutes || undefined,
      };
      if (viewMode === 'edit' && editingQuiz) {
        await quizStorage.updateQuiz(editingQuiz.id, payload);
        toast.success('Quiz updated!');
      } else {
        const created = await quizStorage.createQuiz({ ...payload, createdBy: currentUser?.id ?? '' });
        setEditingQuiz(created);
        setViewMode('edit');
        toast.success('Quiz created! Now add questions below.');
      }
      await loadQuizzes();
    } catch {
      toast.error('Failed to save quiz.');
    } finally {
      setSavingQuiz(false);
    }
  }

  async function handleAddQuestion(form: QuestionFormState) {
    if (!editingQuiz) { toast.error('Save the quiz first before adding questions.'); return; }
    const q = await quizStorage.createQuestion({
      quizId: editingQuiz.id,
      questionText: form.questionText,
      questionType: form.questionType,
      points: form.points,
      correctAnswer: form.questionType === 'multiple_choice'
        ? form.options.find(o => o.isCorrect)?.text ?? ''
        : form.correctAnswer,
      explanation: form.explanation || undefined,
      hint: form.hint || undefined,
      orderIndex: questions.length,
      active: true,
      requiresManualReview: form.requiresManualReview,
      allowPartialCredit: false,
      caseSensitive: form.caseSensitive,
    });

    if (form.questionType === 'multiple_choice') {
      await Promise.all(form.options.map((o, i) =>
        quizStorage.createOption({ questionId: q.id, optionText: o.text, isCorrect: o.isCorrect, orderIndex: i })
      ));
    }
    await loadQuestions(editingQuiz.id);
    setShowQForm(false);
    toast.success('Question added!');
  }

  async function handleDeleteQuestion(qId: string) {
    await quizStorage.deleteQuestion(qId);
    if (editingQuiz) await loadQuestions(editingQuiz.id);
    toast.success('Question deleted.');
  }

  async function handleToggleStatus(quiz: Quiz) {
    const newStatus: QuizStatus = quiz.status === 'active' ? 'draft' : 'active';
    if (newStatus === 'active') {
      const qs = await quizStorage.getQuizQuestions(quiz.id);
      if (qs.length === 0) { toast.error('Cannot activate a quiz with no questions.'); return; }
    }
    await quizStorage.updateQuiz(quiz.id, { status: newStatus });
    await loadQuizzes();
    toast.success(newStatus === 'active' ? 'Quiz activated!' : 'Quiz set to draft.');
  }

  async function handleArchive(quiz: Quiz) {
    await quizStorage.updateQuiz(quiz.id, { status: 'archived' });
    await loadQuizzes();
    toast.success('Quiz archived.');
  }

  async function handleDuplicate(quiz: Quiz) {
    const qs = await quizStorage.getQuizQuestions(quiz.id);
    const newQuiz = await quizStorage.createQuiz({
      ...quiz,
      title: `${quiz.title} (Copy)`,
      status: 'draft',
      createdBy: currentUser?.id ?? quiz.createdBy,
    });
    for (const q of qs) {
      const newQ = await quizStorage.createQuestion({
        ...q,
        quizId: newQuiz.id,
        orderIndex: q.orderIndex,
      });
      if (q.options) {
        await Promise.all(q.options.map((o, i) =>
          quizStorage.createOption({ questionId: newQ.id, optionText: o.optionText, isCorrect: o.isCorrect, orderIndex: i })
        ));
      }
    }
    await loadQuizzes();
    toast.success('Quiz duplicated as draft!');
  }

  async function handleDelete(quizId: string) {
    await quizStorage.deleteQuiz(quizId);
    setConfirmDelete(null);
    if (viewMode === 'edit' && editingQuiz?.id === quizId) setViewMode('list');
    await loadQuizzes();
    toast.success('Quiz deleted.');
  }

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filteredQuizzes = quizzes.filter(q => {
    if (filterSubject !== 'all' && q.subject !== filterSubject) return false;
    if (filterStatus !== 'all' && q.status !== filterStatus) return false;
    if (searchTerm && !q.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // ── List view ─────────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Quiz Management</h1>
              <p className="text-xs text-gray-400">{quizzes.length} quizzes total</p>
            </div>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" /> Create Quiz</Button>
        </div>

        {migrationNeeded && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800">Database migration required</p>
              <p className="text-sm text-amber-700 mt-1">
                The quiz tables don't exist yet in your Supabase database. Run{' '}
                <code className="bg-amber-100 px-1 rounded font-mono text-xs">supabase/migrations/015_daily_quizzes.sql</code>{' '}
                in your Supabase SQL Editor to enable this feature.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="px-4 py-3 flex flex-wrap gap-3 items-center">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="🔍 Search quizzes…"
            className="flex-1 min-w-36 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value as QuizSubject | 'all')}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none bg-white">
            <option value="all">All Subjects</option>
            {SUBJECT_OPTS.map(s => <option key={s.value} value={s.value}>{s.icon} {s.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as QuizStatus | 'all')}
            className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none bg-white">
            <option value="all">All Statuses</option>
            {(['draft','active','closed','archived','hidden'] as QuizStatus[]).map(s =>
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            )}
          </select>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-gray-700">No quizzes found.</p>
            <Button className="mt-4" onClick={openCreate}><Plus className="w-4 h-4" /> Create your first quiz</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredQuizzes.map(quiz => {
              const sm = SUBJECT_OPTS.find(s => s.value === quiz.subject);
              return (
                <Card key={quiz.id} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                  <span className="text-2xl">{sm?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800">{quiz.title}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[quiz.status]}`}>
                        {quiz.status}
                      </span>
                      <span className="text-xs text-gray-400">{sm?.label} · {quiz.difficulty}</span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-gray-400">
                      <span>📝 {quiz.questionCount ?? '?'} questions</span>
                      <span>👥 {attemptCounts[quiz.id] ?? 0} attempts</span>
                      <span>📅 {new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => void handleToggleStatus(quiz)}
                      title={quiz.status === 'active' ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg transition-colors ${quiz.status === 'active' ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => void openEdit(quiz)} title="Edit" className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => void handleDuplicate(quiz)} title="Duplicate" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button onClick={() => void handleArchive(quiz)} title="Archive" className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-50 transition-colors">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(quiz.id)} title="Delete" className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Confirm delete modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <Card className="p-6 max-w-sm w-full text-center">
              <p className="text-3xl mb-3">🗑️</p>
              <p className="font-bold text-gray-800 mb-2">Delete this quiz?</p>
              <p className="text-sm text-gray-500 mb-4">All questions, options, and attempt history will be deleted. This cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1">Cancel</Button>
                <Button variant="danger" onClick={() => void handleDelete(confirmDelete)} className="flex-1">Delete</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // ── Create / Edit view ────────────────────────────────────────────────────────
  const setF = <K extends keyof typeof quizForm>(k: K, v: typeof quizForm[K]) =>
    setQuizForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setViewMode('list')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          {viewMode === 'create' ? '➕ Create New Quiz' : `✏️ Edit: ${editingQuiz?.title}`}
        </h1>
      </div>

      <Card className="p-6">
        {/* Section 1: Quiz Info */}
        <SectionTitle>Quiz Information</SectionTitle>

        <FieldRow>
          <Label>Quiz Title *</Label>
          <input
            value={quizForm.title}
            onChange={e => setF('title', e.target.value)}
            placeholder="e.g. Today's Math Challenge"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </FieldRow>

        <FieldRow>
          <Label>Description</Label>
          <textarea
            value={quizForm.description}
            onChange={e => setF('description', e.target.value)}
            rows={2}
            placeholder="Optional description for participants…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </FieldRow>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FieldRow>
            <Label>Subject</Label>
            <div className="flex flex-col gap-1.5">
              {SUBJECT_OPTS.map(s => (
                <label key={s.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="subject" value={s.value} checked={quizForm.subject === s.value}
                    onChange={() => setF('subject', s.value)} className="w-4 h-4" />
                  {s.icon} {s.label}
                </label>
              ))}
            </div>
          </FieldRow>
          <FieldRow>
            <Label>Difficulty</Label>
            <div className="flex flex-col gap-1.5">
              {DIFFICULTY_OPTS.map(d => (
                <label key={d.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="radio" name="difficulty" value={d.value} checked={quizForm.difficulty === d.value}
                    onChange={() => setF('difficulty', d.value)} className="w-4 h-4" />
                  {d.label}
                </label>
              ))}
            </div>
          </FieldRow>
          <FieldRow>
            <Label>Status</Label>
            <select value={quizForm.status} onChange={e => setF('status', e.target.value as QuizStatus)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
              <option value="hidden">Hidden</option>
            </select>
          </FieldRow>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FieldRow>
            <Label>Available Date</Label>
            <input type="date" value={quizForm.availableDate} onChange={e => setF('availableDate', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </FieldRow>
          <FieldRow>
            <Label>End Date / Deadline</Label>
            <input type="date" value={quizForm.endDate} onChange={e => setF('endDate', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </FieldRow>
        </div>

        {/* Section 2: Attempts & Points */}
        <SectionTitle>Attempts &amp; Points</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <FieldRow>
            <Label>Max Attempts (0 = unlimited)</Label>
            <input type="number" min={0} max={20} value={quizForm.maxAttempts}
              onChange={e => setF('maxAttempts', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </FieldRow>
          <FieldRow>
            <Label>Points Mode</Label>
            <select value={quizForm.pointsMode} onChange={e => setF('pointsMode', e.target.value as 'best_attempt' | 'first_attempt' | 'every_attempt')}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              <option value="best_attempt">Best attempt</option>
              <option value="first_attempt">First attempt only</option>
              <option value="every_attempt">Every attempt</option>
            </select>
          </FieldRow>
          <FieldRow>
            <Label>Full-Score Bonus Points</Label>
            <input type="number" min={0} value={quizForm.fullScoreBonusPoints}
              onChange={e => setF('fullScoreBonusPoints', Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </FieldRow>
          <FieldRow>
            <Label>Minimum Score for Points (%)</Label>
            <input type="number" min={0} max={100} value={quizForm.minimumScoreForPoints}
              onChange={e => setF('minimumScoreForPoints', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </FieldRow>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mb-4">
          <input type="checkbox" checked={quizForm.allowRetries} onChange={e => setF('allowRetries', e.target.checked)} className="w-4 h-4 rounded" />
          Allow retries
        </label>

        {/* Section 3: Options */}
        <SectionTitle>Quiz Options</SectionTitle>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {([
            ['showAnswersAfterSubmit',      'Show correct answers after submit'],
            ['showExplanationsAfterSubmit', 'Show explanations after submit'],
            ['randomizeQuestions',          'Randomize question order'],
            ['randomizeOptions',            'Randomize answer options'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={quizForm[key] as boolean} onChange={e => setF(key, e.target.checked)} className="w-4 h-4 rounded" />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <Label>Time Limit (minutes, 0 = no limit)</Label>
          <input type="number" min={0} value={quizForm.timeLimitMinutes ?? 0}
            onChange={e => setF('timeLimitMinutes', Math.max(0, parseInt(e.target.value) || 0))}
            className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1" />
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => setViewMode('list')} className="flex-1">Cancel</Button>
          <Button onClick={() => void saveQuiz()} loading={savingQuiz} className="flex-1">
            <Save className="w-4 h-4" />
            {viewMode === 'create' ? 'Create Quiz' : 'Update Quiz'}
          </Button>
        </div>
      </Card>

      {/* Questions section — only when editing an existing quiz */}
      {viewMode === 'edit' && editingQuiz && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-700 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Questions ({questions.length})
            </h2>
            <Button size="sm" onClick={() => { setEditingQuestion(null); setShowQForm(true); }}>
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </div>

          {questions.length === 0 && !showQForm && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm">No questions yet. Add your first one!</p>
            </div>
          )}

          {/* Question list */}
          <div className="space-y-3 mb-4">
            {questions.map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 border border-gray-100 rounded-2xl px-4 py-3 bg-gray-50">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{q.questionText}</p>
                  <div className="flex gap-2 mt-0.5">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {QTYPE_LABELS[q.questionType]}
                    </span>
                    <span className="text-xs text-gray-400">+{q.points} pts</span>
                    {q.options && <span className="text-xs text-gray-400">{q.options.length} options</span>}
                  </div>
                </div>
                <button onClick={() => void handleDeleteQuestion(q.id)} className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Question form */}
          {showQForm && (
            <QuestionForm
              initial={editingQuestion ? {
                questionText: editingQuestion.questionText,
                questionType: editingQuestion.questionType,
                points: editingQuestion.points,
                correctAnswer: editingQuestion.correctAnswer ?? '',
                explanation: editingQuestion.explanation ?? '',
                hint: editingQuestion.hint ?? '',
                caseSensitive: editingQuestion.caseSensitive,
                requiresManualReview: editingQuestion.requiresManualReview,
                options: editingQuestion.options?.map(o => ({ text: o.optionText, isCorrect: o.isCorrect })) ?? [],
              } : undefined}
              onSave={async (form) => { await handleAddQuestion(form); }}
              onCancel={() => setShowQForm(false)}
            />
          )}

          {questions.length > 0 && (
            <div className="mt-4 pt-4 border-t flex items-center gap-3 text-sm text-gray-500">
              <BarChart2 className="w-4 h-4" />
              Total: {questions.reduce((s, q) => s + q.points, 0)} Hero Points possible
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
