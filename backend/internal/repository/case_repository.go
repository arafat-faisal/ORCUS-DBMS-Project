// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Case Management]
// File: backend/internal/repository/case_repository.go
// Purpose: Repository for case, case_status_history, and view v_case_overview.
//
// [INTEGRATION NOTE]: Harmonized by Faisal (241400060) to provide atomic transactions
// for status transitions and full case dossier aggregation across all 3 modules.
// ============================================================================

package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type CaseRepository struct {
	db *sqlx.DB
}

func NewCaseRepository(db *sqlx.DB) *CaseRepository {
	return &CaseRepository{db: db}
}

// CreateCase opens a new investigation case
func (r *CaseRepository) CreateCase(ctx context.Context, req *models.CreateCaseRequest, createdByUserID uint) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to start case creation transaction: %w", err)
	}
	defer tx.Rollback()

	insertCase := `
		INSERT INTO ` + "`case`" + ` (case_title, status, opened_date, assigned_date, fir_id, lead_officer_id)
		VALUES (?, 'Open', ?, NULLIF(?, ''), ?, ?)
	`
	res, err := tx.ExecContext(ctx, insertCase, req.CaseTitle, req.OpenedDate, req.AssignedDate, req.FIRID, req.LeadOfficerID)
	if err != nil {
		return 0, fmt.Errorf("error inserting case: %w", err)
	}

	caseID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Insert initial lifecycle status history log
	insertHistory := `
		INSERT INTO case_status_history (case_id, status, changed_at, remarks, changed_by_user_id)
		VALUES (?, 'Open', NOW(), 'Case initiated in system.', ?)
	`
	if _, err := tx.ExecContext(ctx, insertHistory, caseID, createdByUserID); err != nil {
		return 0, fmt.Errorf("error logging initial case history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit case creation transaction: %w", err)
	}

	return uint(caseID), nil
}

// SearchCases performs multi-criteria search over view `v_case_overview`
func (r *CaseRepository) SearchCases(ctx context.Context, filter *models.CaseSearchFilter) ([]models.CaseOverview, error) {
	cases := make([]models.CaseOverview, 0)
	query := `
		SELECT 
			case_id,
			case_title,
			case_status,
			opened_date,
			assigned_date,
			fir_number,
			crime_category,
			gd_number,
			lead_officer_badge,
			lead_officer_name,
			lead_officer_rank,
			branch_name,
			district,
			suspect_count,
			victim_count,
			witness_count,
			evidence_count
		FROM v_case_overview
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if filter.Search != "" {
		query += " AND (case_title LIKE ? OR lead_officer_name LIKE ? OR fir_number LIKE ?)"
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern, pattern)
	}

	if filter.Status != "" {
		query += " AND case_status = ?"
		args = append(args, filter.Status)
	}

	if filter.CrimeCategory != "" {
		query += " AND crime_category LIKE ?"
		args = append(args, "%"+filter.CrimeCategory+"%")
	}

	if filter.LeadOfficerID > 0 {
		query += " AND lead_officer_id = ?"
		args = append(args, filter.LeadOfficerID)
	}

	if filter.District != "" {
		query += " AND district = ?"
		args = append(args, filter.District)
	}

	if filter.DateFrom != "" {
		query += " AND opened_date >= ?"
		args = append(args, filter.DateFrom)
	}

	if filter.DateTo != "" {
		query += " AND opened_date <= ?"
		args = append(args, filter.DateTo)
	}

	query += " ORDER BY opened_date DESC, case_id DESC"

	err := r.db.SelectContext(ctx, &cases, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error searching cases: %w", err)
	}
	return cases, nil
}

// GetCaseOverviewByID retrieves a single case summary from `v_case_overview`
func (r *CaseRepository) GetCaseOverviewByID(ctx context.Context, caseID uint) (*models.CaseOverview, error) {
	var c models.CaseOverview
	query := `
		SELECT 
			case_id,
			case_title,
			case_status,
			opened_date,
			assigned_date,
			fir_number,
			crime_category,
			gd_number,
			lead_officer_badge,
			lead_officer_name,
			lead_officer_rank,
			branch_name,
			district,
			suspect_count,
			victim_count,
			witness_count,
			evidence_count
		FROM v_case_overview
		WHERE case_id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &c, query, caseID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching case overview: %w", err)
	}
	return &c, nil
}

// UpdateCaseStatusTx atomically updates case status and logs to case_status_history
func (r *CaseRepository) UpdateCaseStatusTx(ctx context.Context, caseID uint, newStatus string, remarks string, userID uint) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start status update transaction: %w", err)
	}
	defer tx.Rollback()

	updateQuery := "UPDATE `case` SET status = ? WHERE case_id = ?"
	res, err := tx.ExecContext(ctx, updateQuery, newStatus, caseID)
	if err != nil {
		return fmt.Errorf("error updating case status: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("case not found or status unchanged")
	}

	insertHistoryQuery := `
		INSERT INTO case_status_history (case_id, status, changed_at, remarks, changed_by_user_id)
		VALUES (?, ?, NOW(), ?, ?)
	`
	_, err = tx.ExecContext(ctx, insertHistoryQuery, caseID, newStatus, remarks, userID)
	if err != nil {
		return fmt.Errorf("error logging case status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit case status transition: %w", err)
	}

	return nil
}

// GetCaseStatusHistory fetches chronological lifecycle logs
func (r *CaseRepository) GetCaseStatusHistory(ctx context.Context, caseID uint) ([]models.CaseStatusHistory, error) {
	history := make([]models.CaseStatusHistory, 0)
	query := `
		SELECT 
			csh.history_id,
			csh.case_id,
			csh.status,
			csh.changed_at,
			csh.remarks,
			csh.changed_by_user_id,
			u.username AS changed_by
		FROM case_status_history csh
		LEFT JOIN ` + "`user`" + ` u ON csh.changed_by_user_id = u.user_id
		WHERE csh.case_id = ?
		ORDER BY csh.changed_at ASC, csh.history_id ASC
	`
	err := r.db.SelectContext(ctx, &history, query, caseID)
	if err != nil {
		return nil, fmt.Errorf("error fetching case status history: %w", err)
	}
	return history, nil
}
