# ORCUS Development Plan & Progress Tracker

**System:** ORCUS (Organized Crime Understanding System)  
**Organization:** ORCUS Investigation Agency  
**Course:** 06123228 — Database Management Laboratory (Summer 2026)  
**Team 3:**
- **Md. Arafat Hossain Faisal (241400060)** - Database Design, Integration & Lead
- **A.K. Md. Shakil Hossain (241400043)** - Investigation Intake, Go Backend & Sample Data
- **Ayshee Islam Liza (241400045)** - Participants, Location & Evidence, Next.js UI & Documentation

---

## Progress Overview

```
Phase 1: Database Design & Normalization [====================] 100% COMPLETE
Phase 2: Database Implementation        [====================] 100% COMPLETE
Phase 3: Go Backend API Development     [====================] 100% COMPLETE
Phase 4: Next.js Frontend Development   [                    ]   0% PENDING
Phase 5: Integration, Testing & Reports [                    ]   0% PENDING
```

---

## Phase Checklist

### Phase 1 — Database Design & Normalization (Completed)
- [x] Review Chen ER Model (14 conceptual entities, cardinalities, weak entities)
- [x] Define Relational Schema and Data Dictionary
- [x] Establish Primary Keys, Foreign Keys, and Surrogate Keys
- [x] Formulate Business Rules (BR-01 through BR-15)
- [x] Perform Functional Dependency (FD) Analysis
- [x] Verify Normalization (1NF $\to$ 2NF $\to$ 3NF / BCNF)
- [x] Create Team Workspace Documentation (`rough/faisal/`, `rough/shakil/`, `rough/liza/`)
- [x] Merge Feature Branches into `main`

### Phase 2 — Database Implementation (Completed)
- [x] Create Master DDL Script (`database/schema.sql`)
- [x] Implement Table Constraints (`PK`, `FK`, `UNIQUE`, `CHECK`, Indexes)
- [x] Create Realistic Sample Dataset (`database/sample_data.sql`)
- [x] Build Reporting & Operational Views (`database/views.sql`)
  - [x] `v_case_overview`
  - [x] `v_evidence_chain_of_custody`
  - [x] `v_officer_caseload`
  - [x] `v_suspect_dossier`
  - [x] `v_fir_case_pipeline`
- [x] Develop Analytical and Demonstration Queries (`database/queries.sql`)
- [x] Validate against MySQL 8.0+ / MariaDB (XAMPP environment)

### Phase 3 — Backend Development (Go REST APIs - Completed)
- [x] Initialize Master Go module (`backend/go.mod`) with Gin, sqlx, and `go-sql-driver/mysql`
- [x] Database Connection Pool configuration and environment variables (`backend/internal/config`, `backend/internal/database`)
- [x] Authentication & JWT Token Middleware with RBAC role verification (`backend/internal/middleware`)
- [x] Organization & Officer Endpoints (`/api/v1/branches`, `/api/v1/officers`, `/api/v1/officers/caseload`)
- [x] Investigation Intake Endpoints (`/api/v1/complainants`, `/api/v1/gds`, `/api/v1/firs`, `/api/v1/legal-sections`)
- [x] Case Management & Status Transitions with Atomic Transactions (`/api/v1/cases`, `/api/v1/cases/:id/status`)
- [x] Participant & Location Endpoints (`/api/v1/suspects`, `/api/v1/victims`, `/api/v1/witnesses`, `/api/v1/locations`)
- [x] Evidence Management & Chain of Custody Endpoints (`/api/v1/evidence`, `/api/v1/evidence/:id/chain`)
- [x] Search & Analytics Endpoints (`/api/v1/cases`, `/api/v1/analytics/overview`, `/api/v1/analytics/pipeline`)
- [x] Full Raw Works Crediting and Modification Documentation across all files
- [x] Comprehensive Automated Integration Test Suite (`backend/server_test.go` $\to$ PASS)

### Phase 4 — Frontend Development (Next.js & UI)
- [ ] Setup Next.js Project with TypeScript and App Router
- [ ] Design System & Dark/Light Modern Dashboard Layout
- [ ] Authentication / Login Page with Role-based Navigation
- [ ] Executive Dashboard (Metrics, Active Cases, Recent Evidence Logs)
- [ ] Case Management Flow (Intake Wizard: GD $\to$ FIR $\to$ Case)
- [ ] Case Detail View (Lead Officer, Suspects, Victims, Witnesses, Evidence List)
- [ ] Evidence Chain of Custody Timeline Component
- [ ] Advanced Search & Filter Interface (By Crime Category, District, Officer, Status)
- [ ] Exportable Investigation Dossier PDF / Report Generator

### Phase 5 — Testing, Integration & Final Presentation
- [ ] End-to-End API and UI Integration Testing
- [ ] Database Transaction Rollback Validation
- [ ] Performance Indexing Benchmarks
- [ ] Final Presentation Slides & Live Demo Preparation
- [ ] Final Lab Report Documentation Assembly
