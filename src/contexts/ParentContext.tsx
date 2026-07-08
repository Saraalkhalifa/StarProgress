import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ParentChildLink, ParentAccessRequest, ParentPermissions } from '../types';
import { useAuth } from './AuthContext';
import * as ps from '../lib/parentStorage';

interface ParentContextType {
  links: ParentChildLink[];
  accessRequests: ParentAccessRequest[];
  getChildLink: (participantId: string) => ParentChildLink | undefined;
  hasPermission: (participantId: string, perm: keyof ParentPermissions) => boolean;
  submitAccessRequest: (data: Omit<ParentAccessRequest, 'id' | 'parentId' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote' | 'parentName' | 'parentEmail' | 'parentPhone' | 'matchedParticipantName' | 'matchedParticipantUsername'>) => Promise<void>;
  cancelAccessRequest: (requestId: string) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const ParentContext = createContext<ParentContextType | null>(null);

export function ParentProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [links, setLinks] = useState<ParentChildLink[]>([]);
  const [accessRequests, setAccessRequests] = useState<ParentAccessRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'parent') {
      setLinks([]);
      setAccessRequests([]);
      return;
    }
    setLoading(true);
    try {
      const [fetchedLinks, fetchedRequests] = await Promise.all([
        ps.getLinksForParent(currentUser.id),
        ps.getAccessRequestsForParent(currentUser.id),
      ]);
      // Only expose approved links to the parent
      setLinks(fetchedLinks.filter(l => l.status === 'approved'));
      setAccessRequests(fetchedRequests);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { void refresh(); }, [refresh]);

  const getChildLink = useCallback(
    (participantId: string) => links.find(l => l.participantId === participantId && l.status === 'approved'),
    [links]
  );

  const hasPermission = useCallback(
    (participantId: string, perm: keyof ParentPermissions): boolean => {
      const link = links.find(l => l.participantId === participantId && l.status === 'approved');
      if (!link) return false;
      return Boolean(link.permissions[perm]);
    },
    [links]
  );

  const submitAccessRequest = useCallback(async (
    data: Omit<ParentAccessRequest, 'id' | 'parentId' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewedBy' | 'reviewNote' | 'parentName' | 'parentEmail' | 'parentPhone' | 'matchedParticipantName' | 'matchedParticipantUsername'>
  ) => {
    if (!currentUser) return;
    await ps.createAccessRequest({ ...data, parentId: currentUser.id });
    await refresh();
  }, [currentUser, refresh]);

  const cancelAccessRequest = useCallback(async (requestId: string) => {
    await ps.updateAccessRequest(requestId, { status: 'cancelled' });
    await refresh();
  }, [refresh]);

  return (
    <ParentContext.Provider value={{
      links, accessRequests, getChildLink, hasPermission,
      submitAccessRequest, cancelAccessRequest, refresh, loading,
    }}>
      {children}
    </ParentContext.Provider>
  );
}

export function useParent() {
  const ctx = useContext(ParentContext);
  if (!ctx) throw new Error('useParent must be used within ParentProvider');
  return ctx;
}

export function useParentSafe() {
  return useContext(ParentContext);
}
