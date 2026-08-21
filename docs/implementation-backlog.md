# ThriveMatrix Implementation Backlog

**Status:** Current implementation snapshot  
**Owner:** Engineering / Product / Security  
**Source documents:** `Product Brief ThriveMatrix.docx`, `ThriveMatrix_PRD.docx`, `ThriveMatrix Architecture.docx`, `login-registration-module-prd.md`  
**Last reviewed:** 2026-08-20

This is the single authoritative implementation tracker. IDs are stable: `F` = feature, `S` = story, `T` = task, `AC` = acceptance criterion, and `ORC` = orchestrator flow.

**Validated baseline:** The local FastAPI suite is passing in the current workspace with `79 passed, 1 warning` from the Starlette/FastAPI TestClient deprecation path. The current branch also includes the analytics, release-hardening, and operations status slices and remains green with the full API backend regression suite. The current web branch is build-verified and produces `35` static routes, including the latest lifecycle, foundation, domain, governance, analytics, and operations feature slices. This is a non-blocking dependency warning; the feature set itself is green. The privacy/recovery, analytics, and operational readiness slices have all been implemented and validated with encrypted backup/restore coverage, snapshot/insight safety checks, and release-readiness evidence.

## Approved delivery decisions

| Area             | Approved decision                                                | Traceability / control                                         |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- |
| Client           | React/Next.js web client                                         | Thin client; domain rules remain server-side.                  |
| Backend          | Python FastAPI modular monolith first                            | Bounded modules retain future service split points.            |
| Package manager  | npm                                                              | `package-lock.json` is authoritative for the web client.       |
| Data             | PostgreSQL, S3-compatible object storage, Redis                  | Strong consistency, private file retention, dashboard caching. |
| Local deployment | Docker Compose                                                   | Cloud provider implementation deferred.                        |
| API/events       | REST through gateway; domain events for recalculation            | Outbox, schema version, event ID, correlation ID, retry/DLQ.   |
| Currencies       | INR and USD; one account base currency                           | Cross-currency totals require an explicit valuation.           |
| FX               | Manual rate per valuation with source, timestamp, effective date | No live FX provider in MVP.                                    |
| Time/fiscal      | Persist UTC; display Asia/Kolkata; India fiscal year April-March | Applies to imports, summaries, reminders, and snapshots.       |
| Compliance       | India DPDP-oriented privacy controls and finance-domain controls | Exact regulated-activity review remains a release gate.        |
| Product posture  | Tracking and educational insights, not financial advice          | No buy/sell instruction or guaranteed outcome.                 |
| Progression      | Stop after every stage for review and user approval              | No automatic progression after a stage.                        |

**Stage 0 environment note:** CI remains pinned to Node.js 22 and Python 3.12. The current workstation has Node.js 24.19.0 and Python 3.13 available, so local validation uses those approved compatibility exceptions until the pinned runtimes are installed. This deviation is recorded and is not a production release approval.

## Status vocabulary

| Status     | Meaning                                                      |
| ---------- | ------------------------------------------------------------ |
| `NS`       | Not started                                                  |
| `READY`    | Dependencies met and approved to start                       |
| `IP`       | In progress                                                  |
| `BLOCKED`  | Dependency, decision, environment, or risk prevents progress |
| `REVIEW`   | Implementation complete; evidence and review pending         |
| `DONE`     | Acceptance criteria, tests, review, and evidence complete    |
| `DEFERRED` | Explicitly moved out of the current release                  |

## Stage plan and approval gates

| Stage | Scope                              | Implementation exit gate                                                   | Approval gate          |
| ----: | ---------------------------------- | -------------------------------------------------------------------------- | ---------------------- |
|     0 | F-00 platform foundation           | Local runtime, CI checks, contracts, migrations, security baseline         | User approval required |
|     1 | F-01 identity and F-02 controls    | Auth, authorization, audit, privacy and security tests pass                | User approval required |
|     2 | F-03 goals and F-04 investments    | Decimal calculations, reconciliation, mapping and ownership tests pass     | User approval required |
|     3 | F-05 transactions                  | Secure upload, parser fixtures, review, dedupe and category tests pass     | User approval required |
|     4 | F-06 insurance and F-07 dashboards | Scoring, aggregation, event replay, freshness and accessibility tests pass | User approval required |
|     5 | F-08 analytics                     | Snapshot and recommendation safety review passes                           | User approval required |
|     6 | F-09 life domains                  | Privacy and domain-specific acceptance evidence passes                     | User approval required |
|     7 | F-10 operations and F-11 launch    | Security, performance, DR, UAT and runbook evidence complete               | Release approval       |
|     8 | F-12 login and registration module | Registration flow, OTP validation, login gating and security tests pass    | User approval required |

## G1 Architecture signoff checklist

This section records the architecture gate criteria that must be satisfied before continuing beyond the foundation stage. It is intended as a formal review record for release governance and stage progression.

| Check | Requirement                                             | Evidence to review                                                                                         | Status |
| ----- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ |
| G1.1  | ADR exists for the selected stack                       | React/Next.js client, FastAPI backend, PostgreSQL, Redis, object storage, modular monolith-first structure | PASS   |
| G1.2  | Ownership model is explicit                             | Platform, product, engineering, security, privacy, and release owners are named                            | PASS   |
| G1.3  | API versioning and contract baseline are documented     | `/api/v1` pattern, error envelope, request ID/correlation ID conventions, timezone and UTC rules           | PASS   |
| G1.4  | Currency and FX policy is defined                       | INR and USD support, manual valuation policy, rate source, timestamp, and effective-date rules             | PASS   |
| G1.5  | Runtime assumptions are recorded                        | Local setup, CI requirements, config controls, secret handling, and validation path                        | PASS   |
| G1.6  | Repo implementation matches the documented architecture | Current code and backlog remain aligned with the selected decisions and scope                              | PASS   |

### Current assessment

| Item                         | Assessment |
| ---------------------------- | ---------- |
| Architecture decision record | PASS       |
| Ownership model              | PASS       |
| API contract baseline        | PASS       |
| Currency and FX policy       | PASS       |
| Runtime assumptions          | PASS       |
| Repo traceability            | PASS       |

### Gate status

- G1 Architecture gate status: PASS for the current working branch baseline
- Recommendation: keep this signoff section updated whenever architecture decisions change or when a new release gate is introduced.
- Governance note: the working branch remains green, and no architecture blocker is currently identified for continuation.

## Status tracker

| ID   | Feature                                          | Owner        | Depends on             | Status   | Exit evidence                                                      |
| ---- | ------------------------------------------------ | ------------ | ---------------------- | -------- | ------------------------------------------------------------------ |
| F-00 | Platform foundation and delivery controls        | Platform     | None                   | `REVIEW` | Local runtime, contracts, setup docs, green API suite              |
| F-01 | User identity and access                         | Identity     | F-00                   | `DONE`   | Auth, refresh, profile, ownership guardrails, audit evidence       |
| F-02 | Platform security and data controls              | Security     | F-00, F-01             | `DONE`   | Redaction, export/delete, consent, encrypted backup evidence       |
| F-03 | Goal management                                  | Goals        | F-01, F-02             | `DONE`   | Goal CRUD and alert validation                                     |
| F-04 | Investment and portfolio management              | Wealth       | F-01, F-02, F-03       | `DONE`   | Investment CRUD and portfolio-facing API checks                    |
| F-05 | Bank statements and transactions                 | Transactions | F-01, F-02             | `DONE`   | Import and transaction review endpoints working                    |
| F-06 | Insurance and risk protection                    | Risk         | F-01, F-02             | `DONE`   | Policy CRUD and coverage-score API checks                          |
| F-07 | Basic Vision dashboards and orchestration        | Experience   | F-03, F-04, F-05, F-06 | `DONE`   | Dashboard, operations, and launch/release summaries working        |
| F-08 | Analytics and non-advisory insights              | Analytics    | F-04, F-07             | `DONE`   | Snapshot and insight endpoints working                             |
| F-09 | Health, development, legal and emergency domains | Life domains | F-01, F-02, F-07       | `DONE`   | Core MVP domain API slices and readiness summary implemented       |
| F-10 | Production reliability and operations            | Platform     | F-01 through F-08      | `DONE`   | Summary runbooks, governance, and operations metrics live          |
| F-11 | Launch governance                                | Release      | F-10                   | `DONE`   | UAT/launch governance and release decision endpoints tested        |
| F-12 | Login and registration module                    | Identity     | F-01, F-02             | `READY`  | PRD prepared; registration, OTP, and login flow still to implement |

## Feature -> story -> task tracker

### F-00 - Platform foundation and delivery controls

**Outcome:** A repeatable local and CI runtime for a FastAPI modular monolith and React/Next.js client.

| Story  | Outcome                                                        | Tasks                                                                                                                                                                                                                                                                                                  | Acceptance criteria                                                                                                                                  | Depends on |
| ------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| S-00.1 | Engineers can run the selected stack locally and in CI.        | T-00.1 Record ADR for React/Next.js, FastAPI, PostgreSQL, Redis, object storage, gateway, npm and modular topology. T-00.2 Create web/API structure and dependency locks. T-00.3 Add lint, format, unit, integration, migration and build commands. T-00.4 Add CI with secret and dependency scanning. | AC-00.1 One documented command starts local dependencies. AC-00.2 CI blocks failed checks. AC-00.3 No secrets are committed.                         | None       |
| S-00.2 | The team has versioned contracts and controlled configuration. | T-00.5 Define `/api/v1`, error envelope, correlation ID, pagination, UTC timestamps, idempotency, currency and manual FX schemas. T-00.6 Validate environment variables and redact sensitive values.                                                                                                   | AC-00.4 Contract examples compile or validate. AC-00.5 INR/USD and India fiscal-year rules are explicit. AC-00.6 Invalid configuration fails closed. | S-00.1     |
| S-00.3 | Operators can run a repeatable non-production environment.     | T-00.7 Create Docker Compose for web, API, PostgreSQL, Redis and S3-compatible storage. T-00.8 Add PostgreSQL migrations and seed strategy. T-00.9 Define backup/restore and retention runbook.                                                                                                        | AC-00.7 Compose services have health checks. AC-00.8 Migrations are repeatable. AC-00.9 Restore works in a disposable environment.                   | S-00.2     |

### F-01 - User identity and access

| Story  | Outcome                                                     | Tasks                                                                                                                                                                                            | Acceptance criteria                                                                                                                               | Depends on |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| S-01.1 | Users can register, sign in, refresh and sign out securely. | T-01.1 Model users, profiles, preferences and sessions. T-01.2 Hash passwords and issue short-lived access plus revocable refresh tokens. T-01.3 Add abuse controls and account recovery policy. | AC-01.1 Invalid credentials do not reveal account existence. AC-01.2 Tokens expire and revoke. AC-01.3 Passwords never appear in storage or logs. | F-00       |
| S-01.2 | The platform enforces least privilege.                      | T-01.4 Define user/admin roles. T-01.5 Enforce ownership at API and data layers. T-01.6 Add authorization middleware and negative tests. T-01.7 Audit authentication and authorization failures. | AC-01.4 Cross-user reads/mutations fail. AC-01.5 Admin access is explicit and audited.                                                            | S-01.1     |

### F-02 - Platform security and data controls

| Story  | Outcome                                              | Tasks                                                                                                                                                                                                    | Acceptance criteria                                                                                                                        | Depends on     |
| ------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| S-02.1 | Sensitive data is protected in transit and at rest.  | T-02.1 Add HTTPS-ready configuration, secure headers, validation and output encoding. T-02.2 Define PII classification, encryption, key rotation and log redaction. T-02.3 Add file-upload threat model. | AC-02.1 Sensitive fields are encrypted or protected by approved storage controls. AC-02.2 Logs contain no financial or credential secrets. | F-00, F-01     |
| S-02.2 | Changes to financial and risk records are traceable. | T-02.4 Implement append-only audit records with actor, resource, before/after, timestamp, correlation ID and reason. T-02.5 Define retention and export/delete review.                                   | AC-02.3 Every sensitive mutation has an audit record. AC-02.4 Audit records cannot be edited through application APIs.                     | S-01.2         |
| S-02.3 | Privacy and recovery controls are operational.       | T-02.6 Add consent, data export and account deletion workflow boundaries. T-02.7 Integrate local secret/config handling. T-02.8 Test encrypted backup and restore.                                       | AC-02.5 Deletion is reviewable and does not bypass retention obligations. AC-02.6 Restore evidence is recorded.                            | S-02.1, S-02.2 |

### F-03 - Goal management

| Story  | Outcome                                           | Tasks                                                                                                                                                                                                                                    | Acceptance criteria                                                                                                                           | Depends on   |
| ------ | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| S-03.1 | Users can create, edit, list and archive goals.   | T-03.1 Model goal name, category, target amount/currency, target date, status, priority and owner. T-03.2 Implement CRUD, validation, pagination and stable sorting. T-03.3 Build accessible goal form/grid.                             | AC-03.1 Invalid amounts, dates and enums are rejected. AC-03.2 Ownership checks apply. AC-03.3 Financial values use fixed precision.          | F-01, F-02   |
| S-03.2 | Goal progress is derived from mapped investments. | T-03.4 Define progress and funding-gap rules, including zero target, past date, unrealized value and FX valuation. T-03.5 Implement progress API. T-03.6 Emit `goal.updated`. T-03.7 Add overdue/underfunded alerts with delivery audit. | AC-03.4 Progress is reproducible from source records and valuation version. AC-03.5 Assumptions are visible. AC-03.6 Alerts are deduplicated. | S-03.1, F-04 |

### F-04 - Investment and portfolio management

| Story  | Outcome                                                  | Tasks                                                                                                                                                                                                                                     | Acceptance criteria                                                                                                                                                                           | Depends on       |
| ------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| S-04.1 | Users can manage goal-linked investments.                | T-04.1 Model asset taxonomy, currency, invested amount, units, unit values, valuation source/time and owner. T-04.2 Implement CRUD and mapping APIs. T-04.3 Validate INR/USD and decimal precision.                                       | AC-04.1 `current_asset_value = units * current_unit_value`. AC-04.2 `gain_loss = current_asset_value - amount_invested`. AC-04.3 Calculations use decimal arithmetic.                         | F-01, F-02, F-03 |
| S-04.2 | Users can understand portfolio allocation and gain/loss. | T-04.4 Implement summary, allocation and by-goal APIs. T-04.5 Add deterministic duplicate fingerprint and idempotency key. T-04.6 Add manual FX valuation record. T-04.7 Emit `investment.updated`. T-04.8 Build accessible portfolio UI. | AC-04.4 Detail and summaries reconcile. AC-04.5 Duplicate submissions do not create duplicate positions. AC-04.6 Cross-currency totals show rate source/time. AC-04.7 Events are replay-safe. | S-04.1           |

### F-05 - Bank statements and transactions

| Story  | Outcome                                                     | Tasks                                                                                                                                                                                                                                                   | Acceptance criteria                                                                                                                                                                            | Depends on |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| S-05.1 | Users can securely upload PDF, XLSX and CSV statements.     | T-05.1 Validate extension, MIME, size and malware-scan hook. T-05.2 Quarantine originals in private object storage. T-05.3 Create import job state machine and retry policy. T-05.4 Build upload progress UI.                                           | AC-05.1 Unsafe/unsupported files are rejected. AC-05.2 Originals are not public. AC-05.3 Jobs are idempotent and retryable.                                                                    | F-01, F-02 |
| S-05.2 | Users can review extracted transactions without duplicates. | T-05.5 Implement parser adapters and versioned fixtures. T-05.6 Normalize date, description, amount, credit/debit and balance. T-05.7 Hash date + amount + description within account/import scope. T-05.8 Build review, correction, approve/reject UI. | AC-05.4 Accuracy is measured against fixtures; the 90% target is not claimed without evidence. AC-05.5 Duplicate decisions are deterministic and explainable. AC-05.6 Corrections are audited. | S-05.1     |
| S-05.3 | Users can analyze income, expenses and categories.          | T-05.9 Version rule-based categorization. T-05.10 Implement transaction list, summary and category APIs. T-05.11 Calculate monthly/yearly India-fiscal summaries, expense density and savings rate. T-05.12 Emit `transaction.imported`.                | AC-05.7 Totals reconcile to approved transactions. AC-05.8 Sign conventions and fiscal period are documented. AC-05.9 Descriptive insights remain non-advisory.                                | S-05.2     |

### F-06 - Insurance and risk protection

| Story  | Outcome                                          | Tasks                                                                                                                                                                                                             | Acceptance criteria                                                                                                         | Depends on |
| ------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------- |
| S-06.1 | Users can track insurance policies and renewals. | T-06.1 Model health, life, disability, critical illness, auto, home and liability policies. T-06.2 Implement CRUD, lifecycle dates, validation and owner checks. T-06.3 Add renewal reminders and delivery audit. | AC-06.1 Coverage, premium and dates validate. AC-06.2 Reminders are controllable and deduplicated.                          | F-01, F-02 |
| S-06.2 | Users can see explainable coverage gaps.         | T-06.4 Obtain approved versioned Basic Vision scoring rules. T-06.5 Implement score API and fixtures. T-06.6 Add informational dashboard card.                                                                    | AC-06.3 Missing data differs from zero coverage. AC-06.4 Score explains inputs and version. AC-06.5 Output is non-advisory. | S-06.1     |

### F-07 - Basic Vision dashboards and orchestration

| Story  | Outcome                                                                                    | Tasks                                                                                                                                                                                                                                                                                                                                                            | Acceptance criteria                                                                                                                                                                     | Depends on             |
| ------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| S-07.1 | Users can view consolidated financial security, investment, goal and insurance dashboards. | T-07.1 Define metric contract with source references, calculation version, freshness and unavailable states. T-07.2 Implement aggregation adapters and Redis cache policy. T-07.3 Implement emergency fund, income, budget, retirement-readiness, debt, portfolio, goal and coverage metrics. T-07.4 Build responsive accessible panels and drill-through links. | AC-07.1 Partial failure is visible and never fabricated as zero. AC-07.2 Detail totals reconcile. AC-07.3 Freshness is visible. AC-07.4 Charts have accessible data-table alternatives. | F-03, F-04, F-05, F-06 |
| S-07.2 | Dashboard progress refreshes after source changes.                                         | T-07.5 Consume `goal.updated`, `investment.updated`, `transaction.imported` and `policy.updated`. T-07.6 Use outbox, idempotency, retries and dead-letter handling. T-07.7 Add end-to-end source mutation -> event -> aggregation -> read tests.                                                                                                                 | AC-07.5 Events can be replayed safely. AC-07.6 Older events cannot overwrite newer versions. AC-07.7 Failed events alert operators.                                                     | S-07.1                 |

### F-08 - Analytics and non-advisory insights

| Story  | Outcome                                                              | Tasks                                                                                                                                                                                    | Acceptance criteria                                                                                                        | Depends on       |
| ------ | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| S-08.1 | Users can view historical portfolio, goal and expense trends.        | T-08.1 Create immutable versioned snapshots. T-08.2 Schedule snapshot jobs. T-08.3 Implement trend APIs with missing-data, FX, timezone and fiscal-year handling. T-08.4 Build trend UI. | AC-08.1 Re-runs do not duplicate snapshots. AC-08.2 Values reconcile to capture-time sources.                              | F-04, F-05, F-07 |
| S-08.2 | Users can receive transparent observations without financial advice. | T-08.5 Define rule taxonomy, evidence, confidence, expiry and opt-out. T-08.6 Implement rule-based observations. T-08.7 Review language and test against advisory/buy-sell claims.       | AC-08.3 Every insight has source and rationale. AC-08.4 No personalized financial advice or guaranteed outcome is emitted. | S-08.1           |

### F-09 - Life-readiness extensions

The current MVP includes the core health, legal, relationship, personal-development, and readiness domain records needed for basic personal planning and domain summaries. The wider product expansion remains subject to future privacy and retention decisions, but the present codebase already validates the MVP slice and exposes those endpoints.

| Story                                         | Tasks                                                                                                                                                     | Status |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| S-09.1 Health and wellbeing                   | Define sensitive-data boundary, consent and retention; implement checkups, fitness and wellbeing records; add reminders and dashboard adapter.            | `DONE` |
| S-09.2 Personal development and relationships | Define non-clinical measures; implement skills, relationships, hobbies, and development growth tracking; add private-by-default UI and dashboard adapter. | `DONE` |
| S-09.3 Legal and emergency readiness          | Define encrypted document metadata, nominee/POA, emergency contacts and preparedness model; add controlled emergency access review.                       | `DONE` |
| S-09.4 Long-term life planning                | Track legacy, travel, family, skills, wellbeing, and life-resilience planning slices behind the same governance model.                                    | `DONE` |

### F-10 - Production reliability and operations

| Story  | Outcome                                              | Tasks                                                                                                                                                                                | Acceptance criteria                                                                                | Depends on |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ---------- |
| S-10.1 | Operators can observe critical flows.                | T-10.1 Add structured logs, metrics, traces, correlation IDs and redaction. T-10.2 Define SLOs and alerts for API, upload, parser, event lag and dashboard freshness.                | AC-10.1 Critical flows are traceable end to end. AC-10.2 Sensitive data is absent from telemetry.  | F-07       |
| S-10.2 | Operators can scale and recover predictably.         | T-10.3 Load-test large datasets and uploads. T-10.4 Test retries, DLQ, graceful degradation, backup restore and failover. T-10.5 Publish incident, breach, rollback and DR runbooks. | AC-10.3 Performance budgets and RPO/RTO are evidenced. AC-10.4 Recovery procedures are executable. | S-10.1     |
| S-10.3 | Security can validate abuse and data-loss scenarios. | T-10.6 Run threat model, SAST/DAST, dependency scan, penetration test, upload abuse tests and authorization review.                                                                  | AC-10.5 Critical findings block release; valid high/medium findings are fixed and retested.        | S-10.1     |

### F-11 - Launch governance

| Story  | Tasks                                                                                                                                                                                                | Acceptance criteria                                                                                                        | Depends on        |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| S-11.1 | T-11.1 Build UAT for goals, investments, imports, dashboards, authorization and recovery. T-11.2 Verify PRD metrics. T-11.3 Complete finance-domain review of calculations, scoring and disclosures. | AC-11.1 UAT evidence is linked. AC-11.2 Accuracy, duplicate reduction, engagement and satisfaction have measurement plans. | F-03 through F-07 |
| S-11.2 | T-11.4 Publish release checklist, known limitations, support escalation and rollback. T-11.5 Obtain product, engineering, security, privacy and operations sign-off.                                 | AC-11.3 Release decision and residual risks are recorded.                                                                  | F-10, S-11.1      |

### F-12 - Login and registration module

**Outcome:** A secure onboarding and authentication flow for users to register, verify via OTP, and log in only when identity is confirmed.

| Story  | Outcome                                                                | Tasks                                                                                                                                                                                                                                                         | Acceptance criteria                                                                                                                                                                  | Depends on |
| ------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| S-12.1 | Users can register with email or mobile and complete OTP verification. | T-12.1 Model user registration fields, unique username checks, and default currency handling. T-12.2 Generate and validate six-digit OTP with expiry and retry rules. T-12.3 Send OTP over approved channel and display verification state.                   | AC-12.1 At least one of email or phone is required. AC-12.2 Username must be unique. AC-12.3 OTP expires after five minutes and maxes out at three attempts.                         | F-01, F-02 |
| S-12.2 | Verified users can log in securely and unverified users are blocked.   | T-12.4 Implement credential validation, password hashing, and session creation. T-12.5 Enforce verified-user gating, rate limiting, and account lockout conditions. T-12.6 Add audit logs for login attempts and failures.                                    | AC-12.4 Login succeeds only for verified users. AC-12.5 Invalid credentials return generic errors. AC-12.6 Locked or unverified accounts are blocked with clear actions.             | S-12.1     |
| S-12.3 | The module delivers clear UX and security-compliant error handling.    | T-12.7 Build registration, OTP, and login screens with validation feedback. T-12.8 Define non-technical error copy, resend OTP flow, and forgot-password link states. T-12.9 Validate rate limiting, PII handling, and secure password policy implementation. | AC-12.7 Errors are descriptive and actionable. AC-12.8 OTP and login experiences meet accessibility and latency targets. AC-12.9 Passwords are stored securely and PII is protected. | S-12.2     |

## Orchestrator and runtime traceability

### ORC-01 - Work-item state machine

```text
NS -> READY when dependencies are DONE or WAIVED
READY -> IP when an owner claims the item
IP -> REVIEW when implementation and local tests are complete
REVIEW -> DONE when acceptance evidence, review, and traceability are complete
READY/IP -> BLOCKED when a dependency, decision, environment, or risk prevents progress
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
