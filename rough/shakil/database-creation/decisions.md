# ORCUS Investigation Intake

## Database Design Decisions

**Module:** Investigation Intake
**Responsible Member:** A.K. Md. Shakil Hossain

---

## Decision ID: D001

**Table:** `complainant`

**Choice:**
Use `complainant_id` as the primary key with `INT UNSIGNED AUTO_INCREMENT`.

**Reason:**
Each complainant requires a unique and stable identifier. A system-generated numeric identifier avoids using personal information such as name or phone number as a primary key.

---

## Decision ID: D002

**Table:** `complainant`

**Choice:**
Remove the original `phone` attribute from the `complainant` table and manage contact information through a separate `complainant_contact` table.

**Reason:**
A complainant may have multiple contact methods, such as primary phone, secondary phone, or email. Keeping multiple contact values in the main complainant table would make the design less flexible and could lead to repeating attributes. A separate child table provides a normalized one-to-many structure.

**Impact:**
The original proposal contains `Phone` as a COMPLAINANT attribute. In the implemented enhancement, this information is represented through `complainant_contact`.

---

## Decision ID: D003

**Table:** `complainant_contact`

**Choice:**
Create `complainant_contact` as a separate one-to-many table related to `complainant`.

**Reason:**
Contact information is naturally multivalued. Separating it allows one complainant to have multiple contact records without adding repeated columns such as `phone_1`, `phone_2`, or `email_1`.

---

## Decision ID: D004

**Table:** `complainant_contact`

**Choice:**
Use `contact_type`, `contact_value`, and `is_primary` to describe each contact.

**Reason:**
`contact_type` distinguishes phone and email contacts, `contact_value` stores the actual contact information, and `is_primary` identifies the preferred contact method.

---

## Decision ID: D005

**Table:** `complainant_contact`

**Choice:**
Restrict `contact_type` to controlled values such as `phone` and `email`.

**Reason:**
The current enhancement is designed around phone and email contact methods. A CHECK constraint prevents invalid contact types from entering the database and demonstrates domain integrity.

---

## Decision ID: D006

**Table:** `gd`

**Choice:**
Use `gd_id` as the primary key with `INT UNSIGNED AUTO_INCREMENT`.

**Reason:**
Each GD requires a unique internal identifier that can be safely referenced by related FIR records.

---

## Decision ID: D007

**Table:** `gd`

**Choice:**
Make `gd_number` UNIQUE and NOT NULL.

**Reason:**
The project proposal identifies GD_Number as a unique attribute. The database should prevent duplicate official GD numbers.

---

## Decision ID: D008

**Table:** `gd`

**Choice:**
Use `complainant_id` as a NOT NULL foreign key in `gd`.

**Reason:**
The conceptual model represents the relationship where a complainant files GD records. One complainant may be associated with multiple GD records, while each GD belongs to a complainant.

---

## Decision ID: D009

**Table:** `fir`

**Choice:**
Use `fir_id` as the primary key with `INT UNSIGNED AUTO_INCREMENT`.

**Reason:**
Each FIR requires a stable internal identifier for relationships with GD, legal sections, and cases.

---

## Decision ID: D010

**Table:** `fir`

**Choice:**
Make `fir_number` UNIQUE and NOT NULL.

**Reason:**
The project proposal identifies FIR_Number as a unique attribute. Duplicate official FIR numbers should therefore be prevented.

---

## Decision ID: D011

**Table:** `fir`

**Choice:**
Make `gd_id` a nullable foreign key.

**Reason:**
The project business rule states that every FIR references at most one source GD and that this relationship is optional. Therefore, an FIR may exist without a linked GD.

---

## Decision ID: D012

**Table:** `legal_section`

**Choice:**
Create a separate `legal_section` reference table.

**Reason:**
A FIR may contain multiple legal sections, and the same legal section can be associated with multiple FIR records. Keeping legal-section information in a separate table avoids repeated section descriptions and supports a normalized many-to-many relationship.

**Status:**
Proposed enhancement for team review.

---

## Decision ID: D013

**Table:** `legal_section`

**Choice:**
Use `section_code` as a UNIQUE attribute.

**Reason:**
A legal section should have one unique code within the system. A UNIQUE constraint prevents duplicate section codes.

---

## Decision ID: D014

**Table:** `fir_legal_section`

**Choice:**
Create `fir_legal_section` as a bridge table between `fir` and `legal_section`.

**Reason:**
The relationship between FIR and legal section is many-to-many. A bridge table is required to implement the M:N relationship in a relational database.

---

## Decision ID: D015

**Table:** `fir_legal_section`

**Choice:**
Use the composite key `(fir_id, section_id)` as the primary key.

**Reason:**
The combination uniquely identifies an FIR-section association. A separate surrogate ID is unnecessary because the two foreign keys already form a natural unique relationship.

---

## Decision ID: D016

**Table:** `case`

**Choice:**
Use `case_id` as the primary key with `INT UNSIGNED AUTO_INCREMENT`.

**Reason:**
Each investigation case requires a stable internal identifier for relationships with officers, participants, locations, evidence, and status history during final integration.

---

## Decision ID: D017

**Table:** `case`

**Choice:**
Make `fir_id` a nullable foreign key.

**Reason:**
The project business rule states that every case references at most one source FIR and that the relationship is optional. Therefore, a case may exist without a linked FIR.

---

## Decision ID: D018

**Table:** `case`

**Choice:**
Allow `assigned_date` to be NULL.

**Reason:**
The proposal defines Assigned_Date as a CASE attribute but does not specify that it must always contain a value. A case may therefore exist before an assignment date is recorded.

---

## Decision ID: D019

**Table:** `case`

**Choice:**
Use the conceptual entity name `CASE` and quote the identifier in MySQL/MariaDB SQL.

**Reason:**
The project proposal names the conceptual entity CASE. Because `CASE` is a SQL keyword, identifier quoting is used in SQL statements to preserve the conceptual name without causing syntax conflicts.

---

## Decision ID: D020

**Table:** `case_status_history`

**Choice:**
Create a separate `case_status_history` table.

**Reason:**
The `case.status` attribute represents the current status, but storing status changes separately preserves the complete status history of a case. This improves auditability and demonstrates history tracking.

**Status:**
Proposed enhancement for team review.

---

## Decision ID: D021

**Table:** `case_status_history`

**Choice:**
Use `history_id` as the primary key and store `case_id`, `status`, `changed_at`, and optional `remarks`.

**Reason:**
Each status change requires its own record. A timestamp allows the changes to be ordered chronologically, while remarks can capture additional information about the transition.

---

## Decision ID: D022

**Table:** All assigned tables

**Choice:**
Use `snake_case` for all table and column names.

**Reason:**
The project database workflow explicitly requires snake_case naming for consistency across all team members.

---

## Decision ID: D023

**Table:** All foreign-key relationships

**Choice:**
Use foreign keys with referential-integrity constraints.

**Reason:**
Foreign keys prevent invalid references and orphaned records between complainants, GDs, FIRs, legal sections, and cases.

---

## Decision ID: D024

**Table:** Parent tables with dependent records

**Choice:**
Use `ON DELETE RESTRICT`.

**Reason:**
The project business rules state that deletion is restricted when dependent investigation records exist. Restricting deletion protects referential integrity and prevents accidental loss of related investigation records.

---

## Decision ID: D025

**Table:** Foreign keys

**Choice:**
Use `ON UPDATE CASCADE`.

**Reason:**
If a referenced primary-key value is updated, related foreign-key values should remain synchronized. This maintains referential consistency.

---

## Decision ID: D026

**Table:** All assigned tables

**Choice:**
Use SQL data types based on the nature of each attribute.

**Reason:**
The proposal defines the conceptual attributes but does not specify SQL data types. Therefore, implementation-oriented types are selected: integer types for identifiers, VARCHAR for short textual values, TEXT for longer descriptions, DATE for dates, DATETIME for timestamped history, and BOOLEAN for binary flags.

---

## Decision ID: D027

**Table:** All proposed enhancement tables

**Choice:**
Treat `complainant_contact`, `legal_section`, `fir_legal_section`, and `case_status_history` as proposed enhancements rather than changes to the original conceptual entity list.

**Reason:**
The original proposal defines the core conceptual entities. These additional tables are introduced to improve normalization, support multivalued information, implement an M:N relationship, and preserve status history. They must be reviewed during final team integration before becoming part of the final database schema.

---

## Decision ID: D028

**Table:** `case`

**Choice:**
Do not add an `officer_id` directly to the `case` table in this individual schema.

**Reason:**
The proposal contains an OFFICER–CASE INVESTIGATES relationship, but OFFICER belongs to another team member's module. The final implementation of this cross-module relationship should be decided during team integration rather than creating a conflicting individual design.

---

## Decision ID: D029

**Table:** Cross-module relationships

**Choice:**
Do not independently create participant, evidence, or officer tables inside the Shakil module.

**Reason:**
SUSPECT, VICTIM, WITNESS, LOCATION, EVIDENCE, EVIDENCE_STATUS_HISTORY and the organization/access tables are assigned to other team members. The final database will integrate these reviewed contributions after resolving relationship and naming conflicts.

---

## Decision ID: D030

**Table:** All tables

**Choice:**
Review the complete schema for 3NF and relational integrity before final merge.

**Reason:**
The project proposal targets a normalized relational schema in 3NF. The individual design should therefore be reviewed together with the other team members' schemas before final integration.
