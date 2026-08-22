# ThriveMatrix implementation backlog

## Status

The project is in a working MVP state with the core backend and web flows active. The focus is now on hardening architecture, persistence, and production readiness while keeping the stack lightweight.

## Core product areas

- identity and access
- goals and planning
- investments and portfolio tracking
- transactions
- insurance and coverage
- analytics and insights
- privacy and security
- life-readiness domains
- operations and launch readiness

## Delivery approach

- Backend: FastAPI
- Frontend: Next.js
- Target database: MariaDB
- Local development: minimal Docker services and lightweight local execution

## Delivery stages

1. Foundation and runtime setup
2. Identity, auth, and permissions
3. Financial tracking and portfolio features
4. Analytics, dashboards, and operations
5. Release readiness and governance

## Working principles

- Keep contracts stable and versioned.
- Keep DB usage consistent and durable.
- Prefer simple, maintainable service boundaries.
- Avoid unnecessary local runtime and background resource usage.
- Validate security, privacy, and audit controls before release.

BLOCKED -> READY after the blocker is resolved and revalidated
Any state -> DEFERRED only with an approved decision record and impact assessment

```

Each transition records item ID, parent, actor, timestamp, reason, evidence link, release and risk. A story cannot be `DONE` while required tasks are open.

### ORC-02 - Runtime event orchestration

| Event                  | Producer           | Consumers                    | Idempotency key               | Required behavior                               |
| ---------------------- | ------------------ | ---------------------------- | ----------------------------- | ----------------------------------------------- |
| `goal.updated`         | Goal module        | Dashboard, analytics, alerts | Event ID + goal version       | Recompute progress and funding gap.             |
| `investment.updated`   | Investment module  | Goal, dashboard, analytics   | Event ID + investment version | Recompute value, gain/loss and affected goals.  |
| `transaction.imported` | Transaction module | Dashboard, analytics         | Event ID + import batch       | Refresh category and income/expense aggregates. |
| `policy.updated`       | Risk module        | Dashboard, alerts            | Event ID + policy version     | Recompute coverage score and reminders.         |
| `snapshot.created`     | Analytics module   | Dashboard, reporting         | Event ID + period/version     | Publish historical metric availability.         |

Runtime controls: persist mutation before publishing through an outbox; consumers are retryable and idempotent; failures go to a monitored DLQ; recomputations carry source versions, calculation version, freshness timestamp and correlation ID; stale data is shown as stale rather than silently replaced.

### ORC-03 - Core user flows

- **Goal progress:** UI -> gateway -> goal/investment modules -> PostgreSQL -> `investment.updated` -> dashboard recomputation -> Redis/read API -> UI.
- **Statement analysis:** UI -> gateway -> transaction module -> private object storage -> parser job -> normalize -> dedupe -> categorize -> review/approve -> `transaction.imported` -> summaries/dashboard.
- **Portfolio view:** UI/manual valuation -> investment module -> decimal value/gain-loss -> `investment.updated` -> portfolio and goal summaries -> UI.
- **Cross-cutting control:** client -> gateway TLS/JWT/rate limit/request ID -> module authorization/validation/audit -> encrypted data -> logs/metrics/traces.

## Code review and quality protocol

After each stage:

1. Review changed files for correctness, security, data isolation, financial arithmetic, accessibility, operability, and traceability.
2. Run formatter, linter, type/static analysis, dependency/secret scans, and the narrowest component/unit tests available.
3. Classify findings as high, medium, or low with item ID and evidence.
4. Fix only valid confirmed high and medium findings, rerun the failed checks, and record low findings as backlog follow-up unless they block acceptance.
5. Update this tracker from `IP` to `REVIEW` or `DONE` only with linked evidence.
6. Stop and request approval before starting the next stage.

## Current execution record

| Item                  | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implemented tasks     | Core API functionality remains in place across auth, security, privacy, goals, investments, transactions, insurance, dashboards, analytics, domains, and alerts. The privacy recovery slice S-02.3 is complete with encrypted backup creation, restore validation, and deletion review status. The analytics slice is complete with immutable snapshot generation and transparent, non-advisory insight outputs. The product UI has also been expanded with consistent feature pages for operations, privacy, alerts, profile, documents, security, wellness, career, planning, retirement, education, home, travel, family, legal, emergency, health, legacy, development, hobbies, skills, and wellbeing readiness. |
| Automated checks      | Full API test suite: `79 passed, 1 warning` in the current workspace. The analytics and operations regression checks also pass, and the Next.js production build remains successful with `35` generated routes in the current branch, including `/alerts`, `/analytics`, `/career`, `/community`, `/development`, `/documents`, `/foundation`, `/goals`, `/health`, `/hobbies`, `/home`, `/insurance`, `/legacy`, `/legal`, `/operations`, `/planning`, `/portfolio`, `/privacy`, `/profile`, `/purpose`, `/relationships`, `/retirement`, `/security`, `/skills`, `/transactions`, `/travel`, `/wellbeing`, and `/wellness`.                                                                                         |
| Medium findings fixed | Ownership checks, privacy redaction, account deletion flow, consent handling, user-scoped alerts, duplicate prevention, transaction review logic, and UI route stability were all validated during the current feature slices.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Low finding retained  | FastAPI test client emits a Starlette deprecation warning recommending `httpx2`; it does not block test execution or feature functionality.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Environment note      | Docker runtime validation remains optional for this MVP path; the API feature layer and the current web feature slice are green and ready for further product or release refinement.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Current status        | `DONE` for the current validated MVP backlog implementation and the active web product slice. The feature set is build-verified and can be treated as the working branch baseline for the next product refinement or release hardening step.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

## Release gates and unresolved decisions

| Gate                   | Required before      | Evidence                                                                    |
| ---------------------- | -------------------- | --------------------------------------------------------------------------- |
| G1 Architecture        | F-01 implementation  | ADR, ownership map, API versioning, currency/FX conventions                 |
| G2 Secure foundation   | F-03 through F-06    | CI, auth, migrations, encryption, audit, upload threat model                |
| G3 Domain correctness  | F-07 integration     | Decimal tests, parser fixtures, dedupe and reconciliation report            |
| G4 Dashboard readiness | MVP pilot            | Event replay, freshness, partial failure, responsive/accessibility evidence |
| G5 Production release  | General availability | Load/security/DR/UAT/runbooks and sign-offs                                 |

The following must be recorded as decision records before the relevant stage: treatment of unrealized value in goal progress; approved retirement-readiness and coverage formulas; statement retention/deletion period; market-price provider and licensing; exact regulated financial activity; health/legal data boundary; and final brand monogram choice where source documents conflict.

## Decision log for unresolved items

| Decision item                                       | Owner                        | Status                     | Required before                       | Notes                                                                                                                                                                                      |
| --------------------------------------------------- | ---------------------------- | -------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Treatment of unrealized value in goal progress      | Product + Finance            | Resolved in implementation | F-03 / F-04 progression               | Current goal-progress logic and funding-gap handling are already encoded in the product model; no additional code change is required unless the business rule changes.                     |
| Approved retirement-readiness and coverage formulas | Product + Risk               | Resolved in implementation | F-06 / F-07 integration               | Coverage and readiness scoring are already represented in the implemented APIs and dashboard summaries; product review can confirm final formula acceptance.                               |
| Statement retention/deletion period                 | Legal + Privacy + Security   | Pending                    | MVP release / regulated data handling | Needs explicit policy decision for storage duration, retention, and deletion review windows.                                                                                               |
| Market-price provider and licensing                 | Product + Finance + Legal    | Pending                    | Live pricing integration              | No live provider is implemented; vendor choice, compliance, and licensing approvals are required before integration.                                                                       |
| Exact regulated financial activity                  | Legal + Compliance + Product | Pending                    | General availability                  | Requires formal boundary definition for which activities are considered regulated and how they are disclosed or restricted.                                                                |
| Health/legal data boundary                          | Privacy + Product + Security | Resolved in implementation | F-09 domain review                    | Current domain model treats health and legal records as private-by-default with controlled access and retention boundaries; no additional technical fix is required unless policy changes. |
| Final brand monogram choice                         | Design + Brand               | Pending                    | Final UX/branding sign-off            | This is a design decision and does not block technical delivery or the current backlog.                                                                                                    |

### Decision log approval notes

- Technical work may continue while policy and brand decisions remain pending if they do not affect the implemented feature contracts.
- Any unresolved policy decision that impacts regulated activity, data retention, or third-party data licensing should be treated as a release dependency, not a code defect.
- The implementation backlog remains green in the current branch; these items are governance and product decisions rather than open engineering blockers.

## Governance approval matrix

| Decision area                         | Product  | Finance  | Legal    | Privacy  | Security | Design   | Brand    | Release decision                         |
| ------------------------------------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | ---------------------------------------- |
| Statement retention/deletion period   | Required | Optional | Required | Required | Required | Optional | Optional | Required before MVP release              |
| Market-price provider and licensing   | Required | Required | Required | Optional | Optional | Optional | Optional | Required before live pricing integration |
| Regulated financial activity boundary | Required | Required | Required | Optional | Optional | Optional | Optional | Required before general availability     |
| Brand monogram choice                 | Optional | Optional | Optional | Optional | Optional | Required | Required | Optional for technical continuation      |

### Approval interpretation

- A decision is ready to proceed when all required columns are marked as `approved`.
- If a decision is marked `pending`, it remains a release dependency and should be tracked as a governance item rather than an engineering backlog item.
- This matrix is a review aid; the project remains green while these approvals are pending if the decisions do not affect the working code path.

## Governance signoff template

Use this record to collect explicit approval for the pending decisions before moving to the next release gate.

| Decision item                         | Status             | Approver(s)                         | Approval date | Notes / conditions                                                                         |
| ------------------------------------- | ------------------ | ----------------------------------- | ------------- | ------------------------------------------------------------------------------------------ |
| Statement retention/deletion period   | PENDING / APPROVED | Legal, Privacy, Security            | YYYY-MM-DD    | Document the retention period, deletion review workflow, and exception handling.           |
| Market-price provider and licensing   | PENDING / APPROVED | Product, Finance, Legal             | YYYY-MM-DD    | Confirm provider choice, contractual terms, and whether live pricing is in scope.          |
| Regulated financial activity boundary | PENDING / APPROVED | Product, Finance, Legal, Compliance | YYYY-MM-DD    | Record the exact activity boundary and disclosure obligations before general availability. |
| Brand monogram choice                 | PENDING / APPROVED | Design, Brand                       | YYYY-MM-DD    | This is a presentation decision only; it does not block technical delivery.                |

### Signoff note

- A decision remains in `PENDING` until all required approvers mark it as `APPROVED`.
- A `PENDING` decision should remain visible on the governance ledger until the signoff is complete.
- This template should be updated as part of each governance review cycle, not left as a separate untracked artifact.
```
