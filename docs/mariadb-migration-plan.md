# MariaDB migration plan

## Status

Status: Strategy documented and aligned with the current implementation. The app remains MariaDB-first in design, with SQLite retained only as a local development fallback; the migration is validated as a deployment path rather than an active blocker.

## Goal

Move ThriveMatrix to MariaDB as the primary transactional database while keeping local development lightweight and predictable.

## Current state

- the app still has some SQLite fallback assumptions
- the architecture is moving toward a single durable relational database model
- local services are being kept minimal and cost-aware

## Target architecture

- MariaDB for core application data
- Redis for cache and lightweight operational state
- object storage for files and documents
- one consistent DB access layer for auth, sessions, and domain records

## Migration phases

1. Standardize configuration and environment values.
2. Add a DB compatibility layer for session and user storage.
3. Create the core schema for users, goals, investments, policies, and audit data.
4. Validate data reconciliation and auth flows.
5. Cut over to MariaDB and keep rollback ready.

## Key risks

- mixed persistence patterns across the app
- config drift between local and container runtime
- missed backup and restore procedures
- auth and session regressions during cutover

## Recommended approach

- keep the migration phased instead of a big-bang switch
- store all transactional records in MariaDB
- keep SQLite only as a temporary fallback during early local development
- validate access, auth, and portfolio flows after each migration stage

## Checklist

- confirm MariaDB version and driver
- standardize DATABASE_URL settings
- move session records to MariaDB tables
- create durable tables for core domain entities
- validate users, goals, investments, and policies
- run backup and restore checks
- update docs and deployment notes after cutover
