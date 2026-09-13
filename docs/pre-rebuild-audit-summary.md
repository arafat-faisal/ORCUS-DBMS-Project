# ORCUS Pre-Rebuild Audit Summary

**Date**: 2026-09-13  
**Branch**: `rebuild/orcus-v2` (Derived from commit `7435cef`)  
**Database**: `orcus_db` (MySQL 8.0+ / InnoDB)  
**Backup Location**: `C:\Users\Arafat\orcus_db_backup_20260913_1635.sql` (51,085 bytes)

---

## 1. System Baseline

- **Backend**: Go 1.24 / Gin v1.10.0 / SQLx v1.4.0 on port `5050`
- **Frontend**: Next.js 16.3.5 / React 19.2.8 / Tailwind CSS v4 on port `7700`
- **Database**: 25 tables, 5 SQL views, 100% relational integrity (foreign keys in place)
- **Baseline Tests**:
  - `go test -v ./...`: 4/4 Passed (0.197s)
  - `npm run lint`: Failed with 14 errors, 47 warnings (React purity violations with `Math.random()`, `@typescript-eslint/no-explicit-any`)
  - `npm run build`: Succeeded (only `/` and `/_not-found` registered)

---

## 2. Identified Deficiencies & Critical Vulnerabilities

### Security & Privacy (CRITICAL / HIGH)
1. **Universal Password Backdoor**: `backend/internal/service/auth_service.go` allows any account to authenticate with `password123`, `admin123`, or `secret` when bcrypt hash comparison fails.
2. **Silent Admin Auto-Login**: `frontend/src/app/page.tsx` silently auto-authenticates unauthenticated visitors as `admin_faisal` (full Administrator & Lead Investigator).
3. **Hardcoded Secrets**: JWT secret key `orcus-unified-secret-key-summer-2026-faisal-shakil-liza` is committed in `.env` and hardcoded as a fallback in `config.go`.
4. **Permissive CORS**: `Access-Control-Allow-Origin: *` in `cors.go`.
5. **No Object/Branch Scoping**: Read endpoints (`/cases/:id`, `/evidence/:id`, `/suspects/:id`) allow any logged-in user to read confidential records nationwide.
6. **Cascade Deletion of Custody Logs**: `evidence_status_history` has `ON DELETE CASCADE` referencing `evidence`.

### Architecture & Workflows (HIGH)
1. **Missing Complaint Table**: No complaint database entity exists; only `complainant` person exists. No complaint assessment, tracking code, or public submission mechanism.
2. **Client-Side Random Numbering**: GD and FIR numbers are generated in React component state via `Math.random() * 8999 + 1000`.
3. **Arbitrary Status Jumps**: Case and evidence statuses jump between arbitrary states without state machine validation.
4. **Case Assignment History Erased**: Reassigning a case overwrites `lead_officer_id` without historical logging.
5. **Monolithic Frontend SPA**: `frontend/src/app/page.tsx` is an 844-line monolith simulating tabs with client state, lacking deep-linkable URL routes and firing 15 parallel HTTP queries on mount.

### UI / UX & Localization (HIGH / MEDIUM)
1. **Mocked Analytics**: Crime incident chart is a static SVG path; clearance rate gauge is hardcoded to 86% with inappropriate US military term "DEFCON-1 Active".
2. **Map Defect**: Leaflet map displays third-party API key required error tiles; clicking category filter buttons throws `ReferenceError: setActiveFilter is not defined`.
3. **Zero Bangla UI Support**: Zero i18n support, zero Bangla numerals, no emergency 999 disclaimer.
4. **Missing Administrative Geography**: Locations and branches lack Division, Upazila/Thana, and Union/Ward fields.
