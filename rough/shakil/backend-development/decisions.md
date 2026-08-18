# ORCUS Backend Design Decisions

## Module: Investigation Intake & Cases
**Owner:** A.K. Md. Shakil Hossain

---

## D-01

**Module / Endpoint:** Module workspace

**Choice:**

All Shakil backend work remains inside:

```text
rough/shakil/backend-development/
```

with:

```text
api_spec.md
decisions.md
shakil_backend/
```

**Reason:**

This is the required per-member backend workspace structure.

---

## D-02

**Module / Endpoint:** API routes

**Choice:**

Use `/api/v1` and `kebab-case` URL routes.

**Reason:**

The backend workflow explicitly requires `/api/v1` routes and gives `kebab-case` examples such as `/api/v1/legal-sections`.

---

## D-03

**Module / Endpoint:** JSON

**Choice:**

Use `snake_case` JSON field names.

**Reason:**

This is the project backend naming standard.

---

## D-04

**Module / Endpoint:** API response

**Choice:**

Use:

```json
{
  "success": true,
  "data": {}
}
```

for successful responses.

**Reason:**

The review checklist explicitly requires a consistent response envelope.

---

## D-05

**Module / Endpoint:** API errors

**Choice:**

Use a consistent error envelope with an application error code and message.

**Reason:**

This keeps frontend error handling consistent and prevents raw database errors from being exposed.

---

## D-06

**Module / Endpoint:** Database access

**Choice:**

Use Go `database/sql` with parameterized SQL.

**Reason:**

The backend task explicitly permits `database/sql` and requires parameterized queries to prevent SQL injection.

---

## D-07

**Module / Endpoint:** HTTP layer

**Choice:**

Use the Go standard HTTP package for the module handler.

**Reason:**

The requirement specifies Go REST APIs but does not require a particular HTTP framework. A standard handler is easy to mount into the final shared backend.

---

## D-08

**Module / Endpoint:** Shared database

**Choice:**

The module receives the shared database connection through dependency injection.

**Reason:**

The final backend will integrate multiple modules. A shared connection avoids each module creating an independent database pool.

---

## D-09

**Module / Endpoint:** Authentication/RBAC

**Choice:**

Do not implement a second authentication or RBAC system.

**Reason:**

The Organization & Access Control module owns login, JWT authentication and RBAC middleware. The Investigation Intake & Cases module only defines authorization boundaries for integration.

---

## D-10

**Module / Endpoint:** Complainant creation

**Choice:**

Create a complainant and its contact-channel rows as one logical operation.

**Reason:**

The backend task assigns complainant and contact-channel management to this module. A partial creation should not leave inconsistent related data.

---

## D-11

**Module / Endpoint:** Complainant contact

**Choice:**

Keep contact-channel data separate from the main complainant record through `COMPLAINANT_CONTACT`.

**Reason:**

The backend task explicitly assigns `COMPLAINANT_CONTACT` to this module. This also keeps contact-channel information separate from the main complainant entity.

---

## D-12

**Module / Endpoint:** GD

**Choice:**

Support GD recording and search.

**Reason:**

This is explicitly assigned in the backend task.

---

## D-13

**Module / Endpoint:** FIR source GD

**Choice:**

Treat the GD link as optional.

**Reason:**

The project proposal explicitly states that every FIR references at most one source GD and that the link is optional.

---

## D-14

**Module / Endpoint:** FIR legal sections

**Choice:**

Use `FIR_LEGAL_SECTION` for the FIR-to-legal-section association.

**Reason:**

`LEGAL_SECTION` and `FIR_LEGAL_SECTION` are explicitly assigned to this backend module and represent the statutory legal-section portion of FIR filing.

---

## D-15

**Module / Endpoint:** FIR creation

**Choice:**

Create the FIR and its legal-section associations in one transaction.

**Reason:**

A partially created FIR-to-section mapping would leave inconsistent investigation data. Multi-table state changes are required to be atomic.

---

## D-16

**Module / Endpoint:** Case creation

**Choice:**

Allow the FIR relationship to be optional.

**Reason:**

The project proposal explicitly defines the FIR-to-Case link as optional.

---

## D-17

**Module / Endpoint:** Case search

**Choice:**

Use one multi-criteria case-search endpoint.

**Reason:**

The assigned feature explicitly requires multi-criteria case search. A single endpoint allows the frontend to combine criteria.

---

## D-18

**Module / Endpoint:** Case dossier

**Choice:**

Expose a case dossier endpoint that composes available related intake information.

**Reason:**

The assigned feature explicitly requires case dossier retrieval. The proposal's GD-FIR-Case workflow makes these relationships useful in a combined case view.

---

## D-19

**Module / Endpoint:** Case status transition

**Choice:**

Update `CASE.status` and append `CASE_STATUS_HISTORY` in the same database transaction.

**Reason:**

The backend task explicitly requires an atomic case-status transition transaction.

---

## D-20

**Module / Endpoint:** Case status transition concurrency

**Choice:**

Lock the case row during the status transition when supported by the database transaction.

**Reason:**

This prevents concurrent updates from producing an inconsistent current status/history pair.

---

## D-21

**Module / Endpoint:** Case history

**Choice:**

Treat lifecycle history as chronological records.

**Reason:**

The backend task explicitly requires a chronological case lifecycle history log.

---

## D-22

**Module / Endpoint:** Case history mutation

**Choice:**

History is appended during status transitions rather than overwritten.

**Reason:**

The purpose of the history table is to preserve the lifecycle of status changes.

---

## D-23

**Module / Endpoint:** SQL security

**Choice:**

All user-provided SQL values are parameterized.

**Reason:**

The backend review checklist explicitly requires parameterized SQL and no SQL injection.

---

## D-24

**Module / Endpoint:** Transactions

**Choice:**

Use transactions whenever one logical operation changes multiple related tables.

**Reason:**

The backend review checklist explicitly requires atomic database transactions for multi-table state changes.

---

## D-25

**Module / Endpoint:** Error handling

**Choice:**

Return appropriate HTTP status codes instead of raw database errors.

**Reason:**

The backend review checklist requires appropriate `200`, `201`, `400`, `401`, `403`, `404`, and `500` handling.

---

## D-26

**Module / Endpoint:** Optional relationships

**Choice:**

Do not reject a valid case simply because its optional FIR relationship is absent.

**Reason:**

The project proposal explicitly defines the FIR-to-Case relationship as optional.

---

## D-27

**Module / Endpoint:** Cross-module entities

**Choice:**

Do not duplicate the implementation of:

- `AGENCY_BRANCH`
- `OFFICER`
- `USER`
- `ROLE`
- `USER_ROLE`
- `SUSPECT`
- `VICTIM`
- `WITNESS`
- `LOCATION`
- `EVIDENCE`
- `EVIDENCE_STATUS_HISTORY`
- case-participant bridge tables

**Reason:**

These belong to the other members' assigned modules.

---

## D-28

**Module / Endpoint:** Business rules BR-01 through BR-15

**Choice:**

Do not invent definitions for BR-01 through BR-15.

**Reason:**

The Backend Creation Workflow requires these rules to be strictly enforced, but the supplied workflow does not define the individual rules. Their authoritative definitions must be supplied before claiming complete BR-01 through BR-15 compliance.

---

## D-29

**Module / Endpoint:** API role names

**Choice:**

Do not invent final role names.

**Reason:**

The Organization & Access Control module owns roles and RBAC. The Investigation Intake module documents that authentication/authorization is required and leaves final role mapping to the shared middleware.

---

## D-30

**Module / Endpoint:** Final integration

**Choice:**

Do not edit the final `backend/` directory directly.

**Reason:**

The workflow requires independent development, review, Pull Request approval and only then merging into the master backend.

---

## D-31

**Module / Endpoint:** Final database

**Choice:**

Target MySQL `orcus_db`.

**Reason:**

The backend review checklist explicitly requires the final code to compile and run against MySQL `orcus_db`.

---

## D-32

**Module / Endpoint:** Naming consistency

**Choice:**

Keep API naming in `snake_case` and URL naming in `kebab-case`, while database naming follows the project's existing schema convention.

**Reason:**

This avoids silently renaming existing database structures while still complying with the API naming standard.

---

## D-33

**Module / Endpoint:** Missing specification details

**Choice:**

Where the supplied requirement files do not define an exact field, role, status vocabulary or BR rule, mark it as an integration decision rather than silently presenting a made-up value as an official requirement.

**Reason:**

This preserves traceability between the implementation and the provided project documents.

---

## Final Decision Summary

The implementation follows the supplied ORCUS workflow:

- design and document first
- work only in the member workspace
- use REST conventions
- use the required response envelope
- use parameterized SQL
- use atomic transactions
- integrate with shared RBAC
- preserve case lifecycle history
- respect optional GD/FIR/Case relationships
- review before merge
- do not directly modify the final backend
