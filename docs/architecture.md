# Architecture

## API (api/)
- Express server with SQLite for persistence.
- Tables: `access_reviews`, `audit_logs`, `applications`.
- Endpoints:
  - `GET /health`
  - `GET /api/orr/application-columns` for PwC AU ORR-aligned metadata.
  - CRUD for `/api/access-reviews` with `/api/access-reviews/:id/audit-logs`.
  - `GET/POST /api/applications` for the IT owner registry workflow.
- Audit logging persists create/update/delete events.

## SPA (web/)
- Vite + React TypeScript single-page app.
- Features:
  - Capture and list access reviews with audit visibility.
  - IT owner application capture with ORR column hints.
  - Application registry table.
- Local dev proxy points to API on port 4000.

## Data
- Default SQLite file stored at `api/data/dev.db` (created automatically).
- Tests use in-memory SQLite (`:memory:`) via Jest setup.
