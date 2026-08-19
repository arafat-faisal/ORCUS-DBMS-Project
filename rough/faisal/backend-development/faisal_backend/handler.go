package main

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// SetupRouter registers all Organization & Access Control routes
func (h *Handler) SetupRouter(jwtSecret string) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery(), LoggerMiddleware(), CORSMiddleware())

	api := r.Group("/api/v1")
	{
		// Public Auth
		auth := api.Group("/auth")
		{
			auth.POST("/login", h.Login)
		}

		// Authenticated Routes
		protected := api.Group("")
		protected.Use(JWTAuthMiddleware(jwtSecret))
		{
			// Auth Profile & Registration
			protected.GET("/auth/me", h.GetMe)
			protected.POST("/auth/register", RequireRoles("Administrator"), h.RegisterUser)

			// Branches
			protected.GET("/branches", h.ListBranches)
			protected.GET("/branches/:id", h.GetBranch)
			protected.POST("/branches", RequireRoles("Administrator"), h.CreateBranch)

			// Officers
			protected.GET("/officers", h.ListOfficers)
			protected.GET("/officers/caseload", h.GetOfficerCaseload)
			protected.GET("/officers/:id", h.GetOfficer)
			protected.POST("/officers", RequireRoles("Administrator"), h.CreateOfficer)

			// Roles
			protected.GET("/roles", h.ListRoles)
		}
	}

	return r
}

// ----------------------------------------------------------------------------
// Auth Handlers
// ----------------------------------------------------------------------------

func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   "Invalid request body. 'username' and 'password' are required.",
		})
		return
	}

	res, err := h.service.Login(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Message: "Login successful",
		Data:    res,
	})
}

func (h *Handler) GetMe(c *gin.Context) {
	userID, exists := c.Get(ContextUserID)
	if !exists {
		c.JSON(http.StatusUnauthorized, StandardResponse{
			Success: false,
			Error:   "User context missing",
		})
		return
	}

	profile, err := h.service.GetProfile(c.Request.Context(), userID.(uint))
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if profile == nil {
		c.JSON(http.StatusNotFound, StandardResponse{
			Success: false,
			Error:   "User profile not found",
		})
		return
	}

	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Data:    profile,
	})
}

func (h *Handler) RegisterUser(c *gin.Context) {
	var req RegisterUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	profile, err := h.service.RegisterUser(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, StandardResponse{
		Success: true,
		Message: "User account created successfully",
		Data:    profile,
	})
}

// ----------------------------------------------------------------------------
// Branch Handlers
// ----------------------------------------------------------------------------

func (h *Handler) ListBranches(c *gin.Context) {
	district := c.Query("district")
	branches, err := h.service.ListBranches(c.Request.Context(), district)
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(branches)
	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Count:   &count,
		Data:    branches,
	})
}

func (h *Handler) GetBranch(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   "Invalid branch ID",
		})
		return
	}

	branch, err := h.service.GetBranch(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if branch == nil {
		c.JSON(http.StatusNotFound, StandardResponse{
			Success: false,
			Error:   "Branch not found",
		})
		return
	}

	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Data:    branch,
	})
}

func (h *Handler) CreateBranch(c *gin.Context) {
	var req CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	branch, err := h.service.CreateBranch(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, StandardResponse{
		Success: true,
		Message: "Branch created successfully",
		Data:    branch,
	})
}

// ----------------------------------------------------------------------------
// Officer Handlers
// ----------------------------------------------------------------------------

func (h *Handler) ListOfficers(c *gin.Context) {
	search := c.Query("search")
	branchIDStr := c.Query("branch_id")
	var branchID uint
	if branchIDStr != "" {
		if id, err := strconv.ParseUint(branchIDStr, 10, 32); err == nil {
			branchID = uint(id)
		}
	}

	officers, err := h.service.ListOfficers(c.Request.Context(), search, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(officers)
	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Count:   &count,
		Data:    officers,
	})
}

func (h *Handler) GetOfficer(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   "Invalid officer ID",
		})
		return
	}

	officer, err := h.service.GetOfficer(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if officer == nil {
		c.JSON(http.StatusNotFound, StandardResponse{
			Success: false,
			Error:   "Officer not found",
		})
		return
	}

	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Data:    officer,
	})
}

func (h *Handler) CreateOfficer(c *gin.Context) {
	var req CreateOfficerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	officer, err := h.service.CreateOfficer(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, StandardResponse{
		Success: true,
		Message: "Officer registered successfully",
		Data:    officer,
	})
}

func (h *Handler) GetOfficerCaseload(c *gin.Context) {
	caseload, err := h.service.GetOfficerCaseload(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(caseload)
	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Count:   &count,
		Data:    caseload,
	})
}

// ----------------------------------------------------------------------------
// Role Handlers
// ----------------------------------------------------------------------------

func (h *Handler) ListRoles(c *gin.Context) {
	roles, err := h.service.ListRoles(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, StandardResponse{
		Success: true,
		Data:    roles,
	})
}
