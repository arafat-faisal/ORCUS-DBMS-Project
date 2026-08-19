# Backend Design Decisions — Organization & Access Control Module

**Module Owner:** Md. Arafat Hossain Faisal (241400060)

Every important architectural and implementation decision for the Organization & Access Control backend is recorded below using the team template.

---

Decision ID: BD-01

Module / Endpoint: Auth / `/api/v1/auth/login`

Choice: Use bcrypt (`golang.org/x/crypto/bcrypt`) for password hashing and verification, and issue HMAC-SHA256 JWT tokens containing `user_id`, `username`, and `roles` in claims.

Reason: Storing plaintext passwords violates security best practices and project rules. JWT tokens allow stateless authentication between the Next.js frontend and the Go backend while encapsulating assigned roles.

---

Decision ID: BD-02

Module / Endpoint: RBAC Middleware / `RequireRoles(roles ...string)`

Choice: Create a reusable variadic Gin middleware that verifies if any of the user's assigned roles match the required roles for an endpoint.

Reason: Different endpoints have different permission levels (e.g. branch/officer creation requires `Administrator`, while viewing endpoints require standard authentication). Middleware-based enforcement centralizes security logic.

---

Decision ID: BD-03

Module / Endpoint: User Profile / `/api/v1/auth/me`

Choice: Execute a multi-table SQL query joining `user`, `officer`, `agency_branch`, `user_role`, and `role` with `GROUP_CONCAT(r.role_name SEPARATOR ', ')`.

Reason: Hydrates the entire user session state (account, sworn officer personnel data, branch, and role privileges) in a single high-performance query.

---

Decision ID: BD-04

Module / Endpoint: Caseload Report / `/api/v1/officers/caseload`

Choice: Query the dedicated database view `v_officer_caseload`.

Reason: Leverages database-level aggregation and pre-compiled joins, directly demonstrating the integration between the Go backend and relational database views.

---

Decision ID: BD-05

Module / Endpoint: Data Access Layer

Choice: Use `github.com/jmoiron/sqlx` with standard parameterized queries (`?`).

Reason: Avoids ORM magic, keeping raw SQL visible and defendable for academic DBMS evaluation while providing clean struct scanning (`db.SelectContext`, `db.GetContext`).

---

Decision ID: BD-06

Module / Endpoint: User Registration Transaction

Choice: Wrap user account creation and `user_role` bridge table insertions within a single atomic database transaction (`tx.BeginTxx`).

Reason: Prevents orphaned user accounts if role mapping insertion fails, enforcing ACID integrity.

---

Decision ID: BD-07

Module / Endpoint: API Response Envelope

Choice: Standardize all HTTP responses to `{ "success": true, "data": ..., "message": ... }` and `{ "success": false, "error": ... }`.

Reason: Ensures consistent API consumption across all modules for frontend integration.
