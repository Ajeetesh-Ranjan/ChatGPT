import request from 'supertest';
import { app } from './app';
import { initializeSchema } from './db';

beforeAll(async () => {
  await initializeSchema();
});

describe('AegisAccess API', () => {
  it('responds to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('AegisAccess');
  });

  it('returns ORR application columns', async () => {
    const res = await request(app).get('/api/orr/application-columns');
    expect(res.status).toBe(200);
    expect(res.body.columns).toBeDefined();
    expect(res.body.columns.length).toBeGreaterThan(3);
  });

  it('creates, updates, lists, and deletes an access review with audit logs', async () => {
    const createRes = await request(app)
      .post('/api/access-reviews')
      .send({
        application: 'Payroll',
        reviewer: 'Alex Manager',
        status: 'pending',
        dueDate: '2024-12-31',
        ownerRole: 'IT Owner'
      });
    expect(createRes.status).toBe(201);
    const reviewId = createRes.body.review.id;

    const listRes = await request(app).get('/api/access-reviews');
    expect(listRes.status).toBe(200);
    expect(listRes.body.reviews.length).toBeGreaterThan(0);

    const updateRes = await request(app)
      .put(`/api/access-reviews/${reviewId}`)
      .send({
        application: 'Payroll',
        reviewer: 'Alex Manager',
        status: 'approved',
        dueDate: '2024-12-31',
        ownerRole: 'IT Owner'
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.review.status).toBe('approved');

    const auditRes = await request(app).get(`/api/access-reviews/${reviewId}/audit-logs`);
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.auditLogs.length).toBeGreaterThan(0);

    const deleteRes = await request(app).delete(`/api/access-reviews/${reviewId}`);
    expect(deleteRes.status).toBe(204);
  });

  it('creates application profiles using ORR-driven columns', async () => {
    const res = await request(app)
      .post('/api/applications')
      .send({
        name: 'Aegis Portal',
        businessUnit: 'Advisory',
        dataClassification: 'Confidential',
        criticality: 'High',
        hostingModel: 'Cloud',
        owner: 'Jordan Lee',
        itOwner: 'Taylor Chen',
        complianceScope: 'SOX',
        recoveryObjective: 'RTO 4h',
        serviceLine: 'Digital'
      });
    expect(res.status).toBe(201);
    expect(res.body.application.name).toBe('Aegis Portal');

    const list = await request(app).get('/api/applications');
    expect(list.body.applications.length).toBeGreaterThan(0);
  });
});
