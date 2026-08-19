// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Evidence & Chain of Custody]
// File: backend/internal/models/evidence.go
// Purpose: Models for evidence, evidence_status_history, and chain of custody view.
//
// [INTEGRATION NOTE]: Enhanced by Faisal (241400060) to support weak entity
// case-level sequential numbering (case_id + evidence_no) per BR-03 and view v_evidence_chain_of_custody.
// ============================================================================

package models

import "time"

// Evidence maps to table `evidence` (Weak entity under CASE)
type Evidence struct {
	EvidenceID           uint      `db:"evidence_id" json:"evidence_id"`
	CaseID               uint      `db:"case_id" json:"case_id"`
	EvidenceNo           uint      `db:"evidence_no" json:"evidence_no"`
	Title                string    `db:"title" json:"title"`
	Description          *string   `db:"description" json:"description,omitempty"`
	EvidenceType         string    `db:"evidence_type" json:"evidence_type"`
	Status               string    `db:"status" json:"status"`
	CollectedAt          time.Time `db:"collected_at" json:"collected_at"`
	CollectedByOfficerID *uint     `db:"collected_by_officer_id" json:"collected_by_officer_id,omitempty"`
	StorageLocation      *string   `db:"storage_location" json:"storage_location,omitempty"`
}

// EvidenceStatusHistory maps to table `evidence_status_history` (Append-only audit log)
type EvidenceStatusHistory struct {
	HistoryID       uint      `db:"history_id" json:"history_id"`
	EvidenceID      uint      `db:"evidence_id" json:"evidence_id"`
	Status          string    `db:"status" json:"status"`
	ChangedAt       time.Time `db:"changed_at" json:"changed_at"`
	Remarks         *string   `db:"remarks" json:"remarks,omitempty"`
	ChangedByUserID *uint     `db:"changed_by_user_id" json:"changed_by_user_id,omitempty"`
	UpdatedBy       *string   `db:"updated_by" json:"updated_by,omitempty"`
}

// EvidenceChainLog maps to SQL View `v_evidence_chain_of_custody`
type EvidenceChainLog struct {
	EvidenceID        uint      `db:"evidence_id" json:"evidence_id"`
	CaseID            uint      `db:"case_id" json:"case_id"`
	CaseTitle         string    `db:"case_title" json:"case_title"`
	EvidenceNo        uint      `db:"evidence_no" json:"evidence_no"`
	EvidenceTitle     string    `db:"evidence_title" json:"evidence_title"`
	EvidenceType      string    `db:"evidence_type" json:"evidence_type"`
	StorageLocation   *string   `db:"storage_location" json:"storage_location,omitempty"`
	HistoryID         uint      `db:"history_id" json:"history_id"`
	LoggedStatus      string    `db:"logged_status" json:"logged_status"`
	ChangedAt         time.Time `db:"changed_at" json:"changed_at"`
	Remarks           *string   `db:"remarks" json:"remarks,omitempty"`
	UpdatedByUsername *string   `db:"updated_by_username" json:"updated_by_username,omitempty"`
	UpdatedByOfficer  *string   `db:"updated_by_officer" json:"updated_by_officer,omitempty"`
}

// DTOs for Evidence

type CreateEvidenceRequest struct {
	CaseID               uint    `json:"case_id" binding:"required"`
	Title                string  `json:"title" binding:"required,max=150"`
	Description          *string `json:"description"`
	EvidenceType         string  `json:"evidence_type" binding:"required,oneof=Physical Digital Documentary Biological Forensic Weapon Narcotics Other"`
	StorageLocation      *string `json:"storage_location" binding:"max=150"`
	CollectedByOfficerID *uint   `json:"collected_by_officer_id"`
}

type UpdateEvidenceStatusRequest struct {
	Status          string  `json:"status" binding:"required,oneof='Collected' 'In Lab Analysis' 'Stored in Vault' 'Presented in Court' 'Archived' 'Disposed'"`
	StorageLocation *string `json:"storage_location"`
	Remarks         string  `json:"remarks"`
}
