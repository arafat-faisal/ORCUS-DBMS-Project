# API Specification (`api_spec.md`)

## 1. Suspect Management & Dossier
- **GET /api/v1/suspects**
  - **Method:** GET
  - **Role:** Investigator / Admin
  - **Response (200 OK):** `[{"suspect_id": 1, "name": "John Doe", "status": "In Custody"}]`

- **GET /api/v1/suspects/{id}/dossier**
  - **Method:** GET
  - **Role:** Lead Investigator
  - **Response (200 OK):** `{"suspect_id": 1, "name": "John Doe", "associated_cases": [{"case_id": 101, "title": "Bank Heist"}]}`

- **POST /api/v1/suspects**
  - **Method:** POST
  - **Body:** `{"name": "Jane Doe", "age": 30, "suspicion_level": "High"}`
  - **Response (201 Created):** `{"message": "Suspect registered", "suspect_id": 2}`

## 2. Victim & Witness Records
- **GET /api/v1/victims**
  - **Method:** GET | **Response (200 OK):** List of victims.
- **GET /api/v1/witnesses**
  - **Method:** GET | **Response (200 OK):** List of witnesses.

## 3. Location Directory
- **GET /api/v1/locations**
  - **Method:** GET | **Response (200 OK):** List of crime scene locations with GPS.
- **POST /api/v1/locations**
  - **Method:** POST | **Body:** `{"gps": "23.8103,90.4125", "address": "Dhaka", "city": "Dhaka"}`

## 4. Case-Participant Linking
- **POST /api/v1/cases/{id}/suspects** (also `/victims`, `/witnesses`, `/locations`)
  - **Method:** POST
  - **Body:** `{"participant_id": 1}`
  - **Response (200 OK):** `{"message": "Linked successfully"}`

## 5. Evidence Management & Chain of Custody
- **POST /api/v1/evidence**
  - **Method:** POST | **Body:** `{"title": "Fingerprint", "evidence_type": "Physical"}`
- **PUT /api/v1/evidence/{id}/status**
  - **Method:** PUT | **Body:** `{"status": "In Lab", "remarks": "DNA Testing"}`
- **GET /api/v1/evidence/{id}/chain**
  - **Method:** GET | **Response (200 OK):** Full history of evidence status transitions.