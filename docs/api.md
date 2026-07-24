# API Reference

Base URL defaults to `http://localhost:4000` when running locally.

## Health
- `GET /health` → `{ status: "ok" }`

## Access Reviews
- `GET /api/access-reviews` → list of reviews.
- `GET /api/access-reviews/:id` → specific review (404 if missing).
- `POST /api/access-reviews` → create review. Body:
  ```json
  {
    "subject": "CI144118322",
    "reviewer": "Analyst",
    "status": "pending",
    "lastReviewedAt": "2024-01-01T00:00:00.000Z",
    "notes": "string",
    "tags": ["salesforce"]
  }
  ```
- `PUT /api/access-reviews/:id` → update any fields.
- `DELETE /api/access-reviews/:id` → delete review (204 on success).

## Audit
- `GET /api/access-reviews/:id/audit` → audit trail for a review.
- `GET /api/audit` → full audit log.

All endpoints validate payloads with Zod and return `{ error }` on failure.
