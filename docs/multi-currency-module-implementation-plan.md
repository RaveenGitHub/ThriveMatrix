# Multi-currency and conversion implementation plan

## Status

Status: Planned. This plan turns the Multi-currency and Conversion PRD into an incremental implementation for the current FastAPI, MariaDB/SQLite-compatible, and Next.js architecture.

## 1. Goal

Introduce a single currency catalog and conversion service that preserves source monetary values, supports admin-managed USD-based rates, and returns consistently converted values in the authenticated user's preferred currency.

## 2. Current baseline

The current codebase already provides useful compatibility points:

- `users.preferred_currency` exists and defaults to INR.
- Goals store `target_currency`.
- Investments and transactions store `currency`.
- Insurance records store a policy currency field.
- `001_init_schema.sql` already contains the user and domain currency columns.
- Several summaries still hardcode INR or aggregate raw values without conversion.
- There is an existing `audit_logs` table and role-aware admin route pattern.

Implementation must extend these contracts rather than rename existing fields or rewrite raw records.

## 3. Scope and non-goals

### In scope

- currency catalog and current rate persistence
- reusable Decimal-based conversion service
- admin currency/rate APIs and audit events
- user preference API and profile UI
- converted domain responses and dashboard summaries
- source-currency input controls
- missing/disabled/unsupported states
- focused backend and frontend tests

### Not in the first release

- external FX provider integration
- historical rates or transaction-date valuation
- changing the USD base currency
- portfolio rebalancing or FX exposure recommendations

## 4. Target architecture

### Backend layers

1. **Repository/storage**: currency catalog, current rates, and audit persistence in `api/app/db.py` or a dedicated repository matching existing patterns.
2. **Domain service**: `CurrencyService` owns normalization, active-currency validation, rate lookup, Decimal conversion, rounding, and status generation.
3. **API models**: request and response models in `api/app/main.py` initially, or a nearby domain module if the API is split during implementation.
4. **Route integration**: admin, profile, shared currency, domain detail, and dashboard endpoints call the same service.
5. **Frontend client**: `web/lib/api.ts` exposes currency and profile operations; shared display helpers prevent page-specific conversion formulas.

The service must accept a source amount, source code, target code, and a rate snapshot. It must not read a user preference from global state or mutate domain records.

## 5. Data model and migration

Add a forward-compatible migration after `001_init_schema.sql`.

### 5.1 currency_master

| Field          | Type         | Notes                    |
| -------------- | ------------ | ------------------------ |
| id             | BIGINT PK    | generated identifier     |
| currency_code  | CHAR(3)      | uppercase, unique        |
| currency_name  | VARCHAR(120) | required                 |
| symbol         | VARCHAR(16)  | optional display symbol  |
| decimal_places | SMALLINT     | default 2; JPY may use 0 |
| is_active      | BOOLEAN      | default true             |
| is_base        | BOOLEAN      | USD true in release one  |
| created_at     | DATETIME     | audit                    |
| updated_at     | DATETIME     | audit                    |

### 5.2 currency_conversion_rates

| Field              | Type           | Notes                                    |
| ------------------ | -------------- | ---------------------------------------- |
| id                 | BIGINT PK      | generated identifier                     |
| currency_code      | CHAR(3)        | foreign key/reference to currency master |
| base_currency_code | CHAR(3)        | USD in release one                       |
| usd_per_unit       | DECIMAL(24,12) | positive current rate                    |
| effective_at       | DATETIME       | when rate became active                  |
| updated_by         | VARCHAR(255)   | admin actor                              |
| created_at         | DATETIME       | audit                                    |
| updated_at         | DATETIME       | audit                                    |

Use a uniqueness rule for one current rate per currency/base pair, or use an `is_current` field if historical records are introduced. The migration must be valid for MariaDB and preserve the project's SQLite fallback behavior.

### 5.3 Existing tables

- Backfill null `users.preferred_currency` to `INR`.
- Retain existing `target_currency`, `currency`, and `policy_currency` columns.
- Normalize stored codes to uppercase where data cleanup is safe.
- Add indexes for currency code where aggregate queries need them.
- Seed the required initial catalog and USD rate idempotently.

## 6. Delivery phases

### Phase 0: Contract and fixtures

1. Confirm the canonical field names and response envelope with the existing API tests.
2. Add a shared catalog fixture containing the required currencies and deterministic test rates.
3. Define Decimal precision, display quantization, rate timestamp, and conversion status semantics.
4. Add a migration/bootstrap test for MariaDB-compatible SQL and SQLite fallback.

**Exit criteria:** the catalog and rate semantics are documented in code-level fixtures and can be loaded repeatedly without duplicates.

### Phase 1: Persistence and conversion service

1. Add currency master and current-rate tables to the migration/bootstrap path.
2. Implement seed data for all required currencies with safe local-development rates.
3. Implement `CurrencyService.normalize_code` and active/known currency validation.
4. Implement Decimal conversion using:

   `target = source × source_usd_per_unit ÷ target_usd_per_unit`

5. Return explicit statuses for same currency, converted, missing rate, disabled currency, and unsupported currency.
6. Add unit tests for identity, cross-currency math, rounding, missing rates, inactive rates, invalid rates, and large decimal values.

**Exit criteria:** no route performs currency math directly, and service tests pass without requiring a running frontend.

### Phase 2: Admin currency management

1. Add admin authorization to currency management routes.
2. Implement list, create, update, activate/deactivate, and bulk-rate operations.
3. Validate uppercase three-letter codes, unique names/codes, positive finite rates, decimal places, and USD invariants.
4. Wrap bulk updates in one transaction; reject the complete request if one row is invalid.
5. Write audit entries with before/after payloads, actor, resource, reason, and correlation ID.
6. Add API tests for admin success, regular-user `403`, duplicate code, invalid rate, USD protection, atomic bulk failure, and audit output.

**Exit criteria:** an admin can manage the catalog and rates through the API, and all changes are auditable.

### Phase 3: User preference and shared currency APIs

1. Add `GET /api/v1/currencies` for active currencies.
2. Add `GET /api/v1/currencies/rates` for the authenticated display context or an admin-safe rate view.
3. Add `GET /api/v1/profile` if needed by the current profile contract.
4. Add `PUT /api/v1/profile/currency` with active-currency validation.
5. Backfill legacy users to INR at read/bootstrap time and persist the value where appropriate.
6. Add audit coverage for preference changes.

**Exit criteria:** changing a user's preference updates only profile state and is reflected by the next authenticated read.

### Phase 4: Domain and aggregate conversion

Create one response helper that decorates monetary fields with raw/display metadata, then integrate it in this order:

1. Goals: target, progress, remaining amount, and mapped investment totals.
2. Portfolio: invested amount, current value, gain/loss, category totals, and goal mapping totals.
3. Transactions: row values, income/expense summaries, categories, and monthly analytics.
4. Insurance: coverage, target, premium, coverage gap, and premium gap.
5. Overview dashboard: every monetary snapshot declares the display currency.
6. Life Domains and Governance: convert monetary fields; preserve raw source values for governance inspection.

Rules during integration:

- Filter by owner before calculating aggregates.
- Convert each record before summing when source currencies can differ.
- Never sum raw amounts across currencies.
- Return a warning and exclude unavailable values from converted totals rather than silently treating them as zero.
- Keep existing response fields temporarily for compatibility where tests or clients depend on them, while adding explicit converted fields and metadata.

Add endpoint tests with mixed USD, INR, EUR, and AED records and assert that changing the preference changes display values but not stored records.

**Exit criteria:** every in-scope monetary response is single-currency or explicitly currency-bucketed, and no supported summary hardcodes INR.

### Phase 5: Frontend experience

1. Add shared currency types, formatting, and conversion-status helpers in `web/lib`.
2. Add profile currency preference control with loading, save, success, validation, and disabled-currency states.
3. Add source-currency selectors beside monetary inputs in Goals, Portfolio, Transactions, and Insurance forms.
4. Add admin currency management screen with catalog table, rate edit form, active toggle, bulk update, timestamp, and audit history.
5. Update dashboard and domain pages to render display currency from API metadata.
6. Show raw source amount on detail views where conversion occurred, with rate timestamp and a clear unavailable warning.
7. Add responsive and accessibility coverage for keyboard operation, labels, table headers, status text, and narrow screens.

**Exit criteria:** preference changes update all visible supported values without a full raw-data rewrite, and inactive/missing states are understandable without relying on color.

### Phase 6: Hardening and release validation

1. Run backend unit and API tests.
2. Run frontend lint and typecheck.
3. Add contract tests that compare dashboard totals with domain totals under mixed currencies.
4. Add permission and audit regression tests.
5. Measure dashboard conversion latency with a representative record count.
6. Document rate update ownership, freshness expectations, and rollback procedure.
7. Validate migration on SQLite fallback and MariaDB.

## 7. API implementation details

### Admin currency payload

```json
{
  "currency_code": "AED",
  "currency_name": "United Arab Emirates Dirham",
  "symbol": "د.إ",
  "decimal_places": 2,
  "is_active": true,
  "usd_per_unit": "0.272294"
}
```

### User preference payload

```json
{
  "preferred_currency": "AED"
}
```

### Converted monetary value

```json
{
  "raw_amount": "100.00",
  "source_currency": "EUR",
  "display_amount": "390.12",
  "display_currency": "AED",
  "conversion_status": "converted",
  "rate_as_of": "2026-09-28T12:00:00Z"
}
```

Use strings for decimal values in JSON where that matches existing API conventions or where precision could be lost by JSON numbers. Do not accept `display_amount` from clients for persistence.

## 8. Testing matrix

| Area            | Required coverage                                                               |
| --------------- | ------------------------------------------------------------------------------- |
| Catalog         | seed idempotency, required currencies, uppercase uniqueness                     |
| Rate math       | identity, cross-currency, precision, rounding, missing and disabled rates       |
| Admin           | role enforcement, CRUD, bulk atomicity, USD invariant, audit records            |
| User profile    | default INR, active selection, invalid/inactive rejection, no raw mutation      |
| Goals/portfolio | mixed source currencies, converted progress and totals                          |
| Transactions    | mixed income/expense summaries and unsupported import handling                  |
| Insurance       | coverage/premium/gap conversion and warning propagation                         |
| Dashboard       | one declared display currency and no mixed-currency sums                        |
| Frontend        | loading/error/empty states, source selectors, preference refresh, accessibility |
| Migration       | MariaDB and SQLite bootstrap compatibility                                      |

## 9. Operational and rollback considerations

- Rate changes affect subsequent display reads immediately, so admins must see the effective timestamp and actor.
- Before rate updates, capture the old rate in `audit_logs`; rollback means submitting the previous rate through the same audited endpoint.
- If the currency service is unavailable, return raw values with an explicit unavailable status rather than stale or fabricated converted totals.
- Monitor conversion errors, missing-rate counts, inactive-currency references, dashboard latency, and admin update failures.
- No destructive data migration is required for the first release; existing raw amounts and source codes remain authoritative.

## 10. Definition of done

- Migration and idempotent seed are implemented for the supported catalog.
- Shared Decimal conversion service is used by all in-scope routes.
- Admin APIs, audit records, profile preference API, and frontend controls are implemented.
- Goals, portfolio, transactions, insurance, dashboard, Life Domains, and Governance monetary displays follow the conversion contract.
- Missing, inactive, and unsupported states are tested and visible.
- Backend tests, frontend lint/typecheck, and migration compatibility checks pass.
- Product documentation and operational ownership are updated before release.
