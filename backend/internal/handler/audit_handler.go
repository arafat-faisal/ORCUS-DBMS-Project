package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AuditHandler struct {
	auditService *service.AuditService
}

func NewAuditHandler(auditService *service.AuditService) *AuditHandler {
	return &AuditHandler{auditService: auditService}
}

// ListAuditLogs handles GET /api/v1/admin/audit-logs
func (h *AuditHandler) ListAuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	filter := models.AuditFilter{
		Page:       page,
		PageSize:   pageSize,
		EventType:  c.Query("event_type"),
		EntityType: c.Query("entity_type"),
		Action:     c.Query("action"),
		Result:     c.Query("result"),
		Search:     c.Query("search"),
		FromDate:   c.Query("from_date"),
		ToDate:     c.Query("to_date"),
	}

	if uidStr := c.Query("user_id"); uidStr != "" {
		if uid, err := strconv.ParseUint(uidStr, 10, 32); err == nil {
			u := uint(uid)
			filter.UserID = &u
		}
	}
	if bidStr := c.Query("branch_id"); bidStr != "" {
		if bid, err := strconv.ParseUint(bidStr, 10, 32); err == nil {
			b := uint(bid)
			filter.BranchID = &b
		}
	}

	logs, pagination, err := h.auditService.GetLogs(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve audit logs",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success:    true,
		Data:       logs,
		Pagination: pagination,
	})
}
