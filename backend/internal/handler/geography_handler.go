package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type GeographyHandler struct {
	geoService service.GeographyService
}

func NewGeographyHandler(geoService service.GeographyService) *GeographyHandler {
	return &GeographyHandler{geoService: geoService}
}

func (h *GeographyHandler) ListDivisions(c *gin.Context) {
	divisions, err := h.geoService.GetDivisions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve divisions: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    divisions,
	})
}

func (h *GeographyHandler) ListDistricts(c *gin.Context) {
	var divIDPtr *uint
	if divStr := c.Query("division_id"); divStr != "" {
		if id, err := strconv.ParseUint(divStr, 10, 32); err == nil {
			u := uint(id)
			divIDPtr = &u
		}
	}

	districts, err := h.geoService.GetDistricts(divIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve districts: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    districts,
	})
}

func (h *GeographyHandler) ListUpazilas(c *gin.Context) {
	var distIDPtr *uint
	if distStr := c.Query("district_id"); distStr != "" {
		if id, err := strconv.ParseUint(distStr, 10, 32); err == nil {
			u := uint(id)
			distIDPtr = &u
		}
	}

	upazilas, err := h.geoService.GetUpazilas(distIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve upazilas: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    upazilas,
	})
}

func (h *GeographyHandler) ListThanas(c *gin.Context) {
	var distIDPtr *uint
	if distStr := c.Query("district_id"); distStr != "" {
		if id, err := strconv.ParseUint(distStr, 10, 32); err == nil {
			u := uint(id)
			distIDPtr = &u
		}
	}

	thanas, err := h.geoService.GetThanas(distIDPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   "Failed to retrieve thanas: " + err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    thanas,
	})
}
