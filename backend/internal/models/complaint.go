package models

import "time"

// ComplaintCategory maps to table `complaint_category`
type ComplaintCategory struct {
	CategoryID   uint      `db:"category_id" json:"category_id"`
	NameEn       string    `db:"name_en" json:"name_en"`
	NameBn       string    `db:"name_bn" json:"name_bn"`
	Description  *string   `db:"description" json:"description,omitempty"`
	IsCognizable bool      `db:"is_cognizable" json:"is_cognizable"`
	CreatedAt    time.Time `db:"created_at" json:"created_at"`
}

// Complaint maps to table `complaint`
type Complaint struct {
	ComplaintID          uint       `db:"complaint_id" json:"complaint_id"`
	TrackingCode         string     `db:"tracking_code" json:"tracking_code"`
	ComplainantID        uint       `db:"complainant_id" json:"complainant_id"`
	SubmissionChannel    string     `db:"submission_channel" json:"submission_channel"`
	Title                string     `db:"title" json:"title"`
	Description          string     `db:"description" json:"description"`
	IncidentDate         string     `db:"incident_date" json:"incident_date"`
	IncidentTime         *string    `db:"incident_time" json:"incident_time,omitempty"`
	ApproximateTime      bool       `db:"approximate_time" json:"approximate_time"`
	LocationID           *uint      `db:"location_id" json:"location_id,omitempty"`
	ComplaintCategoryID  *uint      `db:"complaint_category_id" json:"complaint_category_id,omitempty"`
	Urgency              string     `db:"urgency" json:"urgency"`
	ReceivingBranchID    uint       `db:"receiving_branch_id" json:"receiving_branch_id"`
	AssignedReviewerID   *uint      `db:"assigned_reviewer_id" json:"assigned_reviewer_id,omitempty"`
	CurrentStatus        string     `db:"current_status" json:"current_status"`
	ConfidentialityLevel string     `db:"confidentiality_level" json:"confidentiality_level"`
	PublicStatusMessage  *string    `db:"public_status_message" json:"public_status_message,omitempty"`
	InternalNotes        *string    `db:"internal_notes" json:"internal_notes,omitempty"`
	SubmittedAt          time.Time  `db:"submitted_at" json:"submitted_at"`
	ReviewedAt           *time.Time `db:"reviewed_at" json:"reviewed_at,omitempty"`
	ClosedAt             *time.Time `db:"closed_at" json:"closed_at,omitempty"`
	CreatedByUserID      *uint      `db:"created_by_user_id" json:"created_by_user_id,omitempty"`
	UpdatedAt            time.Time  `db:"updated_at" json:"updated_at"`
	Version              uint       `db:"version" json:"version"`

	// Joined informational fields for display
	ComplainantName  string  `db:"complainant_name" json:"complainant_name,omitempty"`
	ComplainantPhone string  `db:"complainant_phone" json:"complainant_phone,omitempty"`
	CategoryName     string  `db:"category_name" json:"category_name,omitempty"`
	BranchName       string  `db:"branch_name" json:"branch_name,omitempty"`
	ReviewerName     *string `db:"reviewer_name" json:"reviewer_name,omitempty"`
}

// ComplaintStatusHistory maps to table `complaint_status_history`
type ComplaintStatusHistory struct {
	HistoryID      uint      `db:"history_id" json:"history_id"`
	ComplaintID    uint      `db:"complaint_id" json:"complaint_id"`
	PreviousStatus *string   `db:"previous_status" json:"previous_status,omitempty"`
	NewStatus      string    `db:"new_status" json:"new_status"`
	Decision       string    `db:"decision" json:"decision"`
	Reason         *string   `db:"reason" json:"reason,omitempty"`
	ActingUserID   *uint     `db:"acting_user_id" json:"acting_user_id,omitempty"`
	ActingBranchID *uint     `db:"acting_branch_id" json:"acting_branch_id,omitempty"`
	CreatedAt      time.Time `db:"created_at" json:"created_at"`

	// Joined details
	ActingUsername string `db:"acting_username" json:"acting_username,omitempty"`
	ActingBranch   string `db:"acting_branch" json:"acting_branch,omitempty"`
}

// ComplaintTransferHistory maps to table `complaint_transfer_history`
type ComplaintTransferHistory struct {
	TransferID          uint      `db:"transfer_id" json:"transfer_id"`
	ComplaintID         uint      `db:"complaint_id" json:"complaint_id"`
	FromBranchID        uint      `db:"from_branch_id" json:"from_branch_id"`
	ToBranchID          uint      `db:"to_branch_id" json:"to_branch_id"`
	TransferReason      string    `db:"transfer_reason" json:"transfer_reason"`
	TransferredByUserID uint      `db:"transferred_by_user_id" json:"transferred_by_user_id"`
	TransferredAt       time.Time `db:"transferred_at" json:"transferred_at"`

	FromBranchName string `db:"from_branch_name" json:"from_branch_name,omitempty"`
	ToBranchName   string `db:"to_branch_name" json:"to_branch_name,omitempty"`
	TransferredBy  string `db:"transferred_by" json:"transferred_by,omitempty"`
}

// Request & Response DTOs

type CreateComplaintRequest struct {
	ComplainantID        uint    `json:"complainant_id"`
	SubmissionChannel    string  `json:"submission_channel"`
	Title                string  `json:"title"`
	Description          string  `json:"description"`
	IncidentDate         string  `json:"incident_date"`
	IncidentTime         *string `json:"incident_time,omitempty"`
	ApproximateTime      bool    `json:"approximate_time"`
	LocationID           *uint   `json:"location_id,omitempty"`
	ComplaintCategoryID  *uint   `json:"complaint_category_id,omitempty"`
	Urgency              string  `json:"urgency"`
	ReceivingBranchID    uint    `json:"receiving_branch_id"`
	ConfidentialityLevel string  `json:"confidentiality_level"`
	InternalNotes        *string `json:"internal_notes,omitempty"`
}

type PublicSubmitComplaintRequest struct {
	// Complainant Details (Created or matched safely)
	ComplainantName string `json:"complainant_name"`
	ContactPhone    string `json:"contact_phone"`
	ContactEmail    string `json:"contact_email,omitempty"`
	NID             string `json:"nid,omitempty"`
	Address         string `json:"address,omitempty"`

	// Complaint Details
	Title               string  `json:"title"`
	Description         string  `json:"description"`
	IncidentDate        string  `json:"incident_date"`
	IncidentTime        *string `json:"incident_time,omitempty"`
	ApproximateTime     bool    `json:"approximate_time"`
	ComplaintCategoryID *uint   `json:"complaint_category_id,omitempty"`
	ReceivingBranchID   uint    `json:"receiving_branch_id"`
	DivisionID          *uint   `json:"division_id,omitempty"`
	DistrictID          *uint   `json:"district_id,omitempty"`
	ThanaID             *uint   `json:"thana_id,omitempty"`
}

type PublicTrackResponse struct {
	TrackingCode        string    `json:"tracking_code"`
	SubmissionDate      time.Time `json:"submission_date"`
	CurrentStatus       string    `json:"current_status"`
	PublicStatusMessage string    `json:"public_status_message"`
	ReceivingBranch     string    `json:"receiving_branch"`
	ContactPhone        string    `json:"contact_phone"`
	LastUpdated         time.Time `json:"last_updated"`
}

type AssessComplaintRequest struct {
	NewStatus           string  `json:"new_status"`
	Decision            string  `json:"decision"`
	Reason              string  `json:"reason"`
	PublicStatusMessage string  `json:"public_status_message,omitempty"`
	InternalNotes       *string `json:"internal_notes,omitempty"`
	AssignedReviewerID  *uint   `json:"assigned_reviewer_id,omitempty"`
}

type ComplaintFilter struct {
	Status     string `json:"status"`
	BranchID   *uint  `json:"branch_id"`
	CategoryID *uint  `json:"category_id"`
	Search     string `json:"search"`
	StartDate  string `json:"start_date"`
	EndDate    string `json:"end_date"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
}
