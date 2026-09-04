# ThriveMatrix repository guide

This repo contains the FastAPI backend, the Next.js frontend, supporting docs, and the local Docker services used for development. Follow the root [README.md](README.md) for environment details, and keep changes consistent with the existing domain structure under `api/` and `web/`.

## Architecture at a glance

- Backend: FastAPI app in `api/app`, with tests under `api/tests`.
- Frontend: Next.js app in `web/app`, organized by feature/domain route folders.
- Data layer: MariaDB-backed runtime with SQLite fallback for local testing; Docker Compose manages the infrastructure stack.
- Docs: feature plans and PRDs live under `docs/` and should be used as source-of-truth context for domain work.

## Required environment contract

The backend validates `APP_ENV` at runtime. Only these values are accepted:

- `local`
- `development`
- `dev`
- `test`
- `staging`
- `production`
- `prod`

Unknown values fail closed. Production and staging also reject SQLite-backed `DATABASE_URL` values.

## Common commands

### Backend

From the repo root on Windows:

```bash
python -m venv api/.venv
api/.venv/Scripts/python -m pip install -r api/requirements.txt
api/.venv/Scripts/python -m pytest api/tests -q
api/.venv/Scripts/python -m uvicorn app.main:app --app-dir api --reload
```

### Frontend

```bash
npm install --prefix web
npm run dev --prefix web
npm run lint --prefix web
npm run typecheck --prefix web
```

The web app requires Node 22 and npm 10 per `web/package.json`.

### Docker services

```bash
docker compose up -d
docker compose down
```

## Repo conventions

- Keep `.env` values local and uncommitted.
- Prefer domain-specific changes that match the structure already used in `api/app` and `web/app`.
- Use `docs/` implementation notes and module plans as references before creating new architecture or API contracts.
- Favor the smallest targeted change that satisfies the requested behavior and test coverage.
- Before finalizing repo-level or cross-stack changes, validate the relevant backend/frontend command(s) rather than relying on assumptions.
