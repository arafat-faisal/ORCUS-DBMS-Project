// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Integration Layer]
// File: backend/internal/handler/analytics_handler.go
// Purpose: HTTP controllers for dashboard overview metrics and intake pipeline views.
// ============================================================================

package handler

import (
	"net/http"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type AnalyticsHandler struct {
	analyticsService *service.AnalyticsService
}

func NewAnalyticsHandler(analyticsService *service.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService}
}

func (h *AnalyticsHandler) GetDashboardOverview(c *gin.Context) {
	overview, err := h.analyticsService.GetOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    overview,
	})
}

func (h *AnalyticsHandler) GetCasePipeline(c *gin.Context) {
	pipeline, err := h.analyticsService.GetPipeline(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(pipeline)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    pipeline,
	})
}
