// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Cases]
// File: backend/internal/service/case_service.go
// Purpose: Business logic for case management, search, dossier aggregation, and atomic status transitions.
//
// [INTEGRATION NOTE]: Harmonized by Faisal (241400060) to assemble the comprehensive
// CaseDossier bringing in Liza's participant links and evidence records.
// ============================================================================

package service

import (
	"context"
	"errors"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type CaseService struct {
	caseRepo        *repository.CaseRepository
	participantRepo *repository.ParticipantRepository
	evidenceRepo    *repository.EvidenceRepository
}

func NewCaseService(
	caseRepo *repository.CaseRepository,
	participantRepo *repository.ParticipantRepository,
	evidenceRepo *repository.EvidenceRepository,
) *CaseService {
	return &CaseService{
		caseRepo:        caseRepo,
		participantRepo: participantRepo,
		evidenceRepo:    evidenceRepo,
	}
}

// OpenCase initiates a new case and logs the initial history record
func (s *CaseService) OpenCase(ctx context.Context, req *models.CreateCaseRequest, userID uint) (*models.CaseOverview, error) {
	caseID, err := s.caseRepo.CreateCase(ctx, req, userID)
	if err != nil {
		return nil, err
	}
	return s.caseRepo.GetCaseOverviewByID(ctx, caseID)
}

// SearchCases performs multi-criteria search over view v_case_overview
func (s *CaseService) SearchCases(ctx context.Context, filter *models.CaseSearchFilter) ([]models.CaseOverview, error) {
	return s.caseRepo.SearchCases(ctx, filter)
}

// GetCaseOverview fetches case overview from v_case_overview
func (s *CaseService) GetCaseOverview(ctx context.Context, caseID uint) (*models.CaseOverview, error) {
	return s.caseRepo.GetCaseOverviewByID(ctx, caseID)
}

// UpdateCaseStatus executes atomic case status transition and logs to case_status_history
func (s *CaseService) UpdateCaseStatus(ctx context.Context, caseID uint, req *models.UpdateCaseStatusRequest, userID uint) (*models.CaseOverview, error) {
	// Validate allowed status domain per BR-15
	allowedStatuses := map[string]bool{
		"Open": true, "Under Investigation": true, "Pending Review": true,
		"Closed": true, "Reopened": true, "Archived": true,
	}
	if !allowedStatuses[req.Status] {
		return nil, errors.New("invalid case status. Allowed values: 'Open', 'Under Investigation', 'Pending Review', 'Closed', 'Reopened', 'Archived'")
	}

	err := s.caseRepo.UpdateCaseStatusTx(ctx, caseID, req.Status, req.Remarks, userID)
	if err != nil {
		return nil, err
	}

	return s.caseRepo.GetCaseOverviewByID(ctx, caseID)
}

// GetCaseStatusHistory returns chronological status logs
func (s *CaseService) GetCaseStatusHistory(ctx context.Context, caseID uint) ([]models.CaseStatusHistory, error) {
	return s.caseRepo.GetCaseStatusHistory(ctx, caseID)
}

// GetCaseDossier aggregates case metadata, status history, linked participants, and evidence items
func (s *CaseService) GetCaseDossier(ctx context.Context, caseID uint) (*models.CaseDossier, error) {
	caseOverview, err := s.caseRepo.GetCaseOverviewByID(ctx, caseID)
	if err != nil {
		return nil, err
	}
	if caseOverview == nil {
		return nil, errors.New("case not found")
	}

	history, _ := s.caseRepo.GetCaseStatusHistory(ctx, caseID)
	suspects, _ := s.participantRepo.GetCaseSuspects(ctx, caseID)
	victims, _ := s.participantRepo.GetCaseVictims(ctx, caseID)
	witnesses, _ := s.participantRepo.GetCaseWitnesses(ctx, caseID)
	locations, _ := s.participantRepo.GetCaseLocations(ctx, caseID)
	evidenceItems, _ := s.evidenceRepo.GetAllEvidence(ctx, caseID, "", "")

	return &models.CaseDossier{
		Case:          *caseOverview,
		History:       history,
		Suspects:      suspects,
		Victims:       victims,
		Witnesses:     witnesses,
		Locations:     locations,
		EvidenceItems: evidenceItems,
	}, nil
}
