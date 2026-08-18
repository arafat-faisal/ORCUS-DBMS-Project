package shakil_backend

// Package shakil_backend contains the Investigation Intake & Cases module.
//
// The master ORCUS backend is responsible for creating the shared MySQL
// connection and mounting Module.Handler().
//
// Authentication and RBAC are intentionally external to this package.
// The AuthorizeFunc hook allows the shared RBAC middleware to protect
// this module's privileged endpoints.
