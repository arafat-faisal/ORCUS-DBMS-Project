# ORCUS Database Schema - Organization & Access Control

Author: Md. Arafat Hossain Faisal (241400060)

This document describes the human-readable design for the **Organization & Access Control** module. No SQL is included here; the implementation lives in `faisal_schema.sql`.

Relationships (Chen ER):

- EMPLOYS: AGENCY_BRANCH (1) — (N) OFFICER
- MAPS_TO: OFFICER (0..1) — (0..1) USER
- HAS_ROLE: USER (M) — (N) ROLE (resolved through bridge table USER_ROLE)

---

## Table: AGENCY_BRANCH

Represents a physical office of the ORCUS Investigation Agency.

| Attribute   | Type          | Constraints        |
| ----------- | ------------- | ------------------ |
| branch_id   | INT UNSIGNED  | PK, auto-increment |
| branch_name | VARCHAR(100)  | NOT NULL           |
| district    | VARCHAR(100)  | NOT NULL           |

- Primary Key: `branch_id`
- Foreign Keys: none
- Unique Constraints: `UNIQUE (branch_name, district)` — no duplicate branches in the same district
- Notes: One branch employs many officers (EMPLOYS, 1:N). Surrogate key used so branches can be renamed without breaking officer references.

---

## Table: OFFICER

Represents an investigation officer employed at a branch.

| Attribute  | Type         | Constraints        |
| ---------- | ------------ | ------------------ |
| officer_id | INT UNSIGNED | PK, auto-increment |
| badge_no   | VARCHAR(20)  | NOT NULL, UNIQUE   |
| first_name | VARCHAR(50)  | NOT NULL           |
| last_name  | VARCHAR(50)  | NOT NULL           |
| rank       | VARCHAR(50)  | NOT NULL           |
| branch_id  | INT UNSIGNED | NOT NULL, FK       |

- Primary Key: `officer_id`
- Foreign Keys: `branch_id` → AGENCY_BRANCH(branch_id), ON DELETE RESTRICT, ON UPDATE CASCADE
- Unique Constraints: `badge_no` (BR-05: badge numbers must be unique)
- Notes: The ER composite attribute Name is split into `first_name` + `last_name` for 3NF and name-based search. Index on `(last_name, first_name)` for search. An officer may optionally map to a user account (MAPS_TO, 0..1).

---

## Table: USER

Represents a login account used to access the ORCUS system.

| Attribute     | Type         | Constraints        |
| ------------- | ------------ | ------------------ |
| user_id       | INT UNSIGNED | PK, auto-increment |
| username      | VARCHAR(50)  | NOT NULL, UNIQUE   |
| password_hash | VARCHAR(255) | NOT NULL           |
| officer_id    | INT UNSIGNED | NULL, UNIQUE, FK   |

- Primary Key: `user_id`
- Foreign Keys: `officer_id` → OFFICER(officer_id), nullable, ON DELETE RESTRICT, ON UPDATE CASCADE
- Unique Constraints: `username` (BR-04: usernames must be unique), `officer_id` (MAPS_TO is 1:1 when present)
- Notes: Passwords are stored only as hashes, never plaintext. An account may exist without an officer mapping (0..1). CHECK constraint enforces a minimum username length.

---

## Table: ROLE

Represents an access role that can be granted to users.

| Attribute   | Type         | Constraints        |
| ----------- | ------------ | ------------------ |
| role_id     | INT UNSIGNED | PK, auto-increment |
| role_name   | VARCHAR(50)  | NOT NULL, UNIQUE   |
| description | VARCHAR(255) | NULL               |

- Primary Key: `role_id`
- Foreign Keys: none
- Unique Constraints: `role_name`
- Notes: Role names must be unique so access-control assignments are unambiguous.

---

## Table: USER_ROLE

Bridge (junction) table resolving the M:N HAS_ROLE relationship between USER and ROLE.

| Attribute | Type         | Constraints    |
| --------- | ------------ | -------------- |
| user_id   | INT UNSIGNED | NOT NULL, FK   |
| role_id   | INT UNSIGNED | NOT NULL, FK   |

- Primary Key: `(user_id, role_id)` composite
- Foreign Keys: `user_id` → USER(user_id), `role_id` → ROLE(role_id), both ON DELETE CASCADE, ON UPDATE CASCADE
- Unique Constraints: covered by composite PK
- Notes: A user can hold one or more roles, and a role can be granted to many users. Composite PK prevents duplicate assignments. CASCADE deletion removes mappings automatically when a user or role is deleted.