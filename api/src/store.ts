import { randomUUID } from "crypto";
import { AccessReview, AuditEvent } from "./types.js";

export class AccessReviewStore {
  private reviews: Map<string, AccessReview> = new Map();
  private audit: AuditEvent[] = [];

  constructor(seed: AccessReview[] = []) {
    seed.forEach((r) => this.create(r, "system"));
  }

  list() {
    return Array.from(this.reviews.values());
  }

  get(id: string) {
    return this.reviews.get(id);
  }

  create(input: Omit<AccessReview, "id"> & { id?: string }, actor: string) {
    const id = input.id ?? randomUUID();
    const review: AccessReview = { ...input, id };
    this.reviews.set(id, review);
    this.logAudit({
      accessReviewId: id,
      action: "created",
      actor,
      after: review,
    });
    return review;
  }

  update(id: string, patch: Partial<AccessReview>, actor: string) {
    const existing = this.reviews.get(id);
    if (!existing) return undefined;
    const updated: AccessReview = { ...existing, ...patch, id };
    this.reviews.set(id, updated);
    this.logAudit({
      accessReviewId: id,
      action: "updated",
      actor,
      before: existing,
      after: updated,
    });
    return updated;
  }

  delete(id: string, actor: string) {
    const existing = this.reviews.get(id);
    if (!existing) return false;
    this.reviews.delete(id);
    this.logAudit({ accessReviewId: id, action: "deleted", actor, before: existing });
    return true;
  }

  auditLog(accessReviewId?: string) {
    return this.audit.filter((a) => !accessReviewId || a.accessReviewId === accessReviewId);
  }

  private logAudit(event: Omit<AuditEvent, "id" | "timestamp">) {
    const auditEntry: AuditEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.audit.push(auditEntry);
  }
}

export const defaultStore = new AccessReviewStore([
  {
    id: "ci-001",
    subject: "Client CI144118322",
    reviewer: "Anton Linschoten",
    status: "approved",
    lastReviewedAt: new Date().toISOString(),
    notes: "Baseline access confirmed.",
    tags: ["tier-4", "salesforce"],
  },
  {
    id: "ci-002",
    subject: "ARR0056449",
    reviewer: "Rob Kopel",
    status: "pending",
    lastReviewedAt: new Date().toISOString(),
    notes: "Awaiting DR sign-off.",
    tags: ["wap", "genai"],
  },
]);
