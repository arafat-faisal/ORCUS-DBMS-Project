# ORCUS Backend Creation Workflow

## Purpose

The goal of this phase is to design and develop the Go REST API backend collaboratively while maintaining clear ownership, documentation, reviewability, and traceability.

Every team member will independently design and implement their assigned module, document all API specifications and decisions, and create Go files in their own workspace.

The final Go backend will be merged into `backend/` only after review, discussion, and approval.

---

# Repository Structure

Every team member must work inside their own folder.

```text
rough/
│
├── faisal/
│   ├── database-creation/
│   └── backend-development/
│
├── shakil/
│   ├── database-creation/
│   └── backend-development/
│
└── liza/
    ├── database-creation/
    └── backend-development/
```

---

# Required Files

Each member must create inside their workspace:

```text
backend-development/
│
├── api_spec.md
├── decisions.md
└── <name>_backend/
```

Example:

```text
rough/
└── faisal/
    └── backend-development/
        ├── api_spec.md
        ├── decisions.md
        └── faisal_backend/
```

---

# File Responsibilities

## api_spec.md

Purpose: Human-readable REST API endpoint specifications.

Include:

- Endpoint Route (e.g. `POST /api/v1/auth/login`)
- HTTP Method (`GET`, `POST`, `PUT`, `DELETE`)
- Authorization / Required Role
- Request Body / Query Parameters
- Response JSON Schema & Status Codes
- Error Responses

No Go code should be written here.

---

## decisions.md

Purpose: Record every important architectural, query, and API design decision.

Template:

```text
Decision ID:

Module / Endpoint:

Choice:

Reason:
```

Document all assumptions, query optimizations, and transaction handling.

---

## <name>_backend/

Purpose: Actual Go code implementation for the assigned module.

Contains:

- Models / Structs
- Database Queries (sqlx / database/sql)
- Business Logic & Transactions
- HTTP Handlers / Controllers

Only Go code belongs here.

---

# Team Distribution

## Md. Arafat Hossain Faisal

### Module
Organization & Access Control

### Assigned Tables & Scope
- `AGENCY_BRANCH`
- `OFFICER`
- `USER`
- `ROLE`
- `USER_ROLE`

### Features & Endpoints
- User login with password verification (bcrypt)
- JWT Authentication & RBAC Middleware
- Current authenticated user profile (`GET /api/v1/auth/me`)
- Branch management (`GET /api/v1/branches`, `POST /api/v1/branches`)
- Officer directory & search (`GET /api/v1/officers`, `GET /api/v1/officers/:id`)
- Officer caseload analytics (`GET /api/v1/officers/caseload`)

Workspace:

```text
rough/faisal/backend-development/
```

---

## A.K. Md. Shakil Hossain

### Module
Investigation Intake & Cases

### Assigned Tables & Scope
- `COMPLAINANT`
- `COMPLAINANT_CONTACT`
- `GD`
- `FIR`
- `LEGAL_SECTION`
- `FIR_LEGAL_SECTION`
- `CASE`
- `CASE_STATUS_HISTORY`

### Features & Endpoints
- Complainant & contact channel management (`GET /api/v1/complainants`, `POST /api/v1/complainants`)
- General Diary recording & search (`GET /api/v1/gds`, `POST /api/v1/gds`)
- FIR filing with statutory legal sections (`GET /api/v1/firs`, `POST /api/v1/firs`, `GET /api/v1/legal-sections`)
- Case intake, multi-criteria search, and case dossier retrieval
- Atomic case status transition transaction (`PUT /api/v1/cases/:id/status`)
- Chronological case lifecycle history log (`GET /api/v1/cases/:id/history`)

Workspace:

```text
rough/shakil/backend-development/
```

---

## Ayshee Islam Liza

### Module
Participants, Location & Evidence

### Assigned Tables & Scope
- `SUSPECT`
- `VICTIM`
- `WITNESS`
- `LOCATION`
- `EVIDENCE`
- `EVIDENCE_STATUS_HISTORY`
- Bridge tables (`CASE_SUSPECT`, `CASE_VICTIM`, `CASE_WITNESS`, `CASE_LOCATION`, `VICTIM_LOCATION`, `VICTIM_EVIDENCE`)

### Features & Endpoints
- Suspect management & cross-case criminal dossier (`GET /api/v1/suspects`, `GET /api/v1/suspects/:id/dossier`, `POST /api/v1/suspects`)
- Victim & protected witness records (`GET /api/v1/victims`, `GET /api/v1/witnesses`)
- Incident location directory & GPS coordinates (`GET /api/v1/locations`, `POST /api/v1/locations`)
- Case-participant linking endpoints (`POST /api/v1/cases/:id/suspects`, `/victims`, `/witnesses`, `/locations`)
- Weak entity Evidence registration under a case (`POST /api/v1/evidence`)
- Atomic evidence chain of custody transition transaction (`PUT /api/v1/evidence/:id/status`)
- Complete evidence chain of custody audit log (`GET /api/v1/evidence/:id/chain`)

Workspace:

```text
rough/liza/backend-development/
```

---

# Git Workflow

## Create Branch

```bash
git checkout -b <name>/backend-development
```

Examples:

```bash
git checkout -b faisal/backend-development
git checkout -b shakil/backend-development
git checkout -b liza/backend-development
```

## Commit Frequently

```bash
git add .
git commit -m "Add backend module updates"
git push origin <branch-name>
```

## Pull Request

1. Complete assigned work
2. Push branch
3. Create Pull Request
4. Team review
5. Faisal approves
6. Merge after approval

---

# Review Checklist

Before approval verify:

- Endpoints follow REST conventions
- JSON responses use consistent envelope format (`{ "success": true, "data": ... }`)
- Parameterized SQL queries are used (no SQL injection)
- Multi-table state changes use atomic database transactions
- Business rules (BR-01 through BR-15) are strictly enforced
- Role-based authorization protects privileged endpoints
- Error handling returns appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Code compiles and runs cleanly against MySQL `orcus_db`

---

# Naming & Response Standard

## URL Routes
Use `kebab-case`.

Examples:
```text
/api/v1/legal-sections
/api/v1/case-history
```

## JSON Field Names
Use `snake_case`.

Examples:
```text
case_id
officer_name
badge_no
```

---

# Final Integration Process

After all three members finish:

## Step 1

Review all API specifications and handlers together.

## Step 2

Resolve route naming, middleware, and dependency conflicts.

## Step 3

Merge all reviewed modules into the master backend:

```text
backend/
```

## Step 4

Run end-to-end integration tests against MySQL `orcus_db`.

---

# Important Rules

✅ Design First

✅ Document Every Decision

✅ Work In Your Own Workspace

✅ Use Pull Requests

✅ Review Before Merge

❌ Do Not Edit Final Backend Directly

❌ Do Not Push To Main Directly

❌ Do Not Modify Another Member's Workspace Without Discussion

The final ORCUS backend must be created from reviewed, documented, and approved contributions from every team member.
