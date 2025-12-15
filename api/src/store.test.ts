import { describe, expect, it } from "vitest";
import { AccessReviewStore } from "./store.js";

const actor = "tester";

describe("AccessReviewStore", () => {
  it("creates and reads reviews with audit", () => {
    const store = new AccessReviewStore();
    const review = store.create(
      {
        subject: "Client A",
        reviewer: "Analyst 1",
        status: "pending",
        lastReviewedAt: new Date().toISOString(),
      },
      actor,
    );

    expect(store.list()).toHaveLength(1);
    const audit = store.auditLog(review.id);
    expect(audit.at(0)?.action).toBe("created");
  });

  it("updates review and tracks audit delta", () => {
    const store = new AccessReviewStore();
    const review = store.create(
      {
        subject: "Client B",
        reviewer: "Analyst 2",
        status: "pending",
        lastReviewedAt: new Date().toISOString(),
      },
      actor,
    );

    const updated = store.update(review.id, { status: "approved" }, actor);
    expect(updated?.status).toBe("approved");
    const audit = store.auditLog(review.id);
    expect(audit.at(-1)?.action).toBe("updated");
    expect(audit.at(-1)?.before?.status).toBe("pending");
  });

  it("deletes review and logs audit", () => {
    const store = new AccessReviewStore();
    const review = store.create(
      {
        subject: "Client C",
        reviewer: "Analyst 3",
        status: "pending",
        lastReviewedAt: new Date().toISOString(),
      },
      actor,
    );

    const removed = store.delete(review.id, actor);
    expect(removed).toBe(true);
    expect(store.get(review.id)).toBeUndefined();
    const audit = store.auditLog(review.id);
    expect(audit.at(-1)?.action).toBe("deleted");
  });
});
