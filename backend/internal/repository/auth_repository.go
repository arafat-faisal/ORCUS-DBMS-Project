// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/repository/auth_repository.go
// Purpose: Repository for user lookup, profile retrieval, and user account creation with roles.
//
// [INTEGRATION NOTE]: Parameterized raw SQL queries using sqlx for transparency and security.
// ============================================================================

package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type AuthRepository struct {
	db *sqlx.DB
}

func NewAuthRepository(db *sqlx.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

// GetUserByUsername fetches user record for credential verification
func (r *AuthRepository) GetUserByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	query := "SELECT user_id, username, password_hash, officer_id FROM `user` WHERE username = ? LIMIT 1"
	err := r.db.GetContext(ctx, &user, query, username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("error fetching user by username: %w", err)
	}
	return &user, nil
}

// GetUserProfile hydrates user, officer details, branch, and aggregated roles
func (r *AuthRepository) GetUserProfile(ctx context.Context, userID uint) (*models.UserProfile, error) {
	var profile models.UserProfile
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

// CreateUserWithRoles executes an atomic transaction creating user and user_role mappings
func (r *AuthRepository) CreateUserWithRoles(ctx context.Context, username, passwordHash string, officerID *uint, roleIDs []uint) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to start user creation transaction: %w", err)
	}
	defer tx.Rollback()

	insertUserQuery := "INSERT INTO `user` (username, password_hash, officer_id) VALUES (?, ?, ?)"
	res, err := tx.ExecContext(ctx, insertUserQuery, username, passwordHash, officerID)
	if err != nil {
		return 0, fmt.Errorf("failed to insert user record: %w", err)
	}

	userID, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert user_id: %w", err)
	}

	insertRoleQuery := "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)"
	for _, roleID := range roleIDs {
		if _, err := tx.ExecContext(ctx, insertRoleQuery, userID, roleID); err != nil {
			return 0, fmt.Errorf("failed to insert user_role link (role_id=%d): %w", roleID, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit user creation transaction: %w", err)
	}

	return uint(userID), nil
}

// GetAllRoles lists available access roles
func (r *AuthRepository) GetAllRoles(ctx context.Context) ([]models.Role, error) {
	roles := make([]models.Role, 0)
	query := "SELECT role_id, role_name, description FROM role ORDER BY role_id ASC"
	err := r.db.SelectContext(ctx, &roles, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching roles: %w", err)
	}
	return roles, nil
}

// CreateRole adds a new RBAC security role
func (r *AuthRepository) CreateRole(ctx context.Context, roleName, description string) (*models.Role, error) {
	query := "INSERT INTO role (role_name, description) VALUES (?, ?)"
	res, err := r.db.ExecContext(ctx, query, roleName, description)
	if err != nil {
		return nil, fmt.Errorf("failed to create role: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return nil, err
	}
	var role models.Role
	err = r.db.GetContext(ctx, &role, "SELECT role_id, role_name, description FROM role WHERE role_id = ?", id)
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// GetAllUsers lists all system users with linked officer details, branches, and roles
// GetAllUsers lists all system users with linked officer details, branches, and roles
func (r *AuthRepository) GetAllUsers(ctx context.Context) ([]models.AdminUserListItem, error) {
	query := `
		SELECT 
			u.user_id,
			u.username,
			u.officer_id,
			CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
			o.badge_no,
			o.rank,
			o.branch_id,
			b.branch_name,
			b.district,
			u.is_active,
			u.last_login_at,
			u.failed_login_attempts,
			COALESCE(GROUP_CONCAT(DISTINCT ob_b.branch_name ORDER BY ob_b.branch_name SEPARATOR ', '), b.branch_name, '') AS branches_concat,
			COALESCE(GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ', '), '') AS roles_concat
		FROM ` + "`user`" + ` u
		LEFT JOIN officer o ON u.officer_id = o.officer_id
		LEFT JOIN agency_branch b ON o.branch_id = b.branch_id
		LEFT JOIN officer_branch ob ON o.officer_id = ob.officer_id
		LEFT JOIN agency_branch ob_b ON ob.branch_id = ob_b.branch_id
		LEFT JOIN user_role ur ON u.user_id = ur.user_id
		LEFT JOIN role r ON ur.role_id = r.role_id
		GROUP BY u.user_id, u.username, u.officer_id, o.first_name, o.last_name, o.badge_no, o.rank, o.branch_id, b.branch_name, b.district, u.is_active, u.last_login_at, u.failed_login_attempts
		ORDER BY u.user_id ASC
	`
	rows := make([]models.AdminUserListItem, 0)
	err := r.db.SelectContext(ctx, &rows, query)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users list: %w", err)
	}

	for i := range rows {
		if rows[i].RolesConcat != "" {
			rows[i].Roles = strings.Split(rows[i].RolesConcat, ", ")
		} else {
			rows[i].Roles = []string{}
		}

		if rows[i].BranchesConcat != "" {
			rows[i].Branches = strings.Split(rows[i].BranchesConcat, ", ")
		} else {
			rows[i].Branches = []string{}
		}

		// Hydrate RoleIDs
		var roleIDs []uint
		_ = r.db.SelectContext(ctx, &roleIDs, "SELECT role_id FROM user_role WHERE user_id = ?", rows[i].UserID)
		rows[i].RoleIDs = roleIDs

		// Hydrate BranchIDs if linked to officer
		if rows[i].OfficerID != nil {
			var branchIDs []uint
			_ = r.db.SelectContext(ctx, &branchIDs, "SELECT branch_id FROM officer_branch WHERE officer_id = ?", *rows[i].OfficerID)
			if len(branchIDs) == 0 && rows[i].BranchID != nil {
				branchIDs = []uint{*rows[i].BranchID}
			}
			rows[i].BranchIDs = branchIDs
		} else {
			rows[i].BranchIDs = []uint{}
		}
	}
	return rows, nil
}

// UpdateUserFull atomically updates a user's linked officer, roles, and branch assignments
func (r *AuthRepository) UpdateUserFull(ctx context.Context, userID uint, req *models.UpdateUserRequest) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start user update transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Update user.officer_id
	if req.OfficerID != nil && *req.OfficerID > 0 {
		_, err = tx.ExecContext(ctx, "UPDATE `user` SET officer_id = ? WHERE user_id = ?", *req.OfficerID, userID)
	} else {
		_, err = tx.ExecContext(ctx, "UPDATE `user` SET officer_id = NULL WHERE user_id = ?", userID)
	}
	if err != nil {
		return fmt.Errorf("failed to update user officer reference: %w", err)
	}

	// 2. Update user_role mappings
	if len(req.RoleIDs) > 0 {
		if _, err := tx.ExecContext(ctx, "DELETE FROM user_role WHERE user_id = ?", userID); err != nil {
			return fmt.Errorf("failed to clear existing user roles: %w", err)
		}
		for _, rid := range req.RoleIDs {
			if _, err := tx.ExecContext(ctx, "INSERT INTO user_role (user_id, role_id) VALUES (?, ?)", userID, rid); err != nil {
				return fmt.Errorf("failed to insert user role %d: %w", rid, err)
			}
		}
	}

	// 3. Update officer branches if an officer is linked and branches provided
	var effectiveOfficerID *uint = req.OfficerID
	if effectiveOfficerID == nil {
		var currentOffID sql.NullInt64
		_ = tx.GetContext(ctx, &currentOffID, "SELECT officer_id FROM `user` WHERE user_id = ?", userID)
		if currentOffID.Valid {
			u := uint(currentOffID.Int64)
			effectiveOfficerID = &u
		}
	}

	if effectiveOfficerID != nil && *effectiveOfficerID > 0 && len(req.BranchIDs) > 0 {
		// Update primary officer.branch_id
		primaryBranch := req.BranchIDs[0]
		_, err = tx.ExecContext(ctx, "UPDATE officer SET branch_id = ? WHERE officer_id = ?", primaryBranch, *effectiveOfficerID)
		if err != nil {
			return fmt.Errorf("failed to update officer primary branch: %w", err)
		}

		// Update officer_branch junction
		_, _ = tx.ExecContext(ctx, "DELETE FROM officer_branch WHERE officer_id = ?", *effectiveOfficerID)
		for idx, bid := range req.BranchIDs {
			isPrimary := 0
			if idx == 0 {
				isPrimary = 1
			}
			_, err := tx.ExecContext(ctx, "INSERT INTO officer_branch (officer_id, branch_id, is_primary) VALUES (?, ?, ?)", *effectiveOfficerID, bid, isPrimary)
			if err != nil {
				return fmt.Errorf("failed to assign branch %d: %w", bid, err)
			}
		}
	}

	return tx.Commit()
}

// UpdateUserStatus updates is_active flag
func (r *AuthRepository) UpdateUserStatus(ctx context.Context, userID uint, isActive bool) error {
	query := "UPDATE `user` SET is_active = ? WHERE user_id = ?"
	_, err := r.db.ExecContext(ctx, query, isActive, userID)
	return err
}

// ResetUserPassword resets user password hash and clears lock
func (r *AuthRepository) ResetUserPassword(ctx context.Context, userID uint, passwordHash string) error {
	query := "UPDATE `user` SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE user_id = ?"
	_, err := r.db.ExecContext(ctx, query, passwordHash, userID)
	return err
}

// DeleteUser completely removes a user and their role mappings
func (r *AuthRepository) DeleteUser(ctx context.Context, userID uint) error {
	if userID == 1 {
		return errors.New("cannot delete root administrator account")
	}
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete user role mappings
	if _, err := tx.ExecContext(ctx, "DELETE FROM user_role WHERE user_id = ?", userID); err != nil {
		return fmt.Errorf("failed to delete user roles: %w", err)
	}

	// 2. Nullify references in related tables to avoid foreign key violations
	tx.ExecContext(ctx, "UPDATE audit_log SET user_id = NULL WHERE user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE case_assignment_history SET assigned_by_user_id = NULL WHERE assigned_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE case_status_history SET changed_by_user_id = NULL WHERE changed_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE complaint SET created_by_user_id = NULL WHERE created_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE complaint_status_history SET acting_user_id = NULL WHERE acting_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE complaint_transfer_history SET transferred_by_user_id = NULL WHERE transferred_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE evidence_status_history SET changed_by_user_id = NULL WHERE changed_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE fir SET approved_by_user_id = NULL WHERE approved_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE fir SET created_by_user_id = NULL WHERE created_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE fir_status_history SET acting_user_id = NULL WHERE acting_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE gd SET approved_by_user_id = NULL WHERE approved_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE gd SET created_by_user_id = NULL WHERE created_by_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE gd_status_history SET acting_user_id = NULL WHERE acting_user_id = ?", userID)
	tx.ExecContext(ctx, "UPDATE investigation_activity SET recorded_by_user_id = NULL WHERE recorded_by_user_id = ?", userID)

	// 3. Delete user row
	res, err := tx.ExecContext(ctx, "DELETE FROM `user` WHERE user_id = ?", userID)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return errors.New("user not found")
	}

	return tx.Commit()
}



