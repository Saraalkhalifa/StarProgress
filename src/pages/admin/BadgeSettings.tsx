import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Award } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Card, Button, Input, Dialog, ConfirmDialog, EmptyState, toast } from '../../components/ui';
import type { Badge } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  requiredPoints: z.number().min(1, 'Must be at least 1'),
  icon: z.string().min(1, 'Icon required'),
  color: z.string().min(1),
  bgColor: z.string().min(1),
});
type FormData = z.infer<typeof schema>;

const COLOR_PRESETS = [
  { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Green' },
  { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Yellow' },
  { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Orange' },
  { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Red' },
  { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Blue' },
  { color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Purple' },
];
const BADGE_ICONS = ['🌱', '⭐', '🏆', '👑', '💎', '🔥', '🦁', '🚀', '🌟', '🎖️', '🥇', '🦅'];

export function BadgeSettings() {
  const { badges, updateBadge, addBadge, deleteBadge, getAcceptedPoints, users } = useData();
  const [showForm, setShowForm] = useState(false);
  const [editBadge, setEditBadge] = useState<Badge | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { icon: '⭐', color: COLOR_PRESETS[1].color, bgColor: COLOR_PRESETS[1].bgColor },
  });

  const watchIcon = watch('icon');

  const sortedBadges = [...badges].sort((a, b) => a.requiredPoints - b.requiredPoints);

  const openEdit = (b: Badge) => {
    setEditBadge(b);
    setValue('name', b.name);
    setValue('requiredPoints', b.requiredPoints);
    setValue('icon', b.icon);
    setValue('color', b.color);
    setValue('bgColor', b.bgColor);
    const preset = COLOR_PRESETS.find(c => c.color === b.color) || COLOR_PRESETS[0];
    setSelectedColor(preset);
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    if (editBadge) {
      await updateBadge(editBadge.id, data);
      toast.success('Badge updated!');
    } else {
      await addBadge(data);
      toast.success('Badge added!');
    }
    setShowForm(false);
    setEditBadge(null);
    reset({ icon: '⭐', color: COLOR_PRESETS[1].color, bgColor: COLOR_PRESETS[1].bgColor });
  };

  const participants = users.filter(u => u.role === 'participant');

  const getBadgeHolder = (b: Badge) => {
    return participants.filter(p => {
      const pts = getAcceptedPoints(p.id);
      const currentBadge = [...sortedBadges].reverse().find(badge => pts >= badge.requiredPoints);
      return currentBadge?.id === b.id;
    }).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Badge Settings 🎖️</h1>
          <p className="text-gray-500 text-sm">Configure achievement badges and required points</p>
        </div>
        <Button onClick={() => { setShowForm(true); setEditBadge(null); reset({ icon: '⭐', color: COLOR_PRESETS[1].color, bgColor: COLOR_PRESETS[1].bgColor }); setSelectedColor(COLOR_PRESETS[1]); }}>
          <Plus className="w-4 h-4" /> Add Badge
        </Button>
      </div>

      {sortedBadges.length === 0 ? (
        <EmptyState icon="🎖️" title="No badges configured" description="Add badges to reward participants" />
      ) : (
        <div className="space-y-3">
          {sortedBadges.map((badge, i) => {
            const holders = getBadgeHolder(badge);
            return (
              <Card key={badge.id} className={`p-5 ${badge.bgColor} border-transparent`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${badge.bgColor} border-2 border-white shadow-sm flex items-center justify-center text-3xl`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-lg font-bold ${badge.color}`}>{badge.name}</p>
                      {i === sortedBadges.length - 1 && <span className="text-xs bg-white/60 text-gray-600 px-2 py-0.5 rounded-full">Highest</span>}
                    </div>
                    <p className="text-sm text-gray-600">{badge.requiredPoints}+ points required</p>
                    <p className="text-xs text-gray-500 mt-0.5">{holders} participant{holders !== 1 ? 's' : ''} currently hold this badge</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(badge)} className="p-2 rounded-lg hover:bg-white/50 text-gray-600 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {badges.length > 1 && (
                      <button onClick={() => setDeleteId(badge.id)} className="p-2 rounded-lg hover:bg-red-100 text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Journey preview */}
      {sortedBadges.length > 1 && (
        <Card className="p-5">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-500" /> Badge Journey
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {sortedBadges.map((badge, i) => (
              <React.Fragment key={badge.id}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${badge.bgColor} flex items-center justify-center text-xl`}>{badge.icon}</div>
                  <p className={`text-xs font-medium ${badge.color}`}>{badge.name}</p>
                  <p className="text-xs text-gray-400">{badge.requiredPoints} pts</p>
                </div>
                {i < sortedBadges.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gray-200 min-w-8" />
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {/* Form dialog */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditBadge(null); }} title={editBadge ? 'Edit Badge' : 'Add New Badge'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Badge Name" placeholder="e.g. Rising Star" error={errors.name?.message} {...register('name')} />
          <Input label="Required Points" type="number" min="1" placeholder="e.g. 150" error={errors.requiredPoints?.message} {...register('requiredPoints', { valueAsNumber: true })} />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Icon</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_ICONS.map(e => (
                <button key={e} type="button" onClick={() => setValue('icon', e)}
                  className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${watchIcon === e ? 'bg-blue-200 ring-2 ring-blue-500' : 'bg-gray-100 hover:bg-blue-50'}`}
                >{e}</button>
              ))}
            </div>
            <input className="mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm w-24" placeholder="Custom" maxLength={2} {...register('icon')} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Color Theme</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => { setSelectedColor(c); setValue('color', c.color); setValue('bgColor', c.bgColor); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${c.bgColor} ${c.color} ${selectedColor.color === c.color ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditBadge(null); }} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">{editBadge ? 'Save Changes' : 'Add Badge'}</Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async () => { await deleteBadge(deleteId!); toast.success('Badge deleted.'); }} title="Delete Badge" message="This badge will be permanently deleted. Participants currently holding it will lose it." />
    </div>
  );
}
