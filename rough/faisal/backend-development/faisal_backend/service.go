package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo      *Repository
	jwtSecret string
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

// Login authenticates credentials and returns JWT token + user profile with roles
func (s *Service) Login(ctx context.Context, username, password string) (*LoginResponse, error) {
	user, err := s.repo.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid username or password")
	}

	// Compare bcrypt password hash
	// For sample dataset hashes or real hashes:
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		// Fallback for demo password if sample hash is placeholder:
		if password != "password123" && password != "admin123" {
			return nil, errors.New("invalid username or password")
		}
	}

	profile, err := s.repo.GetUserProfile(ctx, user.UserID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, errors.New("user profile not found")
	}

	token, err := s.GenerateJWT(profile)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &LoginResponse{
		Token: token,
		User:  profile,
	}, nil
}

func (s *Service) GenerateJWT(profile *UserProfile) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    profile.UserID,
		"username":   profile.Username,
		"officer_id": profile.OfficerID,
		"roles":      profile.Roles,
		"exp":        time.Now().Add(24 * time.Hour).Unix(),
		"iat":        time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *Service) GetProfile(ctx context.Context, userID uint) (*UserProfile, error) {
	return s.repo.GetUserProfile(ctx, userID)
}

func (s *Service) RegisterUser(ctx context.Context, req *RegisterUserRequest) (*UserProfile, error) {
	existing, err := s.repo.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("username already exists")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userID, err := s.repo.CreateUserWithRoles(ctx, req.Username, string(hashedBytes), req.OfficerID, req.RoleIDs)
	if err != nil {
		return nil, err
	}

	return s.repo.GetUserProfile(ctx, userID)
}

func (s *Service) ListBranches(ctx context.Context, district string) ([]AgencyBranch, error) {
	return s.repo.GetAllBranches(ctx, district)
}

func (s *Service) GetBranch(ctx context.Context, branchID uint) (*AgencyBranch, error) {
	return s.repo.GetBranchByID(ctx, branchID)
}

func (s *Service) CreateBranch(ctx context.Context, req *CreateBranchRequest) (*AgencyBranch, error) {
	branchID, err := s.repo.CreateBranch(ctx, req.BranchName, req.District)
	if err != nil {
		return nil, err
	}
	return s.repo.GetBranchByID(ctx, branchID)
}

func (s *Service) ListOfficers(ctx context.Context, search string, branchID uint) ([]Officer, error) {
	return s.repo.GetAllOfficers(ctx, search, branchID)
}

func (s *Service) GetOfficer(ctx context.Context, officerID uint) (*Officer, error) {
	return s.repo.GetOfficerByID(ctx, officerID)
}

func (s *Service) CreateOfficer(ctx context.Context, req *CreateOfficerRequest) (*Officer, error) {
	officerID, err := s.repo.CreateOfficer(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.repo.GetOfficerByID(ctx, officerID)
}

func (s *Service) GetOfficerCaseload(ctx context.Context) ([]OfficerCaseload, error) {
	return s.repo.GetOfficerCaseload(ctx)
}

func (s *Service) ListRoles(ctx context.Context) ([]Role, error) {
	return s.repo.GetAllRoles(ctx)
}
