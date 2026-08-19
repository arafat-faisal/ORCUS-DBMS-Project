# ORCUS Master Go Backend Integration Plan

**Lead Author & Integrator:** Md. Arafat Hossain Faisal (241400060)  
**Co-Authors:**  
- A.K. Md. Shakil Hossain (241400043) — Investigation Intake & Cases  
- Ayshee Islam Liza (241400045) — Participants, Location & Evidence  
**Course:** 06123228 — Database Management Laboratory (Summer 2026)  
**Target RDBMS:** MySQL 8.0+ / MariaDB 10.4+ (XAMPP - `orcus_db`)

---

## 1. Executive Summary

This document specifies the technical implementation plan for unifying the independently developed Go backend modules from all three team members into the master production backend in `backend/`.

The integration brings together:
1. **Module 1 (Faisal):** Organization & Access Control (`agency_branch`, `officer`, `user`, `role`, `user_role`), JWT Authentication, Role-Based Access Control (RBAC) middleware, and Officer Caseload analytics.
2. **Module 2 (Shakil):** Investigation Intake & Case Management (`complainant`, `complainant_contact`, `gd`, `fir`, `legal_section`, `fir_legal_section`, `case`, `case_status_history`), Multi-criteria Search, Case Dossier, and Atomic Case Status Transition transactions.
3. **Module 3 (Liza):** Participants, Location & Evidence (`suspect`, `victim`, `witness`, `location`, `evidence`, `evidence_status_history`, junction tables), Suspect Dossier, Case-Participant Links, Weak Entity Evidence management, and Atomic Chain of Custody transactions.

---

## 2. Review and Analysis of Team Contributions

### 2.1 Faisal's Module (`rough/faisal/backend-development/`)
- **Strengths:** Robust bcrypt hashing, JWT issuance and verification, variadic RBAC middleware (`RequireRoles`), clean integration with view `v_officer_caseload`, standard response envelope.
- **Role in Master Backend:** Provides the core security backbone (`internal/middleware/auth.go`, `internal/middleware/rbac.go`), user authentication routes, and branch/officer repositories.

### 2.2 Shakil's Module (`rough/shakil/backend-development/`)
- **Strengths:** Complete intake pipeline (Complainants with multivalued contacts, GDs, FIRs with multiple legal sections), comprehensive case search filtering, and transactional case status transition (`case_status_history`).
- **Role in Master Backend:** Supplies intake repository, case repository, transactional status transition logic, and intake HTTP handlers.

### 2.3 Liza's Module (`rough/liza/backend-development/`)
- **Strengths:** Participant management, case-participant junction linking (`case_suspect`, `case_victim`, `case_witness`, `case_location`), weak entity evidence handling, and chain of custody tracking (`evidence_status_history`).
- **Role in Master Backend:** Supplies participant repository, location repository, evidence repository with sequential case numbering (`(case_id, evidence_no)`), and chain of custody handlers.

---

## 3. Harmonization & Standardization Strategy

To ensure zero conflicts and a cohesive developer experience, the following standards are unified:

1. **Web Framework & Routing:**
   - Standardized on `github.com/gin-gonic/gin`.
   - All endpoints mounted under `/api/v1/`.

2. **Security & Authorization:**
   - Faisal's JWT Auth middleware protects all private routes.
   - RBAC middleware (`RequireRoles(...)`) enforces specific access rules:
     - `Administrator`: Branch/Officer creation, User registration, System audit.
     - `Lead Investigator`: Case creation, Status transition, FIR filing.
     - `Field Detective`: Complainant intake, GD logging, Suspect/Witness registration, Case linking.
     - `Forensic Specialist`: Evidence registration, Chain of custody status transitions.

3. **Database Access & Transactions:**
   - Pure `github.com/jmoiron/sqlx` with parameterized queries (`?`) to guarantee SQL injection prevention.
   - Connection pool management (`internal/database/db.go`).
   - `WithTransaction` helper ensuring ACID transactions for:
     - User + Role assignment
     - FIR + Legal sections mapping
     - Case status transition + `case_status_history` logging
     - Evidence creation + `(case_id, evidence_no)` sequence calculation
     - Evidence status transition + `evidence_status_history` logging

4. **Standard JSON Envelopes:**
   - Success: `{ "success": true, "message": "...", "data": ..., "count": ... }`
   - Failure: `{ "success": false, "error": "..." }`

---

## 4. Master Backend Architecture Layout (`backend/`)

```text
backend/
├── cmd/
│   └── server/
│       └── main.go                 # Server entry point: DB pool init & router start
│
├── internal/
│   ├── config/
│   │   └── config.go               # Environment config loader (.env)
│   │
│   ├── database/
│   │   ├── db.go                   # MySQL connection pool configuration
│   │   └── transaction.go          # Transaction helper (WithTransaction)
│   │
│   ├── middleware/
│   │   ├── auth.go                 # JWT authentication middleware (Claims extraction)
│   │   ├── rbac.go                 # Role-Based Access Control middleware (RequireRoles)
│   │   ├── cors.go                 # CORS configuration for Next.js frontend
│   │   ├── logger.go               # HTTP request logging
│   │   └── error_handler.go        # Global recovery & error formatting
│   │
│   ├── models/                     # Go structs mapping 1-to-1 with 25 relational tables & views
│   │   ├── organization.go         # agency_branch, officer, user, role, user_role
│   │   ├── intake.go               # complainant, contact, gd, fir, legal_section
│   │   ├── case.go                 # case, case_status_history, v_case_overview
│   │   ├── participant.go          # suspect, victim, witness, location, junction tables
│   │   ├── evidence.go             # evidence, evidence_status_history, v_evidence_chain_of_custody
│   │   └── response.go             # StandardResponse, DTOs
│   │
│   ├── repository/                 # Data Access Layer (Raw SQL with sqlx)
│   │   ├── auth_repo.go            # User lookup, password check, role mappings
│   │   ├── organization_repo.go    # Branch & Officer queries, v_officer_caseload
│   │   ├── intake_repo.go          # Complainant, GD, FIR, Legal Sections
│   │   ├── case_repo.go            # Case CRUD, status history, search filtering
│   │   ├── participant_repo.go     # Suspects, Victims, Witnesses, Locations & Links
│   │   ├── evidence_repo.go        # Evidence weak entity & chain of custody
│   │   └── analytics_repo.go       # Summary metrics and view aggregation
│   │
│   ├── service/                    # Business Logic Layer & Transactions
│   │   ├── auth_service.go         # Login, JWT signing, password verification
│   │   ├── organization_service.go # Branch & Officer management
│   │   ├── intake_service.go       # Complainant, GD, FIR workflows
│   │   ├── case_service.go         # Atomic case status transition & search
│   │   ├── participant_service.go  # Suspect/Victim/Witness/Location logic
│   │   ├── evidence_service.go     # Atomic evidence chain of custody transitions
│   │   └── analytics_service.go    # Dashboard summary statistics
│   │
│   └── handler/                    # REST HTTP Controllers (Gin Handlers)
│       ├── auth_handler.go         # /api/v1/auth/*
│       ├── organization_handler.go # /api/v1/branches/*, /api/v1/officers/*
│       ├── intake_handler.go       # /api/v1/complainants/*, /api/v1/gds/*, /api/v1/firs/*
│       ├── case_handler.go         # /api/v1/cases/*
│       ├── participant_handler.go  # /api/v1/suspects/*, /api/v1/victims/*, /api/v1/witnesses/*
│       ├── location_handler.go     # /api/v1/locations/*
│       ├── evidence_handler.go     # /api/v1/evidence/*
│       ├── analytics_handler.go    # /api/v1/analytics/*
│       └── router.go               # Master router registration & route wiring
│
├── .env.example
├── go.mod
└── go.sum
```

---

## 5. Unified API Route Map

```text
/api/v1
│
├── /auth
│   ├── POST /login                 [Public] Authenticate user, return JWT & roles
│   ├── GET  /me                    [Authenticated] Current user profile
│   └── POST /register              [Role: Administrator] Create user account
│
├── /branches
│   ├── GET  /                      [Authenticated] List branches (with district filter)
│   ├── GET  /:id                   [Authenticated] Get branch by ID
│   └── POST /                      [Role: Administrator] Create branch
│
├── /officers
│   ├── GET  /                      [Authenticated] List officers (search by name/badge)
│   ├── GET  /caseload              [Authenticated] Officer workload report (v_officer_caseload)
│   ├── GET  /:id                   [Authenticated] Get officer profile
│   └── POST /                      [Role: Administrator] Create officer
│
├── /roles
│   └── GET  /                      [Authenticated] List all system roles
│
├── /complainants
│   ├── GET  /                      [Authenticated] List complainants & contacts
│   └── POST /                      [Role: Field Detective+] Register complainant
│
├── /gds
│   ├── GET  /                      [Authenticated] List GD records
│   └── POST /                      [Role: Field Detective+] File General Diary
│
├── /firs
│   ├── GET  /                      [Authenticated] List FIRs
│   └── POST /                      [Role: Lead Investigator+] File FIR with legal sections
│
├── /legal-sections
│   └── GET  /                      [Authenticated] List penal code sections
│
├── /cases
│   ├── GET  /                      [Authenticated] Multi-criteria search (status, category, officer)
│   ├── GET  /:id                   [Authenticated] Full case dossier (officer, participants, evidence)
│   ├── POST /                      [Role: Lead Investigator+] Open case
│   ├── PUT  /:id/status            [Role: Lead Investigator+] Atomic status transition
│   ├── GET  /:id/history           [Authenticated] Chronological case lifecycle log
│   ├── POST /:id/suspects          [Role: Field Detective+] Link suspect with role
│   ├── POST /:id/victims           [Role: Field Detective+] Link victim with impact type
│   ├── POST /:id/witnesses         [Role: Field Detective+] Link witness with statement
│   └── POST /:id/locations         [Role: Field Detective+] Link location with role
│
├── /suspects
│   ├── GET  /                      [Authenticated] List suspects with risk/status filter
│   ├── GET  /:id/dossier           [Authenticated] Cross-case criminal profile (v_suspect_dossier)
│   └── POST /                      [Role: Field Detective+] Register suspect
│
├── /victims
│   ├── GET  /                      [Authenticated] List victims
│   └── POST /                      [Role: Field Detective+] Register victim
│
├── /witnesses
│   ├── GET  /                      [Authenticated] List witnesses (filter protected)
│   └── POST /                      [Role: Field Detective+] Register witness
│
├── /locations
│   ├── GET  /                      [Authenticated] List locations by city/area
│   └── POST /                      [Role: Field Detective+] Register location
│
├── /evidence
│   ├── GET  /                      [Authenticated] List evidence by case/status/type
│   ├── GET  /:id                   [Authenticated] Evidence details
│   ├── POST /                      [Role: Forensic Specialist+] Register weak entity evidence
│   ├── PUT  /:id/status            [Role: Forensic Specialist+] Atomic chain of custody transition
│   └── GET  /:id/chain             [Authenticated] Full audit trail log (v_evidence_chain_of_custody)
│
└── /analytics
    ├── GET  /overview              [Authenticated] Dashboard KPI metrics
    └── GET  /pipeline              [Authenticated] Intake pipeline summary (v_fir_case_pipeline)
```

---

## 6. Implementation & Verification Plan

### Phase A: Setup & Foundation
- Initialize master `backend/go.mod` and install dependencies (`gin`, `mysql`, `sqlx`, `jwt`, `bcrypt`, `cors`, `godotenv`).
- Setup configuration loader and MySQL connection pooling.

### Phase B: Assemble Layers
- Populate `internal/models/` with complete structs mapping all 25 tables and views.
- Assemble `internal/middleware/` (Auth, RBAC, CORS, Logger).
- Assemble `internal/repository/` with parameterized SQL queries for all three modules.
- Assemble `internal/service/` with business validations (BR-01 through BR-15) and transactions.
- Assemble `internal/handler/` and wire the master router in `cmd/server/main.go`.

### Phase C: Automated Verification
- Run compilation check: `go build -o server.exe ./cmd/server`.
- Run automated end-to-end integration tests against local MySQL `orcus_db`:
  1. Auth Login & JWT extraction
  2. RBAC access enforcement (allowed vs forbidden routes)
  3. Branch & Officer caseload queries
  4. GD $\to$ FIR $\to$ Case intake flow
  5. Atomic Case status transition & `case_status_history` logging
  6. Participant linking & Suspect dossier query
  7. Weak entity Evidence creation & Atomic chain of custody transition
  8. Dashboard Analytics & Views verification

### Phase D: Merge & Push
- Commit all merged work to branch `backend/integration`.
- Push branch to GitHub.
- Open integration Pull Request to `main` for final team sign-off.
