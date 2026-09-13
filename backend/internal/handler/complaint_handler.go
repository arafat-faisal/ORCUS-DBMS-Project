package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"orcus-backend/internal/middleware"
	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ComplaintHandler struct {
	complaintService service.ComplaintService
	auditService     *service.AuditService
}

func NewComplaintHandler(complaintService service.ComplaintService, auditService *service.AuditService) *ComplaintHandler {
	return &ComplaintHandler{
		complaintService: complaintService,
		auditService:     auditService,
	}
}

func (h *ComplaintHandler) logAudit(c *gin.Context, eventType, action string, complaintID uint, summary string) {
	if h.auditService == nil {
		return
	}
	reqID := c.GetString(middleware.ContextRequestID)
	var uidPtr *uint
	if val, exists := c.Get(middleware.ContextUserID); exists {
		if u, ok := val.(uint); ok {
			uidPtr = &u
		}
	}
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	cidStr := strconv.FormatUint(uint64(complaintID), 10)

	h.auditService.Log(c.Request.Context(), models.AuditLog{
		RequestID:    toStrPtr(reqID),
		UserID:       uidPtr,
		EventType:    eventType,
		EntityType:   toStrPtr("complaint"),
		EntityID:     &cidStr,
		Action:       action,
		Route:        c.Request.URL.Path,
		HTTPMethod:   c.Request.Method,
		IPAddress:    toStrPtr(ip),
		UserAgent:    toStrPtr(ua),
		AfterSummary: toStrPtr(summary),
		Result:       "SUCCESS",
	})
}

// GetCategories returns available complaint categories
func (h *ComplaintHandler) GetCategories(c *gin.Context) {
	categories, err := h.complaintService.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve categories: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    categories,
	})
}

// PublicSubmitComplaint handles anonymous citizen complaint submission
func (h *ComplaintHandler) PublicSubmitComplaint(c *gin.Context) {
	var req models.PublicSubmitComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint submission request: " + err.Error(),
		})
		return
	}

	complaint, err := h.complaintService.SubmitPublicComplaint(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// Audit public event without sensitive personal values
	h.logAudit(c, "COMPLAINT", "PUBLIC_SUBMIT", complaint.ComplaintID,
		"Public citizen submitted complaint with tracking code: "+complaint.TrackingCode)

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Data: map[string]interface{}{
			"tracking_code":   complaint.TrackingCode,
			"submitted_at":    complaint.SubmittedAt,
			"current_status":  complaint.CurrentStatus,
			"branch_name":     complaint.BranchName,
			"acknowledgment": "Your complaint has been registered successfully. Please save your tracking code for official status inquiries.",
		},
	})
}

// PublicTrackComplaint provides sanitized public-safe complaint progress
func (h *ComplaintHandler) PublicTrackComplaint(c *gin.Context) {
	trackingCode := c.Query("tracking_code")
	phone := c.Query("phone")

	if trackingCode == "" || phone == "" {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Both tracking_code and phone verification parameters are required.",
		})
		return
	}

	trackResp, err := h.complaintService.TrackPublicComplaint(trackingCode, phone)
	if err != nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    trackResp,
	})
}

// CreateOfficerComplaint handles internal officer intake
func (h *ComplaintHandler) CreateOfficerComplaint(c *gin.Context) {
	var req models.CreateComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint data: " + err.Error(),
		})
		return
	}

	userID := uint(1)
	if val, exists := c.Get(middleware.ContextUserID); exists {
		if u, ok := val.(uint); ok {
			userID = u
		}
	}

	complaint, err := h.complaintService.CreateOfficerComplaint(req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	h.logAudit(c, "COMPLAINT", "INTAKE_CREATE", complaint.ComplaintID,
		fmt.Sprintf("Officer registered complaint %s (complainant: %d, branch: %d)", complaint.TrackingCode, complaint.ComplainantID, complaint.ReceivingBranchID))

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Data:    complaint,
	})
}

// ListComplaints returns paginated internal complaints
func (h *ComplaintHandler) ListComplaints(c *gin.Context) {
	var filter models.ComplaintFilter
	filter.Status = c.Query("status")
	filter.Search = c.Query("search")
	filter.StartDate = c.Query("start_date")
	filter.EndDate = c.Query("end_date")

	if bStr := c.Query("branch_id"); bStr != "" {
		if id, err := strconv.ParseUint(bStr, 10, 32); err == nil {
			u := uint(id)
			filter.BranchID = &u
		}
	}
	if catStr := c.Query("category_id"); catStr != "" {
		if id, err := strconv.ParseUint(catStr, 10, 32); err == nil {
			u := uint(id)
			filter.CategoryID = &u
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	filter.Page = page
	filter.PageSize = pageSize

	complaints, total, err := h.complaintService.ListComplaints(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to list complaints: " + err.Error(),
		})
		return
	}

	totalPages := (total + pageSize - 1) / pageSize
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    complaints,
		Pagination: &models.PaginationInfo{
			Page:       page,
			PageSize:   pageSize,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

// GetComplaint returns detailed internal complaint record
func (h *ComplaintHandler) GetComplaint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	complaint, err := h.complaintService.GetComplaint(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Complaint not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    complaint,
	})
}

// AssessComplaint handles status transitions and legal assessments
func (h *ComplaintHandler) AssessComplaint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	var req models.AssessComplaintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid assessment data: " + err.Error(),
		})
		return
	}

	userID := uint(1)
	if val, exists := c.Get(middleware.ContextUserID); exists {
		if u, ok := val.(uint); ok {
			userID = u
		}
	}

	branchID := uint(1)

	complaint, err := h.complaintService.AssessComplaint(uint(id), req, userID, branchID)
	if err != nil {
		c.JSON(http.StatusConflict, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	h.logAudit(c, "COMPLAINT", "ASSESS_STATUS", complaint.ComplaintID,
		fmt.Sprintf("Complaint assessed to status '%s' (decision: %s, reason: %s)", req.NewStatus, req.Decision, req.Reason))

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    complaint,
	})
}

// TransferComplaint handles branch reassignment
func (h *ComplaintHandler) TransferComplaint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	var req struct {
		ToBranchID uint   `json:"to_branch_id"`
		Reason     string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid transfer request: " + err.Error(),
		})
		return
	}

	userID := uint(1)
	if val, exists := c.Get(middleware.ContextUserID); exists {
		if u, ok := val.(uint); ok {
			userID = u
		}
	}

	cid := uint(id)
	if err := h.complaintService.TransferComplaint(cid, req.ToBranchID, req.Reason, userID); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	h.logAudit(c, "COMPLAINT", "TRANSFER_BRANCH", cid,
		fmt.Sprintf("Complaint transferred to branch %d (reason: %s)", req.ToBranchID, req.Reason))

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    "Complaint transferred successfully",
	})
}

// GetStatusHistory returns full status transition logs for complaint
func (h *ComplaintHandler) GetStatusHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	history, err := h.complaintService.GetStatusHistory(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve history: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    history,
	})
}

// GetTransferHistory returns jurisdictional transfer history for complaint
func (h *ComplaintHandler) GetTransferHistory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	transfers, err := h.complaintService.GetTransferHistory(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve transfer history: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    transfers,
	})
}

func (h *ComplaintHandler) DeleteComplaint(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid complaint ID",
		})
		return
	}

	err = h.complaintService.DeleteComplaint(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Message: "Complaint record deleted successfully",
	})
}
