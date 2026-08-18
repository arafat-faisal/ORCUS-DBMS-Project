# ORCUS Business Rules & Integrity Constraints

This document defines the formal business rules, integrity constraints, and relational enforcement mechanisms implemented in the ORCUS database system.

---

## 1. Core Workflow Rules

### BR-01: General Diary to FIR Relationship
- **Rule:** Every FIR may reference at most one source General Diary (GD), but the link is optional.
- **Enforcement:** `fir.gd_id` is a nullable foreign key referencing `gd.gd_id` with `ON UPDATE CASCADE ON DELETE RESTRICT`. Direct FIR filings without a prior GD have `fir.gd_id = NULL`.

### BR-02: FIR to Case Relationship
- **Rule:** Every investigation Case may reference at most one source FIR, but the link is optional.
- **Enforcement:** `case.fir_id` is a nullable foreign key referencing `fir.fir_id` with `ON UPDATE CASCADE ON DELETE RESTRICT`. Direct agency-initiated cases have `case.fir_id = NULL`.

### BR-03: Weak Entity Evidence Constraint
- **Rule:** Evidence cannot exist without a parent Case and is identified within the case by a sequential item number.
- **Enforcement:** `evidence.case_id` is `NOT NULL` referencing `case.case_id` with `ON DELETE RESTRICT`, accompanied by a composite unique constraint `UNIQUE KEY (case_id, evidence_no)`.

### BR-04: User Identity Integrity
- **Rule:** System usernames must be globally unique and meet a minimum length requirement.
- **Enforcement:** `UNIQUE KEY (username)` and `CHECK (CHAR_LENGTH(username) >= 3)` on `user.username`.

### BR-05: Officer Badge Uniqueness
- **Rule:** Sworn badge numbers must be unique across all officers in the agency.
- **Enforcement:** `UNIQUE KEY (badge_no)` on `officer.badge_no`.

---

## 2. Auditability & History Tracking Rules

### BR-06: Append-Only Evidence Status History
- **Rule:** Evidence status transitions must never overwrite past status history; each transition must be recorded as an immutable timestamped log.
- **Enforcement:** Table `evidence_status_history` records `(history_id, evidence_id, status, changed_at, remarks, changed_by_user_id)` with `DEFAULT CURRENT_TIMESTAMP`.

### BR-07: Append-Only Case Status History
- **Rule:** Changes to case states (e.g. Open $\to$ Under Investigation $\to$ Pending Review $\to$ Closed) must be recorded chronologically.
- **Enforcement:** Table `case_status_history` records state transitions with timestamps and responsible user IDs.

---

## 3. Access Control & Authorization Rules

### BR-08: Role-Based Access Control (RBAC)
- **Rule:** Access privileges are granted to user accounts via one or more assigned roles. An account without roles has no system permissions.
- **Enforcement:** Bridge table `user_role` resolves M:N `HAS_ROLE` relationship between `user` and `role` with composite primary key `(user_id, role_id)`.

### BR-09: Officer Account Mapping
- **Rule:** A user account may optionally correspond to at most one sworn officer, and an officer may have at most one user account.
- **Enforcement:** `user.officer_id` is nullable with a `UNIQUE KEY (officer_id)` referencing `officer.officer_id`.

### BR-10: Cryptographic Credential Storage
- **Rule:** Plaintext passwords must never be stored in the database.
- **Enforcement:** `user.password_hash` stores 255-character cryptographic hashes (bcrypt/argon2).

---

## 4. Referential Integrity & Cascade Rules

### BR-11: Restricted Deletion on Core Entities
- **Rule:** Deletion of branches, officers, complainants, GDs, FIRs, or Cases is prohibited when dependent active records exist.
- **Enforcement:** `ON DELETE RESTRICT` on all primary parent-child foreign keys.

### BR-12: Cascading Cleanup on Bridge Tables
- **Rule:** When a participant (suspect, victim, witness) or role is deleted, its junction mappings in bridge tables must be removed automatically to prevent orphan references.
- **Enforcement:** `ON DELETE CASCADE` on participant and role foreign keys in junction tables (`case_suspect`, `case_victim`, `case_witness`, `case_location`, `user_role`).

---

## 5. Domain & Validation Rules

### BR-13: Branch Geographic Uniqueness
- **Rule:** No two branches within the same district can share the same name.
- **Enforcement:** `UNIQUE KEY (branch_name, district)` on `agency_branch`.

### BR-14: Participant Age Validation
- **Rule:** Recorded human ages must fall within valid biological limits.
- **Enforcement:** `CHECK (age IS NULL OR (age >= 0 AND age <= 120))` on `suspect`, `victim`, and `witness`.

### BR-15: Bounded Domain Values
- **Rule:** Status and classification attributes must adhere to strictly defined enumeration domains.
- **Enforcement:** 
  - `suspect.suspicion_level`: `ENUM('Low', 'Medium', 'High')`
  - `case.status`: `CHECK (status IN ('Open', 'Under Investigation', 'Pending Review', 'Closed', 'Reopened', 'Archived'))`
  - `evidence.evidence_type`: `CHECK (evidence_type IN ('Physical', 'Digital', 'Documentary', 'Biological', 'Forensic', 'Weapon', 'Narcotics', 'Other'))`
  - `evidence.status`: `CHECK (status IN ('Collected', 'In Lab Analysis', 'Stored in Vault', 'Presented in Court', 'Archived', 'Disposed'))`