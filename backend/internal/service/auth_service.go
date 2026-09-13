// ============================================================================
// File: backend/internal/service/auth_service.go
// Purpose: Secure authentication business logic with pure bcrypt verification and rate-limiting.
// ============================================================================

package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	authRepo  *repository.AuthRepository
	jwtSecret string
	throttler *LoginThrottler
}

func NewAuthService(authRepo *repository.AuthRepository, jwtSecret string) *AuthService {
	return &AuthService{
		authRepo:  authRepo,
		jwtSecret: jwtSecret,
		throttler: NewLoginThrottler(5, 15*time.Minute),
	}
}

// Login verifies user credentials purely via bcrypt and issues JWT
func (s *AuthService) Login(ctx context.Context, username, password string) (*models.LoginResponse, error) {
	// 1. Check rate-limiting throttle
	if s.throttler.IsBlocked(username) {
		log.Printf("[SECURITY WARNING] Rate-limit blocked login attempt for username '%s'", username)
		return nil, errors.New("too many failed login attempts. Please wait 15 minutes before retrying")
	}

	// 2. Fetch user by username
	user, err := s.authRepo.GetUserByUsername(ctx, username)
	if err != nil {
		return nil, err
	}
	if user == nil {
		s.throttler.RecordFailure(username)
		log.Printf("[SECURITY EVENT] Failed login attempt: Unknown username '%s'", username)
		return nil, errors.New("invalid username or password")
	}

	// 3. Authenticate purely via bcrypt hash comparison (NO fallback / NO backdoor)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		s.throttler.RecordFailure(username)
		log.Printf("[SECURITY EVENT] Failed login attempt: Incorrect password for user '%s'", username)
		return nil, errors.New("invalid username or password")
	}

	// Reset failure count upon success
	s.throttler.Reset(username)

	// 4. Retrieve complete profile
	profile, err := s.authRepo.GetUserProfile(ctx, user.UserID)
	if err != nil {
		return nil, err
	}
	if profile == nil {
		return nil, errors.New("user profile not found")
	}

	// 5. Generate secure JWT token
	token, err := s.GenerateJWT(profile)
	if err != nil {
		return nil, fmt.Errorf("failed to generate authorization token: %w", err)
	}

	log.Printf("[SECURITY EVENT] User '%s' (User ID: %d, Officer ID: %v) authenticated successfully", profile.Username, profile.UserID, profile.OfficerID)

	return &models.LoginResponse{
		Token: token,
		User:  profile,
	}, nil
}

// GenerateJWT creates a signed HMAC-SHA256 JWT with user claims and 24h expiry
func (s *AuthService) GenerateJWT(profile *models.UserProfile) (string, error) {
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

// GetProfile fetches the authenticated user's full profile
func (s *AuthService) GetProfile(ctx context.Context, userID uint) (*models.UserProfile, error) {
	return s.authRepo.GetUserProfile(ctx, userID)
}

// RegisterUser registers a new user with hashed password and role links
func (s *AuthService) RegisterUser(ctx context.Context, req *models.RegisterUserRequest) (*models.UserProfile, error) {
	existing, err := s.authRepo.GetUserByUsername(ctx, req.Username)
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

	userID, err := s.authRepo.CreateUserWithRoles(ctx, req.Username, string(hashedBytes), req.OfficerID, req.RoleIDs)
	if err != nil {
		return nil, err
	}

	log.Printf("[SECURITY EVENT] New user '%s' (ID: %d) registered with roles %v", req.Username, userID, req.RoleIDs)
	return s.authRepo.GetUserProfile(ctx, userID)
}

// ListRoles returns available system access roles
func (s *AuthService) ListRoles(ctx context.Context) ([]models.Role, error) {
	return s.authRepo.GetAllRoles(ctx)
}
