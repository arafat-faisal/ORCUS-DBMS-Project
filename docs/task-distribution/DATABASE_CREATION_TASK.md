# Database Creation Task
## ORCUS - Organized Crime Understanding System

### Objective
Our current goal is to complete the Database Design Phase before starting SQL implementation, backend, or frontend development.

Everyone should contribute to the database design and understand the complete system, even if individual responsibilities are assigned.

---

# Workflow

## Repository

Repository:
https://github.com/arafat-faisal/ORCUS-DBMS-Project

### Branch Rule

Never work directly on `main`.

Create a feature branch:

```bash
git checkout -b feature/database-design
```

Commit regularly:

```bash
git add .
git commit -m "Meaningful commit message"
git push
```

Create a Pull Request when your work is ready.

At least one team member should review before merging.

---

# Team Responsibilities

## Md. Arafat Hossain Faisal

### Responsibility Area
Organization & Access Control

### Tables

- AGENCY_BRANCH
- OFFICER
- USER
- ROLE
- USER_ROLE

### Tasks

- Define attributes
- Define Primary Keys
- Define Foreign Keys
- Define UNIQUE constraints
- Document relationships

---

## A.K. Md. Shakil Hossain

### Responsibility Area
Investigation Intake

### Tables

- COMPLAINANT
- GD
- FIR
- CASE

### Tasks

- Define attributes
- Define Primary Keys
- Define Foreign Keys
- Define workflow relationships
- Document business rules

---

## Ayshee Islam Liza

### Responsibility Area
Investigation Participants & Evidence

### Tables

- SUSPECT
- VICTIM
- WITNESS
- LOCATION
- EVIDENCE
- EVIDENCE_STATUS_HISTORY

### Tasks

- Define attributes
- Define Primary Keys
- Define Foreign Keys
- Define evidence tracking rules
- Define participant relationships

---

# Shared Responsibilities

Everyone participates in reviewing:

- Relational Schema
- Relationships
- Keys
- Constraints
- Normalization

Nobody should merge anything without understanding it.

---

# Required Deliverables

## 1. Relational Schema

File:

```text
docs/relational_schema.md
```

For every table include:

```text
Table Name
Attributes
Primary Key
Foreign Keys
Unique Constraints
```

---

## 2. Business Rules

File:

```text
docs/business_rules.md
```

---

## 3. Bridge Tables

- USER_ROLE
- CASE_SUSPECT
- CASE_VICTIM
- CASE_WITNESS
- CASE_LOCATION

---

# Design Guidelines

Before adding any attribute ask:

1. Why is this attribute needed?
2. Is it stored or derived?
3. Is it mandatory or optional?
4. Does it belong in this table?
5. Will it create redundancy?

Target:

- 1NF
- 2NF
- 3NF

---

# Important Rule

✅ Design First

✅ Review Together

✅ Document Decisions

❌ Do Not Write SQL Yet

❌ Do Not Start Backend Yet

❌ Do Not Start Frontend Yet

---

# Success Criteria

- Complete relational schema
- All Primary Keys defined
- All Foreign Keys defined
- All bridge tables identified
- Business rules documented
- Team review completed

Only then proceed to:

```text
database/schema.sql
```
