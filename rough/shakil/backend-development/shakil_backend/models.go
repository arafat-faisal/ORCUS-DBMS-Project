package shakil_backend

import "time"

type Contact struct {
	ContactID     uint64 `json:"contact_id"`
	ComplainantID uint64 `json:"complainant_id"`
	ContactType   string `json:"contact_type"`
	ContactValue  string `json:"contact_value"`
	IsPrimary     bool   `json:"is_primary"`
}

type Complainant struct {
	ComplainantID uint64    `json:"complainant_id"`
	Name          string    `json:"name"`
	Contacts      []Contact `json:"contacts,omitempty"`
}

type GD struct {
	GDID          uint64 `json:"gd_id"`
	GDNumber      string `json:"gd_number"`
	GDDate        string `json:"gd_date"`
	Subject       string `json:"subject"`
	ComplainantID *uint64 `json:"complainant_id,omitempty"`
}

type LegalSection struct {
	SectionID    uint64 `json:"section_id"`
	SectionCode  string `json:"section_code"`
	SectionTitle string `json:"section_title"`
	Description  string `json:"description,omitempty"`
}

type FIR struct {
	FIRID         uint64         `json:"fir_id"`
	FIRNumber     string         `json:"fir_number"`
	CrimeCategory string         `json:"crime_category"`
	FiledDate     string         `json:"filed_date"`
	GDID          *uint64        `json:"gd_id,omitempty"`
	LegalSections []LegalSection `json:"legal_sections,omitempty"`
}

type Case struct {
	CaseID       uint64  `json:"case_id"`
	CaseTitle    string  `json:"case_title"`
	Status       string  `json:"status"`
	OpenedDate   string  `json:"opened_date"`
	AssignedDate *string `json:"assigned_date,omitempty"`
	FIRID        *uint64 `json:"fir_id,omitempty"`
}

type CaseStatusHistory struct {
	HistoryID uint64    `json:"history_id"`
	CaseID    uint64    `json:"case_id"`
	Status    string    `json:"status"`
	ChangedAt time.Time `json:"changed_at"`
	Remarks   *string   `json:"remarks,omitempty"`
}

type CaseDossier struct {
	Case          Case                `json:"case"`
	FIR           *FIR                `json:"fir,omitempty"`
	GD            *GD                 `json:"gd,omitempty"`
	Complainant   *Complainant        `json:"complainant,omitempty"`
	LegalSections []LegalSection      `json:"legal_sections,omitempty"`
	StatusHistory []CaseStatusHistory `json:"status_history,omitempty"`
}

type Page[T any] struct {
	Items []T `json:"items"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int `json:"total"`
}
