# ORCUS Database Creation Workflow

## Purpose

The goal of this phase is to design the database collaboratively while maintaining clear ownership, documentation, reviewability, and traceability.

Every team member will independently design their assigned part, document all decisions, and create SQL files in their own workspace.

The final database schema will be merged only after review and discussion.

---

# Repository Structure

Every team member must work inside their own folder.

```text
rough/
│
├── faisal/
│   └── database-creation/
│
├── shakil/
│   └── database-creation/
│
└── liza/
    └── database-creation/
```

---

# Required Files

Each member must create:

```text
database-creation/
│
├── schema.md
├── decisions.md
└── <name>_schema.sql
```

Example:

```text
rough/
└── faisal/
    └── database-creation/
        ├── schema.md
        ├── decisions.md
        └── faisal_schema.sql
```

---

# File Responsibilities

## schema.md

Purpose: Human-readable schema design.

Include:

- Table Name
- Attributes
- Primary Key
- Foreign Keys
- Unique Constraints
- Notes

No SQL should be written here.

---

## decisions.md

Purpose: Record every important design decision.

Template:

```text
Decision ID:

Table:

Choice:

Reason:
```

Document all assumptions and discussions.

---

## <name>_schema.sql

Purpose: Actual SQL implementation.

Contains:

- CREATE TABLE statements
- Constraints
- Indexes if needed

Only SQL belongs here.

---

# Team Distribution

## Md. Arafat Hossain Faisal

### Module
Organization & Access Control

### Tables

- AGENCY_BRANCH
- OFFICER
- USER
- ROLE
- USER_ROLE

Workspace:

```text
rough/faisal/database-creation/
```

---

## A.K. Md. Shakil Hossain

### Module
Investigation Intake

### Tables

- COMPLAINANT
- GD
- FIR
- CASE

Workspace:

```text
rough/shakil/database-creation/
```

---

## Ayshee Islam Liza

### Module
Participants & Evidence

### Tables

- SUSPECT
- VICTIM
- WITNESS
- LOCATION
- EVIDENCE
- EVIDENCE_STATUS_HISTORY

Workspace:

```text
rough/liza/database-creation/
```

---

# Git Workflow

## Create Branch

```bash
git checkout -b <name>/database-design
```

Examples:

```bash
git checkout -b faisal/database-design
git checkout -b shakil/database-design
git checkout -b liza/database-design
```

## Commit Frequently

```bash
git add .
git commit -m "Add database design updates"
git push origin <branch-name>
```

## Pull Request

1. Complete assigned work
2. Push branch
3. Create Pull Request
4. Team review
5. Faisal approves
6. Merge after approval

---

# Review Checklist

Before approval verify:

- Attributes are correct
- Primary Keys are defined
- Foreign Keys are correct
- Naming is consistent
- Business rules are followed
- Design supports 3NF

---

# Naming Standard

Use snake_case.

Examples:

```text
branch_id
officer_id
case_id
evidence_id
```

Avoid:

```text
BranchID
BRANCH_ID
Branch_Id
```

---

# Final Integration Process

After all three members finish:

## Step 1

Review all schemas together.

## Step 2

Resolve naming and relationship conflicts.

## Step 3

Merge all reviewed tables into:

```text
database/schema.sql
```

## Step 4

Create:

```text
database/sample_data.sql
database/views.sql
database/queries.sql
```

---

# Important Rules

✅ Design First

✅ Document Every Decision

✅ Work In Your Own Workspace

✅ Use Pull Requests

✅ Review Before Merge

❌ Do Not Edit Final Schema Directly

❌ Do Not Push To Main Directly

❌ Do Not Modify Another Member's Workspace Without Discussion

The final ORCUS database must be created from reviewed, documented, and approved contributions from every team member.
