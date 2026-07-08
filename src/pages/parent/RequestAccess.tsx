import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Heart, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, toast } from '../../components/ui';
import { useParent } from '../../contexts/ParentContext';
import { lookupCodeMatch } from '../../lib/parentStorage';
import type { RelationshipType } from '../../types';

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  father:        'Father',
  mother:        'Mother',
  guardian:      'Guardian',
  older_sibling: 'Older Sibling',
  relative:      'Relative',
  other:         'Other',
};

const schema = z.object({
  mode:             z.enum(['username', 'code']),
  childIdentifier:  z.string().min(1, 'Please enter a username or code'),
  childFullName:    z.string().optional(),
  relationshipType: z.enum(['father', 'mother', 'guardian', 'older_sibling', 'relative', 'other'] as const),
  requestMessage:   z.string().min(5, 'Please provide a brief reason for access'),
  adminMessage:     z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function RequestAccess() {
  const navigate = useNavigate();
  const { submitAccessRequest, accessRequests } = useParent();
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<'username' | 'code'>('username');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'username', relationshipType: 'guardian' },
  });

  const onSubmit = async (data: FormData) => {
    // Check for duplicate pending/approved request using the identifier
    const alreadyPending = accessRequests.some(r =>
      (r.status === 'pending' || r.status === 'approved') &&
      (
        (data.mode === 'username' && r.requestedChildUsername?.toLowerCase() === data.childIdentifier.toLowerCase()) ||
        (data.mode === 'code' && r.requestedChildCode?.toUpperCase() === data.childIdentifier.toUpperCase())
      )
    );
    if (alreadyPending) {
      toast.error('You already have a pending or approved request for this child.');
      return;
    }

    let matchedParticipantId: string | undefined;

    if (data.mode === 'code') {
      try {
        const match = await lookupCodeMatch(data.childIdentifier);
        if (match) matchedParticipantId = match.participantId;
      } catch {
        // not fatal — admin will match manually
      }
    }

    try {
      await submitAccessRequest({
        requestedChildUsername: data.mode === 'username' ? data.childIdentifier : undefined,
        requestedChildCode:     data.mode === 'code'     ? data.childIdentifier.toUpperCase() : undefined,
        matchedParticipantId,
        relationshipType: data.relationshipType,
        requestMessage:   [data.requestMessage, data.adminMessage].filter(Boolean).join('\n\n---\n') || data.requestMessage,
      });
      setDone(true);
    } catch (err) {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="p-10 max-w-md w-full text-center shadow-xl">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 text-sm mb-6">
            The main admin will review your request and notify you. No child data is shared until the request is approved.
          </p>
          <Button onClick={() => navigate('/parent')} className="bg-purple-600 hover:bg-purple-700 w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/parent')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Request Child Access</h1>
                <p className="text-xs text-gray-400">The main admin must approve before you see any data</p>
              </div>
            </div>

            {/* Safety notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-xs text-amber-700">
              🔒 For child safety, your request must be reviewed and approved by the main admin. Knowing a child's username does not grant access automatically.
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Mode tabs */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">How to identify the child</p>
                <div className="flex gap-2">
                  {(['username', 'code'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setMode(m); setValue('mode', m); }}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${mode === m ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                    >
                      {m === 'username' ? '👤 By Username' : '🔑 By Connection Code'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {mode === 'code'
                    ? 'Ask your child or their admin for their unique 8-character connection code.'
                    : 'Enter the username your child uses on Action Heroes.'}
                </p>
              </div>

              <input type="hidden" {...register('mode')} value={mode} />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {mode === 'code' ? 'Connection Code' : 'Child Username'}
                </label>
                <div className="relative">
                  <input
                    {...register('childIdentifier')}
                    placeholder={mode === 'code' ? 'e.g. AB12CD34' : 'e.g. herouser123'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200 pe-10 uppercase font-mono"
                    style={{ textTransform: mode === 'code' ? 'uppercase' : 'none' }}
                  />
                  <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                {errors.childIdentifier && <p className="text-xs text-red-500">{errors.childIdentifier.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Child Full Name <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  {...register('childFullName')}
                  placeholder="Helps the admin match your request"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Your Relationship to the Child</label>
                <select
                  {...register('relationshipType')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200 bg-white"
                >
                  {Object.entries(RELATIONSHIP_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                {errors.relationshipType && <p className="text-xs text-red-500">{errors.relationshipType.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Reason for Access <span className="text-red-500">*</span></label>
                <textarea
                  {...register('requestMessage')}
                  rows={3}
                  placeholder="e.g. I am the child's mother and want to follow their progress and approve reward requests."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200 resize-none"
                />
                {errors.requestMessage && <p className="text-xs text-red-500">{errors.requestMessage.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Message to Admin <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  {...register('adminMessage')}
                  rows={2}
                  placeholder="Any additional information for the admin..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-purple-400 focus:ring-purple-200 resize-none"
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" size="lg" loading={isSubmitting}>
                Submit Access Request
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
