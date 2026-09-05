# ThriveMatrix Screen Integration Implementation Plan

## Status

Status: Completed. The protected route model, dashboard shell, module navigation, role enforcement, and session handling are implemented and validated; remaining approval items are governance-level signoffs.

## 1. Goal

Implement the required authenticated screen integration flow and module navigation model described in the Screen Integration PRD using the current ThriveMatrix stack: FastAPI backend, Next.js frontend, and role-based session enforcement.

## 2. Scope

This plan covers:

- post-login redirect and protected-route enforcement
- persistent global nav shell
- Overview dashboard snapshots
- module-specific management views and routing
- role-based Governance visibility
- session termination and reauthentication flows

## 3. Success criteria

The integration is complete when:

- unauthenticated users are redirected to Login
- authenticated users land on Overview after login
- all module links in the global navigation work correctly
- modules support their required create/edit/update/delete actions
- Governance remains hidden for non-admin roles
- session expiry and browser-close behaviors work reliably

## 4. Architecture alignment

### Frontend

Use the existing Next.js app-router structure and auth context pattern:

- protected route logic
- session refresh and validation
- redirect handling for invalid or missing session
- navigation state management

### Backend

Use the existing FastAPI authentication and session patterns:

- session status endpoint
- session termination endpoint
- protected route enforcement
- role validation for Governance access

### Data ownership

- all user data is scoped to the authenticated owner
- admin data access is restricted to permitted roles
- no module page should render sensitive data without validation

## 5. Implementation phases

### Phase 1: Secure auth and protected-route foundation

#### Tasks

1. Confirm route protection rules for all internal pages.
2. Finalize the public route list: Login and landing screens.
3. Enforce redirect to Login when session is missing, expired, or invalid.
4. Add automatic session termination on browser/tab close.
5. Ensure login success sends the user to Overview.

#### Deliverables

- protected-layout behavior implemented consistently
- auth-context session validation working
- auto-redirect logic for expired or invalid sessions
- session-close cleanup implemented

### Phase 2: Global navigation shell and Overview dashboard

#### Tasks

1. Create a persistent navigation shell across protected screens.
2. Add the required menu items:
   - Overview
   - Goals
   - Portfolio
   - Transactions
   - Insurance
   - Life Domains
   - Privacy
   - Governance (admin-only)
3. Add active menu highlighting logic.
4. Implement Overview cards with quick snapshot links.
5. Wire snapshot cards to their respective module pages.

#### Deliverables

- persistent header/nav shell
- module-level routing map
- active item state management
- Overview dashboard with snapshot cards

### Phase 3: Goals and Portfolio module screen integration

#### Goals module

1. Add goal summary/list page.
2. Add goal create form.
3. Add goal edit form.
4. Add disable/soft-delete action with confirmation.
5. Show fields: name, category, target amount, progress, priority, and status.

#### Portfolio module

1. Add investment list page.
2. Add investment create form.
3. Add investment edit form.
4. Add investment delete flow.
5. Show category breakdown and gain/loss indicators.

#### Deliverables

- complete goals module screen flow
- complete portfolio module screen flow
- consistent module cards and action buttons

### Phase 4: Transactions, Insurance, and Life Domains integration

#### Transactions module

1. Build income and expense management screen.
2. Add manual transaction create/edit flows.
3. Add delete flow.
4. Add statement upload dialog and file handling.
5. Show spending analytics and income vs expense summary.

#### Insurance module

1. Build policy list page.
2. Add policy create/edit/delete flows.
3. Add premium update flow.
4. Add coverage gap, premium gap, and renewal alerts.

#### Life Domains module

1. Build domain management page.
2. Add domain create/edit/update/delete flows.
3. Track health, relationships, legal, development, and emergency items.

#### Deliverables

- transactions management complete
- insurance management complete
- life domains management complete

### Phase 5: Privacy and Governance integration

#### Privacy module

1. Add privacy preferences list page.
2. Add edit form for privacy settings.
3. Add delete flow for privacy entries.

#### Governance module

1. Add admin-only route guard.
2. Build user management dashboard.
3. Add user enable/disable flow.
4. Add block user confirmation and action flow.
5. Add activity summary and system configuration access.

#### Deliverables

- privacy settings flow complete
- governance module visible only to authorized roles
- admin actions protected by backend checks

### Phase 6: QA, hardening, and release validation

#### Tasks

1. Validate redirect behavior for anonymous access.
2. Validate session expiry and browser-close termination.
3. Validate admin and non-admin access separation.
4. Run end-to-end happy path QA across all screens.
5. Verify empty states, loading states, and error handling.
6. Review accessibility, responsiveness, and page consistency.

#### Deliverables

- QA checklist signed off
- role enforcement validated
- release readiness review completed

## 6. Data and API contract considerations

### Frontend route map

- /login
- /home or /overview
- /goals
- /portfolio
- /transactions
- /insurance
- /domains
- /privacy
- /governance

### Protected page contract

All internal routes should require:

- valid active session
- verified user status where required
- role check for Governance

### API expectations

- GET /api/v1/auth/session-status
- POST /api/v1/auth/logout
- POST /api/v1/auth/session/terminate
- protected module endpoints for each domain
- role protected admin endpoints for Governance

## 7. Implementation order

1. Auth gating and redirect rules
2. Navigation shell and Overview dashboard
3. Goals and Portfolio
4. Transactions and Insurance
5. Life Domains and Privacy
6. Governance and admin enforcement
7. Regression testing and QA

## 8. Risks and mitigations

### Risk: stale session allowed after tab close

Mitigation:

- terminate session on pagehide and beforeunload
- validate session on route entry

### Risk: governance route leakage

Mitigation:

- hide menu item for non-admins
- enforce role checks at API and UI layers

### Risk: inconsistent UX across modules

Mitigation:

- standardize page layout, header, buttons, and modal behavior
- use consistent empty, loading, and error states

## 9. Definition of ready

The module is ready for implementation when:

- session validation model is agreed
- protected route list is confirmed
- role definitions are confirmed
- route map is finalized
- module requirements are complete

## 10. Definition of done

The module is complete when:

- all required screens are implemented
- all routes are protected and redirect correctly
- navigation is persistent and highlighted
- all module CRUD flows are working
- Governance is admin-only
- QA confirms secure and consistent user experience
