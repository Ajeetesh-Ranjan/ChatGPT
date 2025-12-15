# Aurora Conflicts Suite Architecture

Aurora Conflicts Suite pairs a lightweight Express API with a React SPA to visualise TFD content and manage a sample Access Review workflow.

## Components
- **API (`/api`)**: Express + TypeScript service exposing Access Review CRUD and audit endpoints. Uses an in-memory store seeded with example records.
- **Web (`/web`)**: Vite + React SPA with a light, vibrant dashboard that mirrors the TFD content and embeds the Access Review experience.
- **Docs (`/docs`)**: This directory centralises architecture, API, CI/CD, and operational notes.

## Access Review flow
1. SPA lets analysts search sections, highlight matches, and manage Access Review entries.
2. API handles `create/read/update/delete` requests and records audit events per action.
3. Audit endpoints surface a trail for each review or the full system.

## Local development
- Run `npm install` once at repo root.
- Start API: `npm run dev --workspace api` (listens on `:4000`).
- Start SPA: `npm run dev --workspace web` (listens on `:5173`). Set `VITE_API_BASE=http://localhost:4000` to exercise live API
  CRUD; without it the SPA uses the seeded client-side data for portability.
- Update `.env` values as needed; defaults rely solely on in-memory data for portability.

## Data & persistence
- In-memory storage keeps the starter lean. Replace `AccessReviewStore` with a database adapter (e.g., Postgres, Cosmos) in `api/src/store.ts` and wire migrations/tests accordingly.

## Security
- CORS enabled by default for rapid prototyping; tighten origins before production.
- Input validation with Zod to reduce malformed payload risk.
- CI adds a ZAP baseline DAST job targeting a configurable staging URL.
