package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{db: db}
}

// ============================================================================
// 1. User & Auth Queries
// ============================================================================

func (r *Repository) GetUserByUsername(ctx context.Context, username string) (*User, error) {
	var user User
	query := `SELECT user_id, username, password_hash, officer_id FROM ` + "`user`" + ` WHERE username = ? LIMIT 1`
	err := r.db.GetContext(ctx, &user, query, username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching user by username: %w", err)
	}
	return &user, nil
}

func (r *Repository) GetUserProfile(ctx context.Context, userID uint) (*UserProfile, error) {
	var profile UserProfile
	query := `
		SELECT 
			u.user_id,
			u.username,
			u.officer_id,
			CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
			o.badge_no,
			o.rank,
			b.branch_id,
			b.branch_name,
			b.district,
			COALESCE(GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ', '), '') AS roles_concat
		FROM ` + "`user`" + ` u
		LEFT JOIN officer o ON u.officer_id = o.officer_id
		LEFT JOIN agency_branch b ON o.branch_id = b.branch_id
		LEFT JOIN user_role ur ON u.user_id = ur.user_id
		LEFT JOIN role r ON ur.role_id = r.role_id
		WHERE u.user_id = ?
		GROUP BY u.user_id, u.username, u.officer_id, o.first_name, o.last_name, o.badge_no, o.rank, b.branch_id, b.branch_name, b.district
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &profile, query, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching user profile: %w", err)
	}

	if profile.RolesConcat != "" {
		profile.Roles = strings.Split(profile.RolesConcat, ", ")
	} else {
		profile.Roles = []string{}
	}

	return &profile, nil
}

func (r *Repository) CreateUserWithRoles(ctx context.Context, username, passwordHash string, officerID *uint, roleIDs []uint) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to start transaction: %w", err)
	}
	defer tx.Rollback()

	insertUserQuery := "INSERT INTO `user` (username, password_hash, officer_id) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, insertUserQuery, username, passwordHash, officerID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert user: %w", err)
	}

	userID, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert user ID: %w", err)
	}

	insertRoleQuery := "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)"
	for _, roleID := range roleIDs {
		_, err := tx.ExecContext(ctx, insertRoleQuery, userID, roleID)
		if err != nil {
			return 0, fmt.Errorf("failed to insert user role mapping: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return uint(userID), nil
}

// ============================================================================
// 2. Agency Branch Queries
// ============================================================================

func (r *Repository) GetAllBranches(ctx context.Context, district string) ([]AgencyBranch, error) {
	branches := make([]AgencyBranch, 0)
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

func (r *Repository) GetBranchByID(ctx context.Context, branchID uint) (*AgencyBranch, error) {
	var branch AgencyBranch
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

func (r *Repository) CreateBranch(ctx context.Context, branchName, district string) (uint, error) {
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

// ============================================================================
// 3. Officer Queries
// ============================================================================

func (r *Repository) GetAllOfficers(ctx context.Context, search string, branchID uint) ([]Officer, error) {
	officers := make([]Officer, 0)
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
		searchParam := "%" + search + "%"
		args = append(args, searchParam, searchParam, searchParam)
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

func (r *Repository) GetOfficerByID(ctx context.Context, officerID uint) (*Officer, error) {
	var officer Officer
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

func (r *Repository) CreateOfficer(ctx context.Context, req *CreateOfficerRequest) (uint, error) {
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

func (r *Repository) GetOfficerCaseload(ctx context.Context) ([]OfficerCaseload, error) {
	caseloads := make([]OfficerCaseload, 0)
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

// ============================================================================
// 4. Role Queries
// ============================================================================

func (r *Repository) GetAllRoles(ctx context.Context) ([]Role, error) {
	roles := make([]Role, 0)
	query := "SELECT role_id, role_name, description FROM role ORDER BY role_id ASC"
	err := r.db.SelectContext(ctx, &roles, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching roles: %w", err)
	}
	return roles, nil
}
