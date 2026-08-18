# Design Decisions — Participants, Location & Evidence Module

**Module Owner:** Ayshee Islam Liza (241400045)

Every important design decision for the Participants, Location & Evidence module is recorded below using the team template.

---

Decision ID: D-01

Table: `suspect`, `victim`, `witness`

Choice: Store `age` as an integer with a CHECK constraint `(age >= 0 AND age <= 120)` alongside optional date of birth.

Reason: In real-world criminal investigations, exact date of birth is rarely known at the point of initial suspect or witness intake, so storing an integer age is more practical while preserving data integrity.

---

Decision ID: D-02

Table: `suspect`

Choice: `suspicion_level` restricted to `ENUM('Low', 'Medium', 'High')` with default 'Low'.

Reason: Eliminates typing inconsistencies in suspect risk classifications and simplifies query filtering in the UI.

---

Decision ID: D-03

Table: `victim`

Choice: Add `is_deceased` as a boolean flag alongside `victim_condition` text.

Reason: Allows high-speed boolean filtering and aggregate counting for fatality reports without scanning and parsing free-text condition descriptions.

---

Decision ID: D-04

Table: `location`

Choice: Surrogate auto-increment `location_id` as primary key.

Reason: Addresses and GPS coordinates can be verbose or change; a surrogate key provides stable reference for foreign keys from `case_location` and `victim_location`.

---

Decision ID: D-05

Table: `evidence`

Choice: Model `evidence` as a weak entity identified by `(case_id, evidence_no)`, with a surrogate `evidence_id` INT AUTO_INCREMENT primary key for referencing.

Reason: The proposal establishes that evidence is weak under CASE and cannot exist without a case (BR-03). The surrogate `evidence_id` makes referencing from `evidence_status_history` and `victim_evidence` clean and efficient, while `UNIQUE (case_id, evidence_no)` enforces the natural case-level sequence.

---

Decision ID: D-06

Table: `evidence`

Choice: `status` attribute holds current status; complete lifecycle recorded in `evidence_status_history`.

Reason: Satisfies BR-06 and the project proposal requirement for full evidentiary auditability and chain-of-custody tracking.

---

Decision ID: D-07

Table: `evidence_status_history`

Choice: Append-only table with `history_id` primary key and `evidence_id` foreign key.

Reason: Preserves a complete historical record with timestamps and remarks, preventing destructive updates to past state changes.

---

Decision ID: D-08

Table: `case_suspect`, `case_victim`, `case_witness`, `case_location`, `victim_location`, `victim_evidence`

Choice: Use bridge tables with composite primary keys for all M:N relationships.

Reason: Each relationship is many-to-many (e.g. a case can have multiple suspects, and a suspect can be involved in multiple cases). Composite PKs prevent duplicate mappings.

---

Decision ID: D-09

Table: All bridge tables

Choice: `ON DELETE RESTRICT` on the `case` foreign key; `ON DELETE CASCADE` on participant/location/evidence foreign keys.

Reason: Prevents accidental deletion of active cases when dependent investigation participant links exist, while cleaning up junction rows automatically if a participant record is removed.

---

Decision ID: D-10

Table: All module tables

Choice: Standardize to `snake_case` naming, InnoDB engine, and `utf8mb4` character set.

Reason: Conforms to the team-wide naming standard defined in `DATABASE_CREATION_TASK.md` and ensures MySQL 8 / MariaDB cross-compatibility in XAMPP.