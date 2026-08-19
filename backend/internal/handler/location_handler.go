// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Location Directory]
// File: backend/internal/handler/location_handler.go
// Purpose: HTTP controllers for location directory and case-location linking.
// ============================================================================

package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type LocationHandler struct {
	participantService *service.ParticipantService
}

func NewLocationHandler(participantService *service.ParticipantService) *LocationHandler {
	return &LocationHandler{participantService: participantService}
}

func (h *LocationHandler) CreateLocation(c *gin.Context) {
	var req models.CreateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	location, err := h.participantService.CreateLocation(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Location added successfully",
		Data:    location,
	})
}

func (h *LocationHandler) ListLocations(c *gin.Context) {
	city := c.Query("city")
	locations, err := h.participantService.ListLocations(c.Request.Context(), city)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(locations)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    locations,
	})
}

func (h *LocationHandler) LinkLocationToCase(c *gin.Context) {
	caseID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{Success: false, Error: "Invalid case ID"})
		return
	}

	var req models.LinkParticipantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{Success: false, Error: err.Error()})
		return
	}

	if err := h.participantService.LinkLocationToCase(c.Request.Context(), uint(caseID), req.ParticipantID, req.RoleOrImpact); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{Success: true, Message: "Location linked to case successfully"})
}
