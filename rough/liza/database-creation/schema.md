# Database Schema Documentation — Participants & Evidence Module

**Module Owner:** Ayshee Islam Liza (241400045)

---

## 1. Primary Tables

### CASE
* **Attributes:** Case_ID (INT, PK), Case_Title (VARCHAR(150)), Status (VARCHAR(30)), Opened_Date (DATE), Assigned_Date (DATE)
* **Primary Key:** Case_ID
* **Foreign Keys:** None
* **Unique Constraints:** None
* **Notes:** Stores core details and status of active or closed cases.

### SUSPECT
* **Attributes:** Suspect_ID (INT, PK, Auto Increment), Name (VARCHAR(100)), Age (INT), Identification_Sign (VARCHAR(255)), Suspicion_Level (ENUM: Low, Medium, High), Status (VARCHAR(50))
* **Primary Key:** Suspect_ID
* **Foreign Keys:** None
* **Unique Constraints:** None
* **Notes:** Tracks details and suspicion levels of individuals tied to investigations.

### VICTIM
* **Attributes:** Victim_ID (INT, PK, Auto Increment), Name (VARCHAR(100)), Age (INT), Identification_Sign (VARCHAR(255)), Victim_Condition (VARCHAR(100)), Is_Deceased (BOOLEAN)
* **Primary Key:** Victim_ID
* **Foreign Keys:** None
* **Unique Constraints:** None
* **Notes:** Contains information about affected individuals and their conditions.

### WITNESS
* **Attributes:** Witness_ID (INT, PK, Auto Increment), Name (VARCHAR(100)), Age (INT), Identification_Sign (VARCHAR(255)), Reliability_Note (VARCHAR(255)), Is_Protected (BOOLEAN)
* **Primary Key:** Witness_ID
* **Foreign Keys:** None
* **Unique Constraints:** None
* **Notes:** Stores witness details, protection status, and credibility notes.

### LOCATION
* **Attributes:** Location_ID (INT, PK), GPS (VARCHAR(50)), Address (VARCHAR(255)), Area (VARCHAR(100)), City (VARCHAR(100))
* **Primary Key:** Location_ID
* **Foreign Keys:** None
* **Unique Constraints:** None
* **Notes:** Geographical records for crime scenes or associated sites.

### EVIDENCE
* **Attributes:** Evidence_Number (INT, PK, Auto Increment), Title (VARCHAR(150)), Content (TEXT), Status (VARCHAR(50)), Evidence_Type (VARCHAR(50)), Collection_DateTime (DATETIME)
* **Primary Key:** Evidence_Number
* **Foreign Keys:** None
* **Unique Constraints:** None
* **Notes:** Core registry of collected evidence items.

### EVIDENCE_STATUS_HISTORY
* **Attributes:** History_ID (INT, PK, Auto Increment), Evidence_Number (INT, FK), Status (VARCHAR(50)), Changed_At (DATETIME), Remarks (VARCHAR(255))
* **Primary Key:** History_ID
* **Foreign Keys:** Evidence_Number -> EVIDENCE(Evidence_Number) [ON DELETE CASCADE]
* **Unique Constraints:** None
* **Notes:** Append-only log tracking evidence status changes over time.

---

## 2. Bridge (Junction) Tables

### CASE_SUSPECT
* **Composite Primary Key:** (Case_ID, Suspect_ID)
* **Foreign Keys:** Case_ID -> CASE(Case_ID) [ON DELETE RESTRICT], Suspect_ID -> SUSPECT(Suspect_ID) [ON DELETE CASCADE]
* **Notes:** Links cases with suspects (Many-to-Many).

### CASE_VICTIM
* **Composite Primary Key:** (Case_ID, Victim_ID)
* **Foreign Keys:** Case_ID -> CASE(Case_ID) [ON DELETE RESTRICT], Victim_ID -> VICTIM(Victim_ID) [ON DELETE CASCADE]
* **Notes:** Links cases with victims (Many-to-Many).

### CASE_WITNESS
* **Composite Primary Key:** (Case_ID, Witness_ID)
* **Foreign Keys:** Case_ID -> CASE(Case_ID) [ON DELETE RESTRICT], Witness_ID -> WITNESS(Witness_ID) [ON DELETE CASCADE]
* **Notes:** Links cases with witnesses (Many-to-Many).

### VICTIM_LOCATION
* **Composite Primary Key:** (Victim_ID, Location_ID)
* **Foreign Keys:** Victim_ID -> VICTIM(Victim_ID) [ON DELETE CASCADE], Location_ID -> LOCATION(Location_ID) [ON DELETE CASCADE]
* **Notes:** Maps victims to related locations (Many-to-Many).

### VICTIM_EVIDENCE
* **Composite Primary Key:** (Victim_ID, Evidence_Number)
* **Foreign Keys:** Victim_ID -> VICTIM(Victim_ID) [ON DELETE CASCADE], Evidence_Number -> EVIDENCE(Evidence_Number) [ON DELETE CASCADE]
* **Notes:** Maps victims to linked evidence items (Many-to-Many).