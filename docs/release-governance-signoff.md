# Release governance signoff checklist

## Scope

This checklist captures the remaining approval items that must be cleared before general availability, while keeping the technical implementation itself separate from governance decisions.

## Current working status

- Product implementation baseline is green and validated.
- Backend and frontend are working in the current branch.
- No engineering blocker is open from the build or test perspective.
- Pending items are release and policy approvals, not code defects.

## Required signoffs before release

### 1. Statement retention and deletion period

Required approvers:

- Legal
- Privacy
- Security

Decision required:

- Maximum retention period for financial, personal, and health data
- Deletion review workflow and exception handling
- Audit trail of deletion or retention exceptions

Evidence to collect:

- retention policy text
- deletion workflow diagram or runbook
- consent scope and client notification details

Status:

- Pending

### 2. Market-price provider and licensing

Required approvers:

- Product
- Finance
- Legal

Decision required:

- approved data provider
- licensing or commercial terms
- whether live pricing is in scope for MVP or later release
- fallback behavior if provider is unavailable

Evidence to collect:

- vendor contract or procurement note
- licensing review summary
- data source usage policy

Status:

- Pending

### 3. Regulated financial activity boundary

Required approvers:

- Product
- Finance
- Legal
- Compliance

Decision required:

- exact boundary of regulated activities supported by the platform
- disclosure language
- restrictions or approvals required before offering specific capabilities

Evidence to collect:

- compliance matrix
- user-facing disclaimers
- operating role restrictions and review controls

Status:

- Pending

### 4. Brand monogram choice

Required approvers:

- Design
- Brand

Decision required:

- final monogram or brand token choice
- acceptable fallback for conflicting source documents

Evidence to collect:

- final approved design asset
- brand usage guidance

Status:

- Pending

## Decision tracker

| Decision item                           | Status  | Required approvers                  | Evidence needed                      | Notes                               |
| --------------------------------------- | ------- | ----------------------------------- | ------------------------------------ | ----------------------------------- |
| Statement retention and deletion period | Pending | Legal, Privacy, Security            | retention policy, deletion flow      | Release dependency                  |
| Market-price provider and licensing     | Pending | Product, Finance, Legal             | vendor approval, license review      | Release dependency for live pricing |
| Regulated financial activity boundary   | Pending | Product, Finance, Legal, Compliance | compliance matrix, disclaimer review | Release dependency before GA        |
| Brand monogram choice                   | Pending | Design, Brand                       | approved brand asset                 | Design decision only                |

## Approval path

1. Confirm the decision owner and required approvers.
2. Attach the evidence artifact for each item.
3. Record the final approval date.
4. Keep the decision visible in the governance ledger until all required approvals are complete.
5. Do not treat these as engineering blockers unless a chosen policy directly changes current product behavior.

## Immediate next actions

| Priority | Action                                                                                      | Owner                               | Status  | Notes                                                                                         |
| -------- | ------------------------------------------------------------------------------------------- | ----------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| P1       | Confirm the data retention and deletion policy for financial, personal, and health records. | Legal, Privacy, Security            | Pending | Must include review exceptions and client notice behavior.                                    |
| P1       | Approve the live pricing vendor and licensing path.                                         | Product, Finance, Legal             | Pending | Required before any live market-data integration is enabled.                                  |
| P1       | Define the regulated financial activity boundary and disclosure requirements.               | Product, Finance, Legal, Compliance | Pending | This is the release gate for GA eligibility.                                                  |
| P2       | Finalize the approved monogram or brand asset.                                              | Design, Brand                       | Pending | Pure design signoff; no technical blocker.                                                    |
| P3       | Keep the implementation baseline under review until each governance approval is complete.   | Project lead                        | Ongoing | No code defect should be opened for pending governance items unless they change the contract. |

## Signoff note

These items remain governance actions rather than implementation defects. The codebase can continue to be treated as a working MVP baseline while these approvals are pending, provided the approval items do not alter the implemented feature contract.
