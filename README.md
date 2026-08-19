# ThriveMatrix

ThriveMatrix is a holistic wealth progress and life vision management application.

## Stage 0 development

Approved baseline: Node.js 22 LTS with npm, Python 3.12 with FastAPI, PostgreSQL, Redis, S3-compatible object storage, and a React/Next.js client. Financial timestamps are persisted in UTC; the MVP supports INR and USD with manual FX valuations.

### Local prerequisites

- Node.js 22 LTS and npm
- Python 3.12
- Docker Desktop with Compose

### Commands

```powershell
npm install --prefix web
py -3.13 -m venv api/.venv
api/.venv/Scripts/python -m pip install -e api[dev]
Copy-Item .env.example .env
docker compose up -d postgres redis object-storage
npm run dev --prefix web
api/.venv/Scripts/python -m uvicorn app.main:app --app-dir api --reload
```

The web client runs on `http://localhost:3000`; the API runs on `http://localhost:8000` and exposes OpenAPI at `/docs`.

The `.env` file is local-only and must never be committed. Production secrets must come from an approved secret manager.

See [the implementation backlog](docs/implementation-backlog.md) for stage gates, traceability IDs, and approval requirements.
