# Design Decisions - Organization & Access Control

Author: Md. Arafat Hossain Faisal (241400060)

Every important design decision for the Organization & Access Control module is recorded below using the team template.

---

Decision ID: D-01

Table: AGENCY_BRANCH

Choice: Surrogate auto-increment `branch_id` as primary key instead of using `branch_name`.

Reason: Branch names may repeat across different districts, and using a business value as the key makes references fragile when the value changes. A surrogate key is stable for foreign keys from OFFICER.

---

Decision ID: D-02

Table: AGENCY_BRANCH

Choice: Add `UNIQUE (branch_name, district)`.

Reason: A branch is unique within its district; this prevents duplicate branch records and gives a natural lookup path.

---

Decision ID: D-03

Table: OFFICER

Choice: Split the composite ER attribute Name into `first_name` and `last_name`.

Reason: The Chen ER model defines Name as composite. Separate columns support search by either name, avoid repeating-group storage, and satisfy 3NF.

---

Decision ID: D-04

Table: OFFICER

Choice: `badge_no` is NOT NULL and UNIQUE.

Reason: BR-05 requires badge numbers to be unique. It also serves as a natural identifier for officer lookup in the UI.

---

Decision ID: D-05

Table: OFFICER

Choice: `branch_id` is NOT NULL with ON DELETE RESTRICT.

Reason: EMPLOYS is 1:N with total participation on the officer side — every officer works at exactly one branch. The proposal states deletion is restricted when dependent investigation records exist, so a branch with officers cannot be deleted.

---

Decision ID: D-06

Table: USER

Choice: `officer_id` is nullable and UNIQUE.

Reason: MAPS_TO is 0..1 : 0..1. A user account may exist without an officer mapping, and each user maps to at most one officer. UNIQUE enforces the 1:1 side.

---

Decision ID: D-07

Table: USER

Choice: Store passwords as `password_hash` (VARCHAR(255)), never plaintext.

Reason: 255 characters safely holds a bcrypt/argon2 hash, and storing only hashes follows standard security practice.

---

Decision ID: D-08

Table: USER

Choice: `username` is NOT NULL and UNIQUE.

Reason: BR-04 requires unique usernames, and the username is the natural login identifier.

---

Decision ID: D-09

Table: USER

Choice: CHECK constraint `CHAR_LENGTH(username) >= 3`.

Reason: Demonstrates the CHECK integrity concept required by the proposal and rejects obviously invalid usernames early.

---

Decision ID: D-10

Table: ROLE

Choice: `role_name` is NOT NULL and UNIQUE.

Reason: Role names identify roles; duplicates would make access-control assignments ambiguous.

---

Decision ID: D-11

Table: USER_ROLE

Choice: Composite primary key `(user_id, role_id)` with no surrogate column.

Reason: HAS_ROLE is M:N, resolved with a bridge table. The composite PK prevents the same role being assigned to the same user twice.

---

Decision ID: D-12

Table: USER_ROLE

Choice: Both foreign keys use ON DELETE CASCADE.

Reason: User-role mappings are dependent records; deleting a user or a role should remove its mappings automatically.

---

Decision ID: D-13

Table: ALL

Choice: InnoDB engine, utf8mb4 charset, snake_case attribute names, surrogate INT UNSIGNED keys.

Reason: InnoDB provides foreign-key enforcement and transactions (XAMPP default); utf8mb4 supports full Unicode; snake_case follows the team naming standard from the task document.

---

Decision ID: D-14

Table: OFFICER / AGENCY_BRANCH

Choice: Indexes on `(last_name, first_name)` and `district`.

Reason: The proposal requires indexes for name and search performance; officers are searched by name and branches by district in the UI.

---

Decision ID: D-15

Table: USER / USER_ROLE

Choice: `user_id` FK in USER_ROLE points to USER (the account), not OFFICER.

Reason: Access control is granted to login accounts, not to officers directly. An officer without an account must not receive role permissions.