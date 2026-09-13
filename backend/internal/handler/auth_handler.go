// ============================================================================
// File: backend/internal/handler/auth_handler.go
// Purpose: HTTP controllers for secure user authentication, cookie management, and logout.
// ============================================================================

package handler

import (
	"fmt"
	"log"
	"net/http"

	"orcus-backend/internal/middleware"
	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService  *service.AuthService
	auditService *service.AuditService
	cookieSecure bool
}

func NewAuthHandler(authService *service.AuthService, auditService *service.AuditService, cookieSecure bool) *AuthHandler {
	return &AuthHandler{
		authService:  authService,
		auditService: auditService,
		cookieSecure: cookieSecure,
	}
}

func toStrPtr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// Login verifies credentials, sets a secure HttpOnly cookie, and returns the profile
func (h *AuthHandler) Login(c *gin.Context) {
	reqID := c.GetString(middleware.ContextRequestID)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success:   false,
			Error:     "Invalid request body. 'username' and 'password' are required.",
			RequestID: reqID,
		})
		return
	}

	res, err := h.authService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		if h.auditService != nil {
			h.auditService.Log(c.Request.Context(), models.AuditLog{
				RequestID:  toStrPtr(reqID),
				EventType:  "AUTH",
				EntityType: toStrPtr("USER"),
				EntityID:   toStrPtr(req.Username),
				Action:     "LOGIN_FAILED",
				Route:      c.Request.URL.Path,
				HTTPMethod: c.Request.Method,
				IPAddress:  toStrPtr(ip),
				UserAgent:  toStrPtr(ua),
				Result:     "FAILED",
			})
		}

		c.JSON(http.StatusUnauthorized, models.StandardResponse{
			Success:   false,
			Error:     err.Error(),
			RequestID: reqID,
		})
		return
	}

	// Set HttpOnly authentication cookie (24 hour duration)
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		middleware.AuthCookieName,
		res.Token,
		86400, // 24 hours
		"/",
		"",
		h.cookieSecure,
		true, // HttpOnly = true (JavaScript cannot read this token)
	)

	if h.auditService != nil {
		uid := res.User.UserID
		h.auditService.Log(c.Request.Context(), models.AuditLog{
			RequestID:  toStrPtr(reqID),
			UserID:     &uid,
			EventType:  "AUTH",
			EntityType: toStrPtr("USER"),
			EntityID:   toStrPtr(res.User.Username),
			Action:     "LOGIN",
			Route:      c.Request.URL.Path,
			HTTPMethod: c.Request.Method,
			IPAddress:  toStrPtr(ip),
			UserAgent:  toStrPtr(ua),
			BranchID:   res.User.BranchID,
			Result:     "SUCCESS",
		})
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success:   true,
		Message:   "Authentication successful",
		RequestID: reqID,
		Data: gin.H{
			"user":  res.User,
			"token": res.Token,
		},
	})
}

// Logout terminates the session by clearing the HttpOnly authentication cookie
func (h *AuthHandler) Logout(c *gin.Context) {
	reqID := c.GetString(middleware.ContextRequestID)
	ip := c.ClientIP()
	ua := c.Request.UserAgent()

	var uid *uint
	if idVal, exists := c.Get(middleware.ContextUserID); exists {
		if idUint, ok := idVal.(uint); ok {
			uid = &idUint
		} else if idInt, ok := idVal.(int); ok {
			u := uint(idInt)
			uid = &u
		}
	}
	var usernameStr *string
	if uVal, exists := c.Get(middleware.ContextUsername); exists {
		if uStr, ok := uVal.(string); ok {
			usernameStr = &uStr
			log.Printf("[SECURITY EVENT] User '%s' logged out.", uStr)
		}
	}

	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		middleware.AuthCookieName,
		"",
		-1, // MaxAge = -1 immediately expires the cookie
		"/",
		"",
		h.cookieSecure,
		true,
	)

	if h.auditService != nil {
		h.auditService.Log(c.Request.Context(), models.AuditLog{
			RequestID:  toStrPtr(reqID),
			UserID:     uid,
			EventType:  "AUTH",
			EntityType: toStrPtr("USER"),
			EntityID:   usernameStr,
			Action:     "LOGOUT",
			Route:      c.Request.URL.Path,
			HTTPMethod: c.Request.Method,
			IPAddress:  toStrPtr(ip),
			UserAgent:  toStrPtr(ua),
			Result:     "SUCCESS",
		})
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success:   true,
		Message:   "Session terminated successfully",
		RequestID: reqID,
	})
}

// GetMe retrieves the authenticated user's profile
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get(middleware.ContextUserID)
	if !exists {
		c.JSON(http.StatusUnauthorized, models.StandardResponse{
			Success: false,
			Error:   "User authentication context missing",
		})
		return
	}

	profile, err := h.authService.GetProfile(c.Request.Context(), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if profile == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "User profile not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    profile,
	})
}

// RegisterUser creates a new user account with hashed password
func (h *AuthHandler) RegisterUser(c *gin.Context) {
	var req models.RegisterUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	profile, err := h.authService.RegisterUser(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "User registered successfully",
		Data:    profile,
	})
}

// ListRoles returns available system access roles
func (h *AuthHandler) ListRoles(c *gin.Context) {
	roles, err := h.authService.ListRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    roles,
	})
}

// CreateRole adds a new system access role
func (h *AuthHandler) CreateRole(c *gin.Context) {
	var req models.CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	role, err := h.authService.CreateRole(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Role created successfully",
		Data:    role,
	})
}

// ListUsers lists all registered system users
func (h *AuthHandler) ListUsers(c *gin.Context) {
	users, err := h.authService.ListAllUsers(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(users)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    users,
	})
}

// UpdateUserStatus activates or suspends a user
func (h *AuthHandler) UpdateUserStatus(c *gin.Context) {
	userIDStr := c.Param("id")
	var userID uint
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid user ID",
		})
		return
	}

	var req models.UpdateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := h.authService.UpdateUserStatus(c.Request.Context(), userID, req.IsActive); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	statusMsg := "User activated successfully"
	if !req.IsActive {
		statusMsg = "User account suspended"
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: statusMsg,
	})
}

// ResetPassword resets a user's password directly from admin
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	userIDStr := c.Param("id")
	var userID uint
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid user ID",
		})
		return
	}

	var req models.ResetUserPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := h.authService.ResetUserPassword(c.Request.Context(), userID, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "User password reset successfully",
	})
}

// UpdateUser handles updating a user's officer link, roles, and branch assignments
func (h *AuthHandler) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	var userID uint
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid user ID",
		})
		return
	}

	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := h.authService.UpdateUser(c.Request.Context(), userID, &req); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "User and branch assignments updated successfully",
	})
}

// DeleteUser completely removes a user account (Admin only)
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	var userID uint
	if _, err := fmt.Sscanf(userIDStr, "%d", &userID); err != nil || userID == 0 {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid user ID",
		})
		return
	}

	if userID == 1 {
		c.JSON(http.StatusForbidden, models.StandardResponse{
			Success: false,
			Error:   "Root administrator account cannot be deleted",
		})
		return
	}

	if err := h.authService.DeleteUser(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "User account deleted successfully",
	})
}



