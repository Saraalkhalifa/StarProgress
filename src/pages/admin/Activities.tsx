import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Input, Textarea, Dialog, ConfirmDialog, StatusBadge, EmptyState, toast } from '../../components/ui';
import type { Activity } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  points: z.number().min(1, 'Must be at least 1').max(100),
  icon: z.string().min(1, 'Icon required'),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

const EMOJI_SUGGESTIONS = ['📚', '✏️', '🧠', '📝', '🌐', '🎨', '🏃', '🤝', '💡', '🧘', '🎯', '🔬', '🎵', '⚽', '🌿', '💻'];

export function ActivitiesManagement() {
  const { activities, addActivity, updateActivity, deleteActivity, submissions } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isActive: true, icon: '📚' },
  });

  const watchIcon = watch('icon');

  const openEdit = (a: Activity) => {
    setEditActivity(a);
    setValue('name', a.name);
    setValue('nameAr', a.nameAr || '');
    setValue('description', a.description || '');
    setValue('points', a.points);
    setValue('icon', a.icon);
    setValue('isActive', a.isActive);
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    if (editActivity) {
      await updateActivity(editActivity.id, data);
      toast.success('Activity updated!');
    } else {
      await addActivity(data);
      toast.success('Activity added!');
    }
    setShowForm(false);
    setEditActivity(null);
    reset({ isActive: true, icon: '📚' });
  };

  const handleToggleActive = async (a: Activity) => {
    await updateActivity(a.id, { isActive: !a.isActive });
    toast.info(`Activity ${a.isActive ? 'deactivated' : 'activated'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Activities 🎯</h1>
          <p className="text-gray-500 text-sm">{activities.filter(a => a.isActive).length} active activities</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditActivity(null); reset({ isActive: true, icon: '📚' }); }}>
          <Plus className="w-4 h-4" /> Add Activity
        </Button>
      </div>

      {activities.length === 0 ? (
        <EmptyState icon="🎯" title="No activities yet" description="Add activities for participants to complete" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map(a => {
            const usageCount = submissions.filter(s => s.activityId === a.id && s.status === 'accepted').length;
            return (
              <Card key={a.id} className={`p-5 transition-opacity ${a.isActive ? '' : 'opacity-60'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-800">{a.name}</p>
                        {a.nameAr && <p className="text-sm text-gray-400" dir="rtl">{a.nameAr}</p>}
                        {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <StatusBadge variant={a.isActive ? 'green' : 'gray'}>
                          {a.isActive ? 'Active' : 'Inactive'}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-blue-700 font-bold text-sm bg-blue-50 px-2 py-0.5 rounded-lg">
                        ⭐ {a.points} pts
                      </span>
                      <span className="text-xs text-gray-400">{usageCount} completions</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                  <button onClick={() => openEdit(a)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-blue-600 hover:bg-blue-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleToggleActive(a)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    {a.isActive ? <ToggleRight className="w-3.5 h-3.5 text-green-500" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                    {a.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-50 transition-colors ml-auto">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditActivity(null); }} title={editActivity ? 'Edit Activity' : 'Add New Activity'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Activity Name (English)" placeholder="e.g. Reading a Book" error={errors.name?.message} {...register('name')} />
            </div>
            <div className="col-span-2">
              <Input label="Activity Name (Arabic - optional)" placeholder="e.g. قراءة كتاب" {...register('nameAr')} />
            </div>
          </div>
          <Textarea label="Description (optional)" placeholder="Brief description of this activity" rows={2} {...register('description')} />
          <Input label="Points Value" type="number" min="1" max="100" error={errors.points?.message} {...register('points', { valueAsNumber: true })} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_SUGGESTIONS.map(e => (
                <button key={e} type="button" onClick={() => setValue('icon', e)}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${watchIcon === e ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-blue-50'}`}
                >{e}</button>
              ))}
            </div>
            <input className="mt-2 px-3 py-2 border border-gray-200 rounded-xl text-sm w-24" placeholder="Custom" maxLength={2} {...register('icon')} />
            {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register('isActive')} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium text-gray-700">Active (visible to participants)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditActivity(null); }} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editActivity ? 'Save Changes' : 'Add Activity'}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteActivity(deleteId!); toast.success('Activity deleted.'); }} title="Delete Activity" message="This will permanently delete this activity. Existing submissions will remain but may show 'Unknown activity'." />
    </div>
  );
}
