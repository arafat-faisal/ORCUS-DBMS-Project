// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Evidence & Chain of Custody]
// File: backend/internal/handler/evidence_handler.go
// Purpose: HTTP controllers for weak entity evidence items and chain of custody tracking.
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

type EvidenceHandler struct {
	evidenceService *service.EvidenceService
}

func NewEvidenceHandler(evidenceService *service.EvidenceService) *EvidenceHandler {
	return &EvidenceHandler{evidenceService: evidenceService}
}

func (h *EvidenceHandler) CreateEvidence(c *gin.Context) {
	var req models.CreateEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	userIDVal, _ := c.Get(middleware.ContextUserID)
	userID := userIDVal.(uint)

	evidence, err := h.evidenceService.CreateEvidence(c.Request.Context(), &req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Evidence item registered and chain of custody initiated",
		Data:    evidence,
	})
}

func (h *EvidenceHandler) ListEvidence(c *gin.Context) {
	var caseID uint
	if caseIDStr := c.Query("case_id"); caseIDStr != "" {
		if id, err := strconv.ParseUint(caseIDStr, 10, 32); err == nil {
			caseID = uint(id)
		}
	}

	evidenceType := c.Query("evidence_type")
	status := c.Query("status")

	items, err := h.evidenceService.ListEvidence(c.Request.Context(), caseID, evidenceType, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(items)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    items,
	})
}

func (h *EvidenceHandler) GetEvidence(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid evidence ID",
		})
		return
	}

	evidence, err := h.evidenceService.GetEvidence(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if evidence == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Evidence item not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    evidence,
	})
}

func (h *EvidenceHandler) UpdateEvidenceStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid evidence ID",
		})
		return
	}

	var req models.UpdateEvidenceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	userIDVal, _ := c.Get(middleware.ContextUserID)
	userID := userIDVal.(uint)

	updated, err := h.evidenceService.UpdateEvidenceStatus(c.Request.Context(), uint(id), &req, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Evidence status updated and chain of custody transition logged",
		Data:    updated,
	})
}

func (h *EvidenceHandler) GetEvidenceChainOfCustody(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid evidence ID",
		})
		return
	}

	logs, err := h.evidenceService.GetEvidenceChainOfCustody(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(logs)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    logs,
	})
}
