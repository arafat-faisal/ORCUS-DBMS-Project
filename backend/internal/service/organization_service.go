// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/service/organization_service.go
// Purpose: Business logic for branch and officer personnel management.
// ============================================================================

package service

import (
	"context"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type OrganizationService struct {
	orgRepo *repository.OrganizationRepository
}

func NewOrganizationService(orgRepo *repository.OrganizationRepository) *OrganizationService {
	return &OrganizationService{orgRepo: orgRepo}
}

func (s *OrganizationService) ListBranches(ctx context.Context, district string) ([]models.AgencyBranch, error) {
	return s.orgRepo.GetAllBranches(ctx, district)
}

func (s *OrganizationService) GetBranch(ctx context.Context, branchID uint) (*models.AgencyBranch, error) {
	return s.orgRepo.GetBranchByID(ctx, branchID)
}

func (s *OrganizationService) CreateBranch(ctx context.Context, req *models.CreateBranchRequest) (*models.AgencyBranch, error) {
	branchID, err := s.orgRepo.CreateBranch(ctx, req.BranchName, req.District)
	if err != nil {
		return nil, err
	}
	return s.orgRepo.GetBranchByID(ctx, branchID)
}

func (s *OrganizationService) ListOfficers(ctx context.Context, search string, branchID uint) ([]models.Officer, error) {
	return s.orgRepo.GetAllOfficers(ctx, search, branchID)
}

func (s *OrganizationService) GetOfficer(ctx context.Context, officerID uint) (*models.Officer, error) {
	return s.orgRepo.GetOfficerByID(ctx, officerID)
}

func (s *OrganizationService) CreateOfficer(ctx context.Context, req *models.CreateOfficerRequest) (*models.Officer, error) {
	officerID, err := s.orgRepo.CreateOfficer(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.orgRepo.GetOfficerByID(ctx, officerID)
}

func (s *OrganizationService) GetOfficerCaseload(ctx context.Context) ([]models.OfficerCaseload, error) {
	return s.orgRepo.GetOfficerCaseload(ctx)
}
