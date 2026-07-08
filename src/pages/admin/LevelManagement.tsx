import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, RotateCcw, Shield } from 'lucide-react';
import { HERO_LEVELS } from '../../lib/heroLevels';
import type { HeroLevel } from '../../types';
import { Card, Button, Input, toast } from '../../components/ui';

const LS_KEY = 'ah_hero_levels';

function loadLevels(): HeroLevel[] {
  try {
    const saved = localStorage.getItem(LS_KEY);
    return saved ? JSON.parse(saved) : HERO_LEVELS;
  } catch { return HERO_LEVELS; }
}

export function LevelManagement() {
  const [levels, setLevels] = useState<HeroLevel[]>(loadLevels);
  const [saving, setSaving] = useState(false);

  const updateLevel = (idx: number, field: 'name' | 'pointsRequired', value: string) => {
    setLevels(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      if (field === 'name') return { ...l, name: value };
      const n = parseInt(value, 10);
      return { ...l, pointsRequired: isNaN(n) ? l.pointsRequired : n };
    }));
  };

  const handleSave = () => {
    setSaving(true);
    // Validate: level 1 must require 0 points; rest must be ascending
    const l0 = levels[0];
    if (l0.pointsRequired !== 0) {
      toast.error('Level 1 must require 0 points.');
      setSaving(false);
      return;
    }
    for (let i = 1; i < levels.length; i++) {
      if (levels[i].pointsRequired <= levels[i - 1].pointsRequired) {
        toast.error(`Level ${i + 1} points must be greater than level ${i} points.`);
        setSaving(false);
        return;
      }
    }
    localStorage.setItem(LS_KEY, JSON.stringify(levels));
    toast.success('Hero Levels saved! ✅');
    setSaving(false);
  };

  const handleReset = () => {
    if (!confirm('Reset all levels to defaults?')) return;
    setLevels([...HERO_LEVELS]);
    localStorage.removeItem(LS_KEY);
    toast.info('Levels reset to defaults.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" /> Hero Level Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Edit level names and point thresholds. Level 1 must start at 0 and thresholds must increase.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleReset} size="sm">
            <RotateCcw className="w-4 h-4" /> Reset Defaults
          </Button>
          <Button onClick={handleSave} loading={saving} size="sm">
            <Save className="w-4 h-4" /> Save All Levels
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {levels.map((level, idx) => (
          <motion.div key={level.level} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: level.color + '20', border: `2px solid ${level.color}` }}
                >
                  {level.icon}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs font-bold text-gray-400 w-6">Lv.{level.level}</span>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={level.name}
                    onChange={e => updateLevel(idx, 'name', e.target.value)}
                    placeholder="Level name"
                    className="text-sm py-1.5"
                  />
                  <div className="relative">
                    <Input
                      type="number"
                      value={level.pointsRequired}
                      onChange={e => updateLevel(idx, 'pointsRequired', e.target.value)}
                      disabled={idx === 0}
                      min={0}
                      className="text-sm py-1.5 pe-8"
                    />
                    <span className="absolute end-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">pts</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Changes apply immediately for all heroes. Existing earned points are not affected.
      </p>
    </div>
  );
}
