# Aurora Conflicts Suite

Aurora Conflicts Suite is a modern starter kit that ships an Express API and a Vite + React SPA for conflict-related workflows. It includes a sample Access Review feature with CRUD and audit logging, unit/integration tests, and CI/CD with DAST hooks for staging.

- API: TypeScript + Express with in-memory data store and audit log trail.
- SPA: React + TypeScript, light and vibrant dashboard UI with interactive cards and search.
- CI/CD: GitHub Actions pipeline running tests, web build, and OWASP ZAP baseline scan placeholder for staging.
- Docs: All project documentation lives under `/docs`.

## Quick start

```bash
npm install
npm run test              # runs API + web tests
npm run dev --workspace web  # start the SPA (Vite dev server)
npm run dev --workspace api  # start the API (tsx dev server)
```

Check `/docs` for architecture, API reference, and runbook details.
