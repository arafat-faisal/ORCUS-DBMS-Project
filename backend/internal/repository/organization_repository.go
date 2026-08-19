// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/repository/organization_repository.go
// Purpose: Repository for agency_branch, officer, and SQL view v_officer_caseload.
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

type OrganizationRepository struct {
	db *sqlx.DB
}

func NewOrganizationRepository(db *sqlx.DB) *OrganizationRepository {
	return &OrganizationRepository{db: db}
}

// ----------------------------------------------------------------------------
// Branch Operations
// ----------------------------------------------------------------------------

func (r *OrganizationRepository) GetAllBranches(ctx context.Context, district string) ([]models.AgencyBranch, error) {
	branches := make([]models.AgencyBranch, 0)
	var query string
	var args []interface{}

	if district != "" {
		query = "SELECT branch_id, branch_name, district FROM agency_branch WHERE district = ? ORDER BY branch_name ASC"
		args = append(args, district)
	} else {
		query = "SELECT branch_id, branch_name, district FROM agency_branch ORDER BY branch_id ASC"
	}

	err := r.db.SelectContext(ctx, &branches, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching branches: %w", err)
	}
	return branches, nil
}

func (r *OrganizationRepository) GetBranchByID(ctx context.Context, branchID uint) (*models.AgencyBranch, error) {
	var branch models.AgencyBranch
	query := "SELECT branch_id, branch_name, district FROM agency_branch WHERE branch_id = ? LIMIT 1"
	err := r.db.GetContext(ctx, &branch, query, branchID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching branch by ID: %w", err)
	}
	return &branch, nil
}

func (r *OrganizationRepository) CreateBranch(ctx context.Context, branchName, district string) (uint, error) {
	query := "INSERT INTO agency_branch (branch_name, district) VALUES (?, ?)"
	res, err := r.db.ExecContext(ctx, query, branchName, district)
	if err != nil {
		return 0, fmt.Errorf("error inserting branch: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

// ----------------------------------------------------------------------------
// Officer Operations
// ----------------------------------------------------------------------------

func (r *OrganizationRepository) GetAllOfficers(ctx context.Context, search string, branchID uint) ([]models.Officer, error) {
	officers := make([]models.Officer, 0)
	query := `
		SELECT 
			o.officer_id,
			o.badge_no,
			o.first_name,
			o.last_name,
			o.rank,
			o.branch_id,
			b.branch_name,
			b.district
		FROM officer o
		JOIN agency_branch b ON o.branch_id = b.branch_id
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if search != "" {
		query += " AND (o.first_name LIKE ? OR o.last_name LIKE ? OR o.badge_no LIKE ?)"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}

	if branchID > 0 {
		query += " AND o.branch_id = ?"
		args = append(args, branchID)
	}

	query += " ORDER BY o.officer_id ASC"

	err := r.db.SelectContext(ctx, &officers, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching officers: %w", err)
	}
	return officers, nil
}

func (r *OrganizationRepository) GetOfficerByID(ctx context.Context, officerID uint) (*models.Officer, error) {
	var officer models.Officer
	query := `
		SELECT 
			o.officer_id,
			o.badge_no,
			o.first_name,
			o.last_name,
			o.rank,
			o.branch_id,
			b.branch_name,
			b.district
		FROM officer o
		JOIN agency_branch b ON o.branch_id = b.branch_id
		WHERE o.officer_id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &officer, query, officerID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching officer by ID: %w", err)
	}
	return &officer, nil
}

func (r *OrganizationRepository) CreateOfficer(ctx context.Context, req *models.CreateOfficerRequest) (uint, error) {
	query := "INSERT INTO officer (badge_no, first_name, last_name, rank, branch_id) VALUES (?, ?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, req.BadgeNo, req.FirstName, req.LastName, req.Rank, req.BranchID)
	if err != nil {
		return 0, fmt.Errorf("error inserting officer: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *OrganizationRepository) GetOfficerCaseload(ctx context.Context) ([]models.OfficerCaseload, error) {
	caseloads := make([]models.OfficerCaseload, 0)
	query := `
		SELECT 
			officer_id,
			badge_no,
			officer_name,
			rank,
			branch_name,
			district,
			total_cases_assigned,
			active_cases,
			closed_cases
		FROM v_officer_caseload
		ORDER BY total_cases_assigned DESC, officer_name ASC
	`
	err := r.db.SelectContext(ctx, &caseloads, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching officer caseload view: %w", err)
	}
	return caseloads, nil
}
