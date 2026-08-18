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
Phase 3: Go Backend API Development     [                    ]   0% PENDING
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

### Phase 3 — Backend Development (Go REST APIs)
- [ ] Initialize Go module (`go.mod`) with Fiber/Gin and `go-sql-driver/mysql`
- [ ] Database Connection Pool configuration and environment variables
- [ ] Authentication & JWT Token Middleware (RBAC role verification)
- [ ] Organization & Officer Endpoints (`/api/branches`, `/api/officers`)
- [ ] Investigation Intake Endpoints (`/api/gds`, `/api/firs`, `/api/cases`)
- [ ] Case Status Transition with Atomic Transaction (`START TRANSACTION`, `COMMIT`)
- [ ] Participant & Location Endpoints (`/api/suspects`, `/api/victims`, `/api/witnesses`, `/api/locations`)
- [ ] Evidence Management & Chain of Custody Endpoints (`/api/evidence`, `/api/evidence/history`)
- [ ] Search & Filter API (`/api/search/cases`, `/api/analytics/summary`)

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
