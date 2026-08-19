# ThriveMatrix

ThriveMatrix is a personal financial and life-readiness management platform focused on goals, investments, insurance, analytics, privacy, and planning insight. The current repository is a FastAPI-based MVP that validates the core domain flows without requiring a production-grade data warehouse or external service dependencies.

## Current status

The project is in a verified MVP state for the implemented API backlog. The validated local suite currently passes with:

- 53 passed
- 1 non-blocking warning from the FastAPI TestClient/Starlette dependency stack

The full regression command used locally is:

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
api/.venv/Scripts/python -m pytest -q api/tests
```

## Product scope

The current API covers:

- Auth, access control, and role enforcement
- Privacy exports, account deletion, consent tracking, and redaction
- Goal creation and ownership scoping
- Investment tracking and portfolio summary
- Transaction import and review flows
- Insurance policy tracking and coverage scoring
- Analytics snapshots and explainable insights
- Dashboard, launch governance, and release status endpoints
- Health, legal, relationship, and readiness domain records
- User-facing alerts for overdue goals and expiring policies

## Local setup

### Prerequisites

- Python 3.12+ (local workspace validation used Python 3.13 compatibility where needed)
- Node.js 22 LTS recommended for client-side tooling
- npm
- Optional: Docker Desktop/Compose for local service orchestration

### Backend setup

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
python -m venv api/.venv
api/.venv/Scripts/python -m pip install --upgrade pip
api/.venv/Scripts/python -m pip install -e api[dev]
```

### Run the API locally

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
api/.venv/Scripts/python -m uvicorn app.main:app --app-dir api --reload
```

The API is available at:

- http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs

### Run the web app

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
npm install --prefix web
npm run dev --prefix web
```

The web server is expected at:

- http://localhost:3000

## Repository layout

```text
README.md
api/
  app/
    main.py
  tests/
    ...feature tests...
web/
  ...Next.js client source...
docs/
  implementation-backlog.md
```

## Safety and configuration notes

- Local `.env` files are repository-local only and should never be committed.
- Secrets and sensitive values must be stored in an approved secret manager in real deployments.
- The current MVP uses in-memory state for rapid prototype validation and is not yet a production persistence layer.

See [docs/implementation-backlog.md](docs/implementation-backlog.md) for the tracked delivery plan, statuses, and stage gates.
