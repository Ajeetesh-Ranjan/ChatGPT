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
}
