// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Cases]
// File: backend/internal/handler/case_handler.go
// Purpose: HTTP controllers for case search, dossier retrieval, and status transitions.
// ============================================================================

package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/middleware"
	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type CaseHandler struct {
	caseService *service.CaseService
}

func NewCaseHandler(caseService *service.CaseService) *CaseHandler {
	return &CaseHandler{caseService: caseService}
}

func (h *CaseHandler) OpenCase(c *gin.Context) {
	var req models.CreateCaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	userIDVal, _ := c.Get(middleware.ContextUserID)
	userID := userIDVal.(uint)

	caseOverview, err := h.caseService.OpenCase(c.Request.Context(), &req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Case opened successfully",
		Data:    caseOverview,
	})
}

func (h *CaseHandler) SearchCases(c *gin.Context) {
	var leadOfficerID uint
	if idStr := c.Query("lead_officer_id"); idStr != "" {
		if id, err := strconv.ParseUint(idStr, 10, 32); err == nil {
			leadOfficerID = uint(id)
		}
	}

	filter := &models.CaseSearchFilter{
		Search:        c.Query("search"),
		Status:        c.Query("status"),
		CrimeCategory: c.Query("crime_category"),
		LeadOfficerID: leadOfficerID,
		District:      c.Query("district"),
		DateFrom:      c.Query("date_from"),
		DateTo:        c.Query("date_to"),
	}

	cases, err := h.caseService.SearchCases(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(cases)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    cases,
	})
}

func (h *CaseHandler) GetCaseDossier(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid case ID",
		})
		return
	}

	dossier, err := h.caseService.GetCaseDossier(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    dossier,
	})
}

func (h *CaseHandler) UpdateCaseStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid case ID",
		})
		return
	}

	var req models.UpdateCaseStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	userIDVal, _ := c.Get(middleware.ContextUserID)
	userID := userIDVal.(uint)

	updatedCase, err := h.caseService.UpdateCaseStatus(c.Request.Context(), uint(id), &req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Case status updated and logged successfully",
		Data:    updatedCase,
	})
}

func (h *CaseHandler) GetCaseHistory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid case ID",
		})
		return
	}

	history, err := h.caseService.GetCaseStatusHistory(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(history)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    history,
	})
}
