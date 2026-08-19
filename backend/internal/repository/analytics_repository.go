// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Integration Layer]
// File: backend/internal/repository/analytics_repository.go
// Purpose: Aggregates dashboard KPI counts and queries SQL View v_fir_case_pipeline.
// ============================================================================

package repository

import (
	"context"
	"fmt"

	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type AnalyticsRepository struct {
	db *sqlx.DB
}

func NewAnalyticsRepository(db *sqlx.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

// GetDashboardOverview computes aggregate metrics across the agency database
func (r *AnalyticsRepository) GetDashboardOverview(ctx context.Context) (*models.DashboardOverview, error) {
	var overview models.DashboardOverview

	query := `
		SELECT 
			(SELECT COUNT(*) FROM ` + "`case`" + ` WHERE status IN ('Open', 'Under Investigation', 'Pending Review')) AS active_cases_count,
			(SELECT COUNT(*) FROM ` + "`case`" + `) AS total_cases_count,
			(SELECT COUNT(*) FROM fir WHERE fir_id NOT IN (SELECT COALESCE(fir_id, 0) FROM ` + "`case`" + ` WHERE fir_id IS NOT NULL)) AS pending_firs_count,
			(SELECT COUNT(*) FROM evidence) AS evidence_count,
			(SELECT COUNT(*) FROM officer) AS total_officers_count,
			(SELECT COUNT(*) FROM agency_branch) AS total_branches_count
	`
	err := r.db.GetContext(ctx, &overview, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching dashboard overview: %w", err)
	}
	return &overview, nil
}

// GetCasePipeline queries SQL View `v_fir_case_pipeline`
func (r *AnalyticsRepository) GetCasePipeline(ctx context.Context) ([]models.CasePipeline, error) {
	pipeline := make([]models.CasePipeline, 0)
	query := `
		SELECT 
			fir_id,
			fir_number,
			crime_category,
			filed_date,
			gd_number,
			gd_date,
			complainant_name,
			applicable_legal_sections,
			case_id,
			case_title,
			case_status
		FROM v_fir_case_pipeline
		ORDER BY filed_date DESC
	`
	err := r.db.SelectContext(ctx, &pipeline, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching case pipeline view: %w", err)
	}
	return pipeline, nil
}
