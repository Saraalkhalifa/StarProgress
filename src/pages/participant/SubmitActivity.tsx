import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Select, Textarea, toast } from '../../components/ui';

const schema = z.object({
  activityId: z.string().min(1, 'Please select an activity'),
  note: z.string().min(5, 'Please write at least 5 characters describing what you did').max(300),
});
type FormData = z.infer<typeof schema>;

export function SubmitActivity() {
  const { currentUser } = useAuth();
  const { activities, addSubmission } = useData();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const watchActivityId = watch('activityId');
  const activeActivities = activities.filter(a => a.isActive);
  const selectedAct = activeActivities.find(a => a.id === watchActivityId);

  const motivationalMessages = [
    "🎉 Amazing! Your submission is in for review!",
    "⭐ Great job! Keep up the awesome work!",
    "🚀 Submitted! The admin will review it soon.",
    "💫 You're making progress! Well done!",
  ];

  const onSubmit = async (data: FormData) => {
    const activity = activities.find(a => a.id === data.activityId);
    if (!activity) return;

    await addSubmission({
      participantId: currentUser!.id,
      activityId: data.activityId,
      note: data.note,
      pointsValueAtSubmission: activity.points,
    });

    setSubmitted(true);
    const msg = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    toast.success(msg);
    reset();
    setTimeout(() => { setSubmitted(false); }, 5000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Submit an Activity 📝</h1>
        <p className="text-gray-500 text-sm mt-1">Log a good activity you completed. It will be reviewed by an admin before points are added.</p>
      </div>

      {submitted && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center animate-fade-in">
          <div className="text-5xl mb-3">🎊</div>
          <h3 className="text-lg font-bold text-green-700">Submission Sent!</h3>
          <p className="text-green-600 text-sm mt-1">Your activity has been submitted and is awaiting admin approval.</p>
          <div className="flex gap-3 justify-center mt-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/participant/history')}>View My Progress</Button>
            <Button size="sm" onClick={() => setSubmitted(false)}>Submit Another</Button>
          </div>
        </div>
      )}

      {!submitted && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              What did you accomplish today?
            </h2>
            <p className="text-blue-100 text-sm mt-1">Select an activity and describe what you did</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Activity picker */}
            <div>
              <Select
                label="Activity Type"
                error={errors.activityId?.message}
                {...register('activityId')}
              >
                <option value="">— Select an activity —</option>
                {activeActivities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.icon} {a.name} {a.nameAr ? `(${a.nameAr})` : ''} — {a.points} pts
                  </option>
                ))}
              </Select>

              {selectedAct && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">{selectedAct.icon}</span>
                  <div>
                    <p className="font-medium text-blue-800 text-sm">{selectedAct.name}</p>
                    {selectedAct.description && <p className="text-xs text-blue-500">{selectedAct.description}</p>}
                    <p className="text-sm font-bold text-blue-700 mt-0.5">🌟 Worth {selectedAct.points} points</p>
                  </div>
                </div>
              )}
            </div>

            {/* Note */}
            <Textarea
              label="What did you do?"
              placeholder='e.g. "Read 20 pages of Atomic Habits" or "Solved 30 قدرات questions - verbal section"'
              rows={4}
              error={errors.note?.message}
              {...register('note')}
            />

            {/* Examples */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">💡 Example notes:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• "Read 15 pages of 'Atomic Habits'"</li>
                <li>• "Solved 25 قدرات questions – verbal section"</li>
                <li>• "Practiced IELTS writing task 2 – technology topic"</li>
                <li>• "Jogged 4km in the morning"</li>
                <li>• "Completed Module 3 of Python for Beginners"</li>
              </ul>
            </div>

            <Button type="submit" size="lg" className="w-full">
              <Send className="w-4 h-4" />
              Submit Activity
            </Button>
          </form>
        </Card>
      )}

      {/* Available activities reference */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">📋 Available Activities & Points</h3>
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
