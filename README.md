# ThriveMatrix

ThriveMatrix is a personal finance and life-readiness platform for goals, net worth, investments, insurance, privacy, and planning.

## Stack

- Backend: FastAPI + Python
- Frontend: Next.js
- Database: MariaDB with SQLite fallback for local development
- Local services: Docker Compose for database and supporting services

## Run locally

### Backend

```bash
python -m venv api/.venv
api/.venv/Scripts/python -m pip install -r api/requirements.txt
api/.venv/Scripts/python -m uvicorn app.main:app --app-dir api --reload
```

### Frontend

```bash
npm install --prefix web
npm run dev --prefix web
```

### Docker

```bash
docker compose up -d
```

Stop the stack when not in use:

```bash
docker compose down
```

## Project structure

```text
api/
web/
docs/
README.md
```

## Notes

- Keep `.env` values out of version control.
- Use Docker only for the services you need locally.
- The project is evolving toward a MariaDB-backed architecture while keeping the local development flow lightweight.
