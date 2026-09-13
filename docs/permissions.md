# ORCUS Permissions and Role-Based Access Control (RBAC)

**Project**: ORCUS (Organized Crime Understanding System)  
**Context**: Fictional Public-Sector Investigation Management Academic Prototype (Bangladesh)  
**Version**: 2.0  
**Security Standard**: Least-Privilege & Separation of Duties (No Universal Bypass)

---

## 1. Architectural Philosophy & Separation of Duties

The original version of ORCUS suffered from critical authorization flaws, including hardcoded credentials, universal bypass passwords, and an `Administrator` role that held unrestricted write access over evidence, criminal allegations, and investigation conclusions.

In ORCUS v2.0, the authorization engine enforces strict **Separation of Duties** and **Least Privilege**:
1. **Administrative Governance vs. Investigative Integrity**: An `Administrator` governs system infrastructure, users, branches, and system health. Administrators **cannot** create complaints, alter FIR allegations, fabricate suspects, or alter physical evidence custody.
2. **Chain of Command**: Case opening, assignment, and formal FIR registration are reserved for the `Officer-in-Charge` (OIC). Case closure requires sign-off from a `Supervising Officer`.
3. **Evidence Custody Isolation**: Only designated `Evidence Officer` personnel (and authorized assigned investigators) can receive, transfer, seal, or register evidence. Chain-of-custody history records are strictly append-only with `ON DELETE RESTRICT`.
4. **Audit Independence**: `System Auditor` personnel possess read-only visibility into system-wide audit logs and reports. They cannot modify operational records or delete audit trails.
5. **Public Boundary**: A `Public Complainant` is restricted to submitting complaints and tracking their public-safe status. They are strictly blocked from internal notes, officer names, suspect dossiers, witness identities, or investigative intelligence.

---

## 2. Standard System Roles

| Role ID | Role Name | Operational Scope & Responsibility |
| :--- | :--- | :--- |
| **1** | **Administrator** | User account provisioning, branch administration, role assignments, system health, and configuration. |
| **7** | **Duty Officer** | Intake desk officer managing public and officer complaint registration, initial verification, and draft GD/FIR records. |
| **8** | **Officer-in-Charge** | Branch executive leadership approving GD/FIR registration, case opening, investigator assignment, and jurisdictional transfer. |
| **9** | **Investigating Officer** | Lead or supporting field investigator assigned to cases, logging diary activities, linking participants, and submitting evidence. |
| **10** | **Evidence Officer** | Dedicated custodian managing evidence reception, packaging, seal inspection, forensic laboratory transfer, and custody vault storage. |
| **11** | **Supervising Officer** | Senior oversight officer conducting periodic investigation reviews, approving formal closure, and evaluating branch clearance metrics. |
| **5** | **System Auditor** | Compliance auditor with read-only inspection access across system-wide audit logs, security events, and compliance reports. |
| **13** | **Public Complainant** | Citizen account restricted strictly to self-submitted complaint intake and public-safe progress tracking. |

---

## 3. Atomic Permission Codes

Permissions are managed as discrete, strongly-typed constants in `backend/internal/auth/permissions.go`:

| Permission Code | Internal Identifier | Description |
| :--- | :--- | :--- |
| `PermManageSystem` | `system:manage` | Manage branch hierarchy, geographic settings, and system configuration. |
| `PermManageUsers` | `users:manage` | Create, activate, deactivate user accounts and assign officer roles. |
| `PermViewAuditLogs` | `audit:view` | Inspect cryptographic request-traced system audit logs and security events. |
| `PermIntakeComplaint` | `complaint:intake` | Register walk-in, phone, or online complaints and draft General Diary (GD) records. |
| `PermAssessComplaint` | `complaint:assess` | Assess complaint legal merit, request citizen clarification, or recommend FIR conversion. |
| `PermApproveIntake` | `intake:approve` | Officially approve and register First Information Reports (FIRs) and GD escalations. |
| `PermManageCases` | `cases:manage` | Officially open cases from registered FIRs and manage lifecycle milestones. |
| `PermAssignInvestigator` | `cases:assign` | Assign, reassign, or designate lead investigators with full transition auditing. |
| `PermInvestigateCase` | `cases:investigate` | Record case diary activities, link suspects, victims, witnesses, and incident locations. |
| `PermManageEvidence` | `evidence:manage` | Register physical evidence, inspect seals, update vault locations, and record chain of custody. |
| `PermSuperviseCase` | `cases:supervise` | Review case investigation dossiers, conduct supervisory inspections, and review closure. |
| `PermApproveClosure` | `cases:approve_closure` | Formally approve case closure, final report submission, or case archiving. |
| `PermViewReports` | `reports:view` | Access operational analytics, caseload reports, and generate printable case dossiers. |
| `PermTrackPublicComplaint`| `public:track` | Query sanitized public complaint progress using secure tracking codes. |

---

## 4. Role-Permission Matrix

| Permission Code | Admin | Duty Officer | Officer in Charge | Investigating Officer | Evidence Officer | Supervising Officer | System Auditor | Public Complainant |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `system:manage` | **Yes** | No | No | No | No | No | No | No |
| `users:manage` | **Yes** | No | No | No | No | No | No | No |
| `audit:view` | **Yes** | No | No | No | No | No | **Yes** | No |
| `complaint:intake` | No | **Yes** | No | **Yes** | No | No | No | No |
| `complaint:assess` | No | **Yes** | No | No | No | No | No | No |
| `intake:approve` | No | No | **Yes** | No | No | No | No | No |
| `cases:manage` | No | No | **Yes** | No | No | No | No | No |
| `cases:assign` | No | No | **Yes** | No | No | No | No | No |
| `cases:investigate` | No | No | No | **Yes** | No | No | No | No |
| `evidence:manage` | No | No | No | **Yes** | **Yes** | No | No | No |
| `cases:supervise` | No | No | **Yes** | No | No | **Yes** | No | No |
| `cases:approve_closure` | No | No | No | No | No | **Yes** | No | No |
| `reports:view` | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | **Yes** | No |
| `public:track` | No | No | No | No | No | No | No | **Yes** |

---

## 5. Negative Authorization & Enforcement Rules

1. **HTTP Status Enforcement**:
   - `401 Unauthorized`: Returned immediately when session cookie (`orcus_auth_token`) is missing, expired, or invalid.
   - `403 Forbidden`: Returned when an authenticated session lacks the required atomic permission or belongs to a forbidden role.
   - `404 Not Found`: Returned instead of revealing sensitive operational identifiers to unauthorized or public users.
2. **Public Portal Isolation**:
   - The Gin router enforces `middleware.RequireNotRoles("Public Complainant")` across all internal operational routes (`/branches`, `/officers`, `/complainants`, `/gds`, `/firs`, `/cases`, `/evidence`, `/suspects`).
   - Public requests are strictly segregated into public endpoints under `/api/v1/public/complaints`.
3. **No Self-Approval**:
   - An Investigating Officer cannot approve their own case closure. Closure requires review by a `Supervising Officer`.
   - Intake officers cannot self-approve FIR registration; approval must be granted by an `Officer-in-Charge`.
