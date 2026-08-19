// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Integration Layer]
// File: backend/internal/service/analytics_service.go
// Purpose: Aggregates dashboard summaries and pipeline views.
// ============================================================================

package service

import (
	"context"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type AnalyticsService struct {
	analyticsRepo *repository.AnalyticsRepository
}

func NewAnalyticsService(analyticsRepo *repository.AnalyticsRepository) *AnalyticsService {
	return &AnalyticsService{analyticsRepo: analyticsRepo}
}

func (s *AnalyticsService) GetOverview(ctx context.Context) (*models.DashboardOverview, error) {
	return s.analyticsRepo.GetDashboardOverview(ctx)
}

func (s *AnalyticsService) GetPipeline(ctx context.Context) ([]models.CasePipeline, error) {
	return s.analyticsRepo.GetCasePipeline(ctx)
}
