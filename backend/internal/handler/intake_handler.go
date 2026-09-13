// ============================================================================
// File: backend/internal/handler/intake_handler.go
// Purpose: HTTP controllers for complainants, General Diary (GD), FIR, and legal sections.
// ============================================================================

package handler

import (
	"errors"
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type IntakeHandler struct {
	intakeService    *service.IntakeService
	complaintService service.ComplaintService
}

func NewIntakeHandler(intakeService *service.IntakeService, complaintService service.ComplaintService) *IntakeHandler {
	return &IntakeHandler{
		intakeService:    intakeService,
		complaintService: complaintService,
	}
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

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	gd, err := h.intakeService.CreateGD(c.Request.Context(), &req, actingUserID)
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
	var complainantID uint
	if cid := c.Query("complainant_id"); cid != "" {
		if id, err := strconv.ParseUint(cid, 10, 32); err == nil {
			complainantID = uint(id)
		}
	}

	var branchID uint
	if bid := c.Query("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			branchID = uint(id)
		}
	}

	status := c.Query("status")
	search := c.Query("search")

	gds, err := h.intakeService.FilterGDs(c.Request.Context(), complainantID, branchID, status, search)
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
			Error:   "General Diary entry not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    gd,
	})
}

func (h *IntakeHandler) GetGDHistory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid GD ID",
		})
		return
	}

	history, err := h.intakeService.GetGDHistory(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    history,
	})
}

func (h *IntakeHandler) UpdateGDStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid GD ID",
		})
		return
	}

	var req models.UpdateGDStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	err = h.intakeService.UpdateGDStatus(c.Request.Context(), uint(id), &req, actingUserID)
	if err != nil {
		if errors.Is(err, service.ErrInvalidGDTransition) {
			c.JSON(http.StatusConflict, models.StandardResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	gd, _ := h.intakeService.GetGD(c.Request.Context(), uint(id))
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "General Diary status updated successfully",
		Data:    gd,
	})
}

func (h *IntakeHandler) ConvertComplaintToGD(c *gin.Context) {
	idParam := c.Param("id")
	complaintID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	var req models.ConvertComplaintToGDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// Verify complaint exists
	complaint, err := h.complaintService.GetComplaint(uint(complaintID))
	if err != nil || complaint == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Complaint not found",
		})
		return
	}

	if complaint.CurrentStatus == "Converted to GD" || complaint.CurrentStatus == "Converted to FIR" {
		c.JSON(http.StatusConflict, models.StandardResponse{
			Success: false,
			Error:   "Complaint has already been converted and cannot be converted again",
		})
		return
	}

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	if req.Subject == "" {
		req.Subject = complaint.Title
	}

	gd, err := h.intakeService.ConvertComplaintToGD(
		c.Request.Context(),
		uint(complaintID),
		&req,
		complaint.ComplainantID,
		complaint.ReceivingBranchID,
		actingUserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Complaint converted to General Diary successfully",
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

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	fir, err := h.intakeService.CreateFIR(c.Request.Context(), &req, actingUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "FIR registered successfully",
		Data:    fir,
	})
}

func (h *IntakeHandler) ListFIRs(c *gin.Context) {
	category := c.Query("category")
	status := c.Query("status")
	search := c.Query("search")
	var branchID uint
	if bid := c.Query("branch_id"); bid != "" {
		if id, err := strconv.ParseUint(bid, 10, 32); err == nil {
			branchID = uint(id)
		}
	}

	firs, err := h.intakeService.FilterFIRs(c.Request.Context(), category, branchID, status, search)
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

func (h *IntakeHandler) GetFIRHistory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid FIR ID",
		})
		return
	}

	history, err := h.intakeService.GetFIRHistory(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    history,
	})
}

func (h *IntakeHandler) UpdateFIRStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid FIR ID",
		})
		return
	}

	var req models.UpdateFIRStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	err = h.intakeService.UpdateFIRStatus(c.Request.Context(), uint(id), &req, actingUserID)
	if err != nil {
		if errors.Is(err, service.ErrInvalidFIRTransition) {
			c.JSON(http.StatusConflict, models.StandardResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	fir, _ := h.intakeService.GetFIR(c.Request.Context(), uint(id))
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "FIR status updated successfully",
		Data:    fir,
	})
}

func (h *IntakeHandler) ConvertComplaintToFIR(c *gin.Context) {
	idParam := c.Param("id")
	complaintID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	var req models.ConvertComplaintToFIRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	complaint, err := h.complaintService.GetComplaint(uint(complaintID))
	if err != nil || complaint == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Complaint not found",
		})
		return
	}

	if complaint.CurrentStatus == "Converted to FIR" || complaint.CurrentStatus == "Converted to GD" {
		c.JSON(http.StatusConflict, models.StandardResponse{
			Success: false,
			Error:   "Complaint has already been converted and cannot be converted again",
		})
		return
	}

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	fir, err := h.intakeService.ConvertComplaintToFIR(
		c.Request.Context(),
		uint(complaintID),
		&req,
		complaint.ComplainantID,
		complaint.ReceivingBranchID,
		actingUserID,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Complaint converted to FIR successfully",
		Data:    fir,
	})
}

func (h *IntakeHandler) LinkGDToFIR(c *gin.Context) {
	idParam := c.Param("id")
	gdID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid GD ID",
		})
		return
	}

	var req models.LinkGDToFIRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	var actingUserID *uint
	if val, ok := c.Get("user_id"); ok {
		if uid, valid := val.(uint); valid {
			actingUserID = &uid
		}
	}

	fir, err := h.intakeService.LinkGDToFIR(c.Request.Context(), uint(gdID), &req, actingUserID)
	if err != nil {
		if errors.Is(err, service.ErrGDAlreadyLinked) {
			c.JSON(http.StatusConflict, models.StandardResponse{
				Success: false,
				Error:   err.Error(),
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "General Diary escalated and linked to formal FIR",
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

func (h *IntakeHandler) DeleteGD(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid GD ID",
		})
		return
	}

	err = h.intakeService.DeleteGD(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "General Diary deleted successfully",
	})
}

func (h *IntakeHandler) DeleteFIR(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid FIR ID",
		})
		return
	}

	err = h.intakeService.DeleteFIR(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "FIR deleted successfully",
	})
}
