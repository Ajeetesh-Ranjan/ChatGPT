import express from "express";
import cors from "cors";
import { z } from "zod";
import { AccessReview } from "./types.js";
import { AccessReviewStore, defaultStore } from "./store.js";

export const makeApp = (store: AccessReviewStore = defaultStore) => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const reviewSchema = z.object({
    id: z.string().optional(),
    subject: z.string().min(3),
    reviewer: z.string().min(3),
    status: z.enum(["pending", "approved", "revoked"]),
    lastReviewedAt: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
  });

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.get("/api/access-reviews", (_req, res) => {
    res.json({ data: store.list() });
  });

  app.get("/api/access-reviews/:id", (req, res) => {
    const review = store.get(req.params.id);
    if (!review) return res.status(404).json({ error: "Not found" });
    res.json({ data: review });
  });

  app.post("/api/access-reviews", (req, res) => {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const body = parsed.data as AccessReview;
    const review = store.create({ ...body, lastReviewedAt: body.lastReviewedAt ?? new Date().toISOString() }, "api");
    res.status(201).json({ data: review });
  });

  app.put("/api/access-reviews/:id", (req, res) => {
    const parsed = reviewSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const updated = store.update(req.params.id, parsed.data, "api");
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ data: updated });
  });

  app.delete("/api/access-reviews/:id", (req, res) => {
    const removed = store.delete(req.params.id, "api");
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  });

  app.get("/api/access-reviews/:id/audit", (req, res) => {
    const review = store.get(req.params.id);
    if (!review) return res.status(404).json({ error: "Not found" });
    res.json({ data: store.auditLog(req.params.id) });
  });

  app.get("/api/audit", (_req, res) => {
    res.json({ data: store.auditLog() });
  });

  return app;
};
