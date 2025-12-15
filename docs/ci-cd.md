# CI/CD & Security Scans

The repository ships a GitHub Actions workflow (`.github/workflows/ci.yml`) that covers:

1. **Unit & integration tests**: Runs `npm run test` across API and web workspaces using Node 20.
2. **Build check**: Builds the Vite SPA to ensure production assets compile.
3. **DAST placeholder**: Runs OWASP ZAP baseline against a configurable staging URL. Set `STAGING_URL` secret or repository variable to point at the deployed app before enabling.

## Local validation
- `npm run test` to execute all tests.
- `npm run build --workspace web` to ensure the SPA compiles.
- For manual API checks, `curl http://localhost:4000/api/access-reviews` after starting the API with `npm run dev --workspace api`.
