// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Case Management]
// File: backend/internal/models/intake.go
// Purpose: Models for complainant, contact, gd, fir, legal_section, case, and status history.
//
// [INTEGRATION NOTE]: Enhanced and harmonized by Faisal (241400060) to align with
// the master 3NF schema, including lead_officer_id reference and SQL view models.
// ============================================================================

package models

import "time"

// Complainant maps to table `complainant`
type Complainant struct {
	ComplainantID uint                 `db:"complainant_id" json:"complainant_id"`
	Name          string               `db:"name" json:"name"`
	Contacts      []ComplainantContact `json:"contacts,omitempty"`
}

// ComplainantContact maps to table `complainant_contact` (1NF normalized multivalued contacts)
type ComplainantContact struct {
	ContactID     uint   `db:"contact_id" json:"contact_id"`
	ComplainantID uint   `db:"complainant_id" json:"complainant_id"`
	ContactType   string `db:"contact_type" json:"contact_type"`
	ContactValue  string `db:"contact_value" json:"contact_value"`
	IsPrimary     bool   `db:"is_primary" json:"is_primary"`
}

// GD maps to table `gd` (General Diary)
type GD struct {
	GDID            uint      `db:"gd_id" json:"gd_id"`
	GDNumber        string    `db:"gd_number" json:"gd_number"`
	GDDate          time.Time `db:"gd_date" json:"gd_date"`
	Subject         string    `db:"subject" json:"subject"`
	ComplainantID   uint      `db:"complainant_id" json:"complainant_id"`
	ComplainantName *string   `db:"complainant_name" json:"complainant_name,omitempty"`
}

// FIR maps to table `fir` (First Information Report)
type FIR struct {
	FIRID         uint           `db:"fir_id" json:"fir_id"`
	FIRNumber     string         `db:"fir_number" json:"fir_number"`
	CrimeCategory string         `db:"crime_category" json:"crime_category"`
	FiledDate     time.Time      `db:"filed_date" json:"filed_date"`
	GDID          *uint          `db:"gd_id" json:"gd_id,omitempty"`
	GDNumber      *string        `db:"gd_number" json:"gd_number,omitempty"`
	LegalSections []LegalSection `json:"legal_sections,omitempty"`
}

// LegalSection maps to table `legal_section`
type LegalSection struct {
	SectionID    uint    `db:"section_id" json:"section_id"`
	SectionCode  string  `db:"section_code" json:"section_code"`
	SectionTitle string  `db:"section_title" json:"section_title"`
	Description  *string `db:"description" json:"description,omitempty"`
}

// FirLegalSection maps to bridge table `fir_legal_section`
type FirLegalSection struct {
	FIRID     uint `db:"fir_id" json:"fir_id"`
	SectionID uint `db:"section_id" json:"section_id"`
}

// Case maps to table `case`
type Case struct {
	CaseID          uint       `db:"case_id" json:"case_id"`
	CaseTitle       string     `db:"case_title" json:"case_title"`
	Status          string     `db:"status" json:"status"`
	OpenedDate      time.Time  `db:"opened_date" json:"opened_date"`
	AssignedDate    *time.Time `db:"assigned_date" json:"assigned_date,omitempty"`
	FIRID           *uint      `db:"fir_id" json:"fir_id,omitempty"`
	LeadOfficerID   *uint      `db:"lead_officer_id" json:"lead_officer_id,omitempty"`
	LeadOfficerName *string    `db:"lead_officer_name" json:"lead_officer_name,omitempty"`
	BadgeNo         *string    `db:"badge_no" json:"badge_no,omitempty"`
}

// CaseStatusHistory maps to table `case_status_history`
type CaseStatusHistory struct {
	HistoryID       uint      `db:"history_id" json:"history_id"`
	CaseID          uint      `db:"case_id" json:"case_id"`
	Status          string    `db:"status" json:"status"`
	ChangedAt       time.Time `db:"changed_at" json:"changed_at"`
	Remarks         *string   `db:"remarks" json:"remarks,omitempty"`
	ChangedByUserID *uint     `db:"changed_by_user_id" json:"changed_by_user_id,omitempty"`
	ChangedBy       *string   `db:"changed_by" json:"changed_by,omitempty"`
}

// CaseOverview maps to SQL View `v_case_overview`
type CaseOverview struct {
	CaseID           uint       `db:"case_id" json:"case_id"`
	CaseTitle        string     `db:"case_title" json:"case_title"`
	CaseStatus       string     `db:"case_status" json:"case_status"`
	OpenedDate       time.Time  `db:"opened_date" json:"opened_date"`
	AssignedDate     *time.Time `db:"assigned_date" json:"assigned_date,omitempty"`
	FIRNumber        *string    `db:"fir_number" json:"fir_number,omitempty"`
	CrimeCategory    *string    `db:"crime_category" json:"crime_category,omitempty"`
	GDNumber         *string    `db:"gd_number" json:"gd_number,omitempty"`
	LeadOfficerBadge *string    `db:"lead_officer_badge" json:"lead_officer_badge,omitempty"`
	LeadOfficerName  *string    `db:"lead_officer_name" json:"lead_officer_name,omitempty"`
	LeadOfficerRank  *string    `db:"lead_officer_rank" json:"lead_officer_rank,omitempty"`
	BranchName       *string    `db:"branch_name" json:"branch_name,omitempty"`
	District         *string    `db:"district" json:"district,omitempty"`
	SuspectCount     int        `db:"suspect_count" json:"suspect_count"`
	VictimCount      int        `db:"victim_count" json:"victim_count"`
	WitnessCount     int        `db:"witness_count" json:"witness_count"`
	EvidenceCount    int        `db:"evidence_count" json:"evidence_count"`
}

// CasePipeline maps to SQL View `v_fir_case_pipeline`
type CasePipeline struct {
	FIRID                   uint       `db:"fir_id" json:"fir_id"`
	FIRNumber               string     `db:"fir_number" json:"fir_number"`
	CrimeCategory           string     `db:"crime_category" json:"crime_category"`
	FiledDate               time.Time  `db:"filed_date" json:"filed_date"`
	GDNumber                *string    `db:"gd_number" json:"gd_number,omitempty"`
	GDDate                  *time.Time `db:"gd_date" json:"gd_date,omitempty"`
	ComplainantName         *string    `db:"complainant_name" json:"complainant_name,omitempty"`
	ApplicableLegalSections *string    `db:"applicable_legal_sections" json:"applicable_legal_sections,omitempty"`
	CaseID                  *uint      `db:"case_id" json:"case_id,omitempty"`
	CaseTitle               *string    `db:"case_title" json:"case_title,omitempty"`
	CaseStatus              *string    `db:"case_status" json:"case_status,omitempty"`
}

// CaseDossier represents a complete investigation dossier
type CaseDossier struct {
	Case          CaseOverview        `json:"case"`
	History       []CaseStatusHistory `json:"status_history"`
	Suspects      []CaseSuspectLink   `json:"suspects"`
	Victims       []CaseVictimLink    `json:"victims"`
	Witnesses     []CaseWitnessLink   `json:"witnesses"`
	Locations     []CaseLocationLink  `json:"locations"`
	EvidenceItems []Evidence          `json:"evidence_items"`
}

// DTOs for Intake & Cases

type CreateComplainantRequest struct {
	Name     string                  `json:"name" binding:"required,max=100"`
	Contacts []ComplainantContactDTO `json:"contacts"`
}

type ComplainantContactDTO struct {
	ContactType  string `json:"contact_type" binding:"required,oneof=phone email"`
	ContactValue string `json:"contact_value" binding:"required,max=100"`
	IsPrimary    bool   `json:"is_primary"`
}

type CreateGDRequest struct {
	GDNumber      string `json:"gd_number" binding:"required,max=50"`
	GDDate        string `json:"gd_date" binding:"required"` // Format: YYYY-MM-DD
	Subject       string `json:"subject" binding:"required"`
	ComplainantID uint   `json:"complainant_id" binding:"required"`
}

type CreateFIRRequest struct {
	FIRNumber     string `json:"fir_number" binding:"required,max=50"`
	CrimeCategory string `json:"crime_category" binding:"required,max=100"`
	FiledDate     string `json:"filed_date" binding:"required"` // Format: YYYY-MM-DD
	GDID          *uint  `json:"gd_id"`
	SectionIDs    []uint `json:"section_ids"`
}

type CreateCaseRequest struct {
	CaseTitle     string `json:"case_title" binding:"required,max=200"`
	OpenedDate    string `json:"opened_date" binding:"required"` // Format: YYYY-MM-DD
	AssignedDate  string `json:"assigned_date"`
	FIRID         *uint  `json:"fir_id"`
	LeadOfficerID *uint  `json:"lead_officer_id"`
}

type UpdateCaseStatusRequest struct {
	Status  string `json:"status" binding:"required,oneof='Open' 'Under Investigation' 'Pending Review' 'Closed' 'Reopened' 'Archived'"`
	Remarks string `json:"remarks"`
}

type CaseSearchFilter struct {
	Search        string
	Status        string
	CrimeCategory string
	LeadOfficerID uint
	District      string
	DateFrom      string
	DateTo        string
}
