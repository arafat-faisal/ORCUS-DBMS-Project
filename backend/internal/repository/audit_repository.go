package repository

import (
	"context"
	"fmt"
	"strings"

	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type AuditRepository struct {
	db *sqlx.DB
}

func NewAuditRepository(db *sqlx.DB) *AuditRepository {
	return &AuditRepository{db: db}
}

// Create inserts an immutable audit log record
func (r *AuditRepository) Create(ctx context.Context, a *models.AuditLog) error {
	query := `
		INSERT INTO audit_log (
			request_id, user_id, event_type, entity_type, entity_id,
			action, route, http_method, ip_address, user_agent,
			branch_id, before_summary, after_summary, result
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.ExecContext(ctx, query,
		a.RequestID, a.UserID, a.EventType, a.EntityType, a.EntityID,
		a.Action, a.Route, a.HTTPMethod, a.IPAddress, a.UserAgent,
		a.BranchID, a.BeforeSummary, a.AfterSummary, a.Result,
	)
	if err != nil {
		return fmt.Errorf("failed to insert audit log: %w", err)
	}

	id, err := res.LastInsertId()
	if err == nil {
		a.AuditID = id
	}
	return nil
}

// List queries audit log entries with filters and pagination
func (r *AuditRepository) List(ctx context.Context, f models.AuditFilter) ([]models.AuditLog, int, error) {
	var conditions []string
	var args []interface{}

	if f.UserID != nil {
		conditions = append(conditions, "a.user_id = ?")
		args = append(args, *f.UserID)
	}
	if f.EventType != "" {
		conditions = append(conditions, "a.event_type = ?")
		args = append(args, f.EventType)
	}
	if f.EntityType != "" {
		conditions = append(conditions, "a.entity_type = ?")
		args = append(args, f.EntityType)
	}
	if f.Action != "" {
		conditions = append(conditions, "a.action = ?")
		args = append(args, f.Action)
	}
	if f.Result != "" {
		conditions = append(conditions, "a.result = ?")
		args = append(args, f.Result)
	}
	if f.BranchID != nil {
		conditions = append(conditions, "a.branch_id = ?")
		args = append(args, *f.BranchID)
	}
	if f.Search != "" {
		conditions = append(conditions, "(a.entity_id LIKE ? OR a.route LIKE ? OR u.username LIKE ?)")
		pattern := "%" + f.Search + "%"
		args = append(args, pattern, pattern, pattern)
	}
	if f.FromDate != "" {
		conditions = append(conditions, "a.created_at >= ?")
		args = append(args, f.FromDate)
	}
	if f.ToDate != "" {
		conditions = append(conditions, "a.created_at <= ?")
		args = append(args, f.ToDate+" 23:59:59")
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// 1. Get total count
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM audit_log a
		LEFT JOIN user u ON a.user_id = u.user_id
		LEFT JOIN agency_branch b ON a.branch_id = b.branch_id
		%s
	`, whereClause)

	var total int
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs: %w", err)
	}

	// 2. Pagination defaults
	page := f.Page
	if page < 1 {
		page = 1
	}
	pageSize := f.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	// 3. Query paginated results
	selectQuery := fmt.Sprintf(`
		SELECT
			a.audit_id,
			a.request_id,
			a.user_id,
			u.username,
			a.event_type,
			a.entity_type,
			a.entity_id,
			a.action,
			a.route,
			a.http_method,
			a.ip_address,
			a.user_agent,
			a.branch_id,
			b.branch_name,
			a.before_summary,
			a.after_summary,
			a.result,
			a.created_at
		FROM audit_log a
		LEFT JOIN user u ON a.user_id = u.user_id
		LEFT JOIN agency_branch b ON a.branch_id = b.branch_id
		%s
		ORDER BY a.created_at DESC, a.audit_id DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	queryArgs := append(args, pageSize, offset)
	var logs []models.AuditLog
	if err := r.db.SelectContext(ctx, &logs, selectQuery, queryArgs...); err != nil {
		return nil, 0, fmt.Errorf("failed to fetch audit logs: %w", err)
	}

	return logs, total, nil
}
