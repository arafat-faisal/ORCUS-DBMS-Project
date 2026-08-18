# ORCUS Backend API Specification

## Module: Investigation Intake & Cases

**Owner:** A.K. Md. Shakil Hossain  
**Workspace:** `rough/shakil/backend-development/`  
**API base path:** `/api/v1`  
**Backend:** Go REST API  
**Database:** MySQL / MariaDB

This specification is based on the ORCUS Backend Creation Workflow and the approved project proposal.

---

## 1. Assigned Scope

Assigned database scope:

- `COMPLAINANT`
- `COMPLAINANT_CONTACT`
- `GD`
- `FIR`
- `LEGAL_SECTION`
- `FIR_LEGAL_SECTION`
- `CASE`
- `CASE_STATUS_HISTORY`

Assigned features:

- Complainant and contact-channel management
- General Diary recording and search
- FIR filing with statutory legal sections
- Case intake
- Multi-criteria case search
- Case dossier retrieval
- Atomic case status transition
- Chronological case lifecycle history

The backend workflow explicitly assigns these entities and features to the Investigation Intake & Cases module.

---

## 2. API Standards

### URL routes

Use `kebab-case`.

Examples:

```text
/api/v1/legal-sections
/api/v1/cases/:id/status
/api/v1/cases/:id/history
```

### JSON fields

Use `snake_case`.

Examples:

```text
case_id
case_title
opened_date
changed_at
```

### Success envelope

```json
{
  "success": true,
  "data": {}
}
```

### Error envelope

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Required HTTP status codes

The module uses the status codes required by the backend review checklist:

- `200` successful read/update
- `201` successful creation
- `400` invalid request
- `401` unauthenticated
- `403` unauthorized
- `404` resource not found
- `500` internal/server error

`409 Conflict` may be used for a database uniqueness conflict when the final schema defines a UNIQUE constraint for the relevant identifier.

---

# 3. Complainants

## GET /api/v1/complainants

### Purpose

Retrieve complainants and their contact-channel information.

### Authorization

Authenticated request. Final role mapping is supplied by the shared RBAC middleware.

### Query Parameters

```text
search   optional
page     optional
limit    optional
```

`search` may be used for complainant-related text lookup. Pagination may be applied by the implementation.

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "complainant_id": 1,
        "name": "Example Name",
        "contacts": [
          {
            "contact_id": 1,
            "complainant_id": 1,
            "contact_type": "phone",
            "contact_value": "01700000000",
            "is_primary": true
          }
        ]
      }
    ]
  }
}
```

### Errors

- `400` invalid query parameters
- `401` authentication required
- `403` insufficient permission
- `500` internal error

---

## POST /api/v1/complainants

### Purpose

Create a complainant and its submitted contact channels.

### Authorization

Authenticated request. Final role mapping is supplied by the shared RBAC middleware.

### Request Body

```json
{
  "name": "Example Name",
  "contacts": [
    {
      "contact_type": "phone",
      "contact_value": "01700000000",
      "is_primary": true
    }
  ]
}
```

### Validation

- `name` is required.
- Contact values must not be empty.
- At most one submitted contact may be marked as primary.
- Contact creation belongs to the same logical creation operation as the complainant.

### Response

`201 Created`

```json
{
  "success": true,
  "data": {
    "complainant_id": 1,
    "name": "Example Name",
    "contacts": []
  }
}
```

### Errors

- `400` validation error
- `401` authentication required
- `403` insufficient permission
- `500` internal error

---

# 4. General Diary

## GET /api/v1/gds

### Purpose

Search and retrieve General Diary records.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Query Parameters

Supported search/filter parameters:

```text
gd_number
complainant_id
date_from
date_to
search
page
limit
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "gd_id": 1,
        "gd_number": "GD-001",
        "gd_date": "2026-08-19",
        "subject": "Example subject",
        "complainant_id": 1
      }
    ]
  }
}
```

### Errors

- `400` invalid parameters
- `401` authentication required
- `403` insufficient permission
- `500` internal error

---

## POST /api/v1/gds

### Purpose

Record a General Diary.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Request Body

```json
{
  "gd_number": "GD-001",
  "gd_date": "2026-08-19",
  "subject": "Example subject",
  "complainant_id": 1
}
```

### Response

`201 Created`

```json
{
  "success": true,
  "data": {
    "gd_id": 1,
    "gd_number": "GD-001",
    "gd_date": "2026-08-19",
    "subject": "Example subject",
    "complainant_id": 1
  }
}
```

### Errors

- `400` validation error
- `401` authentication required
- `403` insufficient permission
- `404` referenced complainant not found
- `500` internal error

---

# 5. Legal Sections

## GET /api/v1/legal-sections

### Purpose

Retrieve statutory legal sections available for FIR association.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Query Parameters

```text
search        optional
section_code  optional
```

### Response

```json
{
  "success": true,
  "data": [
    {
      "section_id": 1,
      "section_code": "SECTION-1",
      "section_title": "Example Section",
      "description": "Example description"
    }
  ]
}
```

### Errors

- `401` authentication required
- `403` insufficient permission
- `500` internal error

---

# 6. FIR

## GET /api/v1/firs

### Purpose

Retrieve/search FIR records.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Query Parameters

```text
fir_number
crime_category
gd_id
section_code
date_from
date_to
page
limit
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "fir_id": 1,
        "fir_number": "FIR-001",
        "crime_category": "Example",
        "filed_date": "2026-08-19",
        "gd_id": 1,
        "legal_sections": []
      }
    ]
  }
}
```

---

## POST /api/v1/firs

### Purpose

File an FIR and associate statutory legal sections.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Request Body

```json
{
  "fir_number": "FIR-001",
  "crime_category": "Example",
  "filed_date": "2026-08-19",
  "gd_id": 1,
  "section_ids": [1, 2]
}
```

`gd_id` is optional because the project proposal specifies that the FIR-to-GD link is optional.

### Transaction Requirement

Creating the FIR and its `FIR_LEGAL_SECTION` mappings must be atomic.

### Response

`201 Created`

```json
{
  "success": true,
  "data": {
    "fir_id": 1,
    "fir_number": "FIR-001",
    "crime_category": "Example",
    "filed_date": "2026-08-19",
    "gd_id": 1,
    "legal_sections": []
  }
}
```

### Errors

- `400` validation error
- `401` authentication required
- `403` insufficient permission
- `404` referenced GD/legal section not found
- `500` internal/transaction error

---

# 7. Case Intake

## POST /api/v1/cases

### Purpose

Open a case from the investigation intake workflow.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Request Body

```json
{
  "case_title": "Example case",
  "status": "Opened",
  "opened_date": "2026-08-19",
  "assigned_date": null,
  "fir_id": 1
}
```

`fir_id` is optional because the project proposal specifies that the FIR-to-Case link is optional.

### Response

`201 Created`

```json
{
  "success": true,
  "data": {
    "case_id": 1,
    "case_title": "Example case",
    "status": "Opened",
    "opened_date": "2026-08-19",
    "assigned_date": null,
    "fir_id": 1
  }
}
```

### Errors

- `400` validation error
- `401` authentication required
- `403` insufficient permission
- `404` referenced FIR not found
- `500` internal error

---

# 8. Case Search

## GET /api/v1/cases

### Purpose

Provide case search with multiple criteria.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Query Parameters

The implementation may combine available criteria including:

```text
case_id
status
fir_id
gd_number
fir_number
complainant_id
crime_category
opened_from
opened_to
search
page
limit
```

### Response

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "case_id": 1,
        "case_title": "Example case",
        "status": "Opened",
        "opened_date": "2026-08-19",
        "assigned_date": null,
        "fir_id": 1
      }
    ]
  }
}
```

### Errors

- `400` invalid search parameters
- `401` authentication required
- `403` insufficient permission
- `500` internal error

---

# 9. Case Dossier

## GET /api/v1/cases/:id

### Purpose

Retrieve the case dossier for a specific case.

The dossier can compose available intake information including:

- Case
- Source FIR
- Source GD
- Complainant
- Complainant contacts
- Legal sections
- Case status history

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Path Parameter

```text
id
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "case": {
      "case_id": 1,
      "case_title": "Example case",
      "status": "Opened",
      "opened_date": "2026-08-19",
      "assigned_date": null,
      "fir_id": 1
    },
    "fir": null,
    "gd": null,
    "complainant": null,
    "legal_sections": [],
    "status_history": []
  }
}
```

Optional relationships are represented as absent/null when they do not exist.

### Errors

- `400` invalid case ID
- `401` authentication required
- `403` insufficient permission
- `404` case not found
- `500` internal error

---

# 10. Case Status Transition

## PUT /api/v1/cases/:id/status

### Purpose

Change the current case status and append a lifecycle-history record.

### Authorization

Authenticated request with the final role permission assigned by the shared RBAC middleware.

### Request Body

```json
{
  "status": "Under Investigation",
  "remarks": "Investigation started."
}
```

### Atomic Transaction Requirement

The status transition must be one atomic database transaction:

```text
BEGIN
  verify case
  update CASE.status
  insert CASE_STATUS_HISTORY
COMMIT
```

If any operation fails:

```text
ROLLBACK
```

### Response

`200 OK`

```json
{
  "success": true,
  "data": {
    "case_id": 1,
    "status": "Under Investigation"
  }
}
```

### Errors

- `400` validation error
- `401` authentication required
- `403` insufficient permission
- `404` case not found
- `500` transaction/internal error

---

# 11. Case Lifecycle History

## GET /api/v1/cases/:id/history

### Purpose

Retrieve the chronological lifecycle history of a case.

### Authorization

Authenticated request. Final role mapping is supplied by shared RBAC.

### Response

```json
{
  "success": true,
  "data": [
    {
      "history_id": 1,
      "case_id": 1,
      "status": "Opened",
      "changed_at": "2026-08-19T10:00:00Z",
      "remarks": "Case opened."
    },
    {
      "history_id": 2,
      "case_id": 1,
      "status": "Under Investigation",
      "changed_at": "2026-08-19T11:00:00Z",
      "remarks": "Investigation started."
    }
  ]
}
```

### Ordering

History is chronological by `changed_at`. A deterministic secondary ordering may use the history identifier.

### Errors

- `400` invalid case ID
- `401` authentication required
- `403` insufficient permission
- `404` case not found
- `500` internal error

---

# 12. Authorization Boundary

This module does not implement:

- password verification
- JWT creation
- JWT verification
- user/role management
- RBAC middleware implementation

Those belong to the Organization & Access Control module.

This module exposes authorization points so the shared RBAC middleware can protect privileged endpoints.

---

# 13. Database Safety

All user-controlled SQL values must use parameterized queries.

No SQL string concatenation of user-controlled values is permitted.

Multi-table state changes must use atomic transactions.

---

# 14. Business-Rule Note

The backend task requires strict enforcement of `BR-01` through `BR-15`.

The provided Backend Creation Workflow names these rules but does not define the individual contents of BR-01 through BR-15. Therefore this module does not invent their definitions. Once the authoritative business-rule list is supplied, each applicable rule must be mapped to validation/transaction logic before final approval.

---

# 15. Integration

The final module must:

- follow REST conventions
- use the common response envelope
- use parameterized SQL
- use atomic transactions
- respect shared RBAC
- return the required HTTP status codes
- compile and run against MySQL `orcus_db`
- remain inside `rough/shakil/backend-development/` until review
- be merged into `backend/` only after team review and approval
