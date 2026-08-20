# ThriveMatrix

ThriveMatrix is a personal financial and life-readiness management platform focused on goals, investments, insurance, analytics, privacy, and planning insight. The current repository is a FastAPI-based MVP that validates the core domain flows without requiring a production-grade data warehouse or external service dependencies.

## Current status

The project is in a verified MVP state for the implemented API backlog and the active product UI slice. The current branch is green with:

- 58 passed in the backend suite
- 1 non-blocking dependency warning from the FastAPI/TestClient stack
- Next.js production build succeeded with 35 generated routes
- Privacy recovery slice S-02.3 verified with encrypted backup, restore, and delete-review flow

The local validation commands used are:

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
api/.venv/Scripts/python -m pytest -q api/tests
npm --prefix web run build
```

The project also includes a one-command startup script for the required local services:

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
./scripts/start-local.ps1
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
- Health, legal, relationship, emergency, legacy, and broader life-readiness domains
- User-facing alerts for overdue goals and expiring policies

The current web product slice includes the following feature routes:

- Overview, Goals, Portfolio, Transactions, Insurance
- Privacy, Security, Documents, Profile, Operations
- Analytics, Alerts, Wellness, Career, Planning, Retirement
- Education, Home, Travel, Family, Legal, Emergency, Health, Legacy

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

The production build should be checked with:

```powershell
cd "D:\Raveendran\thrivematrix\ThriveMatrix"
npm --prefix web run build
```

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
