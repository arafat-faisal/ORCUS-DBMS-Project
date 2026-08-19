// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Participants & Location]
// File: backend/internal/service/participant_service.go
// Purpose: Business logic for suspects, victims, witnesses, locations, and case linking.
//
// [INTEGRATION NOTE]: Enhanced by Faisal (241400060) to provide structured linking
// validations and cross-case criminal profiling from v_suspect_dossier.
// ============================================================================

package service

import (
	"context"
	"errors"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type ParticipantService struct {
	participantRepo *repository.ParticipantRepository
}

func NewParticipantService(participantRepo *repository.ParticipantRepository) *ParticipantService {
	return &ParticipantService{participantRepo: participantRepo}
}

// ----------------------------------------------------------------------------
// Suspect Logic
// ----------------------------------------------------------------------------

func (s *ParticipantService) CreateSuspect(ctx context.Context, req *models.CreateSuspectRequest) (*models.Suspect, error) {
	id, err := s.participantRepo.CreateSuspect(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.participantRepo.GetSuspectByID(ctx, id)
}

func (s *ParticipantService) ListSuspects(ctx context.Context, search, suspicionLevel, status string) ([]models.Suspect, error) {
	return s.participantRepo.GetAllSuspects(ctx, search, suspicionLevel, status)
}

func (s *ParticipantService) GetSuspect(ctx context.Context, id uint) (*models.Suspect, error) {
	return s.participantRepo.GetSuspectByID(ctx, id)
}

func (s *ParticipantService) GetSuspectDossier(ctx context.Context, suspectID uint) ([]models.SuspectDossierItem, error) {
	return s.participantRepo.GetSuspectDossier(ctx, suspectID)
}

// ----------------------------------------------------------------------------
// Victim Logic
// ----------------------------------------------------------------------------

func (s *ParticipantService) CreateVictim(ctx context.Context, req *models.CreateVictimRequest) (*models.Victim, error) {
	id, err := s.participantRepo.CreateVictim(ctx, req)
	if err != nil {
		return nil, err
	}
	return &models.Victim{
		VictimID:           id,
		Name:               req.Name,
		Phone:              req.Phone,
		Age:                req.Age,
		IdentificationSign: req.IdentificationSign,
		ConditionNotes:     req.ConditionNotes,
		IsDeceased:         req.IsDeceased,
	}, nil
}

func (s *ParticipantService) ListVictims(ctx context.Context) ([]models.Victim, error) {
	return s.participantRepo.GetAllVictims(ctx)
}

// ----------------------------------------------------------------------------
// Witness Logic
// ----------------------------------------------------------------------------

func (s *ParticipantService) CreateWitness(ctx context.Context, req *models.CreateWitnessRequest) (*models.Witness, error) {
	id, err := s.participantRepo.CreateWitness(ctx, req)
	if err != nil {
		return nil, err
	}
	return &models.Witness{
		WitnessID:          id,
		Name:               req.Name,
		Phone:              req.Phone,
		Age:                req.Age,
		IdentificationSign: req.IdentificationSign,
		Reliability:        req.Reliability,
		IsProtected:        req.IsProtected,
		StatementSummary:   req.StatementSummary,
	}, nil
}

func (s *ParticipantService) ListWitnesses(ctx context.Context, protectedOnly bool) ([]models.Witness, error) {
	return s.participantRepo.GetAllWitnesses(ctx, protectedOnly)
}

// ----------------------------------------------------------------------------
// Location Logic
// ----------------------------------------------------------------------------

func (s *ParticipantService) CreateLocation(ctx context.Context, req *models.CreateLocationRequest) (*models.Location, error) {
	id, err := s.participantRepo.CreateLocation(ctx, req)
	if err != nil {
		return nil, err
	}
	return &models.Location{
		LocationID:     id,
		GPSCoordinates: req.GPSCoordinates,
		Address:        req.Address,
		Area:           req.Area,
		City:           req.City,
	}, nil
}

func (s *ParticipantService) ListLocations(ctx context.Context, city string) ([]models.Location, error) {
	return s.participantRepo.GetAllLocations(ctx, city)
}

// ----------------------------------------------------------------------------
// Case-Participant Link Logic
// ----------------------------------------------------------------------------

func (s *ParticipantService) LinkSuspectToCase(ctx context.Context, caseID, suspectID uint, roleInCrime string) error {
	if caseID == 0 || suspectID == 0 {
		return errors.New("case_id and suspect_id are required")
	}
	return s.participantRepo.LinkSuspectToCase(ctx, caseID, suspectID, roleInCrime)
}

func (s *ParticipantService) LinkVictimToCase(ctx context.Context, caseID, victimID uint, impactType string) error {
	if caseID == 0 || victimID == 0 {
		return errors.New("case_id and victim_id are required")
	}
	return s.participantRepo.LinkVictimToCase(ctx, caseID, victimID, impactType)
}

func (s *ParticipantService) LinkWitnessToCase(ctx context.Context, caseID, witnessID uint, statement string) error {
	if caseID == 0 || witnessID == 0 {
		return errors.New("case_id and witness_id are required")
	}
	return s.participantRepo.LinkWitnessToCase(ctx, caseID, witnessID, statement)
}

func (s *ParticipantService) LinkLocationToCase(ctx context.Context, caseID, locationID uint, role string) error {
	if caseID == 0 || locationID == 0 {
		return errors.New("case_id and location_id are required")
	}
	return s.participantRepo.LinkLocationToCase(ctx, caseID, locationID, role)
}
