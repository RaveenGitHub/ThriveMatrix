# ThriveMatrix Screen Integration PRD

## Status

Status: Implemented and validated. The authenticated application shell, protected navigation, role-based governance access, and session behaviors are in place and working in the current branch.

## 1. Overview

This module defines the authenticated application navigation, screen access model, and module-level integration behavior for ThriveMatrix. It ensures that users move through the product as a consistent, secure, and role-aware experience across goals, portfolio, transactions, insurance, life domains, privacy, and governance.

The design aligns with the current architecture:

- Frontend: Next.js app-router application
- Backend: FastAPI services with session validation
- Security model: authenticated access enforced for all protected screens
- User experience: consistent menu, redirect behavior, and modular page flow

## 2. Product objective

Create a unified post-login experience in which users can:

- access a protected Overview dashboard immediately after authentication
- navigate across all major modules through a persistent global menu
- reach the correct management screen for each domain
- be redirected safely when unauthenticated or session-invalid
- access Governance only with required admin roles

## 3. Problem statement

Without a standardized authenticated screen model, users may experience:

- inconsistent navigation paths
- direct access to protected routes without a valid session
- confusion when jumping between modules
- permission leakage to non-admin users
- difficulty understanding which actions are available in each domain

This PRD resolves these issues by standardizing screen flow, role enforcement, and module access patterns.

## 4. Users and roles

### 4.1 End-user

- Authenticated user with access to all personal financial and life domains
- Can manage goals, investments, transactions, insurance, life domains, and privacy settings

### 4.2 Admin / System Admin

- Can access Governance features
- Can view and manage user-level system functionality
- Must be excluded from non-admin user access to governance surfaces

## 5. Core user journeys

### 5.1 Authentication and landing flow

1. User opens the application.
2. If the user is authenticated and verified, route to the Overview dashboard.
3. If the user is unauthenticated, route to the Login page.
4. If the user visits a protected deep link without a valid session, redirect to Login.
5. If session expires, redirect to Login and clear any stale client-side session state.

### 5.2 Overview flow

1. User lands on Overview after login.
2. Overview shows quick snapshots for goals, portfolio, transactions, insurance, life domains, and privacy.
3. Each snapshot is clickable and routes to the corresponding module detail page.

### 5.3 Module navigation flow

The user can move between the main modules using a persistent global navigation bar:

- Overview
- Goals
- Portfolio
- Transactions
- Insurance
- Life Domains
- Privacy
- Governance (Admin only)

## 6. Functional requirements

### 6.1 Post-login behavior

- After successful authentication, redirect to the Overview page.
- Only authenticated users may access protected routes.
- Any unauthenticated request to a protected route must redirect to Login.
- Session expiry must force reauthentication.
- Closing browser or tab must terminate the current session.

### 6.2 Global navigation

- The global menu must remain visible and persistent across all modules.
- All menu items must redirect to their module page.
- The active item must be visually highlighted.
- Navigation state must remain stable during page transitions.

### 6.3 Overview page

The Overview page serves as the home dashboard and must display the following snapshots:

#### Goals snapshot

- total goals
- completed goals
- high-priority goals

#### Portfolio snapshot

- total investment value
- gain/loss summary
- category distribution

#### Transactions snapshot

- monthly expense
- income vs expense
- top spending category

#### Insurance snapshot

- coverage summary
- coverage gaps
- renewal alerts

#### Life domains snapshot

- health readiness
- personal development readiness
- legal readiness
- emergency readiness

#### Privacy snapshot

- privacy settings summary

#### Interaction rule

Clicking any snapshot must redirect to the respective full module page.

### 6.4 Goals module

The Goals module must support:

- add new goal
- edit existing goal
- update progress and target values
- disable goal with soft-delete semantics
- list goals with name, category, target amount, progress %, priority, and status

Navigation behavior:

- Add Goal → goal creation form
- Edit → goal edit form
- Disable → confirmation modal before soft delete

### 6.5 Portfolio module

The Portfolio module must support:

- add investment
- edit investment
- update current unit value
- change goal mapping
- delete investment
- display all investments, category breakdown, goal mapping, and gain/loss metrics

Navigation behavior:

- Add Investment → investment creation form
- Edit → investment edit form

### 6.6 Transactions module

The Transactions module must support:

- add manual transaction
- edit transaction
- update transaction
- delete transaction
- upload bank file statements (PDF, Excel, CSV)
- view spending pattern and income vs expense analysis

Navigation behavior:

- Upload Statement → file upload dialog
- Add Transaction → transaction form
- Edit → transaction edit form

### 6.7 Insurance module

The Insurance module must support:

- add policy
- edit policy
- update premium payment status
- delete policy
- view coverage amount, coverage goal, gap, premium gap, and renewal alerts

Navigation behavior:

- Add Policy → policy form
- Edit → policy edit form

### 6.8 Life domains module

The Life Domains module must support:

- health and well-being
- personal development
- relationships
- legal and documentation
- emergency preparedness

User actions:

- add domain entry
- edit domain entry
- update progress
- delete domain entry

Navigation behavior:

- Add Domain Item → domain form
- Edit → domain edit form

### 6.9 Privacy module

The Privacy module must support:

- add privacy preferences
- edit privacy settings
- update configuration
- delete privacy entries

Navigation behavior:

- Edit Privacy Settings → privacy edit form

### 6.10 Governance module

Governance must be visible only to Admin and System Admin roles.

Admin actions:

- view all users
- enable or disable user account
- permanently block user
- view user activity summary
- manage system-level configuration

Navigation behavior:

- View User → user detail page
- Disable User → confirmation modal
- Block User → confirmation modal

## 7. Security and session rules

### 7.1 Session rules

- Session ends when the browser closes, user logs out, or timeout occurs.
- Session token validation must occur on every protected route access.
- Expired or invalid sessions must force reauthentication.
- No silent continuation is allowed after tab close or browser shutdown.

### 7.2 Security requirements

- Unauthorized access must redirect to Login.
- Governance access must be role-based and restricted to admin roles.
- Protected pages must validate the active session before rendering content.
- Sensitive session tokens must not be exposed in logs or client-visible data.

## 8. Acceptance criteria

### 8.1 Authentication and access

- Login redirects to Overview.
- Protected deep links redirect to Login when unauthenticated.
- Session expiry redirects to Login.
- Browser or tab close ends the active session.

### 8.2 Navigation

- Global menu remains available on all protected pages.
- Active menu item is highlighted.
- Each menu item routes correctly to its module page.

### 8.3 Module behaviors

- Each module supports the full create/edit/update/delete flow defined in this PRD.
- Snapshot tiles navigate to the correct module page.
- Governance remains hidden for standard users.

## 9. Non-functional requirements

### Security

- all protected pages must enforce session validation
- role checks must be enforced at both UI and API layers
- admin-only routes must fail closed

### Usability

- navigation must feel consistent across all modules
- empty states and loading states must be clear
- actions should be visible and easy to discover

### Reliability

- all redirect behavior should be deterministic
- invalid sessions should consistently end in Login
- module transitions should not leave stale state behind

## 10. Out of scope

- external insurance provider integrations
- third-party financial institution connectors
- payment processing flows
- non-admin governance automation outside the defined access boundary

## 11. Definition of done

The integration module is done when:

- login and protected-route behavior are working end to end
- every menu item routes to the expected module page
- module CRUD flows are present for each major domain
- Governance access is admin-only
- session expiry and close behavior are enforced
- security and usability checks pass in QA
