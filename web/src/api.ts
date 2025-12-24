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
}
