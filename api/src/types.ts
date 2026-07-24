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
}
