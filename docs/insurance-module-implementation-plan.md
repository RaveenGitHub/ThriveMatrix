# Insurance module implementation plan

## Status

Status: Complete for the implemented module scope. The product logic, dashboard behavior, and API integration pattern are in place; live carrier integrations and final policy signoff remain outside the current engineering scope.

## 1. Goal

Implement the Insurance module in a way that matches the product requirements in the Insurance PRD while staying consistent with the current ThriveMatrix product architecture and API patterns.

## 2. Scope

This plan covers:

- policy management
- goal-based coverage tracking
- premium and gap calculations
- renewal and alert logic
- dashboard readiness summary
- user-owned access controls
- tests and validation

This plan does not include live insurer API integrations or regulated insurance sales flows.

## 3. Product constraints and principles

- Treat insurance as a user-owned financial protection domain.
- Keep coverage logic deterministic and auditable.
- Use the same currency and validation conventions as the rest of the app.
- Ensure all API behavior is user-scoped.
- Keep dashboards and alerts fed by the same backend source of truth.
- Do not expose insurance data across user accounts.

## 4. Target architecture

### API layer

The backend will expose insurance endpoints through the FastAPI app in the same style as goals, investments, and privacy modules.

### Domain model

- Policy record stores the actual policy details.
- Coverage goal records define target protection values.
- Premium records support payment history and renewals over time.
- Summary tables support dashboard and analytics reads.
- Gap snapshots can be generated for audit and reporting.

### Storage model

The repo already uses a MariaDB-first, SQLite-friendly pattern. Insurance records should follow this pattern, with the persistence layer consistent with `api/app/db.py` and the migration bootstrap logic.

## 5. Database design

### 5.1 insurance_policies

| Field             | Type          | Notes                        |
| ----------------- | ------------- | ---------------------------- |
| id                | BIGINT PK     | auto-generated               |
| owner_email       | VARCHAR(255)  | identifies the owner         |
| policy_name       | VARCHAR(200)  | free-text label              |
| policy_type       | VARCHAR(100)  | health, life, auto, etc.     |
| provider          | VARCHAR(150)  | insurer name                 |
| coverage_amount   | DECIMAL(18,4) | active cover                 |
| coverage_goal     | DECIMAL(18,4) | target cover                 |
| premium_amount    | DECIMAL(18,4) | current premium              |
| premium_frequency | VARCHAR(32)   | monthly / quarterly / yearly |
| last_premium_date | DATETIME      | last paid date               |
| next_due_date     | DATETIME      | calculated or user-set       |
| tenure            | VARCHAR(64)   | optional duration            |
| status            | VARCHAR(32)   | active, expired, renewal_due |
| created_at        | DATETIME      | audit                        |
| updated_at        | DATETIME      | audit                        |

### 5.2 insurance_goals

| Field           | Type          | Notes                     |
| --------------- | ------------- | ------------------------- |
| id              | BIGINT PK     | auto-generated            |
| owner_email     | VARCHAR(255)  | owner                     |
| category        | VARCHAR(100)  | medical, life, auto, etc. |
| target_amount   | DECIMAL(18,4) | desired coverage          |
| target_currency | CHAR(3)       | default INR               |
| status          | VARCHAR(32)   | active, archived          |
| created_at      | DATETIME      | audit                     |
| updated_at      | DATETIME      | audit                     |

### 5.3 insurance_payments

| Field       | Type          | Notes                   |
| ----------- | ------------- | ----------------------- |
| id          | BIGINT PK     | auto-generated          |
| owner_email | VARCHAR(255)  | owner                   |
| policy_id   | BIGINT        | linked policy           |
| paid_amount | DECIMAL(18,4) | premium amount          |
| paid_on     | DATETIME      | payment date            |
| frequency   | VARCHAR(32)   | monthly / yearly        |
| status      | VARCHAR(32)   | paid, missed, scheduled |

### 5.4 insurance_category_summary

| Field           | Type          | Notes              |
| --------------- | ------------- | ------------------ |
| id              | BIGINT PK     | summary row        |
| owner_email     | VARCHAR(255)  | owner              |
| category        | VARCHAR(100)  | category key       |
| total_coverage  | DECIMAL(18,4) | aggregated cover   |
| total_premium   | DECIMAL(18,4) | aggregated premium |
| target_coverage | DECIMAL(18,4) | target cover       |
| progress_pct    | DECIMAL(9,2)  | coverage progress  |
| gap_amount      | DECIMAL(18,4) | coverage gap       |
| premium_gap     | DECIMAL(18,4) | premium gap        |
| updated_at      | DATETIME      | refresh time       |

### 5.5 insurance_gap_snapshots

| Field       | Type          | Notes                      |
| ----------- | ------------- | -------------------------- |
| id          | BIGINT PK     | auto-generated             |
| owner_email | VARCHAR(255)  | owner                      |
| category    | VARCHAR(100)  | category key               |
| gap_type    | VARCHAR(64)   | coverage, premium, renewal |
| gap_amount  | DECIMAL(18,4) | numeric value              |
| severity    | VARCHAR(32)   | low, medium, high          |
| created_at  | DATETIME      | audit                      |

## 6. Backend implementation tasks

### Phase 1: Data validation and schema

1. Add the insurance taxonomy to the canonical catalog and MariaDB-compatible SQL definitions.
2. Create validation models for policy creation and update with the new policy metadata fields.
3. Enforce required numeric, date, and policy-type validations.
4. Support both legacy short codes and the new app-ready insurance labels.
5. Add user ownership checks to all policy endpoints.

### Insurance taxonomy to support

Canonical app-ready labels:

- Life Insurance
- Accident Insurance
- Critical Illness Insurance
- Mental Wellness Insurance
- Health Insurance
- Hospital Cash Insurance
- Top-Up & Super Top-Up Health Plans
- Income Protection / Disability Insurance
- Job Loss Insurance
- Vehicle Insurance
- Home Insurance
- Property Insurance
- Travel Insurance
- Business Insurance
- Professional Liability Insurance
- Cyber Insurance
- Employer Liability Insurance
- Pet Insurance
- Event Insurance
- Agriculture Insurance

Compatibility contract:

- The backend must accept legacy short aliases for older clients and tests: `health`, `life`, `disability`, `critical_illness`, `auto`, `home`, and `liability`.
- The backend must normalize those values to the canonical catalog labels when storing or returning records.
- The DB catalog, validation model, and UI dropdown must all use the same canonical values so the product stays consistent.

Each policy should carry:

- policy_name / name
- policy_type
- provider
- coverage_amount
- coverage_goal
- premium_amount
- premium_frequency
- last_premium_date
- start_date
- end_date
- renewal_date
- policy_details
- goal_mapping
- coverage_gap
- premium_gap
- status

Implementation note:

- The current runtime uses `APPROVED_INSURANCE_POLICY_TYPES` from the canonical DB catalog and the validator in `api/app/main.py` to enforce the accepted values.
- The UI in `web/app/insurance/page.tsx` also uses the canonical labels as dropdown options so that form input matches the API contract.

### Phase 2: Core policy and coverage logic

1. Implement POST /api/v1/insurance/policies.
2. Implement GET /api/v1/insurance/policies.
3. Implement GET /api/v1/insurance/policies/{policy_id}.
4. Implement PUT /api/v1/insurance/policies/{policy_id}.
5. Implement DELETE /api/v1/insurance/policies/{policy_id}.
6. Compute next_due_date and renewal status.
7. Compute coverage gap and premium gap.
8. Compute progress percentage from coverage goal.

### Phase 3: Coverage goal and summary layer

1. Implement insurance goal definitions and category aggregation.
2. Group multiple policies per category.
3. Calculate dashboard totals and category summaries.
4. Expose GET /api/v1/insurance/coverage-score.
5. Expose GET /api/v1/insurance/gaps.
6. Expose GET /api/v1/insurance/dashboard.

### Phase 4: Alerts and operational logic

1. Add renewal alerts when dates are within a 30-day threshold.
2. Add under-insurance alerts for categories below targets.
3. Flag expired policies and overdue premium states.
4. Ensure alert generation is user-scoped and consistent with dashboard values.

### Phase 5: UI layer

1. Build the policy list page.
2. Build add/edit policy modal or form.
3. Build the insurance dashboard card set.
4. Build category gap and renewal alert panels.
5. Add dashboard summary cards for coverage, premium, and readiness.

## 7. Core calculations

### 7.1 Coverage progress

progress_pct = (current_coverage / coverage_goal) × 100

If coverage_goal == 0, treat as not configured and return a no-goal state.

### 7.2 Coverage gap

coverage_gap = max(0, coverage_goal − current_coverage)

### 7.3 Premium gap

premium_gap = 0.5 × max(0, premium_required − premium_paid)

Where:

- premium_required is the premium associated with the target protection model
- premium_paid is the current or aggregated premium value

### 7.4 Renewal status

Renewal reminder should trigger when:

- next_due_date is within 30 days, or
- the policy is overdue, or
- premium status is marked missed

## 8. API contract details

### POST /api/v1/insurance/policies

Request payload:

```json
{
  "policy_name": "Star Health Family Floater",
  "policy_type": "health",
  "provider": "Star Health",
  "coverage_amount": 2000000,
  "coverage_goal": 3000000,
  "premium_amount": 20000,
  "premium_frequency": "yearly",
  "last_premium_date": "2026-08-01",
  "status": "active"
}
```

Response:

```json
{
  "id": "1",
  "owner_email": "user@example.com",
  "policy_name": "Star Health Family Floater",
  "policy_type": "health",
  "coverage_amount": 2000000,
  "coverage_goal": 3000000,
  "premium_amount": 20000,
  "progress_pct": 66.67,
  "coverage_gap": 1000000,
  "premium_gap": 5000,
  "status": "active"
}
```

### GET /api/v1/insurance/coverage-score

Returns:

- score
- policy_count
- coverage_amount
- coverage_gaps
- score_components

### GET /api/v1/insurance/gaps

Returns a list of gap records for:

- coverage gap
- premium gap
- category gap
- renewal gap

### GET /api/v1/insurance/dashboard

Returns a compact summary for the user dashboard:

- total coverage
- category totals
- policy count
- renewal count
- premium summary
- score

## 9. Acceptance criteria for implementation

The Insurance module is complete when:

- the user can create and manage policies
- the API enforces user ownership across all operations
- coverage progress is computed correctly
- premium gap follows the defined rule
- policy and category gaps are displayed clearly
- renewal reminders trigger correctly
- the dashboard reflects the same computed values as the API
- tests cover happy path, validation, and ownership failures

## 10. Test plan

### Backend tests

- create policy succeeds with valid values
- invalid numeric values fail validation
- expired policy is excluded from active coverage totals
- categories aggregate correctly across multiple policies
- premium gap calculation matches the 50% rule
- ownership checks reject cross-user access
- renewal alert triggers for due policies

### Frontend validation

- policy form renders and submits correctly
- dashboard cards render with computed values
- gap list shows category-level problems clearly
- renewal panel shows due or overdue items

## 11. Execution plan

### Phase 1: foundation

- confirm domain model and schema
- add database bootstrap entries
- build validation layer
- create user-owned access checks

### Phase 2: policy CRUD and calculations

- implement create/read/update/delete policy endpoints
- compute coverage, premium, and renewal values
- ensure all calculations are deterministic and user-scoped

### Phase 3: dashboard and alerts

- aggregate summary metrics
- compute category-level gaps
- expose dashboard and alert contract to UI

### Phase 4: UX and polish

- add forms and dashboard cards
- add alert states and gap severity rules
- validate the module against product requirements

### Phase 5: signoff

- verify against acceptance criteria
- validate repo-level regression safety
- ensure module is ready for release-stage review

## 12. Risks and mitigations

### Risk: miscalculated gap values

Mitigation: centralize calculations in one service/helper layer and test them extensively.

### Risk: cross-user access leaks

Mitigation: require authenticated user ownership validation on each endpoint.

### Risk: overcomplicated UI during MVP

Mitigation: keep the initial dashboard focused on core risk summary, category gaps, and renewal reminders.

### Risk: policy data drift

Mitigation: keep one source-of-truth summary generation and avoid duplication in UI logic.

## 13. Final recommendation

The Insurance module should be implemented as a focused, user-owned protection domain with deterministic calculations, simple dashboard visibility, and strong data ownership controls. It fits the existing ThriveMatrix architecture and can be built as a true product module without requiring a major refactor of the broader app.
