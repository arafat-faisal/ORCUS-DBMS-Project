// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Cases]
// File: backend/internal/handler/intake_handler.go
// Purpose: HTTP controllers for complainants, contacts, General Diary (GD), FIR, and legal sections.
// ============================================================================

package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type IntakeHandler struct {
	intakeService *service.IntakeService
}

func NewIntakeHandler(intakeService *service.IntakeService) *IntakeHandler {
	return &IntakeHandler{intakeService: intakeService}
}

// ----------------------------------------------------------------------------
// Complainants
// ----------------------------------------------------------------------------

func (h *IntakeHandler) CreateComplainant(c *gin.Context) {
	var req models.CreateComplainantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	complainant, err := h.intakeService.CreateComplainant(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Complainant registered successfully",
		Data:    complainant,
	})
}

func (h *IntakeHandler) ListComplainants(c *gin.Context) {
	complainants, err := h.intakeService.ListComplainants(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(complainants)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    complainants,
	})
}

func (h *IntakeHandler) GetComplainant(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complainant ID",
		})
		return
	}

	complainant, err := h.intakeService.GetComplainant(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if complainant == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Complainant not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    complainant,
	})
}

// ----------------------------------------------------------------------------
// General Diary (GD)
// ----------------------------------------------------------------------------

func (h *IntakeHandler) CreateGD(c *gin.Context) {
	var req models.CreateGDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	gd, err := h.intakeService.CreateGD(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "General Diary entry recorded successfully",
		Data:    gd,
	})
}

func (h *IntakeHandler) ListGDs(c *gin.Context) {
	complainantIDStr := c.Query("complainant_id")
	var complainantID uint
	if complainantIDStr != "" {
		if id, err := strconv.ParseUint(complainantIDStr, 10, 32); err == nil {
			complainantID = uint(id)
		}
	}

	gds, err := h.intakeService.ListGDs(c.Request.Context(), complainantID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(gds)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    gds,
	})
}

func (h *IntakeHandler) GetGD(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid GD ID",
		})
		return
	}

	gd, err := h.intakeService.GetGD(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if gd == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "GD entry not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    gd,
	})
}

// ----------------------------------------------------------------------------
// FIR & Legal Sections
// ----------------------------------------------------------------------------

func (h *IntakeHandler) CreateFIR(c *gin.Context) {
	var req models.CreateFIRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	fir, err := h.intakeService.CreateFIR(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "First Information Report (FIR) filed successfully",
		Data:    fir,
	})
}

func (h *IntakeHandler) ListFIRs(c *gin.Context) {
	category := c.Query("crime_category")
	firs, err := h.intakeService.ListFIRs(c.Request.Context(), category)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(firs)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    firs,
	})
}

func (h *IntakeHandler) GetFIR(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid FIR ID",
		})
		return
	}

	fir, err := h.intakeService.GetFIR(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if fir == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "FIR not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    fir,
	})
}

func (h *IntakeHandler) ListLegalSections(c *gin.Context) {
	sections, err := h.intakeService.ListLegalSections(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(sections)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    sections,
	})
}
