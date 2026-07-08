import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Award, Search, Users, Star, ArrowUpRight, Eye, EyeOff } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import {
  Card, Button, Input, Dialog, ConfirmDialog, EmptyState, toast,
  StatusBadge, Toggle, Skeleton, AlertBanner,
} from '../../components/ui';
import type { Badge } from '../../types';

// ── Validation schema ────────────────────────────────────────────────────────
const schema = z.object({
  name:           z.string().min(2, 'Badge name must be at least 2 characters'),
  nameAr:         z.string().optional(),
  requiredPoints: z.number().min(1, 'Must be at least 1 point'),
  icon:           z.string().min(1, 'Choose an icon for this badge'),
  color:          z.string().min(1),
  bgColor:        z.string().min(1),
});
type FormData = z.infer<typeof schema>;

// ── Constants ────────────────────────────────────────────────────────────────
const COLOR_PRESETS = [
  { color: 'text-emerald-600', bgColor: 'bg-emerald-100', label: 'Green',  hex: '#059669' },
  { color: 'text-amber-600',   bgColor: 'bg-amber-100',   label: 'Gold',   hex: '#d97706' },
  { color: 'text-orange-600',  bgColor: 'bg-orange-100',  label: 'Orange', hex: '#ea580c' },
  { color: 'text-red-600',     bgColor: 'bg-red-100',     label: 'Red',    hex: '#dc2626' },
  { color: 'text-blue-600',    bgColor: 'bg-blue-100',    label: 'Blue',   hex: '#2563eb' },
  { color: 'text-purple-600',  bgColor: 'bg-purple-100',  label: 'Purple', hex: '#9333ea' },
  { color: 'text-pink-600',    bgColor: 'bg-pink-100',    label: 'Pink',   hex: '#db2777' },
  { color: 'text-teal-600',    bgColor: 'bg-teal-100',    label: 'Teal',   hex: '#0d9488' },
];

const BADGE_ICONS = [
  '🌱', '⭐', '🏆', '👑', '💎', '🔥', '🦁', '🚀',
  '🌟', '🎖️', '🥇', '🦅', '🎯', '💪', '🌙', '✨',
  '🛡️', '⚡', '🌈', '🦋', '🏅', '🎪', '🌺', '🦊',
];

// ── Badge card component ──────────────────────────────────────────────────────
function BadgeCard({
  badge, rank, totalBadges, holders, onEdit, onDelete,
}: {
  badge: Badge; rank: number; totalBadges: number; holders: number;
  onEdit: () => void; onDelete: () => void;
}) {
  const isHighest = rank === totalBadges - 1;
  const isFirst   = rank === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: rank * 0.04 }}
    >
      <Card className={`overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_16px_0_rgb(0_0_0/0.08)]`}>
        {/* Colored top strip */}
        <div className={`h-1.5 w-full ${badge.bgColor}`} />

        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`w-16 h-16 rounded-3xl ${badge.bgColor} flex items-center justify-center text-3xl
                          shadow-sm border-2 border-white flex-shrink-0`}
            >
              {badge.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className={`text-lg font-extrabold ${badge.color}`}>{badge.name}</p>
                {badge.nameAr && <span className="text-sm text-gray-400">({badge.nameAr})</span>}
                {isHighest && (
                  <StatusBadge variant="purple">👑 Highest</StatusBadge>
                )}
                {isFirst && (
                  <StatusBadge variant="green">🌱 Starter</StatusBadge>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Unlocks at <span className={`font-extrabold ${badge.color}`}>{badge.requiredPoints.toLocaleString()} pts</span>
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Users className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-xs text-gray-400 font-semibold">
                  {holders} hero{holders !== 1 ? 'es' : ''} holding this badge
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={onEdit}
                className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-all duration-150 group"
                title="Edit badge"
              >
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={onDelete}
                className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-150 group"
                title="Delete badge"
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Badge preview ─────────────────────────────────────────────────────────────
function BadgePreview({ icon, name, color, bgColor, points }: {
  icon: string; name: string; color: string; bgColor: string; points: number;
}) {
  return (
    <div className={`${bgColor} rounded-2xl p-4 flex items-center gap-3 border-2 border-white shadow-sm`}>
      <div className={`w-12 h-12 rounded-2xl bg-white/60 flex items-center justify-center text-2xl`}>{icon}</div>
      <div>
        <p className={`font-extrabold ${color}`}>{name || 'Badge Name'}</p>
        <p className="text-xs text-gray-500 font-medium">{points ? `${points} pts required` : 'Enter points'}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function BadgeSettings() {
  const { badges, updateBadge, addBadge, deleteBadge, getAcceptedPoints, users, loading } = useData();

  const [showForm, setShowForm]         = useState(false);
  const [editBadge, setEditBadge]       = useState<Badge | null>(null);
  const [deleteId, setDeleteId]         = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0]);
  const [search, setSearch]             = useState('');

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      icon: '⭐',
      color: COLOR_PRESETS[1].color,
      bgColor: COLOR_PRESETS[1].bgColor,
    },
  });

  const watchIcon   = watch('icon')   ?? '⭐';
  const watchName   = watch('name')   ?? '';
  const watchPts    = watch('requiredPoints') ?? 0;
  const watchColor  = watch('color')  ?? COLOR_PRESETS[1].color;
  const watchBg     = watch('bgColor') ?? COLOR_PRESETS[1].bgColor;

  const sortedBadges = useMemo(
    () => [...badges].sort((a, b) => a.requiredPoints - b.requiredPoints),
    [badges]
  );

  const participants = useMemo(() => users.filter(u => u.role === 'participant'), [users]);

  const getBadgeHolders = (b: Badge) =>
    participants.filter(p => {
      const pts = getAcceptedPoints(p.id);
      const current = [...sortedBadges].reverse().find(badge => pts >= badge.requiredPoints);
      return current?.id === b.id;
    }).length;

  const filtered = useMemo(() =>
    sortedBadges.filter(b =>
      !search || b.name.toLowerCase().includes(search.toLowerCase())
    ),
    [sortedBadges, search]
  );

  const openNew = () => {
    setEditBadge(null);
    setSelectedColor(COLOR_PRESETS[1]);
    reset({ icon: '⭐', color: COLOR_PRESETS[1].color, bgColor: COLOR_PRESETS[1].bgColor, requiredPoints: undefined as unknown as number });
    setShowForm(true);
  };

  const openEdit = (b: Badge) => {
    setEditBadge(b);
    setValue('name', b.name);
    setValue('nameAr', b.nameAr ?? '');
    setValue('requiredPoints', b.requiredPoints);
    setValue('icon', b.icon);
    setValue('color', b.color);
    setValue('bgColor', b.bgColor);
    const preset = COLOR_PRESETS.find(c => c.color === b.color) ?? COLOR_PRESETS[0];
    setSelectedColor(preset);
    setShowForm(true);
  };

  const onSubmit = async (data: FormData) => {
    if (editBadge) {
      await updateBadge(editBadge.id, data);
      toast.success('Badge updated! ✨');
    } else {
      await addBadge(data);
      toast.success('New badge created! 🎖️');
    }
    setShowForm(false);
    setEditBadge(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBadge(deleteId);
    toast.success('Badge removed.');
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
            <span className="text-3xl">🎖️</span> Badge Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Configure Hero Badges and the points required to earn each one
          </p>
        </div>
        <Button onClick={openNew} size="md">
          <Plus className="w-4 h-4" /> Add Badge
        </Button>
      </div>

      {/* Stats row */}
      {sortedBadges.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Badges', value: sortedBadges.length, icon: '🎖️', color: 'text-purple-600 bg-purple-50' },
            { label: 'Participants Ranked', value: participants.filter(p => {
              const pts = getAcceptedPoints(p.id);
              return sortedBadges.some(b => pts >= b.requiredPoints);
            }).length, icon: '🦸', color: 'text-blue-600 bg-blue-50' },
            { label: 'Highest Threshold', value: `${(sortedBadges[sortedBadges.length-1]?.requiredPoints ?? 0).toLocaleString()} pts`,
              icon: '👑', color: 'text-amber-600 bg-amber-50' },
          ].map(stat => (
            <Card key={stat.label} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl ${stat.color.split(' ')[1]}`}>
                {stat.icon}
              </div>
              <div>
                <p className={`text-xl font-extrabold ${stat.color.split(' ')[0]}`}>{stat.value}</p>
                <p className="text-xs text-gray-400 font-semibold">{stat.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      {sortedBadges.length > 2 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search badges by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-none transition-all duration-150"
          />
        </div>
      )}

      {/* Badge list */}
      {filtered.length === 0 && sortedBadges.length === 0 ? (
        <EmptyState
          icon="🎖️"
          title="No badges yet"
          description="Create your first badge to start rewarding heroes when they reach point milestones."
          action={<Button onClick={openNew}><Plus className="w-4 h-4" /> Add your first badge</Button>}
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="🔍" title="No badges match your search" description={`No badge found for "${search}"`} />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((badge, i) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                rank={sortedBadges.indexOf(badge)}
                totalBadges={sortedBadges.length}
                holders={getBadgeHolders(badge)}
                onEdit={() => openEdit(badge)}
                onDelete={() => setDeleteId(badge.id)}
              />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Journey timeline */}
      {sortedBadges.length > 1 && (
        <Card className="p-6">
          <h3 className="font-bold text-gray-700 mb-5 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-blue-500" />
            Badge Journey
          </h3>
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            {sortedBadges.map((badge, i) => (
              <React.Fragment key={badge.id}>
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-2xl ${badge.bgColor} flex items-center justify-center text-2xl
                                shadow-sm border-2 border-white`}
                  >
                    {badge.icon}
                  </div>
                  <p className={`text-xs font-extrabold ${badge.color} whitespace-nowrap`}>{badge.name}</p>
                  <p className="text-xs text-gray-400 font-semibold">{badge.requiredPoints.toLocaleString()} pts</p>
                </div>
                {i < sortedBadges.length - 1 && (
                  <div className="flex items-center pb-8 flex-1 min-w-6">
                    <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-200 to-gray-300" />
                    <div className="text-gray-300 text-xs mx-1">→</div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {/* Alert: minimum 1 badge */}
      {badges.length === 1 && (
        <AlertBanner type="info">
          Keep at least one badge active. Add more badges to create a progression path for heroes.
        </AlertBanner>
      )}

      {/* Form dialog */}
      <Dialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditBadge(null); }}
        title={editBadge ? '✏️ Edit Badge' : '✨ Create New Badge'}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowForm(false); setEditBadge(null); }}>
              Cancel
            </Button>
            <Button type="submit" form="badge-form" loading={isSubmitting}>
              {editBadge ? 'Save Changes' : 'Create Badge'}
            </Button>
          </>
        }
      >
        <form id="badge-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Live preview */}
          <BadgePreview
            icon={watchIcon}
            name={watchName}
            color={watchColor}
            bgColor={watchBg}
            points={watchPts}
          />

          {/* Name fields */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Badge Name (English)"
              placeholder="e.g. Rising Star"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Name (Arabic) — optional"
              placeholder="اسم الشارة"
              dir="rtl"
              {...register('nameAr')}
            />
          </div>

          {/* Points */}
          <Input
            label="Hero Points Required"
            type="number"
            min="1"
            placeholder="e.g. 150"
            error={errors.requiredPoints?.message}
            hint="Heroes earn this badge when they reach this total of accepted Hero Points."
            {...register('requiredPoints', { valueAsNumber: true })}
          />

          {/* Icon picker */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Badge Icon</label>
            <div className="flex flex-wrap gap-2">
              {BADGE_ICONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setValue('icon', e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-150
                              ${watchIcon === e
                                ? 'bg-blue-100 ring-2 ring-blue-500 scale-110 shadow-sm'
                                : 'bg-gray-100 hover:bg-blue-50 hover:scale-105'}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              className="mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Custom 🌸"
              maxLength={2}
              {...register('icon')}
            />
            {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
          </div>

          {/* Color theme */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Color Theme</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c);
                    setValue('color', c.color);
                    setValue('bgColor', c.bgColor);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold ${c.bgColor} ${c.color} transition-all duration-150
                              ${selectedColor.color === c.color ? 'ring-2 ring-offset-1 ring-blue-500 scale-105 shadow-sm' : 'hover:scale-105'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

        </form>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Badge"
        message="This badge will be permanently removed. Heroes currently holding it will lose their badge status until they meet the criteria of another badge."
        confirmText="Remove Badge"
        confirmVariant="danger"
      />
    </div>
  );
}
