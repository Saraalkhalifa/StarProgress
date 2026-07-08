import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Sparkles, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Select, Textarea, toast } from '../../components/ui';
import { getTodayRiyadh } from '../../lib/streakEngine';

// Per-activity description prompts to guide children
const ACTIVITY_PROMPTS: Record<string, string> = {
  'Reading a Book': 'Tell us the book name, how many pages you read, how long you spent reading, and what you understood from it.',
  'Volunteering': 'Tell us where you volunteered, what you did, how long it took, and how it helped others.',
  'Drawing': 'Tell us what you drew or created, how long it took, what materials you used, and what your artwork means.',
  'Exercise & Sports': 'Tell us what sport you did, how long you practiced, where you did it, and how it helped your health.',
  'Going to the Mosque': 'Tell us what you did at the mosque, how long you spent, and what you learned or gained.',
  'Cleaning Room': 'Tell us what you cleaned, how long it took, and how your room improved.',
  'Helping Family': 'Tell us who you helped, what you did, how long it took, and why it was helpful.',
};

const DEFAULT_PROMPT = 'Describe what you did in detail. Include how long it took and what you learned or achieved.';

const schema = z.object({
  activityId: z.string().min(1, 'Please select an activity'),
  note: z
    .string()
    .min(30, 'Please write at least 30 characters describing what you did. The admin needs a clear description to award your Hero Points.')
    .max(1000, 'Description must be under 1000 characters'),
  activity_date: z.string().min(1, 'Please select the date of this activity'),
});
type FormData = z.infer<typeof schema>;

export function SubmitActivity() {
  const { currentUser } = useAuth();
  const { activities, addSubmission } = useData();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { activity_date: getTodayRiyadh() },
  });

  const watchActivityId = watch('activityId');
  const watchNote = watch('note') ?? '';
  const activeActivities = activities.filter(a => a.isActive);
  const selectedAct = activeActivities.find(a => a.id === watchActivityId);
  const prompt = selectedAct ? (ACTIVITY_PROMPTS[selectedAct.name] ?? DEFAULT_PROMPT) : DEFAULT_PROMPT;

  const motivationalMessages = [
    "🎉 Hero action submitted! Waiting for admin review.",
    "⭐ Great job, Hero! Your action is under review.",
    "🚀 Submitted! Keep up the great work!",
    "💫 You're making a difference! Action under review.",
  ];

  const onSubmit = async (data: FormData) => {
    const activity = activities.find(a => a.id === data.activityId);
    if (!activity) return;

    try {
      await addSubmission({
        participantId: currentUser!.id,
        activityId: data.activityId,
        note: data.note,
        pointsValueAtSubmission: activity.points,
        activity_date: data.activity_date,
        sourceType: 'activity_submission',
      });

      setSubmitted(true);
      const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
      toast.success(msg);
      reset();
      setTimeout(() => { setSubmitted(false); }, 5000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-600" /> Submit Hero Action ⚡
        </h1>
        <p className="text-gray-500 text-sm mt-1">Log a good action you completed. An admin will review it before Hero Points are awarded.</p>
      </div>

      {submitted && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🎊</div>
          <h3 className="text-lg font-bold text-green-700">Hero Action Submitted!</h3>
          <p className="text-green-600 text-sm mt-1">Your action is awaiting admin review. You'll be notified when it's approved.</p>
          <div className="flex gap-3 justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/participant/history')}>View My Journey</Button>
            <Button size="sm" onClick={() => setSubmitted(false)}>Submit Another</Button>
          </div>
        </div>
      )}

      {!submitted && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              What did you do today, Hero?
            </h2>
            <p className="text-blue-100 text-sm mt-1">Select an action type and describe what you did</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Activity picker */}
            <div>
              <Select
                label="Hero Action Type"
                error={errors.activityId?.message}
                {...register('activityId')}
              >
                <option value="">— Select a hero action —</option>
                {activeActivities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name} {a.nameAr ? `(${a.nameAr})` : ''} — {a.points} Hero Points
                  </option>
                ))}
              </Select>

              {selectedAct && (
                <div className="mt-3 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
                  <span className="text-2xl">{selectedAct.icon}</span>
                  <div>
                    <p className="font-medium text-blue-800 text-sm">{selectedAct.name}</p>
                    {selectedAct.description && <p className="text-xs text-blue-500">{selectedAct.description}</p>}
                    <p className="text-sm font-bold text-blue-700 mt-1">⭐ Worth {selectedAct.points} Hero Points</p>
                  </div>
                </div>
              )}
            </div>

            {/* Activity date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date of Action
              </label>
              <input
                type="date"
                max={getTodayRiyadh()}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                {...register('activity_date')}
              />
              {errors.activity_date && (
                <p className="text-red-500 text-xs mt-1">{errors.activity_date.message}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">When did you complete this action?</p>
            </div>

            {/* Description */}
            <div>
              {selectedAct && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium">{prompt}</p>
                </div>
              )}
              <Textarea
                label={`Describe your hero action${watchNote.length > 0 ? ` (${watchNote.length} chars)` : ''}`}
                placeholder={selectedAct ? prompt : 'First select an action type above, then describe what you did...'}
                rows={5}
                error={errors.note?.message}
                {...register('note')}
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-400">
                  {watchNote.length < 30
                    ? `Write at least ${30 - watchNote.length} more characters`
                    : '✅ Good length — keep describing!'}
                </p>
                <span className={`text-xs font-medium ${watchNote.length < 30 ? 'text-red-400' : 'text-green-500'}`}>
                  {watchNote.length}/1000
                </span>
              </div>
            </div>

            {/* Privacy reminder */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">📸 Proof Tips:</p>
              <ul className="text-xs text-gray-500 space-y-0.5">
                <li>• Include enough detail so the admin can understand what you did</li>
                <li>• Never include private information, phone numbers, or addresses</li>
                <li>• Be honest — your description must match the action you selected</li>
                <li>• Copied or repeated descriptions will be denied</li>
              </ul>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              <Send className="w-4 h-4" />
              Submit Hero Action
            </Button>
          </form>
        </Card>
      )}

      {/* Available actions reference */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">📋 Available Hero Actions & Points</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeActivities.map(a => (
            <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-blue-50 transition-colors">
              <span className="text-xl">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{a.name}</p>
                {a.nameAr && <p className="text-xs text-gray-400">{a.nameAr}</p>}
              </div>
              <span className="text-sm font-bold text-blue-600 flex-shrink-0">{a.points} pts</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
