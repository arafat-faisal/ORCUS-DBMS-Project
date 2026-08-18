Decision ID: DEC-001
Module / Endpoint: Suspect Dossier (`/api/v1/suspects/:id/dossier`)
Choice: Use JOIN query across SUSPECT and CASE_SUSPECT tables.
Reason: Prevents N+1 database querying issues when generating criminal dossiers.

Decision ID: DEC-002
Module / Endpoint: Atomic Evidence Status Update (`/api/v1/evidence/:id/status`)
Choice: Wrap UPDATE on EVIDENCE and INSERT on EVIDENCE_STATUS_HISTORY inside a SQL Transaction (BEGIN/COMMIT).
Reason: Ensures strict data integrity and chain-of-custody compliance. If history logging fails, status update rolls back.

Decision ID: DEC-003
Module / Endpoint: Participant Linking (`/api/v1/cases/:id/*`)
Choice: Enforce Composite Primary Keys and ON DELETE CASCADE on Bridge tables.
Reason: Ensures junction table entries automatically clean up without leaving orphaned links.