// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Participants & Location]
// File: backend/internal/handler/participant_handler.go
// Purpose: HTTP controllers for suspects, victims, witnesses, and case linking.
// ============================================================================

package handler

import (
	"net/http"
	"strconv"

	"orcus-backend/internal/models"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ParticipantHandler struct {
	participantService *service.ParticipantService
}

func NewParticipantHandler(participantService *service.ParticipantService) *ParticipantHandler {
	return &ParticipantHandler{participantService: participantService}
}

// ----------------------------------------------------------------------------
// Suspects
// ----------------------------------------------------------------------------

func (h *ParticipantHandler) CreateSuspect(c *gin.Context) {
	var req models.CreateSuspectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	suspect, err := h.participantService.CreateSuspect(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Suspect registered successfully",
		Data:    suspect,
	})
}

func (h *ParticipantHandler) ListSuspects(c *gin.Context) {
	search := c.Query("search")
	suspicionLevel := c.Query("suspicion_level")
	status := c.Query("status")

	suspects, err := h.participantService.ListSuspects(c.Request.Context(), search, suspicionLevel, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(suspects)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    suspects,
	})
}

func (h *ParticipantHandler) GetSuspect(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid suspect ID",
		})
		return
	}

	suspect, err := h.participantService.GetSuspect(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if suspect == nil {
		c.JSON(http.StatusNotFound, models.StandardResponse{
			Success: false,
			Error:   "Suspect not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Data:    suspect,
	})
}

func (h *ParticipantHandler) GetSuspectDossier(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   "Invalid suspect ID",
		})
		return
	}

	dossier, err := h.participantService.GetSuspectDossier(c.Request.Context(), uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(dossier)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    dossier,
	})
}

// ----------------------------------------------------------------------------
// Victims
// ----------------------------------------------------------------------------

func (h *ParticipantHandler) CreateVictim(c *gin.Context) {
	var req models.CreateVictimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	victim, err := h.participantService.CreateVictim(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Victim recorded successfully",
		Data:    victim,
	})
}

func (h *ParticipantHandler) ListVictims(c *gin.Context) {
	victims, err := h.participantService.ListVictims(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(victims)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    victims,
	})
}

// ----------------------------------------------------------------------------
// Witnesses
// ----------------------------------------------------------------------------

func (h *ParticipantHandler) CreateWitness(c *gin.Context) {
	var req models.CreateWitnessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	witness, err := h.participantService.CreateWitness(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, models.StandardResponse{
		Success: true,
		Message: "Witness recorded successfully",
		Data:    witness,
	})
}

func (h *ParticipantHandler) ListWitnesses(c *gin.Context) {
	protectedOnly := c.Query("protected") == "true"
	witnesses, err := h.participantService.ListWitnesses(c.Request.Context(), protectedOnly)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	count := len(witnesses)
	c.JSON(http.StatusOK, models.StandardResponse{
		Success: true,
		Count:   &count,
		Data:    witnesses,
	})
}

// ----------------------------------------------------------------------------
// Case-Participant Links
// ----------------------------------------------------------------------------

func (h *ParticipantHandler) LinkSuspectToCase(c *gin.Context) {
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

	if err := h.participantService.LinkSuspectToCase(c.Request.Context(), uint(caseID), req.ParticipantID, req.RoleOrImpact); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{Success: true, Message: "Suspect linked to case successfully"})
}

func (h *ParticipantHandler) LinkVictimToCase(c *gin.Context) {
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

	if err := h.participantService.LinkVictimToCase(c.Request.Context(), uint(caseID), req.ParticipantID, req.RoleOrImpact); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{Success: true, Message: "Victim linked to case successfully"})
}

func (h *ParticipantHandler) LinkWitnessToCase(c *gin.Context) {
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

	if err := h.participantService.LinkWitnessToCase(c.Request.Context(), uint(caseID), req.ParticipantID, req.RoleOrImpact); err != nil {
		c.JSON(http.StatusInternalServerError, models.StandardResponse{Success: false, Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.StandardResponse{Success: true, Message: "Witness linked to case successfully"})
}
