// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Evidence & Chain of Custody]
// File: backend/internal/service/evidence_service.go
// Purpose: Business logic for weak entity evidence items and atomic chain of custody transitions.
//
// [INTEGRATION NOTE]: Enhanced by Faisal (241400060) to validate allowed status domain (BR-15)
// and enforce sequential numbering per case (BR-03).
// ============================================================================

package service

import (
	"context"
	"errors"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type EvidenceService struct {
	evidenceRepo *repository.EvidenceRepository
}

func NewEvidenceService(evidenceRepo *repository.EvidenceRepository) *EvidenceService {
	return &EvidenceService{evidenceRepo: evidenceRepo}
}

func (s *EvidenceService) CreateEvidence(ctx context.Context, req *models.CreateEvidenceRequest, userID uint) (*models.Evidence, error) {
	if req.CaseID == 0 {
		return nil, errors.New("case_id is required for weak entity evidence creation")
	}
	id, err := s.evidenceRepo.CreateEvidenceItemTx(ctx, req, userID)
	if err != nil {
		return nil, err
	}
	return s.evidenceRepo.GetEvidenceByID(ctx, id)
}

func (s *EvidenceService) ListEvidence(ctx context.Context, caseID uint, evidenceType, status string) ([]models.Evidence, error) {
	return s.evidenceRepo.GetAllEvidence(ctx, caseID, evidenceType, status)
}

func (s *EvidenceService) GetEvidence(ctx context.Context, id uint) (*models.Evidence, error) {
	return s.evidenceRepo.GetEvidenceByID(ctx, id)
}

func (s *EvidenceService) UpdateEvidenceStatus(ctx context.Context, evidenceID uint, req *models.UpdateEvidenceStatusRequest, userID uint) (*models.Evidence, error) {
	allowedStatuses := map[string]bool{
		"Collected": true, "In Lab Analysis": true, "Stored in Vault": true,
		"Presented in Court": true, "Archived": true, "Disposed": true,
	}
	if !allowedStatuses[req.Status] {
		return nil, errors.New("invalid evidence status. Allowed: 'Collected', 'In Lab Analysis', 'Stored in Vault', 'Presented in Court', 'Archived', 'Disposed'")
	}

	err := s.evidenceRepo.UpdateEvidenceStatusTx(ctx, evidenceID, req, userID)
	if err != nil {
		return nil, err
	}
	return s.evidenceRepo.GetEvidenceByID(ctx, evidenceID)
}

func (s *EvidenceService) GetEvidenceChainOfCustody(ctx context.Context, evidenceID uint) ([]models.EvidenceChainLog, error) {
	return s.evidenceRepo.GetEvidenceChainOfCustody(ctx, evidenceID)
}
