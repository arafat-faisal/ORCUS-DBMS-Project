// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/handler/auth_handler.go
// Purpose: HTTP controllers for user login, current user profile (/auth/me), and user registration.
// ============================================================================

package handler

import (
	"net/http"

	"orcus-backend/internal/middleware"
	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid request body. 'username' and 'password' are required.",
		})
		return
	}

	res, err := h.authService.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Authentication successful",
		Data:    res,
	})
}

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
