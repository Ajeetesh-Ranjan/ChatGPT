<<<<<<< HEAD
export type AccessStatus = "pending" | "approved" | "revoked";

export interface AccessReview {
  id: string;
  subject: string;
  reviewer: string;
  status: AccessStatus;
  lastReviewedAt: string;
  notes?: string;
  tags?: string[];
}

export interface AuditEvent {
  id: string;
  accessReviewId: string;
  action: "created" | "updated" | "deleted";
  timestamp: string;
  actor: string;
  before?: Partial<AccessReview>;
  after?: Partial<AccessReview>;
=======
export interface AccessReview {
  id?: number;
  application: string;
  reviewer: string;
  status: string;
  dueDate: string;
  ownerRole: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id?: number;
  entityType: string;
  entityId: number;
  action: string;
  actor: string;
  changes?: unknown;
  createdAt?: string;
}

export interface ApplicationProfile {
  id?: number;
  name: string;
  businessUnit: string;
  serviceLine?: string;
  dataClassification?: string;
  criticality?: string;
  hostingModel?: string;
  owner?: string;
  itOwner?: string;
  complianceScope?: string;
  recoveryObjective?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ORRColumn {
  key: string;
  label: string;
  description: string;
  required: boolean;
>>>>>>> origin/main
}
