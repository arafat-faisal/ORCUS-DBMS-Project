# ORCUS Database Normalization Analysis (1NF to 3NF)

**Course:** 06123228 — Database Management Laboratory  
**Project:** ORCUS (Organized Crime Understanding System)  
**Target:** Third Normal Form (3NF)

---

## 1. Introduction & Normalization Objectives

Database normalization is a systematic technique of designing relational database tables to:
1. Eliminate data redundancy.
2. Prevent insertion, update, and deletion anomalies.
3. Ensure functional dependencies are correctly represented and enforced by candidate keys.

The ORCUS schema is strictly designed to satisfy **Third Normal Form (3NF)**.

---

## 2. Functional Dependency (FD) Analysis

A functional dependency $X \to Y$ indicates that the attribute(s) $X$ uniquely determine the value of attribute(s) $Y$.

### Module 1: Organization & Access Control
1. **`AGENCY_BRANCH`**
   - $FD_1$: `branch_id` $\to$ `branch_name`, `district` *(Candidate Key: `branch_id`)*
   - $FD_2$: `(branch_name, district)` $\to$ `branch_id` *(Candidate Key: `(branch_name, district)`)*

2. **`OFFICER`**
   - $FD_1$: `officer_id` $\to$ `badge_no`, `first_name`, `last_name`, `rank`, `branch_id` *(Primary Key)*
   - $FD_2$: `badge_no` $\to$ `officer_id`, `first_name`, `last_name`, `rank`, `branch_id` *(Alternate Key)*

3. **`USER`**
   - $FD_1$: `user_id` $\to$ `username`, `password_hash`, `officer_id` *(Primary Key)*
   - $FD_2$: `username` $\to$ `user_id`, `password_hash`, `officer_id` *(Alternate Key)*
   - $FD_3$: `officer_id` $\to$ `user_id`, `username`, `password_hash` *(When not null, 1:1)*

4. **`ROLE`**
   - $FD_1$: `role_id` $\to$ `role_name`, `description` *(Primary Key)*
   - $FD_2$: `role_name` $\to$ `role_id`, `description` *(Alternate Key)*

5. **`USER_ROLE`**
   - $FD_1$: `(user_id, role_id)` $\to$ $\emptyset$ *(Composite Primary Key)*

---

### Module 2: Investigation Intake
6. **`COMPLAINANT`**
   - $FD_1$: `complainant_id` $\to$ `name` *(Primary Key)*

7. **`COMPLAINANT_CONTACT`**
   - $FD_1$: `contact_id` $\to$ `complainant_id`, `contact_type`, `contact_value`, `is_primary` *(Primary Key)*

8. **`GD`**
   - $FD_1$: `gd_id` $\to$ `gd_number`, `gd_date`, `subject`, `complainant_id` *(Primary Key)*
   - $FD_2$: `gd_number` $\to$ `gd_id`, `gd_date`, `subject`, `complainant_id` *(Alternate Key)*

9. **`FIR`**
   - $FD_1$: `fir_id` $\to$ `fir_number`, `crime_category`, `filed_date`, `gd_id` *(Primary Key)*
   - $FD_2$: `fir_number` $\to$ `fir_id`, `crime_category`, `filed_date`, `gd_id` *(Alternate Key)*

10. **`LEGAL_SECTION`**
    - $FD_1$: `section_id` $\to$ `section_code`, `section_title`, `description` *(Primary Key)*
    - $FD_2$: `section_code` $\to$ `section_id`, `section_title`, `description` *(Alternate Key)*

11. **`FIR_LEGAL_SECTION`**
    - $FD_1$: `(fir_id, section_id)` $\to$ $\emptyset$ *(Composite Primary Key)*

12. **`CASE`**
    - $FD_1$: `case_id` $\to$ `case_title`, `status`, `opened_date`, `assigned_date`, `fir_id`, `lead_officer_id` *(Primary Key)*

13. **`CASE_STATUS_HISTORY`**
    - $FD_1$: `history_id` $\to$ `case_id`, `status`, `changed_at`, `remarks`, `changed_by_user_id` *(Primary Key)*

---

### Module 3: Participants, Location & Evidence
14. **`SUSPECT`**
    - $FD_1$: `suspect_id` $\to$ `first_name`, `last_name`, `age`, `date_of_birth`, `identification_sign`, `suspicion_level`, `status` *(Primary Key)*

15. **`VICTIM`**
    - $FD_1$: `victim_id` $\to$ `name`, `phone`, `age`, `identification_sign`, `condition_notes`, `is_deceased` *(Primary Key)*

16. **`WITNESS`**
    - $FD_1$: `witness_id` $\to$ `name`, `phone`, `age`, `identification_sign`, `reliability`, `is_protected`, `statement_summary` *(Primary Key)*

17. **`LOCATION`**
    - $FD_1$: `location_id` $\to$ `gps_coordinates`, `address`, `area`, `city` *(Primary Key)*

18. **`EVIDENCE`**
    - $FD_1$: `evidence_id` $\to$ `case_id`, `evidence_no`, `title`, `description`, `evidence_type`, `status`, `collected_at`, `collected_by_officer_id`, `storage_location` *(Primary Key)*
    - $FD_2$: `(case_id, evidence_no)` $\to$ `evidence_id`, `title`, `description`, `evidence_type`, `status`, `collected_at`, `collected_by_officer_id`, `storage_location` *(Weak Entity Natural Key)*

19. **`EVIDENCE_STATUS_HISTORY`**
    - $FD_1$: `history_id` $\to$ `evidence_id`, `status`, `changed_at`, `remarks`, `changed_by_user_id` *(Primary Key)*

20. **Bridge Tables (`CASE_SUSPECT`, `CASE_VICTIM`, `CASE_WITNESS`, `CASE_LOCATION`, `VICTIM_LOCATION`, `VICTIM_EVIDENCE`)**
    - For `CASE_SUSPECT`: `(case_id, suspect_id)` $\to$ `role_in_crime`
    - For `CASE_VICTIM`: `(case_id, victim_id)` $\to$ `impact_type`
    - For `CASE_WITNESS`: `(case_id, witness_id)` $\to$ `testimony_summary`
    - For `CASE_LOCATION`: `(case_id, location_id)` $\to$ `location_role`

---

## 3. Step-by-Step Normalization Breakdown

### 3.1 First Normal Form (1NF) Compliance
**Definition:** A relation is in 1NF if:
1. Every attribute contains only atomic (indivisible) values.
2. There are no repeating groups or multivalued attributes.
3. A unique primary key exists for every relation.

**Demonstration in ORCUS:**
- **Multivalued Phone/Email Numbers:** Instead of storing comma-separated contact numbers in `COMPLAINANT`, a normalized child table `COMPLAINANT_CONTACT` is introduced where each row holds exactly one contact value.
- **Composite Names:** Officer and Suspect names are split into `first_name` and `last_name` columns.
- **Composite Addresses:** Incident locations are broken into atomic attributes `address`, `area`, and `city`.

---

### 3.2 Second Normal Form (2NF) Compliance
**Definition:** A relation is in 2NF if:
1. It is in 1NF.
2. Every non-prime attribute is **fully functionally dependent** on the entire primary key (no partial dependencies on a subset of a composite candidate key).

**Demonstration in ORCUS:**
- All single-column primary key tables (`OFFICER`, `GD`, `FIR`, `CASE`, `SUSPECT`, `EVIDENCE`) trivially satisfy 2NF because no proper subset of the key exists.
- In composite primary key bridge tables:
  - In `CASE_SUSPECT(case_id, suspect_id, role_in_crime)`: `role_in_crime` depends on both the specific case and the suspect together: `(case_id, suspect_id) -> role_in_crime`. It does not depend on `case_id` alone or `suspect_id` alone.
  - In `CASE_LOCATION(case_id, location_id, location_role)`: `location_role` (e.g. 'Crime Scene', 'Suspect Hideout') describes the role of that specific location in that specific case, depending on the full composite key.
  - Pure junction tables (`USER_ROLE`, `FIR_LEGAL_SECTION`, `VICTIM_LOCATION`, `VICTIM_EVIDENCE`) have no non-prime attributes, eliminating any risk of partial dependencies.

---

### 3.3 Third Normal Form (3NF) Compliance
**Definition:** A relation is in 3NF if:
1. It is in 2NF.
2. There are **no transitive dependencies** ($X \to Y$ and $Y \to Z$ where $X$ is a superkey, $Y$ is not a superkey, and $Z$ is a non-prime attribute). In formal terms: for every non-trivial functional dependency $X \to Y$, either $X$ is a superkey or $Y$ is a prime attribute.

**Demonstration in ORCUS:**
- **Branch Attributes in Officer:** `OFFICER` stores only `branch_id`. Branch attributes (`branch_name`, `district`) are isolated in `AGENCY_BRANCH`. If stored in `OFFICER`, transitive dependency `officer_id -> branch_id -> district` would violate 3NF.
- **Complainant in GD / FIR:** `GD` stores only `complainant_id`. Complainant name and contact details are stored in `COMPLAINANT` and `COMPLAINANT_CONTACT`, avoiding transitive dependencies.
- **Legal Sections in FIR:** Penal law descriptions are decoupled into `LEGAL_SECTION` via bridge table `FIR_LEGAL_SECTION`, avoiding repeating section text across FIRs.
- **Location Attributes in Cases:** Case incident sites are referenced via `LOCATION` foreign keys, ensuring city/area data is not duplicated inside `CASE`.

---

## 4. Normalization Summary Table

| Table Name | Primary Key | Highest Normal Form | Normalization Justifications & Design Highlights |
| :--- | :--- | :---: | :--- |
| `AGENCY_BRANCH` | `branch_id` | **3NF / BCNF** | All non-key attributes depend only on `branch_id`. District lookup indexed. |
| `OFFICER` | `officer_id` | **3NF / BCNF** | Name split into atomic columns; branch details factored out. |
| `USER` | `user_id` | **3NF / BCNF** | Strict username uniqueness; passwords stored as hashes. |
| `ROLE` | `role_id` | **3NF / BCNF** | Access roles isolated to support M:N RBAC. |
| `USER_ROLE` | `(user_id, role_id)` | **3NF / BCNF** | Pure bridge table resolving M:N relationship. |
| `COMPLAINANT` | `complainant_id` | **3NF / BCNF** | Decouples citizen identity from intake documents. |
| `COMPLAINANT_CONTACT`| `contact_id` | **3NF / BCNF** | Resolves multivalued contact information into 1NF/3NF. |
| `GD` | `gd_id` | **3NF / BCNF** | Refers to `complainant_id`; no transitive dependencies. |
| `FIR` | `fir_id` | **3NF / BCNF** | Optional link to GD; crime category standardized. |
| `LEGAL_SECTION` | `section_id` | **3NF / BCNF** | Statutory codes centralized without duplication. |
| `FIR_LEGAL_SECTION` | `(fir_id, section_id)`| **3NF / BCNF** | Resolves M:N statutory law mapping. |
| `CASE` | `case_id` | **3NF / BCNF** | References FIR and Lead Officer without embedding details. |
| `CASE_STATUS_HISTORY`| `history_id` | **3NF / BCNF** | Immutable chronological status transition log. |
| `SUSPECT` | `suspect_id` | **3NF / BCNF** | Full atomic person attributes; suspicion bounded by ENUM. |
| `VICTIM` | `victim_id` | **3NF / BCNF** | Atomic condition details with boolean death flag. |
| `WITNESS` | `witness_id` | **3NF / BCNF** | Atomic reliability rating and protection status. |
| `LOCATION` | `location_id` | **3NF / BCNF** | Atomic address, area, city coordinates. |
| `EVIDENCE` | `evidence_id` | **3NF / BCNF** | Weak entity under Case; case-level sequencing `(case_id, evidence_no)`. |
| `EVIDENCE_STATUS_HISTORY`| `history_id` | **3NF / BCNF** | Append-only chain of custody log with timestamps. |
| `CASE_SUSPECT` | `(case_id, suspect_id)`| **3NF / BCNF** | Resolves M:N link; `role_in_crime` fully dependent on composite key. |
| `CASE_VICTIM` | `(case_id, victim_id)` | **3NF / BCNF** | Resolves M:N link; `impact_type` fully dependent on composite key. |
| `CASE_WITNESS` | `(case_id, witness_id)`| **3NF / BCNF** | Resolves M:N link; testimony fully dependent on composite key. |
| `CASE_LOCATION` | `(case_id, location_id)`| **3NF / BCNF** | Resolves M:N link; `location_role` fully dependent on composite key. |
| `VICTIM_LOCATION` | `(victim_id, location_id)`| **3NF / BCNF** | Pure bridge table. |
| `VICTIM_EVIDENCE` | `(victim_id, evidence_id)`| **3NF / BCNF** | Pure bridge table. |
