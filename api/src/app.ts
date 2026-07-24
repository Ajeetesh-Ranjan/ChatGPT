<<<<<<< HEAD
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
=======
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { all, get, initializeSchema, run } from './db';
import { AccessReview, ApplicationProfile, AuditLog, ORRColumn } from './types';

export const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const ORR_COLUMNS: ORRColumn[] = [
  {
    key: 'name',
    label: 'Application Name',
    description: 'Official name used within the PwC AU Operational Risk Register.',
    required: true
  },
  {
    key: 'businessUnit',
    label: 'Business Unit',
    description: 'Primary business unit accountable for the application.',
    required: true
  },
  {
    key: 'serviceLine',
    label: 'Service Line',
    description: 'Service line or capability aligned to the application.',
    required: false
  },
  {
    key: 'dataClassification',
    label: 'Data Classification',
    description: 'PwC AU data classification for stored or processed data.',
    required: true
  },
  {
    key: 'criticality',
    label: 'Criticality',
    description: 'Operational criticality or ORR impact rating.',
    required: true
  },
  {
    key: 'hostingModel',
    label: 'Hosting Model',
    description: 'Hosting pattern (cloud, on-premises, hybrid).',
    required: true
  },
  {
    key: 'owner',
    label: 'Business Owner',
    description: 'Manager responsible for outcomes and budget.',
    required: true
  },
  {
    key: 'itOwner',
    label: 'IT Owner',
    description: 'IT owner accountable for operations and controls.',
    required: true
  },
  {
    key: 'complianceScope',
    label: 'Compliance Scope',
    description: 'Regulatory or policy scope (e.g., SOX, ISO 27001).',
    required: false
  },
  {
    key: 'recoveryObjective',
    label: 'Recovery Objective',
    description: 'Documented RTO/RPO or DR tier recorded in the ORR.',
    required: false
  }
];

function mapReview(row: any): AccessReview {
  return {
    id: row.id,
    application: row.application,
    reviewer: row.reviewer,
    status: row.status,
    dueDate: row.due_date,
    ownerRole: row.owner_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapApplication(row: any): ApplicationProfile {
  return {
    id: row.id,
    name: row.name,
    businessUnit: row.business_unit,
    serviceLine: row.service_line,
    dataClassification: row.data_classification,
    criticality: row.criticality,
    hostingModel: row.hosting_model,
    owner: row.owner,
    itOwner: row.it_owner,
    complianceScope: row.compliance_scope,
    recoveryObjective: row.recovery_objective,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function logAudit(entry: AuditLog) {
  const now = new Date().toISOString();
  await run(
    `INSERT INTO audit_logs (entity_type, entity_id, action, actor, changes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      entry.entityType,
      entry.entityId,
      entry.action,
      entry.actor,
      entry.changes ? JSON.stringify(entry.changes) : null,
      entry.createdAt || now
    ]
  );
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', name: 'AegisAccess' });
});

app.get('/api/orr/application-columns', (_req, res) => {
  res.json({ columns: ORR_COLUMNS });
});

app.get('/api/applications', async (_req, res) => {
  const rows = await all<any>('SELECT * FROM applications ORDER BY created_at DESC');
  res.json({ applications: rows.map(mapApplication) });
});

app.post('/api/applications', async (req, res) => {
  const payload: ApplicationProfile = req.body;
  const now = new Date().toISOString();
  await run(
    `INSERT INTO applications (name, business_unit, service_line, data_classification, criticality, hosting_model, owner, it_owner, compliance_scope, recovery_objective, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name,
      payload.businessUnit,
      payload.serviceLine || null,
      payload.dataClassification || null,
      payload.criticality || null,
      payload.hostingModel || null,
      payload.owner || null,
      payload.itOwner || null,
      payload.complianceScope || null,
      payload.recoveryObjective || null,
      now,
      now
    ]
  );

  const appRow = await get<any>('SELECT * FROM applications ORDER BY id DESC LIMIT 1');
  if (appRow) {
    await logAudit({
      entityType: 'application',
      entityId: appRow.id,
      action: 'created',
      actor: payload.itOwner || payload.owner || 'system',
      changes: payload,
      createdAt: now
    });
    res.status(201).json({ application: mapApplication(appRow) });
  } else {
    res.status(500).json({ error: 'Failed to create application' });
  }
});

app.get('/api/access-reviews', async (_req, res) => {
  const rows = await all<any>('SELECT * FROM access_reviews ORDER BY created_at DESC');
  res.json({ reviews: rows.map(mapReview) });
});

app.post('/api/access-reviews', async (req, res) => {
  const payload: AccessReview = req.body;
  const now = new Date().toISOString();

  await run(
    `INSERT INTO access_reviews (application, reviewer, status, due_date, owner_role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.application,
      payload.reviewer,
      payload.status,
      payload.dueDate,
      payload.ownerRole,
      now,
      now
    ]
  );

  const row = await get<any>('SELECT * FROM access_reviews ORDER BY id DESC LIMIT 1');
  if (row) {
    const review = mapReview(row);
    await logAudit({
      entityType: 'access_review',
      entityId: review.id!,
      action: 'created',
      actor: review.reviewer,
      changes: review,
      createdAt: now
    });
    res.status(201).json({ review });
  } else {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

app.get('/api/access-reviews/:id', async (req, res) => {
  const row = await get<any>('SELECT * FROM access_reviews WHERE id = ?', [req.params.id]);
  if (!row) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  res.json({ review: mapReview(row) });
});

app.put('/api/access-reviews/:id', async (req, res) => {
  const payload: AccessReview = req.body;
  const now = new Date().toISOString();
  const existing = await get<any>('SELECT * FROM access_reviews WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  await run(
    `UPDATE access_reviews SET application = ?, reviewer = ?, status = ?, due_date = ?, owner_role = ?, updated_at = ? WHERE id = ?`,
    [
      payload.application,
      payload.reviewer,
      payload.status,
      payload.dueDate,
      payload.ownerRole,
      now,
      req.params.id
    ]
  );

  const updated = await get<any>('SELECT * FROM access_reviews WHERE id = ?', [req.params.id]);
  await logAudit({
    entityType: 'access_review',
    entityId: Number(req.params.id),
    action: 'updated',
    actor: payload.reviewer,
    changes: { before: mapReview(existing), after: mapReview(updated!) },
    createdAt: now
  });
  res.json({ review: mapReview(updated!) });
});

app.delete('/api/access-reviews/:id', async (req, res) => {
  const existing = await get<any>('SELECT * FROM access_reviews WHERE id = ?', [req.params.id]);
  if (!existing) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }
  await run('DELETE FROM access_reviews WHERE id = ?', [req.params.id]);
  const now = new Date().toISOString();
  await logAudit({
    entityType: 'access_review',
    entityId: Number(req.params.id),
    action: 'deleted',
    actor: existing.reviewer,
    changes: mapReview(existing),
    createdAt: now
  });
  res.status(204).send();
});

app.get('/api/access-reviews/:id/audit-logs', async (req, res) => {
  const logs = await all<any>(
    'SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
    ['access_review', req.params.id]
  );
  res.json({
    auditLogs: logs.map((log) => ({
      id: log.id,
      entityType: log.entity_type,
      entityId: log.entity_id,
      action: log.action,
      actor: log.actor,
      changes: log.changes ? JSON.parse(log.changes) : null,
      createdAt: log.created_at
    })) as AuditLog[]
  });
});

export async function startServer(port = Number(process.env.PORT) || 4000) {
  await initializeSchema();
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`AegisAccess API running on port ${port}`);
      resolve(server);
    });
  });
}
>>>>>>> origin/main
