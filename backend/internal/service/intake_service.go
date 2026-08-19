// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Cases]
// File: backend/internal/service/intake_service.go
// Purpose: Business logic for complainant, General Diary (GD), FIR, and legal sections.
//
// [INTEGRATION NOTE]: Enhanced by Faisal (241400060) to validate optional GD-to-FIR
// links (BR-01) and support multi-section associations.
// ============================================================================

package service

import (
	"context"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type IntakeService struct {
	intakeRepo *repository.IntakeRepository
}

func NewIntakeService(intakeRepo *repository.IntakeRepository) *IntakeService {
	return &IntakeService{intakeRepo: intakeRepo}
}

func (s *IntakeService) CreateComplainant(ctx context.Context, req *models.CreateComplainantRequest) (*models.Complainant, error) {
	id, err := s.intakeRepo.CreateComplainantWithContacts(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.intakeRepo.GetComplainantByID(ctx, id)
}

func (s *IntakeService) ListComplainants(ctx context.Context) ([]models.Complainant, error) {
	return s.intakeRepo.GetAllComplainants(ctx)
}

func (s *IntakeService) GetComplainant(ctx context.Context, id uint) (*models.Complainant, error) {
	return s.intakeRepo.GetComplainantByID(ctx, id)
}

func (s *IntakeService) CreateGD(ctx context.Context, req *models.CreateGDRequest) (*models.GD, error) {
	id, err := s.intakeRepo.CreateGD(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.intakeRepo.GetGDByID(ctx, id)
}

func (s *IntakeService) ListGDs(ctx context.Context, complainantID uint) ([]models.GD, error) {
	return s.intakeRepo.GetAllGDs(ctx, complainantID)
}

func (s *IntakeService) GetGD(ctx context.Context, id uint) (*models.GD, error) {
	return s.intakeRepo.GetGDByID(ctx, id)
}

func (s *IntakeService) CreateFIR(ctx context.Context, req *models.CreateFIRRequest) (*models.FIR, error) {
	id, err := s.intakeRepo.CreateFIRWithLegalSections(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.intakeRepo.GetFIRByID(ctx, id)
}

func (s *IntakeService) ListFIRs(ctx context.Context, category string) ([]models.FIR, error) {
	return s.intakeRepo.GetAllFIRs(ctx, category)
}

func (s *IntakeService) GetFIR(ctx context.Context, id uint) (*models.FIR, error) {
	return s.intakeRepo.GetFIRByID(ctx, id)
}

func (s *IntakeService) ListLegalSections(ctx context.Context) ([]models.LegalSection, error) {
	return s.intakeRepo.GetAllLegalSections(ctx)
}
