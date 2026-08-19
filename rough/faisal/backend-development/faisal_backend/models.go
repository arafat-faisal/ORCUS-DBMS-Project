package main

import "time"

// AgencyBranch maps to table `agency_branch`
type AgencyBranch struct {
	BranchID   uint   `db:"branch_id" json:"branch_id"`
	BranchName string `db:"branch_name" json:"branch_name"`
	District   string `db:"district" json:"district"`
}

// Officer maps to table `officer`
type Officer struct {
	OfficerID  uint   `db:"officer_id" json:"officer_id"`
	BadgeNo    string `db:"badge_no" json:"badge_no"`
	FirstName  string `db:"first_name" json:"first_name"`
	LastName   string `db:"last_name" json:"last_name"`
	Rank       string `db:"rank" json:"rank"`
	BranchID   uint   `db:"branch_id" json:"branch_id"`
	BranchName string `db:"branch_name" json:"branch_name,omitempty"`
	District   string `db:"district" json:"district,omitempty"`
}

// User maps to table `user`
type User struct {
	UserID       uint   `db:"user_id" json:"user_id"`
	Username     string `db:"username" json:"username"`
	PasswordHash string `db:"password_hash" json:"-"`
	OfficerID    *uint  `db:"officer_id" json:"officer_id,omitempty"`
}

// Role maps to table `role`
type Role struct {
	RoleID      uint    `db:"role_id" json:"role_id"`
	RoleName    string  `db:"role_name" json:"role_name"`
	Description *string `db:"description" json:"description,omitempty"`
}

// UserProfile represents the full profile returned by /auth/me and /auth/login
type UserProfile struct {
	UserID       uint     `db:"user_id" json:"user_id"`
	Username     string   `db:"username" json:"username"`
	OfficerID    *uint    `db:"officer_id" json:"officer_id,omitempty"`
	OfficerName  *string  `db:"officer_name" json:"officer_name,omitempty"`
	BadgeNo      *string  `db:"badge_no" json:"badge_no,omitempty"`
	Rank         *string  `db:"rank" json:"rank,omitempty"`
	BranchID     *uint    `db:"branch_id" json:"branch_id,omitempty"`
	BranchName   *string  `db:"branch_name" json:"branch_name,omitempty"`
	District     *string  `db:"district" json:"district,omitempty"`
	RolesConcat  string   `db:"roles_concat" json:"-"`
	Roles        []string `json:"roles"`
}

// OfficerCaseload maps to SQL View `v_officer_caseload`
type OfficerCaseload struct {
	OfficerID          uint   `db:"officer_id" json:"officer_id"`
	BadgeNo            string `db:"badge_no" json:"badge_no"`
	OfficerName        string `db:"officer_name" json:"officer_name"`
	Rank               string `db:"rank" json:"rank"`
	BranchName         string `db:"branch_name" json:"branch_name"`
	District           string `db:"district" json:"district"`
	TotalCasesAssigned int    `db:"total_cases_assigned" json:"total_cases_assigned"`
	ActiveCases        int    `db:"active_cases" json:"active_cases"`
	ClosedCases        int    `db:"closed_cases" json:"closed_cases"`
}

// Request & Response DTOs

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  *UserProfile `json:"user"`
}

type RegisterUserRequest struct {
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Password  string `json:"password" binding:"required,min=6"`
	OfficerID *uint  `json:"officer_id"`
	RoleIDs   []uint `json:"role_ids" binding:"required,min=1"`
}

type CreateBranchRequest struct {
	BranchName string `json:"branch_name" binding:"required,max=100"`
	District   string `json:"district" binding:"required,max=100"`
}

type CreateOfficerRequest struct {
	BadgeNo   string `json:"badge_no" binding:"required,max=20"`
	FirstName string `json:"first_name" binding:"required,max=50"`
	LastName  string `json:"last_name" binding:"required,max=50"`
	Rank      string `json:"rank" binding:"required,max=50"`
	BranchID  uint   `json:"branch_id" binding:"required"`
}

type StandardResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Count   *int        `json:"count,omitempty"`
}

type UserClaims struct {
	UserID    uint     `json:"user_id"`
	Username  string   `json:"username"`
	OfficerID *uint    `json:"officer_id,omitempty"`
	Roles     []string `json:"roles"`
}

type TokenPayload struct {
	UserClaims
	ExpiresAt time.Time
}
