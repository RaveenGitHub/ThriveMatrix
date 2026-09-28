# Multi-currency and conversion module PRD

## Status

Status: Planned. This document is the product contract for introducing multi-currency storage, conversion, administration, and user display preferences across ThriveMatrix.

## 1. Module summary

ThriveMatrix currently stores currency codes on several financial records and defaults new values to INR, but it does not yet provide a central currency catalog, administrable rates, or consistent runtime conversion. This module establishes a single currency system for Goals, Portfolio, Transactions, Insurance, Life Domains where monetary values exist, Governance, and the Overview dashboard.

The system will:

- preserve every monetary amount in the currency in which it was entered
- allow administrators to manage supported currencies and USD-based conversion rates
- allow each user to choose a preferred display currency
- convert values at read time without mutating raw financial records
- make unavailable or disabled-rate states explicit to users and administrators

## 2. Problem statement

Users may hold investments, insurance policies, goals, income, and expenses in different currencies. Without a shared conversion contract, totals are inconsistent, goal progress is misleading, and cross-module comparisons cannot be trusted.

## 3. Product vision

Provide one transparent, auditable monetary view of a user's financial life while retaining the original currency and amount for data integrity, reporting, and future historical-rate support.

## 4. Objectives and success metrics

### Objectives

1. Support the major currencies required by the product and allow controlled additions.
2. Give administrators a secure workflow for currency and rate management.
3. Give users a profile-level preferred display currency.
4. Apply the same conversion behavior to every monetary response and dashboard aggregate.
5. Make raw amount, source currency, rate metadata, and conversion status inspectable.

### Success metrics

- 100% of monetary API responses identify their source currency and display currency.
- 100% of supported dashboard monetary aggregates use the shared conversion service.
- Conversion calculation latency remains below 1 second for a normal dashboard request.
- Zero mutation of stored raw monetary amounts when a user changes preference or an admin changes a rate.
- 100% of currency and rate changes produce an audit record.

## 5. Scope

### In scope

- currency master data and active/inactive status
- USD as the initial base currency
- current conversion rates with effective timestamps
- admin create, update, activate, deactivate, list, and bulk-rate operations
- user preferred display currency
- runtime conversion in Goals, Portfolio, Transactions, Insurance, Life Domains monetary fields, Overview, and Governance
- conversion metadata, missing-rate states, disabled-currency states, validation, audit, and tests

### Out of scope for the first release

- automatic external FX provider integration
- historical valuation using transaction-date rates
- currency hedging, volatility scoring, or rebalancing recommendations
- multi-currency allocation recommendations
- changing the base currency from USD

## 6. Supported currencies

The initial catalog must include at least:

| Code | Name                        |
| ---- | --------------------------- |
| USD  | US Dollar                   |
| INR  | Indian Rupee                |
| EUR  | Euro                        |
| GBP  | Pound Sterling              |
| AED  | United Arab Emirates Dirham |
| SGD  | Singapore Dollar            |
| AUD  | Australian Dollar           |
| CAD  | Canadian Dollar             |
| JPY  | Japanese Yen                |
| CHF  | Swiss Franc                 |
| CNY  | Chinese Yuan                |
| HKD  | Hong Kong Dollar            |
| ZAR  | South African Rand          |
| SAR  | Saudi Riyal                 |
| QAR  | Qatari Riyal                |
| MYR  | Malaysian Ringgit           |
| THB  | Thai Baht                   |

Administrators may add additional ISO 4217-style three-letter codes after validation. USD is always present and is the first-release base currency.

## 7. Currency and rate model

### 7.1 Stored values

Every monetary record must store:

- `amount` or field-specific monetary amount as a decimal, never a floating-point value in persistence
- the source `currency` code
- the existing owner and audit metadata

Existing field names remain compatible: goals use `target_currency`, investments and transactions use `currency`, and insurance uses `policy_currency` or the equivalent canonical field. New monetary fields must follow the same rule.

### 7.2 Rate semantics

Each active currency has one current rate expressed as USD per one unit of that currency:

`usd_per_unit(currency) = amount of USD represented by 1 source currency unit`

USD has a fixed rate of `1`. To convert an amount from source currency `S` to target currency `T`:

`target_amount = source_amount × usd_per_unit(S) ÷ usd_per_unit(T)`

Rates must be positive finite decimals. The conversion service must apply decimal arithmetic and a documented display scale/rounding policy. Stored raw amounts are never rounded or overwritten.

### 7.3 Conversion metadata

Converted responses must include, where applicable:

- raw amount and source currency
- converted amount and target/display currency
- rate identifiers or effective timestamp
- conversion status: `converted`, `same_currency`, `rate_not_available`, `currency_disabled`, or `unsupported_currency`
- a user-safe warning when conversion cannot be completed

## 8. Functional requirements

### 8.1 Admin currency management

An authenticated admin can:

- view all currencies, including inactive currencies and current rates
- add a currency with code, name, symbol, precision, and active status
- edit name, display metadata, and active status
- update a current USD-based rate
- submit a validated bulk rate update
- inspect the last updated time and actor
- view audit history for currency and rate changes

Rules:

- non-admin users receive `403` for admin operations
- codes are normalized to uppercase and are unique
- USD cannot be deleted or deactivated in the first release
- deactivation is soft state; existing records remain valid and retain their source currency
- rate updates are atomic per request and produce audit entries
- a rate update takes effect for subsequent reads immediately after commit

### 8.2 User currency preference

A user can select any active supported currency from Profile. The preference defaults to INR for compatibility with the current product behavior.

Changing the preference:

- updates only the user profile preference
- does not rewrite goals, investments, transactions, insurance, or other raw records
- changes the display currency for subsequent API responses and page renders
- records `last_changed` and an audit event
- rejects inactive, unsupported, or malformed currency codes

### 8.3 Display behavior

All monetary values shown in the user's authenticated experience must use the preferred display currency, including:

- Overview: portfolio value, goal progress, insurance coverage, income, expenses
- Goals: target, current progress, remaining amount, and mapped investment totals
- Portfolio: invested amount, current value, gain/loss, category totals, and goal mappings
- Transactions: row amounts, income, expenses, monthly totals, category totals, and analytics
- Insurance: coverage, target, premiums, coverage gap, and premium gap
- Life Domains: monetary values and monetary progress metrics where present
- Governance and admin views: raw values remain visible with source currency; converted values are shown when requested or required by the view

The API must not silently present a mixed-currency aggregate. Every aggregate must either be converted to one declared display currency or returned as a currency-bucketed result.

### 8.4 Input behavior

Create and edit forms must:

- show the source currency selector alongside each monetary input
- default the selector to the user's preferred currency
- preserve the selected source currency on save
- reject unsupported or inactive currencies for new entries
- allow existing records with a later-disabled currency to remain readable with a warning

## 9. Edge cases and user-facing states

| Condition                              | Required behavior                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Source and target currencies are equal | Return the original amount as `same_currency`; no rate lookup is needed.                                  |
| Rate missing                           | Return raw amount and source code with `rate_not_available`; do not fabricate a total.                    |
| Source or target currency inactive     | Return raw amount and a `currency_disabled` warning; block selection for new input.                       |
| Unsupported imported currency          | Preserve the import row as unsupported, exclude it from converted aggregates, and request manual mapping. |
| Zero or negative rate                  | Reject the admin update.                                                                                  |
| Invalid code or duplicate code         | Reject with validation error.                                                                             |
| Rate changes after data entry          | Recalculate display values on the next read; raw data remains unchanged.                                  |
| No preferred currency on legacy user   | Treat as INR and backfill/default the profile value.                                                      |

## 10. API contract

All routes use the existing `/api/v1` prefix and the current authentication and error envelope conventions.

### Admin routes

- `GET /api/v1/admin/currencies`
- `POST /api/v1/admin/currencies`
- `PUT /api/v1/admin/currencies/{currency_code}`
- `POST /api/v1/admin/currencies/rates/bulk`
- `GET /api/v1/admin/currencies/audit`

### User and shared routes

- `GET /api/v1/currencies`
- `GET /api/v1/currencies/rates`
- `GET /api/v1/profile`
- `PUT /api/v1/profile/currency`

The profile update accepts `{ "preferred_currency": "AED" }`. Shared currency responses must expose only active currencies by default; admin responses include inactive entries.

### Response contract

The conversion service should expose a reusable response shape similar to:

```json
{
  "raw_amount": "100.00",
  "source_currency": "EUR",
  "display_amount": "108.25",
  "display_currency": "AED",
  "conversion_status": "converted",
  "rate_as_of": "2026-09-28T12:00:00Z"
}
```

Exact field embedding may vary by endpoint, but the semantics must remain consistent.

## 11. Security, trust, and compliance

- Protect admin currency routes with the existing role check and authentication middleware.
- Log actor, operation, currency code, before/after rate, timestamp, and correlation ID in `audit_logs`.
- Never accept a client-supplied converted amount as authoritative.
- Keep raw amount and source currency available for reconciliation.
- Show rate timestamp and warning states wherever a converted total informs a financial decision.
- Use accessible labels and text status indicators; color alone must not communicate disabled or unavailable rates.
- Avoid presenting a converted estimate as an accounting or tax value without clear labeling.

## 12. Future enhancements

- historical rate snapshots and transaction-date valuation
- external FX provider integration with freshness and fallback controls
- scheduled rate refresh and approval workflow
- base-currency configuration after migration and reporting impacts are designed
- currency volatility and exposure analytics

## 13. Product acceptance criteria

1. An admin can create, update, activate, deactivate, list, and bulk-update supported currencies and rates.
2. A regular user cannot access admin currency operations.
3. A user can select an active preferred currency and see it reflected in all supported pages.
4. Raw financial records retain their original amount and currency after preference and rate changes.
5. Goals, portfolio, transactions, insurance, and dashboard aggregates use one declared display currency.
6. Missing, disabled, and unsupported currency states are explicit and do not produce misleading totals.
7. Currency and rate changes are auditable.
8. Automated tests cover rate math, permissions, persistence, aggregate conversion, and fallback states.
