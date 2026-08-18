# Database Schema Documentation — Participants, Location & Evidence Module

**Module Owner:** Ayshee Islam Liza (241400045)

This document describes the human-readable schema design for the **Participants, Location & Evidence** module of the ORCUS Investigation Agency database.

---

## 1. Primary & Weak Tables

### Table: `suspect`
Represents individuals identified as suspects during an investigation.

| Attribute           | Type                        | Constraints                 |
| ------------------- | --------------------------- | --------------------------- |
| suspect_id          | INT UNSIGNED                | PK, auto-increment          |
| name                | VARCHAR(100)                | NOT NULL                    |
| age                 | INT                         | CHECK (age >= 0 AND age <= 120) |
| identification_sign | VARCHAR(255)                | NULL                        |
| suspicion_level     | ENUM('Low','Medium','High') | NOT NULL, DEFAULT 'Low'     |
| status              | VARCHAR(50)                 | NOT NULL, DEFAULT 'Under Investigation' |

- **Primary Key:** `suspect_id`
- **Foreign Keys:** None
- **Unique Constraints:** None (names can be non-unique)
- **Indexes:** `KEY idx_suspect_name (name)`, `KEY idx_suspect_suspicion (suspicion_level)`
- **Notes:** Linked to cases via M:N bridge table `case_suspect`.

---

### Table: `victim`
Represents individuals affected by crimes investigated by the agency.

| Attribute           | Type         | Constraints                 |
| ------------------- | ------------ | --------------------------- |
| victim_id           | INT UNSIGNED | PK, auto-increment          |
| name                | VARCHAR(100) | NOT NULL                    |
| phone               | VARCHAR(20)  | NULL                        |
| age                 | INT          | CHECK (age >= 0 AND age <= 120) |
| identification_sign | VARCHAR(255) | NULL                        |
| victim_condition    | VARCHAR(100) | NULL                        |
| is_deceased         | BOOLEAN      | NOT NULL, DEFAULT FALSE     |

- **Primary Key:** `victim_id`
- **Foreign Keys:** None
- **Unique Constraints:** None
- **Indexes:** `KEY idx_victim_name (name)`
- **Notes:** Linked to cases via M:N bridge table `case_victim`.

---

### Table: `witness`
Represents witnesses or informants providing statements or evidence.

| Attribute           | Type         | Constraints                 |
| ------------------- | ------------ | --------------------------- |
| witness_id          | INT UNSIGNED | PK, auto-increment          |
| name                | VARCHAR(100) | NOT NULL                    |
| phone               | VARCHAR(20)  | NULL                        |
| age                 | INT          | CHECK (age >= 0 AND age <= 120) |
| identification_sign | VARCHAR(255) | NULL                        |
| reliability_note    | VARCHAR(255) | NULL                        |
| is_protected        | BOOLEAN      | NOT NULL, DEFAULT FALSE     |

- **Primary Key:** `witness_id`
- **Foreign Keys:** None
- **Unique Constraints:** None
- **Indexes:** `KEY idx_witness_name (name)`
- **Notes:** Linked to cases via M:N bridge table `case_witness`.

---

### Table: `location`
Represents geographical places such as crime scenes, discovery points, and suspect hideouts.

| Attribute   | Type         | Constraints        |
| ----------- | ------------ | ------------------ |
| location_id | INT UNSIGNED | PK, auto-increment |
| gps         | VARCHAR(50)  | NULL               |
| address     | VARCHAR(255) | NOT NULL           |
| area        | VARCHAR(100) | NOT NULL           |
| city        | VARCHAR(100) | NOT NULL           |

- **Primary Key:** `location_id`
- **Foreign Keys:** None
- **Unique Constraints:** None
- **Indexes:** `KEY idx_location_city_area (city, area)`
- **Notes:** Linked to cases via M:N bridge table `case_location` (representing the ER relationship OCCURS_AT).

---

### Table: `evidence` (Weak Entity under CASE)
Represents physical, digital, documentary, or forensic items collected during an investigation.

| Attribute           | Type         | Constraints                 |
| ------------------- | ------------ | --------------------------- |
| evidence_id         | INT UNSIGNED | PK, auto-increment (surrogate) |
| case_id             | INT UNSIGNED | NOT NULL, FK                |
| evidence_no         | INT UNSIGNED | NOT NULL (case-sequence)    |
| title               | VARCHAR(150) | NOT NULL                    |
| content             | TEXT         | NULL                        |
| status              | VARCHAR(50)  | NOT NULL, DEFAULT 'Collected' |
| evidence_type       | VARCHAR(50)  | NOT NULL                    |
| collection_datetime | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- **Primary Key:** `evidence_id`
- **Foreign Keys:** `case_id` → `case(case_id)`, ON UPDATE CASCADE, ON DELETE RESTRICT (BR-03: Evidence cannot exist without a Case)
- **Unique Constraints:** `UNIQUE KEY uq_case_evidence_no (case_id, evidence_no)`
- **Indexes:** `KEY idx_evidence_status (status)`, `KEY idx_evidence_type (evidence_type)`
- **Notes:** Weak entity identified conceptually by `(case_id, evidence_no)`.

---

### Table: `evidence_status_history`
Append-only audit trail recording every state change of an evidence item over time.

| Attribute   | Type         | Constraints                 |
| ----------- | ------------ | --------------------------- |
| history_id  | INT UNSIGNED | PK, auto-increment          |
| evidence_id | INT UNSIGNED | NOT NULL, FK                |
| status      | VARCHAR(50)  | NOT NULL                    |
| changed_at  | DATETIME     | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| remarks     | VARCHAR(255) | NULL                        |

- **Primary Key:** `history_id`
- **Foreign Keys:** `evidence_id` → `evidence(evidence_id)`, ON UPDATE CASCADE, ON DELETE CASCADE
- **Unique Constraints:** None
- **Indexes:** `KEY idx_evidence_history_status (status)`, `KEY idx_evidence_history_changed_at (changed_at)`
- **Notes:** Append-only log for full auditability (BR-06).

---

## 2. Bridge (Junction) Tables

### Table: `case_suspect`
Resolves M:N relationship SUSPECTED_IN between `case` and `suspect`.
- **Composite Primary Key:** `(case_id, suspect_id)`
- **Foreign Keys:**
  - `case_id` → `case(case_id)` [ON DELETE RESTRICT, ON UPDATE CASCADE]
  - `suspect_id` → `suspect(suspect_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]

### Table: `case_victim`
Resolves M:N relationship AFFECTED_BY between `case` and `victim`.
- **Composite Primary Key:** `(case_id, victim_id)`
- **Foreign Keys:**
  - `case_id` → `case(case_id)` [ON DELETE RESTRICT, ON UPDATE CASCADE]
  - `victim_id` → `victim(victim_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]

### Table: `case_witness`
Resolves M:N relationship HAS_WITNESS between `case` and `witness`.
- **Composite Primary Key:** `(case_id, witness_id)`
- **Foreign Keys:**
  - `case_id` → `case(case_id)` [ON DELETE RESTRICT, ON UPDATE CASCADE]
  - `witness_id` → `witness(witness_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]

### Table: `case_location`
Resolves M:N relationship OCCURS_AT between `case` and `location`.
- **Composite Primary Key:** `(case_id, location_id)`
- **Foreign Keys:**
  - `case_id` → `case(case_id)` [ON DELETE RESTRICT, ON UPDATE CASCADE]
  - `location_id` → `location(location_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]

### Table: `victim_location`
Resolves M:N relationship between `victim` and `location`.
- **Composite Primary Key:** `(victim_id, location_id)`
- **Foreign Keys:**
  - `victim_id` → `victim(victim_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]
  - `location_id` → `location(location_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]

### Table: `victim_evidence`
Resolves M:N relationship between `victim` and `evidence`.
- **Composite Primary Key:** `(victim_id, evidence_id)`
- **Foreign Keys:**
  - `victim_id` → `victim(victim_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]
  - `evidence_id` → `evidence(evidence_id)` [ON DELETE CASCADE, ON UPDATE CASCADE]