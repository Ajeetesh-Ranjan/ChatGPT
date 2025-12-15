import request from "supertest";
import { describe, expect, it } from "vitest";
import { makeApp } from "./app.js";
import { AccessReviewStore } from "./store.js";

const store = new AccessReviewStore();
const app = makeApp(store);

describe("access review API", () => {
  it("creates, reads, updates, deletes", async () => {
    const createdRes = await request(app)
      .post("/api/access-reviews")
      .send({ subject: "CI144118322", reviewer: "Analyst", status: "pending" })
      .expect(201);

    const id = createdRes.body.data.id;
    await request(app).get(`/api/access-reviews/${id}`).expect(200);

    await request(app)
      .put(`/api/access-reviews/${id}`)
      .send({ status: "approved", notes: "validated" })
      .expect(200);

    const auditRes = await request(app).get(`/api/access-reviews/${id}/audit`).expect(200);
    expect(auditRes.body.data.length).toBeGreaterThan(1);

    await request(app).delete(`/api/access-reviews/${id}`).expect(204);
  });
});
