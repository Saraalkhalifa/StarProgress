import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { getDeductions, updateDeduction } from '../../lib/deductionStorage';
import { Card } from '../../components/ui';
import type { BehavioralDeduction } from '../../types/deduction';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusPill({ status }: { status: BehavioralDeduction['status'] }) {
  const cfg: Record<string, string> = {
    active:         'bg-red-100 text-red-700',
    pending_review: 'bg-amber-100 text-amber-700',
    reversed:       'bg-blue-100 text-blue-700',
    rejected:       'bg-gray-100 text-gray-500',
  };
  const label: Record<string, string> = {
    active: 'Active', pending_review: 'Under Review', reversed: 'Reversed', rejected: 'Dismissed',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg[status] ?? ''}`}>{label[status] ?? status}</span>;
}

export function MyDeductions() {
  const { currentUser } = useAuth();
  const [deductions, setDeductions] = useState<BehavioralDeduction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    getDeductions({ participantId: currentUser.id })
      .then(setDeductions)
      .catch(() => setDeductions([]))
      .finally(() => setLoading(false));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || deductions.length === 0) return;
    // Auto-mark not_viewed → viewed
    const unviewed = deductions.filter(d => d.acknowledgmentStatus === 'not_viewed');
    unviewed.forEach(d => {
      updateDeduction(d.id, { acknowledgmentStatus: 'viewed' }).catch(() => undefined);
    });
    if (unviewed.length > 0) {
      setDeductions(prev => prev.map(d => d.acknowledgmentStatus === 'not_viewed' ? { ...d, acknowledgmentStatus: 'viewed' } : d));
    }
  }, [deductions.length]);

  async function acknowledge(ded: BehavioralDeduction) {
    await updateDeduction(ded.id, { acknowledgmentStatus: 'acknowledged' });
    setDeductions(prev => prev.map(d => d.id === ded.id ? { ...d, acknowledgmentStatus: 'acknowledged' } : d));
    toast.success('Acknowledged.');
  }

  const active   = deductions.filter(d => d.status === 'active');
  const totalDed = active.reduce((s, d) => s + d.pointsDeducted, 0);
  const newCount = deductions.filter(d => d.acknowledgmentStatus === 'not_viewed').length;

  if (loading) {
    return <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-500" /> My Incidents
      </h1>
      <p className="text-sm text-gray-500 mb-6">Behavioral deductions recorded for you by an admin or parent.</p>

      {deductions.length === 0 ? (
        <Card className="p-10 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">No incidents on record!</p>
          <p className="text-sm text-gray-400 mt-1">Keep up the great work! 🌟</p>
        </Card>
      ) : (
        <>
          {newCount > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              You have <strong>{newCount}</strong> new record{newCount !== 1 ? 's' : ''} to review.
            </div>
          )}
          {active.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              You have <strong>{active.length}</strong> active deduction{active.length !== 1 ? 's' : ''} totalling <strong>-{totalDed} pts</strong>.
            </div>
          )}

          <div className="space-y-3">
            {deductions.map(ded => {
              const isNew = ded.acknowledgmentStatus === 'not_viewed';
              return (
                <Card key={ded.id} className={`p-4 border-2 ${isNew ? 'border-amber-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusPill status={ded.status} />
                        {isNew && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">NEW</span>}
                      </div>
                      <p className="font-semibold text-gray-900 mt-1">{ded.categoryLabelSnap}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{ded.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {fmtDate(ded.incidentDate)} · Recorded by {ded.issuerRole === 'parent' ? ded.issuerNameSnap : 'Admin'}
                      </p>
                      {ded.status === 'reversed' && ded.reversalReason && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" /> Reversed: {ded.reversalReason}
                        </p>
                      )}
                    </div>
                    <div className="text-end shrink-0">
                      <p className={`text-lg font-bold ${ded.status === 'reversed' ? 'text-blue-600' : 'text-red-600'}`}>
                        {ded.status === 'reversed' ? '+' : '−'}{ded.pointsDeducted}
                      </p>
                      <p className="text-xs text-gray-400">pts</p>
                    </div>
                  </div>
                  {ded.status === 'active' && ded.acknowledgmentStatus !== 'acknowledged' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button onClick={() => acknowledge(ded)}
                        className="text-sm text-blue-600 hover:underline font-medium">
                        I understand and acknowledge this
                      </button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
