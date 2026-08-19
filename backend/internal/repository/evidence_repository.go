// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Evidence & Chain of Custody]
// File: backend/internal/repository/evidence_repository.go
// Purpose: Repository for evidence, evidence_status_history, and view v_evidence_chain_of_custody.
//
// [INTEGRATION NOTE]: Enhanced by Faisal (241400060) to provide atomic sequential
// numbering per case (case_id + evidence_no) and transaction-safe chain of custody updates.
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

type EvidenceRepository struct {
	db *sqlx.DB
}

func NewEvidenceRepository(db *sqlx.DB) *EvidenceRepository {
	return &EvidenceRepository{db: db}
}

// CreateEvidenceItemTx atomically calculates the sequential evidence_no for the case and logs initial status
func (r *EvidenceRepository) CreateEvidenceItemTx(ctx context.Context, req *models.CreateEvidenceRequest, userID uint) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to start evidence transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Calculate next sequential evidence_no for this case
	var nextNo uint
	seqQuery := "SELECT COALESCE(MAX(evidence_no), 0) + 1 FROM evidence WHERE case_id = ? FOR UPDATE"
	if err := tx.GetContext(ctx, &nextNo, seqQuery, req.CaseID); err != nil {
		return 0, fmt.Errorf("failed to calculate next evidence sequence number: %w", err)
	}

	// 2. Insert into evidence table
	insertEvidence := `
		INSERT INTO evidence (case_id, evidence_no, title, description, evidence_type, status, collected_at, collected_by_officer_id, storage_location)
		VALUES (?, ?, ?, ?, ?, 'Collected', NOW(), ?, ?)
	`
	res, err := tx.ExecContext(ctx, insertEvidence, req.CaseID, nextNo, req.Title, req.Description, req.EvidenceType, req.CollectedByOfficerID, req.StorageLocation)
	if err != nil {
		return 0, fmt.Errorf("error inserting evidence record: %w", err)
	}

	evidenceID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	// 3. Log initial chain of custody state
	insertHistory := `
		INSERT INTO evidence_status_history (evidence_id, status, changed_at, remarks, changed_by_user_id)
		VALUES (?, 'Collected', NOW(), 'Initial evidence registration in system.', ?)
	`
	if _, err := tx.ExecContext(ctx, insertHistory, evidenceID, userID); err != nil {
		return 0, fmt.Errorf("error inserting initial evidence history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit evidence creation: %w", err)
	}

	return uint(evidenceID), nil
}

// GetAllEvidence lists evidence items with optional case, type, and status filtering
func (r *EvidenceRepository) GetAllEvidence(ctx context.Context, caseID uint, evidenceType, status string) ([]models.Evidence, error) {
	items := make([]models.Evidence, 0)
	query := `
		SELECT 
			evidence_id,
			case_id,
			evidence_no,
			title,
			description,
			evidence_type,
			status,
			collected_at,
			collected_by_officer_id,
			storage_location
		FROM evidence
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if caseID > 0 {
		query += " AND case_id = ?"
		args = append(args, caseID)
	}

	if evidenceType != "" {
		query += " AND evidence_type = ?"
		args = append(args, evidenceType)
	}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	query += " ORDER BY case_id ASC, evidence_no ASC"

	err := r.db.SelectContext(ctx, &items, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching evidence items: %w", err)
	}
	return items, nil
}

// GetEvidenceByID fetches single evidence item
func (r *EvidenceRepository) GetEvidenceByID(ctx context.Context, id uint) (*models.Evidence, error) {
	var e models.Evidence
	query := `
		SELECT 
			evidence_id,
			case_id,
			evidence_no,
			title,
			description,
			evidence_type,
			status,
			collected_at,
			collected_by_officer_id,
			storage_location
		FROM evidence
		WHERE evidence_id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &e, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &e, nil
}

// UpdateEvidenceStatusTx atomically updates current evidence status & location and appends to evidence_status_history
func (r *EvidenceRepository) UpdateEvidenceStatusTx(ctx context.Context, evidenceID uint, req *models.UpdateEvidenceStatusRequest, userID uint) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start status transition transaction: %w", err)
	}
	defer tx.Rollback()

	updateQuery := `
		UPDATE evidence 
		SET status = ?, storage_location = COALESCE(?, storage_location)
		WHERE evidence_id = ?
	`
	res, err := tx.ExecContext(ctx, updateQuery, req.Status, req.StorageLocation, evidenceID)
	if err != nil {
		return fmt.Errorf("error updating evidence status: %w", err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		return errors.New("evidence record not found")
	}

	insertHistory := `
		INSERT INTO evidence_status_history (evidence_id, status, changed_at, remarks, changed_by_user_id)
		VALUES (?, ?, NOW(), ?, ?)
	`
	if _, err := tx.ExecContext(ctx, insertHistory, evidenceID, req.Status, req.Remarks, userID); err != nil {
		return fmt.Errorf("error inserting evidence status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit evidence status transition: %w", err)
	}

	return nil
}

// GetEvidenceChainOfCustody queries SQL View `v_evidence_chain_of_custody`
func (r *EvidenceRepository) GetEvidenceChainOfCustody(ctx context.Context, evidenceID uint) ([]models.EvidenceChainLog, error) {
	logs := make([]models.EvidenceChainLog, 0)
	query := `
		SELECT 
			evidence_id,
			case_id,
			case_title,
			evidence_no,
			evidence_title,
			evidence_type,
			storage_location,
			history_id,
			logged_status,
			changed_at,
			remarks,
			updated_by_username,
			updated_by_officer
		FROM v_evidence_chain_of_custody
		WHERE evidence_id = ?
		ORDER BY history_id ASC
	`
	err := r.db.SelectContext(ctx, &logs, query, evidenceID)
	if err != nil {
		return nil, fmt.Errorf("error fetching evidence chain of custody: %w", err)
	}
	return logs, nil
}
