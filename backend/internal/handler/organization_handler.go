// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/handler/organization_handler.go
// Purpose: HTTP controllers for agency_branch and officer endpoints.
// ============================================================================

package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type OrganizationHandler struct {
	orgService *service.OrganizationService
}

func NewOrganizationHandler(orgService *service.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{orgService: orgService}
}

// ----------------------------------------------------------------------------
// Branch Handlers
// ----------------------------------------------------------------------------

func (h *OrganizationHandler) ListBranches(c *gin.Context) {
	district := c.Query("district")
	branches, err := h.orgService.ListBranches(c.Request.Context(), district)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(branches)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    branches,
	})
}

func (h *OrganizationHandler) GetBranch(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid branch ID",
		})
		return
	}

	branch, err := h.orgService.GetBranch(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if branch == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Branch not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    branch,
	})
}

func (h *OrganizationHandler) CreateBranch(c *gin.Context) {
	var req models.CreateBranchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	branch, err := h.orgService.CreateBranch(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Branch created successfully",
		Data:    branch,
	})
}

// ----------------------------------------------------------------------------
// Officer Handlers
// ----------------------------------------------------------------------------

func (h *OrganizationHandler) ListOfficers(c *gin.Context) {
	search := c.Query("search")
	branchIDStr := c.Query("branch_id")
	var branchID uint
	if branchIDStr != "" {
		if id, err := strconv.ParseUint(branchIDStr, 10, 32); err == nil {
			branchID = uint(id)
		}
	}

	officers, err := h.orgService.ListOfficers(c.Request.Context(), search, branchID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(officers)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    officers,
	})
}

func (h *OrganizationHandler) GetOfficer(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid officer ID",
		})
		return
	}

	officer, err := h.orgService.GetOfficer(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if officer == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Officer not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    officer,
	})
}

func (h *OrganizationHandler) CreateOfficer(c *gin.Context) {
	var req models.CreateOfficerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	officer, err := h.orgService.CreateOfficer(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Officer registered successfully",
		Data:    officer,
	})
}

func (h *OrganizationHandler) GetOfficerCaseload(c *gin.Context) {
	caseload, err := h.orgService.GetOfficerCaseload(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(caseload)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    caseload,
	})
}
