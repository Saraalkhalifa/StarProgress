import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { RewardType, RewardRequest } from '../types';
import { rewardStorage } from '../lib/rewardStorage';
import { generateId } from '../lib/utils';

interface RewardContextType {
  rewardTypes: RewardType[];
  rewardRequests: RewardRequest[];
  addRewardRequest: (data: Omit<RewardRequest, 'id' | 'requestedAt' | 'status'>) => void;
  updateRewardRequest: (id: string, data: Partial<RewardRequest>) => void;
  getRequestsForParticipant: (participantId: string) => RewardRequest[];
  getRequestsForParent: (parentEmail: string) => RewardRequest[];
  getPendingForParent: (parentEmail: string) => RewardRequest[];
  addRewardType: (data: Omit<RewardType, 'id' | 'createdAt'>) => void;
  updateRewardType: (id: string, data: Partial<RewardType>) => void;
  removeRewardType: (id: string) => void;
  refresh: () => void;
}

const RewardContext = createContext<RewardContextType | null>(null);

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const [rewardTypes, setRewardTypes] = useState<RewardType[]>([]);
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([]);

  const refresh = useCallback(() => {
    setRewardTypes(rewardStorage.getTypes());
    setRewardRequests(rewardStorage.getRequests());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addRewardRequest = useCallback((data: Omit<RewardRequest, 'id' | 'requestedAt' | 'status'>) => {
    const req: RewardRequest = { ...data, id: generateId(), requestedAt: new Date().toISOString(), status: 'pending' };
    rewardStorage.addRequest(req);
    refresh();
  }, [refresh]);

  const updateRewardRequest = useCallback((id: string, data: Partial<RewardRequest>) => {
    rewardStorage.updateRequest(id, data);
    refresh();
  }, [refresh]);

  const getRequestsForParticipant = useCallback((participantId: string) =>
    rewardRequests.filter(r => r.participantId === participantId), [rewardRequests]);

  const getRequestsForParent = useCallback((parentEmail: string) =>
    rewardRequests.filter(r => r.parentEmail?.toLowerCase() === parentEmail.toLowerCase()), [rewardRequests]);

  const getPendingForParent = useCallback((parentEmail: string) =>
    rewardRequests.filter(r => r.parentEmail?.toLowerCase() === parentEmail.toLowerCase() && r.status === 'pending'), [rewardRequests]);

  const addRewardType = useCallback((data: Omit<RewardType, 'id' | 'createdAt'>) => {
    const rt: RewardType = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    rewardStorage.addType(rt);
    refresh();
  }, [refresh]);

  const updateRewardType = useCallback((id: string, data: Partial<RewardType>) => {
    rewardStorage.updateType(id, data);
    refresh();
  }, [refresh]);

  const removeRewardType = useCallback((id: string) => {
    rewardStorage.removeType(id);
    refresh();
  }, [refresh]);

  return (
    <RewardContext.Provider value={{
      rewardTypes, rewardRequests, addRewardRequest, updateRewardRequest,
      getRequestsForParticipant, getRequestsForParent, getPendingForParent,
      addRewardType, updateRewardType, removeRewardType, refresh,
    }}>
      {children}
    </RewardContext.Provider>
  );
}

export function useRewards() {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error('useRewards must be used inside RewardProvider');
  return ctx;
}
