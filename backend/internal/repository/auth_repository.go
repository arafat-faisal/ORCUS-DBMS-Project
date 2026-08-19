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
