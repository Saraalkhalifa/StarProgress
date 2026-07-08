import type { RewardType, RewardRequest } from '../types';

const TYPES_KEY = 'ah_reward_types';
const REQS_KEY = 'ah_reward_requests';

function lsGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; }
  catch { return []; }
}
function lsSet<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const DEFAULT_TYPES: RewardType[] = [
  { id: 'r1', name: 'PlayStation Time', description: 'Enjoy PlayStation gaming', pointCost: 50, costType: 'per_hour', maxDuration: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'r2', name: 'Nintendo Time', description: 'Enjoy Nintendo gaming', pointCost: 50, costType: 'per_hour', maxDuration: 3, isActive: true, createdAt: new Date().toISOString() },
  { id: 'r3', name: 'Visit a Friend', description: "Go visit a friend's house", pointCost: 50, costType: 'fixed', isActive: true, createdAt: new Date().toISOString() },
  { id: 'r4', name: 'Watch a Movie', description: 'Choose a movie to watch', pointCost: 40, costType: 'fixed', isActive: true, createdAt: new Date().toISOString() },
  { id: 'r5', name: 'Extra Screen Time', description: 'Extra screen time on your device', pointCost: 50, costType: 'per_hour', maxDuration: 2, isActive: true, createdAt: new Date().toISOString() },
  { id: 'r6', name: 'Choose Family Game', description: 'Pick the family game for game night', pointCost: 30, costType: 'fixed', isActive: true, createdAt: new Date().toISOString() },
  { id: 'r7', name: 'Choose Dinner', description: "Choose what's for dinner tonight", pointCost: 40, costType: 'fixed', isActive: true, createdAt: new Date().toISOString() },
  { id: 'r8', name: 'Stay Up 30 Min Later', description: 'Stay up 30 minutes past bedtime', pointCost: 30, costType: 'fixed', isActive: true, createdAt: new Date().toISOString() },
];

export const rewardStorage = {
  getTypes: (): RewardType[] => {
    const existing = lsGet<RewardType>(TYPES_KEY);
    if (existing.length === 0) {
      lsSet(TYPES_KEY, DEFAULT_TYPES);
      return DEFAULT_TYPES;
    }
    return existing;
  },
  addType: (rt: RewardType): void => { lsSet(TYPES_KEY, [rt, ...lsGet<RewardType>(TYPES_KEY)]); },
  updateType: (id: string, data: Partial<RewardType>): void => {
    lsSet(TYPES_KEY, lsGet<RewardType>(TYPES_KEY).map(r => r.id === id ? { ...r, ...data } : r));
  },
  removeType: (id: string): void => { lsSet(TYPES_KEY, lsGet<RewardType>(TYPES_KEY).filter(r => r.id !== id)); },

  getRequests: (): RewardRequest[] => lsGet<RewardRequest>(REQS_KEY),
  getRequestsForParent: (parentEmail: string): RewardRequest[] =>
    lsGet<RewardRequest>(REQS_KEY).filter(r => r.parentEmail === parentEmail || r.parentId),
  getRequestsForParticipant: (participantId: string): RewardRequest[] =>
    lsGet<RewardRequest>(REQS_KEY).filter(r => r.participantId === participantId),
  addRequest: (req: RewardRequest): void => { lsSet(REQS_KEY, [req, ...lsGet<RewardRequest>(REQS_KEY)]); },
  updateRequest: (id: string, data: Partial<RewardRequest>): void => {
    lsSet(REQS_KEY, lsGet<RewardRequest>(REQS_KEY).map(r => r.id === id ? { ...r, ...data } : r));
  },
};
