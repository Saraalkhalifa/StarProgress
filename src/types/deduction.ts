export type DeductionStatus = 'pending_review' | 'active' | 'reversed' | 'rejected';
export type AcknowledgmentStatus = 'not_viewed' | 'viewed' | 'acknowledged';
export type IssuerRole = 'admin' | 'main_admin' | 'parent';

export interface BehaviorCategory {
  id: string;
  name: string;
  nameAr: string;
  recMin: number;
  recMax: number;
  maxAllowed: number;
  requiresEvidence: boolean;
  requiresAdminReview: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface BehavioralDeduction {
  id: string;
  idempotencyKey?: string;
  participantId: string;
  participantNameSnap: string;
  categoryId: string;
  categoryLabelSnap: string;
  pointsDeducted: number;
  reason: string;
  internalNote?: string;
  evidenceNote?: string;
  incidentDate: string;       // YYYY-MM-DD
  incidentTime?: string;
  issuerId?: string;
  issuerRole: IssuerRole;
  issuerNameSnap: string;
  status: DeductionStatus;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  acknowledgmentStatus: AcknowledgmentStatus;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeductionAuditEntry {
  id: string;
  deductionId?: string;
  action: string;
  actorId?: string;
  actorRole?: string;
  participantId?: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  note?: string;
  createdAt: string;
}
