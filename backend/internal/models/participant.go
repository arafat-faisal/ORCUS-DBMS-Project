// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Participants & Location]
// File: backend/internal/models/participant.go
// Purpose: Models for suspect, victim, witness, location, and junction bridge tables.
//
// [INTEGRATION NOTE]: Standardized by Faisal (241400060) to match the 3NF snake_case
// database schema and unified REST response conventions.
// ============================================================================

package models

import "time"

// Suspect maps to table `suspect`
type Suspect struct {
	SuspectID          uint       `db:"suspect_id" json:"suspect_id"`
	FirstName          string     `db:"first_name" json:"first_name"`
	LastName           string     `db:"last_name" json:"last_name"`
	Age                *int       `db:"age" json:"age,omitempty"`
	DateOfBirth        *time.Time `db:"date_of_birth" json:"date_of_birth,omitempty"`
	IdentificationSign *string    `db:"identification_sign" json:"identification_sign,omitempty"`
	SuspicionLevel     string     `db:"suspicion_level" json:"suspicion_level"`
	Status             string     `db:"status" json:"status"`
}

// Victim maps to table `victim`
type Victim struct {
	VictimID           uint    `db:"victim_id" json:"victim_id"`
	Name               string  `db:"name" json:"name"`
	Phone              *string `db:"phone" json:"phone,omitempty"`
	Age                *int    `db:"age" json:"age,omitempty"`
	IdentificationSign *string `db:"identification_sign" json:"identification_sign,omitempty"`
	ConditionNotes     *string `db:"condition_notes" json:"condition_notes,omitempty"`
	IsDeceased         bool    `db:"is_deceased" json:"is_deceased"`
}

// Witness maps to table `witness`
type Witness struct {
	WitnessID          uint    `db:"witness_id" json:"witness_id"`
	Name               string  `db:"name" json:"name"`
	Phone              *string `db:"phone" json:"phone,omitempty"`
	Age                *int    `db:"age" json:"age,omitempty"`
	IdentificationSign *string `db:"identification_sign" json:"identification_sign,omitempty"`
	Reliability        string  `db:"reliability" json:"reliability"`
	IsProtected        bool    `db:"is_protected" json:"is_protected"`
	StatementSummary   *string `db:"statement_summary" json:"statement_summary,omitempty"`
}

// Location maps to table `location`
type Location struct {
	LocationID     uint    `db:"location_id" json:"location_id"`
	GPSCoordinates *string `db:"gps_coordinates" json:"gps_coordinates,omitempty"`
	Address        string  `db:"address" json:"address"`
	Area           string  `db:"area" json:"area"`
	City           string  `db:"city" json:"city"`
}

// Junction Table Link Structs

type CaseSuspectLink struct {
	CaseID             uint    `db:"case_id" json:"case_id"`
	SuspectID          uint    `db:"suspect_id" json:"suspect_id"`
	FirstName          string  `db:"first_name" json:"first_name"`
	LastName           string  `db:"last_name" json:"last_name"`
	SuspicionLevel     string  `db:"suspicion_level" json:"suspicion_level"`
	Status             string  `db:"status" json:"status"`
	IdentificationSign *string `db:"identification_sign" json:"identification_sign,omitempty"`
	RoleInCrime        *string `db:"role_in_crime" json:"role_in_crime,omitempty"`
}

type CaseVictimLink struct {
	CaseID     uint    `db:"case_id" json:"case_id"`
	VictimID   uint    `db:"victim_id" json:"victim_id"`
	Name       string  `db:"name" json:"name"`
	Phone      *string `db:"phone" json:"phone,omitempty"`
	IsDeceased bool    `db:"is_deceased" json:"is_deceased"`
	ImpactType *string `db:"impact_type" json:"impact_type,omitempty"`
}

type CaseWitnessLink struct {
	CaseID           uint    `db:"case_id" json:"case_id"`
	WitnessID        uint    `db:"witness_id" json:"witness_id"`
	Name             string  `db:"name" json:"name"`
	Reliability      string  `db:"reliability" json:"reliability"`
	IsProtected      bool    `db:"is_protected" json:"is_protected"`
	TestimonySummary *string `db:"testimony_summary" json:"testimony_summary,omitempty"`
}

type CaseLocationLink struct {
	CaseID         uint    `db:"case_id" json:"case_id"`
	LocationID     uint    `db:"location_id" json:"location_id"`
	Address        string  `db:"address" json:"address"`
	Area           string  `db:"area" json:"area"`
	City           string  `db:"city" json:"city"`
	GPSCoordinates *string `db:"gps_coordinates" json:"gps_coordinates,omitempty"`
	LocationRole   string  `db:"location_role" json:"location_role"`
}

// SuspectDossier maps to SQL View `v_suspect_dossier`
type SuspectDossierItem struct {
	SuspectID          uint    `db:"suspect_id" json:"suspect_id"`
	SuspectName        string  `db:"suspect_name" json:"suspect_name"`
	Age                *int    `db:"age" json:"age,omitempty"`
	SuspicionLevel     string  `db:"suspicion_level" json:"suspicion_level"`
	SuspectStatus      string  `db:"suspect_status" json:"suspect_status"`
	IdentificationSign *string `db:"identification_sign" json:"identification_sign,omitempty"`
	CaseID             uint    `db:"case_id" json:"case_id"`
	CaseTitle          string  `db:"case_title" json:"case_title"`
	CaseStatus         string  `db:"case_status" json:"case_status"`
	RoleInCrime        *string `db:"role_in_crime" json:"role_in_crime,omitempty"`
}

// DTOs for Participants & Locations

type CreateSuspectRequest struct {
	FirstName          string  `json:"first_name" binding:"required,max=50"`
	LastName           string  `json:"last_name" binding:"required,max=50"`
	Age                *int    `json:"age"`
	DateOfBirth        *string `json:"date_of_birth"` // YYYY-MM-DD
	IdentificationSign *string `json:"identification_sign"`
	SuspicionLevel     string  `json:"suspicion_level" binding:"required,oneof=Low Medium High"`
	Status             string  `json:"status"`
}

type CreateVictimRequest struct {
	Name               string  `json:"name" binding:"required,max=100"`
	Phone              *string `json:"phone"`
	Age                *int    `json:"age"`
	IdentificationSign *string `json:"identification_sign"`
	ConditionNotes     *string `json:"condition_notes"`
	IsDeceased         bool    `json:"is_deceased"`
}

type CreateWitnessRequest struct {
	Name               string  `json:"name" binding:"required,max=100"`
	Phone              *string `json:"phone"`
	Age                *int    `json:"age"`
	IdentificationSign *string `json:"identification_sign"`
	Reliability        string  `json:"reliability" binding:"required"`
	IsProtected        bool    `json:"is_protected"`
	StatementSummary   *string `json:"statement_summary"`
}

type CreateLocationRequest struct {
	GPSCoordinates *string `json:"gps_coordinates"`
	Address        string  `json:"address" binding:"required,max=255"`
	Area           string  `json:"area" binding:"required,max=100"`
	City           string  `json:"city" binding:"required,max=100"`
}

type LinkParticipantRequest struct {
	ParticipantID uint   `json:"participant_id" binding:"required"`
	RoleOrImpact  string `json:"role_or_impact"`
}
