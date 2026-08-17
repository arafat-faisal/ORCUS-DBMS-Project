# ORCUS Investigation Intake

## Database Schema Design

**Module:** Investigation Intake
**Responsible Member:** A.K. Md. Shakil Hossain

---

# 1. Module Overview

The Investigation Intake module manages complainants, General Diaries (GD), First Information Reports (FIR), investigation cases, legal sections associated with FIRs, complainant contact information, and case status history.

## Core Tables

* `complainant`
* `gd`
* `fir`
* `case`

## Proposed Enhancement Tables

* `complainant_contact`
* `legal_section`
* `fir_legal_section`
* `case_status_history`

The four enhancement tables are proposed improvements to the original conceptual design and require team review before final integration.

---

# 2. COMPLAINANT

## Table Name

`complainant`

## Attributes

| Attribute        | Data Type    | Constraints                 | Description                         |
| ---------------- | ------------ | --------------------------- | ----------------------------------- |
| `complainant_id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique identifier for a complainant |
| `name`           | VARCHAR(100) | NOT NULL                    | Full name of the complainant        |

## Primary Key

`complainant_id`

## Foreign Keys

None.

## Unique Constraints

None.

## Notes

The original proposal contains a Phone attribute. In this enhanced design, contact information is normalized into the separate `complainant_contact` table.

Relationship:

`complainant 1 : N complainant_contact`

`complainant 1 : N gd`

---

# 3. COMPLAINANT_CONTACT

## Table Name

`complainant_contact`

## Attributes

| Attribute        | Data Type    | Constraints                 | Description                   |
| ---------------- | ------------ | --------------------------- | ----------------------------- |
| `contact_id`     | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique contact record         |
| `complainant_id` | INT UNSIGNED | NOT NULL, FOREIGN KEY       | Associated complainant        |
| `contact_type`   | VARCHAR(20)  | NOT NULL, CHECK             | Type of contact               |
| `contact_value`  | VARCHAR(100) | NOT NULL                    | Phone number or email address |
| `is_primary`     | BOOLEAN      | NOT NULL, DEFAULT FALSE     | Indicates the primary contact |

## Primary Key

`contact_id`

## Foreign Keys

`complainant_id` references `complainant(complainant_id)`.

## Unique Constraints

None.

## Notes

A complainant may have multiple contact records.

Supported contact types:

* `phone`
* `email`

Relationship:

`complainant 1 : N complainant_contact`

---

# 4. GD

## Table Name

`gd`

## Attributes

| Attribute        | Data Type    | Constraints                 | Description                  |
| ---------------- | ------------ | --------------------------- | ---------------------------- |
| `gd_id`          | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique GD identifier         |
| `gd_number`      | VARCHAR(50)  | NOT NULL, UNIQUE            | Official GD number           |
| `gd_date`        | DATE         | NOT NULL                    | Date of GD                   |
| `subject`        | TEXT         | NOT NULL                    | Subject of the GD            |
| `complainant_id` | INT UNSIGNED | NOT NULL, FOREIGN KEY       | Complainant who filed the GD |

## Primary Key

`gd_id`

## Foreign Keys

`complainant_id` references `complainant(complainant_id)`.

## Unique Constraints

`gd_number`

## Notes

A complainant may file multiple GD records.

Relationship:

`complainant 1 : N gd`

---

# 5. FIR

## Table Name

`fir`

## Attributes

| Attribute        | Data Type    | Constraints                 | Description                 |
| ---------------- | ------------ | --------------------------- | --------------------------- |
| `fir_id`         | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique FIR identifier       |
| `fir_number`     | VARCHAR(50)  | NOT NULL, UNIQUE            | Official FIR number         |
| `crime_category` | VARCHAR(100) | NOT NULL                    | Category of crime           |
| `filed_date`     | DATE         | NOT NULL                    | Date on which FIR was filed |
| `gd_id`          | INT UNSIGNED | NULL, FOREIGN KEY           | Optional source GD          |

## Primary Key

`fir_id`

## Foreign Keys

`gd_id` references `gd(gd_id)`.

## Unique Constraints

`fir_number`

## Notes

The source GD relationship is optional. Therefore, `gd_id` may be NULL.

Relationship:

`gd 1 : N fir`

---

# 6. LEGAL_SECTION

## Table Name

`legal_section`

## Status

Proposed enhancement.

## Attributes

| Attribute       | Data Type    | Constraints                 | Description                     |
| --------------- | ------------ | --------------------------- | ------------------------------- |
| `section_id`    | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique legal section identifier |
| `section_code`  | VARCHAR(30)  | NOT NULL, UNIQUE            | Unique legal section code       |
| `section_title` | VARCHAR(150) | NOT NULL                    | Name/title of the legal section |
| `description`   | TEXT         | NULL                        | Additional description          |

## Primary Key

`section_id`

## Foreign Keys

None.

## Unique Constraints

`section_code`

## Notes

This table acts as a reference/master table for legal sections.

Relationship:

`fir M : N legal_section`

---

# 7. FIR_LEGAL_SECTION

## Table Name

`fir_legal_section`

## Status

Proposed enhancement.

## Attributes

| Attribute    | Data Type    | Constraints              | Description              |
| ------------ | ------------ | ------------------------ | ------------------------ |
| `fir_id`     | INT UNSIGNED | PRIMARY KEY, FOREIGN KEY | Associated FIR           |
| `section_id` | INT UNSIGNED | PRIMARY KEY, FOREIGN KEY | Associated legal section |

## Primary Key

Composite primary key:

`(fir_id, section_id)`

## Foreign Keys

`fir_id` references `fir(fir_id)`.

`section_id` references `legal_section(section_id)`.

## Unique Constraints

The composite primary key prevents duplicate FIR-section associations.

## Notes

This bridge table implements the many-to-many relationship between FIR and legal section.

Relationship:

`fir M : N legal_section`

---

# 8. CASE

## Table Name

`case`

## Attributes

| Attribute       | Data Type    | Constraints                 | Description                |
| --------------- | ------------ | --------------------------- | -------------------------- |
| `case_id`       | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique case identifier     |
| `case_title`    | VARCHAR(200) | NOT NULL                    | Title of the case          |
| `status`        | VARCHAR(30)  | NOT NULL                    | Current case status        |
| `opened_date`   | DATE         | NOT NULL                    | Date the case was opened   |
| `assigned_date` | DATE         | NULL                        | Date the case was assigned |
| `fir_id`        | INT UNSIGNED | NULL, FOREIGN KEY           | Optional source FIR        |

## Primary Key

`case_id`

## Foreign Keys

`fir_id` references `fir(fir_id)`.

## Unique Constraints

None specified.

## Notes

The source FIR relationship is optional.

The table name follows the conceptual entity name `CASE`. SQL identifier quoting is required when using the name in MySQL/MariaDB.

Relationship:

`fir 1 : N case`

---

# 9. CASE_STATUS_HISTORY

## Table Name

`case_status_history`

## Status

Proposed enhancement.

## Attributes

| Attribute    | Data Type    | Constraints                 | Description                           |
| ------------ | ------------ | --------------------------- | ------------------------------------- |
| `history_id` | INT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Unique history record                 |
| `case_id`    | INT UNSIGNED | NOT NULL, FOREIGN KEY       | Associated case                       |
| `status`     | VARCHAR(30)  | NOT NULL                    | Status recorded at the time of change |
| `changed_at` | DATETIME     | NOT NULL                    | Time of status change                 |
| `remarks`    | TEXT         | NULL                        | Optional remarks                      |

## Primary Key

`history_id`

## Foreign Keys

`case_id` references `case(case_id)`.

## Unique Constraints

None.

## Notes

The `case` table stores the current status, while this table preserves previous status changes.

Relationship:

`case 1 : N case_status_history`

---

# 10. Relationship Summary

| Parent        | Relationship | Child                 |
| ------------- | ------------ | --------------------- |
| `complainant` | 1 : N        | `complainant_contact` |
| `complainant` | 1 : N        | `gd`                  |
| `gd`          | 1 : N        | `fir`                 |
| `fir`         | M : N        | `legal_section`       |
| `fir`         | 1 : N        | `case`                |
| `case`        | 1 : N        | `case_status_history` |

---

# 11. Foreign Key Summary

| Child Table           | Foreign Key      | Parent Table    | Optional? |
| --------------------- | ---------------- | --------------- | --------- |
| `complainant_contact` | `complainant_id` | `complainant`   | No        |
| `gd`                  | `complainant_id` | `complainant`   | No        |
| `fir`                 | `gd_id`          | `gd`            | Yes       |
| `fir_legal_section`   | `fir_id`         | `fir`           | No        |
| `fir_legal_section`   | `section_id`     | `legal_section` | No        |
| `case`                | `fir_id`         | `fir`           | Yes       |
| `case_status_history` | `case_id`        | `case`          | No        |

---

# 12. Referential Integrity

Foreign-key relationships use referential-integrity constraints.

Dependent records must not be orphaned. Parent records with dependent records should not be deleted automatically.

The intended deletion behavior is:

`ON DELETE RESTRICT`

The intended update behavior is:

`ON UPDATE CASCADE`

---

# 13. Naming Convention

All table and column names use `snake_case` as required by the project database workflow.

Examples:

* `complainant_id`
* `gd_id`
* `fir_id`
* `case_id`
* `section_id`
* `history_id`

---

# 14. Cross-Module Integration Notes

The following relationships belong to other team members' modules and are intentionally not implemented independently in this contribution:

* `CASE` ↔ `OFFICER`
* `CASE` ↔ `SUSPECT`
* `CASE` ↔ `VICTIM`
* `CASE` ↔ `WITNESS`
* `CASE` ↔ `LOCATION`
* `CASE` ↔ `EVIDENCE`

These relationships will be resolved during final team integration.

The `case_assignment` design may be considered during integration for implementing the OFFICER–CASE relationship.
