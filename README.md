<<<<<<< HEAD
# Aurora Conflicts Suite

Aurora Conflicts Suite is a modern starter kit that ships an Express API and a Vite + React SPA for conflict-related workflows. It includes a sample Access Review feature with CRUD and audit logging, unit/integration tests, and CI/CD with DAST hooks for staging.

- API: TypeScript + Express with in-memory data store and audit log trail.
- SPA: React + TypeScript, light and vibrant dashboard UI with interactive cards, search, and live Access Review CRUD.
- CI/CD: GitHub Actions pipeline running tests, web build, and OWASP ZAP baseline scan placeholder for staging.
- Docs: All project documentation lives under `/docs`.

## Quick start

```bash
npm install
npm run test              # runs API + web tests
npm run dev --workspace web  # start the SPA (Vite dev server)
npm run dev --workspace api  # start the API (tsx dev server)

# Point the SPA to the API (optional; falls back to seeded data)
VITE_API_BASE=http://localhost:4000 npm run dev --workspace web
```

Check `/docs` for architecture, API reference, and runbook details.
=======
# AegisAccess

AegisAccess is an organizational web API + SPA starter for application management and access reviews. It aligns application capture to PwC AU ORR fields and provides audited CRUD for access reviews.

- API: Express + SQLite with audit logs.
- SPA: React + Vite experience for IT owners and managers.
- CI/CD: GitHub Actions pipeline running tests/builds and OWASP ZAP DAST hook for staging.

See `/docs` for setup, architecture, and pipeline details.
>>>>>>> origin/main
