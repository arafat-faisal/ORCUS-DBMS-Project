package models

import "time"

// AuditLog represents an immutable security and operational audit trail entry
type AuditLog struct {
	AuditID       int64     `db:"audit_id" json:"audit_id"`
	RequestID     *string   `db:"request_id" json:"request_id"`
	UserID        *uint     `db:"user_id" json:"user_id"`
	Username      *string   `db:"username" json:"username,omitempty"`
	EventType     string    `db:"event_type" json:"event_type"`
	EntityType    *string   `db:"entity_type" json:"entity_type"`
	EntityID      *string   `db:"entity_id" json:"entity_id"`
	Action        string    `db:"action" json:"action"`
	Route         string    `db:"route" json:"route"`
	HTTPMethod    string    `db:"http_method" json:"http_method"`
	IPAddress     *string   `db:"ip_address" json:"ip_address"`
	UserAgent     *string   `db:"user_agent" json:"user_agent"`
	BranchID      *uint     `db:"branch_id" json:"branch_id"`
	BranchName    *string   `db:"branch_name" json:"branch_name,omitempty"`
	BeforeSummary *string   `db:"before_summary" json:"before_summary"`
	AfterSummary  *string   `db:"after_summary" json:"after_summary"`
	Result        string    `db:"result" json:"result"`
	CreatedAt     time.Time `db:"created_at" json:"created_at"`
}

// AuditFilter defines criteria for searching and paginating audit logs
type AuditFilter struct {
	Page       int
	PageSize   int
	UserID     *uint
	EventType  string
	EntityType string
	Action     string
	Result     string
	BranchID   *uint
	Search     string
	FromDate   string
	ToDate     string
}
