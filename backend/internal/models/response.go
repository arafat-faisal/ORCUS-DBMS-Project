// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Standard Response Envelope]
// File: backend/internal/models/response.go
// Purpose: Standard API response format used across all ORCUS backend endpoints.
// ============================================================================

package models

type StandardResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Count   *int        `json:"count,omitempty"`
}

type DashboardOverview struct {
	ActiveCasesCount   int `db:"active_cases_count" json:"active_cases_count"`
	TotalCasesCount    int `db:"total_cases_count" json:"total_cases_count"`
	PendingFIRsCount   int `db:"pending_firs_count" json:"pending_firs_count"`
	EvidenceCount      int `db:"evidence_count" json:"evidence_count"`
	TotalOfficersCount int `db:"total_officers_count" json:"total_officers_count"`
	TotalBranchesCount int `db:"total_branches_count" json:"total_branches_count"`
}
