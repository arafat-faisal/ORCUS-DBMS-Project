# ORCUS Go Backend Architecture & Implementation Plan

**Course:** 06123228 — Database Management Laboratory  
**Project:** ORCUS (Organized Crime Understanding System)  
**Session:** Summer 2026  
**Module Owner:** A.K. Md. Shakil Hossain (Backend Lead) with Faisal (Database Lead) & Liza (UI Lead)

---

## 1. Technical Stack & Dependencies

| Component | Choice | Justification |
| :--- | :--- | :--- |
| **Language** | Go (v1.26+) | Strong typing, high concurrency, low memory footprint, compiled binary |
| **Web Framework** | `github.com/gin-gonic/gin` | Industry-standard REST router, high performance, clean middleware chain |
| **Database Driver** | `github.com/go-sql-driver/mysql` | Pure Go MySQL driver implementing standard `database/sql` |
| **SQL Helper** | `github.com/jmoiron/sqlx` | Clean struct scanning (`db.Select`, `db.Get`) while preserving explicit raw SQL queries for lab defense |
| **Authentication** | `golang.org/x/crypto/bcrypt` + `github.com/golang-jwt/jwt/v5` | Cryptographic password hashing and standard JWT token signing/verification |
| **Request Validation** | `github.com/go-playground/validator/v10` | Struct tag-based HTTP payload validation |
| **Environment Config**| `github.com/joho/godotenv` | `.env` configuration loader |
| **CORS Middleware** | `github.com/gin-contrib/cors` | Cross-Origin Resource Sharing with Next.js frontend (`localhost:3000`) |

---

## 2. Layered Architecture Directory Layout

```text
backend/
├── cmd/
│   └── server/
│       └── main.go                 # Entry point: config init, DB pool, router start
│
├── internal/
│   ├── config/
│   │   └── config.go               # Environment variables loader
│   │
│   ├── database/
│   │   ├── db.go                   # MySQL connection pool setup (MaxOpen, MaxIdle, Ping)
│   │   └── transaction.go          # Atomic transaction helper (WithTransaction)
│   │
│   ├── middleware/
│   │   ├── auth.go                 # JWT authentication middleware (Extracts User Claims)
│   │   ├── rbac.go                 # Role-Based Access Control middleware (RequireRoles)
│   │   ├── logger.go               # Structured HTTP request logger
│   │   ├── cors.go                 # CORS configuration for Next.js frontend
│   │   └── error_handler.go        # Standardized error response formatter
│   │
│   ├── models/                     # Data structs mapping to 3NF relational tables
│   │   ├── branch.go               # agency_branch struct
│   │   ├── officer.go              # officer struct & caseload view model
│   │   ├── user.go                 # user, role, user_role structs & JWT claims
│   │   ├── complainant.go          # complainant & complainant_contact structs
│   │   ├── gd.go                   # gd struct
│   │   ├── fir.go                  # fir, legal_section, fir_legal_section structs
│   │   ├── case.go                 # case & case_status_history structs
│   │   ├── participant.go          # suspect, victim, witness & junction models
│   │   ├── location.go             # location struct
│   │   ├── evidence.go             # evidence & evidence_status_history structs
│   │   └── analytics.go            # View models for reporting dashboards
│   │
│   ├── repository/                 # Data Access Layer (Raw SQL with sqlx)
│   │   ├── user_repository.go      # Login lookup, password hash check, roles
│   │   ├── branch_repository.go    # Branch queries
│   │   ├── officer_repository.go   # Officer queries & caseload view
│   │   ├── intake_repository.go    # Complainant, GD, FIR, Legal Sections
│   │   ├── case_repository.go      # Case CRUD, status history, joins
│   │   ├── participant_repository.go # Suspects, Victims, Witnesses & junction links
│   │   ├── location_repository.go  # Locations & case_location mappings
│   │   ├── evidence_repository.go  # Weak entity evidence & chain of custody
│   │   └── analytics_repository.go # Dashboard metrics & pipeline views
│   │
│   ├── service/                    # Business Logic & Transaction Management
│   │   ├── auth_service.go         # Login, JWT signing, password verification
│   │   ├── branch_service.go
│   │   ├── officer_service.go
│   │   ├── intake_service.go       # Intake workflow & FIR escalation
│   │   ├── case_service.go         # Atomic case status transition + history logging
│   │   ├── participant_service.go  # Suspect/Victim/Witness management
│   │   ├── evidence_service.go     # Atomic evidence chain of custody updates
│   │   └── analytics_service.go    # Summary metrics aggregation
│   │
│   └── handler/                    # HTTP Controllers (Gin Handlers)
│       ├── auth_handler.go         # /api/v1/auth/*
│       ├── branch_handler.go       # /api/v1/branches/*
│       ├── officer_handler.go      # /api/v1/officers/*
│       ├── intake_handler.go       # /api/v1/complainants, /gds, /firs, /legal-sections
│       ├── case_handler.go         # /api/v1/cases/*
│       ├── participant_handler.go  # /api/v1/suspects, /victims, /witnesses
│       ├── location_handler.go     # /api/v1/locations/*
│       ├── evidence_handler.go     # /api/v1/evidence/*
│       └── analytics_handler.go    # /api/v1/analytics/*
│
├── .env.example                    # Sample environment variables
├── go.mod                          # Go module definition
└── go.sum                          # Checksum file
```

---

## 3. Key Transactional Business Workflows

### 3.1 Case Status Transition with Immutable Audit Trail
When an authorized investigator changes the state of a case (e.g. `Open` $\to$ `Under Investigation` $\to$ `Pending Review` $\to$ `Closed`):
1. **`START TRANSACTION`**
2. `UPDATE \`case\` SET status = ?, assigned_date = ? WHERE case_id = ?`
3. `INSERT INTO case_status_history (case_id, status, changed_at, remarks, changed_by_user_id) VALUES (?, ?, NOW(), ?, ?)`
4. **`COMMIT`** (Rollback on any failure).

### 3.2 Evidence Chain of Custody State Transition
When evidence moves (e.g. `Collected` $\to$ `In Lab Analysis` $\to$ `Stored in Vault` $\to$ `Presented in Court`):
1. **`START TRANSACTION`**
2. `UPDATE evidence SET status = ?, storage_location = ? WHERE evidence_id = ?`
3. `INSERT INTO evidence_status_history (evidence_id, status, changed_at, remarks, changed_by_user_id) VALUES (?, ?, NOW(), ?, ?)`
4. **`COMMIT`** (Rollback on any failure).

### 3.3 Intake Escalation: GD $\to$ FIR $\to$ Case
1. Allows optional escalation from GD into an FIR linked with multiple statutory `legal_section` records via `fir_legal_section`.
2. Allows opening a formal `case` linked to the source FIR and assigning a lead officer from `officer`.

---

## 4. RESTful API Endpoints Specification

### 4.1 Authentication & Authorization (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticates credentials, returns JWT token and assigned roles |
| `GET` | `/api/v1/auth/me` | Authenticated | Returns current user profile and permissions |
| `POST` | `/api/v1/auth/register` | Admin | Creates a new user account with role mappings |

### 4.2 Organization & Officers (`/api/v1/branches`, `/api/v1/officers`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/branches` | Authenticated | List all branches with district filter |
| `POST` | `/api/v1/branches` | Admin | Create a new agency branch |
| `GET` | `/api/v1/officers` | Authenticated | List officers with search (name, badge, branch) |
| `GET` | `/api/v1/officers/:id` | Authenticated | Officer profile and assigned cases |
| `POST` | `/api/v1/officers` | Admin | Register sworn officer |
| `GET` | `/api/v1/officers/caseload` | Authenticated | Officer workload & active case count report |

### 4.3 Investigation Intake (`/api/v1/intake`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/complainants` | Authenticated | List complainants and contact channels |
| `POST` | `/api/v1/complainants` | Field Agent+ | Register complainant with primary phone/email |
| `GET` | `/api/v1/gds` | Authenticated | List General Diary records with date/complainant filter |
| `POST` | `/api/v1/gds` | Field Agent+ | Register new General Diary entry |
| `GET` | `/api/v1/firs` | Authenticated | List FIRs with crime category and legal section details |
| `POST` | `/api/v1/firs` | Lead Investigator+ | File new FIR with associated penal code sections |
| `GET` | `/api/v1/legal-sections` | Authenticated | Reference list of statutory penal sections |

### 4.4 Case Management (`/api/v1/cases`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cases` | Authenticated | Multi-criteria search and filter (status, officer, date range) |
| `GET` | `/api/v1/cases/:id` | Authenticated | Comprehensive case dossier (lead officer, participants, evidence) |
| `POST` | `/api/v1/cases` | Lead Investigator+ | Open new investigation case |
| `PUT` | `/api/v1/cases/:id/status` | Lead Investigator+ | **Atomic status change** with history logging |
| `GET` | `/api/v1/cases/:id/history` | Authenticated | View chronological case transition log |
| `POST` | `/api/v1/cases/:id/suspects` | Field Agent+ | Link suspect with role in crime |
| `POST` | `/api/v1/cases/:id/victims` | Field Agent+ | Link victim with impact type |
| `POST` | `/api/v1/cases/:id/witnesses` | Field Agent+ | Link witness with testimony summary |
| `POST` | `/api/v1/cases/:id/locations` | Field Agent+ | Link location with crime scene role |

### 4.5 Participants & Location
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/suspects` | Authenticated | List suspects filtered by suspicion level and status |
| `GET` | `/api/v1/suspects/:id/dossier` | Authenticated | Comprehensive suspect profile across all linked cases |
| `POST` | `/api/v1/suspects` | Field Agent+ | Register suspect with physical markers & suspicion level |
| `GET` | `/api/v1/victims` | Authenticated | List victims with condition and deceased status |
| `POST` | `/api/v1/victims` | Field Agent+ | Register victim record |
| `GET` | `/api/v1/witnesses` | Authenticated | List witnesses with protection and reliability flags |
| `POST` | `/api/v1/witnesses` | Field Agent+ | Register witness record |
| `GET` | `/api/v1/locations` | Authenticated | List incident locations by city and area |
| `POST` | `/api/v1/locations` | Field Agent+ | Register new location coordinates |

### 4.6 Evidence & Chain of Custody (`/api/v1/evidence`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/evidence` | Authenticated | List evidence filtered by case, type, status, vault |
| `GET` | `/api/v1/evidence/:id` | Authenticated | Evidence details and complete chain of custody log |
| `POST` | `/api/v1/evidence` | Forensic Specialist+ | Register weak entity evidence under a case |
| `PUT` | `/api/v1/evidence/:id/status` | Forensic Specialist+ | **Atomic chain-of-custody update** with history log |
| `GET` | `/api/v1/evidence/:id/chain` | Authenticated | Full audit trail from `v_evidence_chain_of_custody` |

### 4.7 Analytics & Dashboards (`/api/v1/analytics`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/overview` | Authenticated | Summary statistics (Active cases, pending FIRs, seized evidence) |
| `GET` | `/api/v1/analytics/pipeline` | Authenticated | Pipeline metrics from `v_fir_case_pipeline` |
| `GET` | `/api/v1/analytics/crime-stats` | Authenticated | Crime category and legal section distribution |

---

## 5. Implementation Roadmap & Steps

1. **Step 1: Module & Environment Setup**
   - Initialize Go module `orcus/backend`.
   - Setup `.env` configuration and MySQL connection pooling (`internal/database/db.go`).
2. **Step 2: Core Models & Transaction Utilities**
   - Define model structs mapping to the 25 database tables.
   - Implement `WithTransaction` helper for atomic multi-statement operations.
3. **Step 3: Security & RBAC Middleware**
   - Implement JWT token generator and validator.
   - Build role-based authorization middleware enforcing permissions.
4. **Step 4: Repository Layer Implementation**
   - Write parameterized raw SQL queries using `sqlx` matching all table requirements and views.
5. **Step 5: Service Layer & Business Rules**
   - Implement business logic validation (BR-01 to BR-15) and transactions.
6. **Step 6: REST Handler Controllers & Routing**
   - Implement Gin HTTP handlers and configure API route groups.
7. **Step 7: Verification & Testing**
   - Test endpoints with HTTP test requests against local MySQL `orcus_db`.
