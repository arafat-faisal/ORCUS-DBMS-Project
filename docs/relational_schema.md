# ORCUS Relational Database Schema Specification

**Course:** 06123228 — Database Management Laboratory  
**Organization:** ORCUS Investigation Agency (Fictional)  
**Session:** Summer 2026  
**Target RDBMS:** MySQL 8.0+ / MariaDB 10.4+ (InnoDB Engine, utf8mb4)

---

## 1. Executive Summary & Architecture

The ORCUS database manages the entire operational lifecycle of criminal investigations across three integrated modules:
1. **Organization & Access Control:** Agency branches, officer personnel, login accounts, and role-based access control (RBAC).
2. **Investigation Intake:** Citizen complaints, general diaries (GD), first information reports (FIR), penal legal sections, cases, and case progression history.
3. **Participants, Location & Evidence:** Suspects, victims, witnesses, incident locations, case-level weak evidence items, and append-only evidence chain of custody.

---

## 2. Relational Schema Formal Notation

Primary keys are marked with **PK**, foreign keys with **FK**, and unique attributes with **UQ**.

### Module 1: Organization & Access Control
- `AGENCY_BRANCH` (**`branch_id`** PK, `branch_name`, `district`, UQ(`branch_name`, `district`))
- `OFFICER` (**`officer_id`** PK, `badge_no` UQ, `first_name`, `last_name`, `rank`, `branch_id` FK $\to$ `AGENCY_BRANCH`.`branch_id`)
- `USER` (**`user_id`** PK, `username` UQ, `password_hash`, `officer_id` FK UQ $\to$ `OFFICER`.`officer_id`)
- `ROLE` (**`role_id`** PK, `role_name` UQ, `description`)
- `USER_ROLE` (**`user_id`** FK $\to$ `USER`.`user_id`, **`role_id`** FK $\to$ `ROLE`.`role_id`, PK(`user_id`, `role_id`))

### Module 2: Investigation Intake
- `COMPLAINANT` (**`complainant_id`** PK, `name`)
- `COMPLAINANT_CONTACT` (**`contact_id`** PK, `complainant_id` FK $\to$ `COMPLAINANT`.`complainant_id`, `contact_type`, `contact_value`, `is_primary`)
- `GD` (**`gd_id`** PK, `gd_number` UQ, `gd_date`, `subject`, `complainant_id` FK $\to$ `COMPLAINANT`.`complainant_id`)
- `FIR` (**`fir_id`** PK, `fir_number` UQ, `crime_category`, `filed_date`, `gd_id` FK $\to$ `GD`.`gd_id`)
- `LEGAL_SECTION` (**`section_id`** PK, `section_code` UQ, `section_title`, `description`)
- `FIR_LEGAL_SECTION` (**`fir_id`** FK $\to$ `FIR`.`fir_id`, **`section_id`** FK $\to$ `LEGAL_SECTION`.`section_id`, PK(`fir_id`, `section_id`))
- `CASE` (**`case_id`** PK, `case_title`, `status`, `opened_date`, `assigned_date`, `fir_id` FK $\to$ `FIR`.`fir_id`, `lead_officer_id` FK $\to$ `OFFICER`.`officer_id`)
- `CASE_STATUS_HISTORY` (**`history_id`** PK, `case_id` FK $\to$ `CASE`.`case_id`, `status`, `changed_at`, `remarks`, `changed_by_user_id` FK $\to$ `USER`.`user_id`)

### Module 3: Participants, Location & Evidence
- `SUSPECT` (**`suspect_id`** PK, `first_name`, `last_name`, `age`, `date_of_birth`, `identification_sign`, `suspicion_level`, `status`)
- `VICTIM` (**`victim_id`** PK, `name`, `phone`, `age`, `identification_sign`, `condition_notes`, `is_deceased`)
- `WITNESS` (**`witness_id`** PK, `name`, `phone`, `age`, `identification_sign`, `reliability`, `is_protected`, `statement_summary`)
- `LOCATION` (**`location_id`** PK, `gps_coordinates`, `address`, `area`, `city`)
- `EVIDENCE` (**`evidence_id`** PK, `case_id` FK $\to$ `CASE`.`case_id`, `evidence_no`, `title`, `description`, `evidence_type`, `status`, `collected_at`, `collected_by_officer_id` FK $\to$ `OFFICER`.`officer_id`, `storage_location`, UQ(`case_id`, `evidence_no`))
- `EVIDENCE_STATUS_HISTORY` (**`history_id`** PK, `evidence_id` FK $\to$ `EVIDENCE`.`evidence_id`, `status`, `changed_at`, `remarks`, `changed_by_user_id` FK $\to$ `USER`.`user_id`)

### Bridge (Junction) Tables
- `CASE_SUSPECT` (**`case_id`** FK $\to$ `CASE`.`case_id`, **`suspect_id`** FK $\to$ `SUSPECT`.`suspect_id`, `role_in_crime`, PK(`case_id`, `suspect_id`))
- `CASE_VICTIM` (**`case_id`** FK $\to$ `CASE`.`case_id`, **`victim_id`** FK $\to$ `VICTIM`.`victim_id`, `impact_type`, PK(`case_id`, `victim_id`))
- `CASE_WITNESS` (**`case_id`** FK $\to$ `CASE`.`case_id`, **`witness_id`** FK $\to$ `WITNESS`.`witness_id`, `testimony_summary`, PK(`case_id`, `witness_id`))
- `CASE_LOCATION` (**`case_id`** FK $\to$ `CASE`.`case_id`, **`location_id`** FK $\to$ `LOCATION`.`location_id`, `location_role`, PK(`case_id`, `location_id`))
- `VICTIM_LOCATION` (**`victim_id`** FK $\to$ `VICTIM`.`victim_id`, **`location_id`** FK $\to$ `LOCATION`.`location_id`, PK(`victim_id`, `location_id`))
- `VICTIM_EVIDENCE` (**`victim_id`** FK $\to$ `VICTIM`.`victim_id`, **`evidence_id`** FK $\to$ `EVIDENCE`.`evidence_id`, PK(`victim_id`, `evidence_id`))

---

## 3. Data Dictionary

### 3.1 Organization & Access Control

#### Table: `agency_branch`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `branch_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique internal identifier for the agency branch |
| `branch_name` | VARCHAR(100) | NO | Unique with district | Formal name of the regional branch |
| `district` | VARCHAR(100) | NO | Indexed | Administrative district where branch operates |

#### Table: `officer`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `officer_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique internal officer identifier |
| `badge_no` | VARCHAR(20) | NO | UNIQUE | Official sworn badge number |
| `first_name` | VARCHAR(50) | NO | Indexed | Officer given name |
| `last_name` | VARCHAR(50) | NO | Indexed | Officer family name |
| `rank` | VARCHAR(50) | NO | | Rank title (e.g. Inspector, Detective) |
| `branch_id` | INT UNSIGNED | NO | FK $\to$ `agency_branch` | Assigned branch of service |

#### Table: `user`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique login account ID |
| `username` | VARCHAR(50) | NO | UNIQUE, CHECK $\ge 3$ chars | Unique system login name |
| `password_hash` | VARCHAR(255) | NO | | Secure cryptographic password hash |
| `officer_id` | INT UNSIGNED | YES | UNIQUE, FK $\to$ `officer` | Optional 1:1 mapping to sworn officer record |

#### Table: `role`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `role_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique role identifier |
| `role_name` | VARCHAR(50) | NO | UNIQUE | Access role title |
| `description` | VARCHAR(255) | YES | | Purpose and authorization scope of the role |

#### Table: `user_role`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `user_id` | INT UNSIGNED | NO | PK (Comp), FK $\to$ `user` | Account receiving role authorization |
| `role_id` | INT UNSIGNED | NO | PK (Comp), FK $\to$ `role` | Authorized role |

---

### 3.2 Investigation Intake

#### Table: `complainant`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `complainant_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique complainant record ID |
| `name` | VARCHAR(100) | NO | Indexed | Name of citizen or corporate entity filing complaint |

#### Table: `complainant_contact`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `contact_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique contact record ID |
| `complainant_id` | INT UNSIGNED | NO | FK $\to$ `complainant` | Referenced complainant |
| `contact_type` | VARCHAR(20) | NO | CHECK ('phone', 'email') | Channel type |
| `contact_value` | VARCHAR(100) | NO | | Phone number or email address |
| `is_primary` | BOOLEAN | NO | DEFAULT FALSE | Flag indicating default primary contact |

#### Table: `gd`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `gd_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique General Diary ID |
| `gd_number` | VARCHAR(50) | NO | UNIQUE | Official GD reference number |
| `gd_date` | DATE | NO | Indexed | Date of GD registration |
| `subject` | TEXT | NO | | Summary of reported incident or intelligence |
| `complainant_id` | INT UNSIGNED | NO | FK $\to$ `complainant` | Complainant who lodged the GD |

#### Table: `fir`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `fir_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique FIR record ID |
| `fir_number` | VARCHAR(50) | NO | UNIQUE | Official First Information Report number |
| `crime_category` | VARCHAR(100) | NO | Indexed | Classification of offense |
| `filed_date` | DATE | NO | Indexed | Official filing date |
| `gd_id` | INT UNSIGNED | YES | FK $\to$ `gd` | Optional source GD |

#### Table: `case`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `case_id` | INT UNSIGNED | NO | PK, Auto Increment | Master investigation case identifier |
| `case_title` | VARCHAR(200) | NO | | Formal operation/case title |
| `status` | VARCHAR(30) | NO | CHECK allowed statuses | Current investigation status |
| `opened_date` | DATE | NO | Indexed | Date case was initiated |
| `assigned_date` | DATE | YES | | Date lead investigator was assigned |
| `fir_id` | INT UNSIGNED | YES | FK $\to$ `fir` | Optional source FIR |
| `lead_officer_id` | INT UNSIGNED | YES | FK $\to$ `officer` | Sworn lead investigator (1:N INVESTIGATES) |

---

### 3.3 Evidence & Chain of Custody

#### Table: `evidence`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `evidence_id` | INT UNSIGNED | NO | PK, Auto Increment | Surrogate primary key for system indexing |
| `case_id` | INT UNSIGNED | NO | FK $\to$ `case`, UQ(case, no) | Parent investigation case (mandatory weak entity link) |
| `evidence_no` | INT UNSIGNED | NO | UQ with case_id | Sequential evidence index within case (1, 2, 3...) |
| `title` | VARCHAR(150) | NO | | Short title of evidence item |
| `description` | TEXT | YES | | Detailed physical/forensic description |
| `evidence_type` | VARCHAR(50) | NO | CHECK allowed types | Category (Physical, Digital, Forensic, Weapon, etc.) |
| `status` | VARCHAR(50) | NO | CHECK allowed statuses | Current custodial state |
| `collected_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Timestamp of physical collection |
| `collected_by_officer_id` | INT UNSIGNED | YES | FK $\to$ `officer` | Recovering officer |
| `storage_location` | VARCHAR(150) | YES | | Vault, locker, or lab facility |

#### Table: `evidence_status_history`
| Column Name | Data Type | Nullable | Key / Constraint | Description |
| :--- | :--- | :---: | :--- | :--- |
| `history_id` | INT UNSIGNED | NO | PK, Auto Increment | Unique history record ID |
| `evidence_id` | INT UNSIGNED | NO | FK $\to$ `evidence` | Evidence item being tracked |
| `status` | VARCHAR(50) | NO | Indexed | Updated custodial status |
| `changed_at` | DATETIME | NO | DEFAULT CURRENT_TIMESTAMP | Timestamp of state transition |
| `remarks` | VARCHAR(255) | YES | | Context, court transfer details, or lab findings |
| `changed_by_user_id` | INT UNSIGNED | YES | FK $\to$ `user` | User account that authorized the status change |

---

## 4. Referential Integrity Matrix

| Foreign Key | Parent Table | Child Table | ON UPDATE | ON DELETE | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `fk_officer_branch` | `agency_branch` | `officer` | CASCADE | RESTRICT | Officers cannot belong to non-existent branches; branches with active staff cannot be deleted. |
| `fk_user_officer` | `officer` | `user` | CASCADE | RESTRICT | Preserves officer identity mapping; prevents accidental deletion of active accounts. |
| `fk_user_role_user` | `user` | `user_role` | CASCADE | CASCADE | Deleting a user account cleans up its granted roles. |
| `fk_user_role_role` | `role` | `user_role` | CASCADE | CASCADE | Deleting a role removes assignments from all users. |
| `fk_contact_complainant` | `complainant` | `complainant_contact` | CASCADE | RESTRICT | Protects contact details while complainant record exists. |
| `fk_gd_complainant` | `complainant` | `gd` | CASCADE | RESTRICT | GD records require a valid complainant. |
| `fk_fir_gd` | `gd` | `fir` | CASCADE | RESTRICT | Deletion restricted when dependent FIR exists (BR-01). |
| `fk_case_fir` | `fir` | `case` | CASCADE | RESTRICT | Deletion restricted when dependent Case exists (BR-02). |
| `fk_case_lead_officer` | `officer` | `case` | CASCADE | RESTRICT | Lead officer reference maintained for accountability. |
| `fk_evidence_case` | `case` | `evidence` | CASCADE | RESTRICT | Evidence cannot exist without a Case (BR-03); active cases cannot be dropped if evidence exists. |
| `fk_evidence_history_evidence` | `evidence` | `evidence_status_history` | CASCADE | CASCADE | Cascade history cleanup when master evidence item is purged. |
| `fk_case_suspect_case` | `case` | `case_suspect` | CASCADE | RESTRICT | Protects active case links. |
| `fk_case_suspect_suspect` | `suspect` | `case_suspect` | CASCADE | CASCADE | Deleting a suspect cleans up junction mappings. |
| `fk_case_victim_case` | `case` | `case_victim` | CASCADE | RESTRICT | Protects active case links. |
| `fk_case_victim_victim` | `victim` | `case_victim` | CASCADE | CASCADE | Deleting a victim cleans up junction mappings. |
| `fk_case_witness_case` | `case` | `case_witness` | CASCADE | RESTRICT | Protects active case links. |
| `fk_case_witness_witness` | `witness` | `case_witness` | CASCADE | CASCADE | Deleting a witness cleans up junction mappings. |
| `fk_case_location_case` | `case` | `case_location` | CASCADE | RESTRICT | Protects active case links. |
| `fk_case_location_location` | `location` | `case_location` | CASCADE | CASCADE | Deleting a location cleans up junction mappings. |
