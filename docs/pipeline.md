# CI/CD and Security

GitHub Actions workflow `.github/workflows/ci.yml` runs:
1. Install dependencies for API and SPA.
2. Lint/build/test: `npm run build` + `npm test` for API and SPA.
3. DAST hook: OWASP ZAP baseline scan against `$STAGING_URL` (skipped when the variable is unset).

Set `STAGING_URL` in repository secrets to enable DAST for staging deployments.
