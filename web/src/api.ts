export interface AccessReview {
<<<<<<< HEAD
  id: string;
  subject: string;
  reviewer: string;
  status: "pending" | "approved" | "revoked";
  lastReviewedAt: string;
  notes?: string;
  tags?: string[];
}

export interface AccessReviewPayload extends Omit<AccessReview, "id"> {}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: "created" | "updated" | "deleted";
  actor: string;
  accessReviewId: string;
  before?: AccessReview;
  after?: AccessReview;
}

const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit, apiBase = DEFAULT_API_BASE): Promise<T> {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  const json = (await res.json()) as { data: T };
  return json.data;
}

export async function listAccessReviews(apiBase?: string) {
  return request<AccessReview[]>("/api/access-reviews", undefined, apiBase);
}

export async function fetchAccessReview(id: string, apiBase?: string) {
  return request<AccessReview>(`/api/access-reviews/${id}`, undefined, apiBase);
}

export async function createAccessReview(payload: AccessReviewPayload, apiBase?: string) {
  return request<AccessReview>(
    "/api/access-reviews",
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export async function updateAccessReview(id: string, payload: Partial<AccessReviewPayload>, apiBase?: string) {
  return request<AccessReview>(
    `/api/access-reviews/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    apiBase,
  );
}

export async function deleteAccessReview(id: string, apiBase?: string) {
  const res = await fetch(`${apiBase ?? DEFAULT_API_BASE}/api/access-reviews/${id}` , { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}

export async function fetchAuditTrail(id: string, apiBase?: string) {
  return request<AuditEvent[]>(`/api/access-reviews/${id}/audit`, undefined, apiBase);
=======
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
  id: number;
  action: string;
  actor: string;
  createdAt: string;
  changes?: unknown;
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

const headers = {
  'Content-Type': 'application/json'
};

export async function fetchAccessReviews(): Promise<AccessReview[]> {
  const res = await fetch('/api/access-reviews');
  const data = await res.json();
  return data.reviews;
}

export async function createAccessReview(review: AccessReview): Promise<AccessReview> {
  const res = await fetch('/api/access-reviews', {
    method: 'POST',
    headers,
    body: JSON.stringify(review)
  });
  const data = await res.json();
  return data.review;
}

export async function updateAccessReview(id: number, review: AccessReview): Promise<AccessReview> {
  const res = await fetch(`/api/access-reviews/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(review)
  });
  const data = await res.json();
  return data.review;
}

export async function deleteAccessReview(id: number) {
  await fetch(`/api/access-reviews/${id}`, { method: 'DELETE' });
}

export async function fetchAuditLogs(id: number): Promise<AuditLog[]> {
  const res = await fetch(`/api/access-reviews/${id}/audit-logs`);
  const data = await res.json();
  return data.auditLogs;
}

export async function fetchORRColumns(): Promise<ORRColumn[]> {
  const res = await fetch('/api/orr/application-columns');
  const data = await res.json();
  return data.columns;
}

export async function createApplication(app: ApplicationProfile): Promise<ApplicationProfile> {
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers,
    body: JSON.stringify(app)
  });
  const data = await res.json();
  return data.application;
}

export async function fetchApplications(): Promise<ApplicationProfile[]> {
  const res = await fetch('/api/applications');
  const data = await res.json();
  return data.applications;
>>>>>>> origin/main
}
