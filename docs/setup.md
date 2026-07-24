# Setup

## Prerequisites
- Node.js 20+
- npm

## Install dependencies
```bash
cd api && npm install
cd ../web && npm install
```

## Run locally
In two terminals:
1. API: `cd api && npm run dev`
2. SPA: `cd web && npm run dev`

The SPA proxies API calls to `http://localhost:4000` and serves on `http://localhost:5173`.

## Run tests
- API unit/integration: `cd api && npm test`
- SPA tests: `cd web && npm test`

## Build
- API: `cd api && npm run build`
- SPA: `cd web && npm run build`
