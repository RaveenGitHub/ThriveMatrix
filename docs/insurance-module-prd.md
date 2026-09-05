# Insurance module PRD

## Status

Status: Implemented and validated in the current branch. The insurance module is functional within the ThriveMatrix app flow, and the remaining open items are product and governance approvals rather than missing technical implementation.

## 1. Module summary

The Insurance module is a user-scoped protection tracker for ThriveMatrix. It helps users understand whether their current policy coverage is adequate, how premium payments contribute to their protection goal, and where gaps exist in their insurance readiness.

The module follows a goal-based model:

- Insurance coverage is treated as a measurable goal.
- Premium paid is treated as progress toward the protection goal.
- Coverage gap and premium gap are surfaced clearly to the user.
- Renewal and risk readiness are visible in the dashboard and alerting layer.

## 2. Problem statement

Users commonly face these problems:

- they do not know whether their existing cover is enough
- they pay premiums without understanding the value they are buying
- they have no structured view of category gaps such as health, life, auto, or home
- they forget policy renewal dates and miss coverage windows
- they do not see how insurance fits into their overall financial and life-readiness plan

ThriveMatrix solves this by turning insurance into a measurable, time-aware, goal-based module.

## 3. Product vision

To help a user answer, in under a minute:

- What does my current protection cover?
- What is still missing?
- How much premium am I paying and how much should I pay?
- What will expire soon?
- Which category is under-protected?

## 4. Objectives and success metrics

### Objectives

1. Convert insurance coverage into measurable goals.
2. Measure premium contribution as progress toward coverage goals.
3. Identify category gaps across all major risk types.
4. Surface renewal risks and under-insurance alerts.
5. Integrate insurance readiness into the dashboard and portfolio view.

### Success metrics

- 90% of users complete their basic insurance profile
- 80% of users reduce coverage gaps within six months
- 95% of premium-based progress calculations are accurate
- 90% of renewals are reminded within the configured reminder window

## 5. Core concepts

### 5.1 Insurance coverage as a goal

Every policy contributes to a coverage goal for a category or a user-defined risk objective.

Example:

- Goal: Medical Coverage = ₹30 lakh
- Current coverage: ₹20 lakh
- Coverage gap: ₹10 lakh

### 5.2 Premium paid as progress

Progress is measured using the current coverage versus the target coverage:

Insurance Progress = (Current Coverage / Coverage Goal) × 100

### 5.3 Premium gap rule

If coverage is below goal, the system shows both:

- coverage gap
- premium gap

Premium gap is calculated as:

Premium Gap = 50% × (Premium Required − Premium Paid)

Example:

- Goal coverage = ₹30 lakh
- Current coverage = ₹20 lakh
- Coverage gap = ₹10 lakh
- Premium paid = ₹20,000/year
- Premium required = ₹30,000/year
- Premium gap = 50% × (₹30,000 − ₹20,000) = ₹5,000

## 6. Functional scope

### 6.1 Insurance policy management

Users can create, view, edit, and delete insurance policies.

Required fields:

- policy_id
- policy_type
- policy_name
- provider
- coverage_amount
- coverage_goal
- premium_amount
- premium_frequency
- last_premium_date
- next_due_date
- tenure
- notes
- status

### 6.2 Insurance goal system

Supported cover categories and policy types:

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

Canonical insurance taxonomy rule:

- The app uses the human-readable labels above as the canonical policy types in the UI and API responses.
- The backend accepts legacy short-form values as compatibility aliases for older clients and test contracts, including `health`, `life`, `disability`, `critical_illness`, `auto`, `home`, and `liability`.
- The saved canonical value must remain aligned with the approved catalog so data stays consistent across the database, API, and UI.

Required activation metadata for each policy item:

- Policy Name
- Policy Type
- Provider
- Coverage Amount
- Premium Amount
- Premium Frequency
- Last Premium Date
- Policy Details
- Goal Mapping
- Coverage Gap
- Premium Gap
- Renewal Date
- Activation Status

Required insurance payload fields:

- `policy_name` / `name`
- `policy_type`
- `provider`
- `coverage_amount`
- `coverage_goal`
- `premium_amount`
- `premium_frequency`
- `last_premium_date`
- `start_date`
- `end_date`
- `renewal_date`
- `status`
- `policy_details`
- `goal_mapping`

Rules:

1. If no goal is defined, show “Goal Not Planned”.
2. If a goal exists, measure progress against it.
3. Multiple policies can contribute to one goal.
4. If no policy exists for a category, show “No Coverage”.

### 6.3 Coverage gap analysis

Gap types:

1. Coverage gap
2. Premium gap
3. Category gap
4. Renewal gap

Display rules:

- Always show gaps even if the goal is not planned.
- If a user has not defined a medical goal, show recommended baseline values and current coverage accordingly.
- Expired policies are excluded from active coverage totals.

### 6.4 Dashboard integration

The dashboard must show:

- total coverage
- category-wise coverage
- goal vs current coverage
- total premium paid
- premium gap summary
- renewal reminders
- overall readiness score

## 7. System logic and data flow

### 7.1 Policy creation flow

1. User enters policy data.
2. System validates values.
3. System calculates:
   - next_due_date
   - coverage_gap
   - premium_gap
   - progress_percent
4. System updates the insurance dashboard and alerting layer.

### 7.2 Coverage goal flow

1. User defines a coverage goal.
2. System recalculates:
   - coverage gap
   - premium gap
   - progress percentage
3. Dashboard refreshes.

### 7.3 Premium payment flow

1. User updates the last premium date or amount.
2. System recalculates due dates and premium consistency.
3. Renewal reminders update based on the next due date.

## 8. Edge cases and rules

### Case 1: No goal defined

- Show “Goal Not Planned”.
- Show current coverage and recommended baseline target.
- Show coverage gap.

### Case 2: Multiple policies in same category

- Aggregate coverage across policies.
- Aggregate premium.
- Calculate combined progress.

### Case 3: Expired policy

- Mark as expired.
- Exclude from active coverage calculation.

### Case 4: Premium overdue

- Flag renewal gap.
- Show non-compliance in the alert list.

### Case 5: Free text policy name

- Do not over-validate the name.
- Validate numeric values and date ranges only.

## 9. Non-functional requirements

### Security

- User data must remain private to the authenticated owner.
- Insurance data must not be visible across users.
- Sensitive records must be stored with auditable access patterns.

### Reliability

- Policy values must be calculated deterministically.
- Renewal reminders must be based on persistent policy data.
- Dashboard values must reflect the same source of truth as API calculations.

### Performance

- Policy and dashboard reads must remain fast for common user flows.
- Summary queries must aggregate across user policy sets efficiently.

## 10. Data model

### Core tables

- insurance_policies
- insurance_goals
- insurance_payments
- insurance_category_summary
- insurance_gap_snapshots

### Example policy entity

- id
- owner_email
- policy_name
- policy_type
- provider
- coverage_amount
- coverage_goal
- premium_amount
- premium_frequency
- last_premium_date
- next_due_date
- status
- created_at
- updated_at

## 11. API contract

### Planned endpoints

- POST /api/v1/insurance/policies
- GET /api/v1/insurance/policies
- GET /api/v1/insurance/policies/{policy_id}
- PUT /api/v1/insurance/policies/{policy_id}
- DELETE /api/v1/insurance/policies/{policy_id}
- GET /api/v1/insurance/coverage-score
- GET /api/v1/insurance/gaps
- GET /api/v1/insurance/dashboard

### Response expectations

- user-scoped access only
- values returned in INR by default unless a different currency is explicitly set
- all risk and gap calculations must be deterministic and reproducible

## 12. User experience requirements

### UI screens

- Add policy
- Policy list
- Policy detail
- Insurance dashboard
- Coverage gap view
- Renewal alerts

### UX behavior

- show progress bars for category coverage
- color-code coverage gap severity
- show targeted recommendations for under-protected categories
- keep the interface simple, not advisory-heavy

## 13. Future enhancements

- AI-recommended coverage targets
- premium forecasting
- insurer API integration
- family-level policy grouping
- risk heatmap or protective score visualization

## 14. Acceptance criteria

The module is complete when all of the following are satisfied:

- the user can add a policy with valid coverage and premium inputs
- coverage, premium gap, and progress are computed correctly
- expired and non-active policies are excluded from active coverage totals
- category gaps are displayed based on policy coverage
- renewal alerts are generated at the configured window
- the dashboard reflects the same values as the backend API
- user access is restricted to each user’s own insurance records

## 15. Implementation notes

This PRD should be read as the product contract for the Insurance domain. The engineering implementation must be aligned to the user-owned, goal-based protection model described above and should remain consistent with the broader ThriveMatrix architecture.
