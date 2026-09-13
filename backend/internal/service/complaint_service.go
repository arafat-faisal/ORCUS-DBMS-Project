package service

import (
	"errors"
	"fmt"
	"strings"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type ComplaintService interface {
	GetCategories() ([]models.ComplaintCategory, error)
	CreateOfficerComplaint(req models.CreateComplaintRequest, userID uint) (*models.Complaint, error)
	SubmitPublicComplaint(req models.PublicSubmitComplaintRequest) (*models.Complaint, error)
	GetComplaint(id uint) (*models.Complaint, error)
	TrackPublicComplaint(trackingCode string, phone string) (*models.PublicTrackResponse, error)
	AssessComplaint(complaintID uint, req models.AssessComplaintRequest, actingUserID uint, actingBranchID uint) (*models.Complaint, error)
	TransferComplaint(complaintID uint, toBranchID uint, reason string, actingUserID uint) error
	ListComplaints(filter models.ComplaintFilter) ([]models.Complaint, int, error)
	GetStatusHistory(complaintID uint) ([]models.ComplaintStatusHistory, error)
	GetTransferHistory(complaintID uint) ([]models.ComplaintTransferHistory, error)
	DeleteComplaint(complaintID uint) error
}

type complaintService struct {
	repo       repository.ComplaintRepository
	intakeRepo *repository.IntakeRepository
	seqService SequenceService
	auditSvc   *AuditService
}

func NewComplaintService(
	repo repository.ComplaintRepository,
	intakeRepo *repository.IntakeRepository,
	seqService SequenceService,
	auditSvc *AuditService,
) ComplaintService {
	return &complaintService{
		repo:       repo,
		intakeRepo: intakeRepo,
		seqService: seqService,
		auditSvc:   auditSvc,
	}
}

func (s *complaintService) GetCategories() ([]models.ComplaintCategory, error) {
	return s.repo.GetCategories()
}

func (s *complaintService) CreateOfficerComplaint(req models.CreateComplaintRequest, userID uint) (*models.Complaint, error) {
	if strings.TrimSpace(req.Title) == "" {
		return nil, errors.New("complaint title is required")
	}
	if strings.TrimSpace(req.Description) == "" {
		return nil, errors.New("complaint description is required")
	}
	if req.ComplainantID == 0 {
		return nil, errors.New("valid complainant_id is required")
	}
	if req.ReceivingBranchID == 0 {
		return nil, errors.New("receiving_branch_id is required")
	}

	tx, err := s.repo.BeginTx()
	if err != nil {
		return nil, fmt.Errorf("transaction begin failed: %w", err)
	}
	defer tx.Rollback()

	branchCode, _ := s.repo.GetBranchCode(req.ReceivingBranchID)
	trackingCode, err := s.seqService.GenerateComplaintTrackingCode(tx, branchCode)
	if err != nil {
		return nil, fmt.Errorf("tracking code generation failed: %w", err)
	}

	confLevel := req.ConfidentialityLevel
	if confLevel == "" {
		confLevel = "Standard"
	}

	urgency := req.Urgency
	if urgency == "" {
		urgency = "Medium"
	}

	channel := req.SubmissionChannel
	if channel == "" {
		channel = "Officer Entry"
	}

	initialMsg := "Complaint registered at intake desk. Awaiting initial officer review."

	c := &models.Complaint{
		TrackingCode:         trackingCode,
		ComplainantID:        req.ComplainantID,
		SubmissionChannel:    channel,
		Title:                req.Title,
		Description:          req.Description,
		IncidentDate:         req.IncidentDate,
		IncidentTime:         req.IncidentTime,
		ApproximateTime:      req.ApproximateTime,
		LocationID:           req.LocationID,
		ComplaintCategoryID:  req.ComplaintCategoryID,
		Urgency:              urgency,
		ReceivingBranchID:    req.ReceivingBranchID,
		CurrentStatus:        "Submitted",
		ConfidentialityLevel: confLevel,
		PublicStatusMessage:  &initialMsg,
		InternalNotes:        req.InternalNotes,
		CreatedByUserID:      &userID,
	}

	complaintID, err := s.repo.CreateComplaint(tx, c)
	if err != nil {
		return nil, fmt.Errorf("failed to insert complaint: %w", err)
	}
	c.ComplaintID = complaintID

	// Write initial status history entry
	history := &models.ComplaintStatusHistory{
		ComplaintID:    complaintID,
		PreviousStatus: nil,
		NewStatus:      "Submitted",
		Decision:       "Initial Registration",
		Reason:         &initialMsg,
		ActingUserID:   &userID,
		ActingBranchID: &req.ReceivingBranchID,
	}
	if err := s.repo.AddStatusHistory(tx, history); err != nil {
		return nil, fmt.Errorf("failed to record status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("transaction commit failed: %w", err)
	}

	return s.repo.GetComplaintByID(complaintID)
}

func (s *complaintService) SubmitPublicComplaint(req models.PublicSubmitComplaintRequest) (*models.Complaint, error) {
	if strings.TrimSpace(req.ComplainantName) == "" {
		return nil, errors.New("complainant name is required")
	}
	if strings.TrimSpace(req.ContactPhone) == "" {
		return nil, errors.New("contact phone number is required")
	}
	if strings.TrimSpace(req.Title) == "" {
		return nil, errors.New("complaint title is required")
	}
	if strings.TrimSpace(req.Description) == "" {
		return nil, errors.New("complaint description is required")
	}

	// Normalize mobile number
	normPhone, err := NormalizeBDMobile(req.ContactPhone)
	if err != nil {
		return nil, err
	}

	tx, err := s.repo.BeginTx()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// Create complainant record
	var complainantID uint
	compRes, err := tx.Exec("INSERT INTO complainant (name) VALUES (?)", strings.TrimSpace(req.ComplainantName))
	if err != nil {
		return nil, fmt.Errorf("failed to create complainant: %w", err)
	}
	cid, _ := compRes.LastInsertId()
	complainantID = uint(cid)

	// Add phone contact
	_, err = tx.Exec("INSERT INTO complainant_contact (complainant_id, contact_type, contact_value, is_primary) VALUES (?, 'phone', ?, TRUE)", complainantID, normPhone)
	if err != nil {
		return nil, fmt.Errorf("failed to save complainant phone: %w", err)
	}

	// Branch ID default to 1 (HQ / Motijheel) if unspecified
	branchID := req.ReceivingBranchID
	if branchID == 0 {
		branchID = 1
	}

	branchCode, _ := s.repo.GetBranchCode(branchID)
	trackingCode, err := s.seqService.GenerateComplaintTrackingCode(tx, branchCode)
	if err != nil {
		return nil, fmt.Errorf("tracking code generation failed: %w", err)
	}

	initialMsg := "Complaint received via Online Citizen Portal. Assigned to desk for preliminary review."

	c := &models.Complaint{
		TrackingCode:         trackingCode,
		ComplainantID:        complainantID,
		SubmissionChannel:    "Public Online",
		Title:                strings.TrimSpace(req.Title),
		Description:          strings.TrimSpace(req.Description),
		IncidentDate:         req.IncidentDate,
		IncidentTime:         req.IncidentTime,
		ApproximateTime:      req.ApproximateTime,
		ComplaintCategoryID:  req.ComplaintCategoryID,
		Urgency:              "Medium",
		ReceivingBranchID:    branchID,
		CurrentStatus:        "Submitted",
		ConfidentialityLevel: "Standard",
		PublicStatusMessage:  &initialMsg,
	}

	complaintID, err := s.repo.CreateComplaint(tx, c)
	if err != nil {
		return nil, fmt.Errorf("failed to save complaint: %w", err)
	}
	c.ComplaintID = complaintID

	// Write initial status history
	history := &models.ComplaintStatusHistory{
		ComplaintID:    complaintID,
		PreviousStatus: nil,
		NewStatus:      "Submitted",
		Decision:       "Online Citizen Submission",
		Reason:         &initialMsg,
		ActingUserID:   nil,
		ActingBranchID: &branchID,
	}
	if err := s.repo.AddStatusHistory(tx, history); err != nil {
		return nil, fmt.Errorf("failed to save status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit complaint transaction: %w", err)
	}

	return s.repo.GetComplaintByID(complaintID)
}

func (s *complaintService) GetComplaint(id uint) (*models.Complaint, error) {
	return s.repo.GetComplaintByID(id)
}

func (s *complaintService) TrackPublicComplaint(trackingCode string, phone string) (*models.PublicTrackResponse, error) {
	cleanCode := strings.TrimSpace(trackingCode)
	if cleanCode == "" {
		return nil, errors.New("tracking code is required")
	}

	normPhone, err := NormalizeBDMobile(phone)
	if err != nil {
		return nil, fmt.Errorf("invalid verification phone: %w", err)
	}

	complaint, err := s.repo.GetComplaintByTrackingCode(cleanCode)
	if err != nil {
		return nil, errors.New("no complaint found matching the provided tracking reference")
	}

	// Verify phone matches complainant contact (Second factor for prototype)
	cleanStoredPhone := strings.ReplaceAll(complaint.ComplainantPhone, " ", "")
	if cleanStoredPhone != normPhone && !strings.HasSuffix(normPhone, cleanStoredPhone) && !strings.HasSuffix(cleanStoredPhone, normPhone[4:]) {
		return nil, errors.New("verification factor mismatch. Enter the mobile number used during complaint submission.")
	}

	publicMsg := "Your complaint has been registered and is under official assessment."
	if complaint.PublicStatusMessage != nil && *complaint.PublicStatusMessage != "" {
		publicMsg = *complaint.PublicStatusMessage
	}

	return &models.PublicTrackResponse{
		TrackingCode:        complaint.TrackingCode,
		SubmissionDate:      complaint.SubmittedAt,
		CurrentStatus:       complaint.CurrentStatus,
		PublicStatusMessage: publicMsg,
		ReceivingBranch:     complaint.BranchName,
		ContactPhone:        FormatBDMobileReadable(normPhone),
		LastUpdated:         complaint.UpdatedAt,
	}, nil
}

func (s *complaintService) AssessComplaint(complaintID uint, req models.AssessComplaintRequest, actingUserID uint, actingBranchID uint) (*models.Complaint, error) {
	complaint, err := s.repo.GetComplaintByID(complaintID)
	if err != nil {
		return nil, fmt.Errorf("complaint not found: %w", err)
	}

	// Valid status transitions from current status
	validTransitions := map[string][]string{
		"Submitted": {
			"Under Review", "Correction Required", "Verified",
			"Converted to GD", "Converted to FIR", "Transferred",
			"Rejected", "Resolved", "Closed",
		},
		"Under Review": {
			"Correction Required", "Verified", "Converted to GD",
			"Converted to FIR", "Transferred", "Rejected", "Resolved", "Closed",
		},
		"Correction Required": {
			"Submitted", "Under Review", "Verified", "Rejected", "Closed",
		},
		"Verified": {
			"Converted to GD", "Converted to FIR", "Transferred", "Resolved", "Closed",
		},
		"Transferred": {
			"Under Review", "Verified", "Rejected", "Closed",
		},
		"Converted to GD": {
			"Converted to FIR", "Resolved", "Closed",
		},
		"Converted to FIR": {
			"Closed",
		},
		"Resolved": {
			"Closed",
		},
		"Rejected": {},
		"Closed":   {},
	}

	allowed, ok := validTransitions[complaint.CurrentStatus]
	if !ok {
		return nil, fmt.Errorf("invalid current status: %s", complaint.CurrentStatus)
	}

	isAllowed := false
	for _, st := range allowed {
		if st == req.NewStatus {
			isAllowed = true
			break
		}
	}
	if !isAllowed {
		return nil, fmt.Errorf("invalid status transition from '%s' to '%s'", complaint.CurrentStatus, req.NewStatus)
	}

	tx, err := s.repo.BeginTx()
	if err != nil {
		return nil, fmt.Errorf("transaction begin failed: %w", err)
	}
	defer tx.Rollback()

	var pubMsg *string
	if req.PublicStatusMessage != "" {
		pubMsg = &req.PublicStatusMessage
	}

	err = s.repo.UpdateComplaintStatus(tx, complaintID, req.NewStatus, pubMsg, req.InternalNotes, req.AssignedReviewerID, complaint.Version)
	if err != nil {
		return nil, err
	}

	// Add status history
	prevStatus := complaint.CurrentStatus
	history := &models.ComplaintStatusHistory{
		ComplaintID:    complaintID,
		PreviousStatus: &prevStatus,
		NewStatus:      req.NewStatus,
		Decision:       req.Decision,
		Reason:         &req.Reason,
		ActingUserID:   &actingUserID,
		ActingBranchID: &actingBranchID,
	}
	if err := s.repo.AddStatusHistory(tx, history); err != nil {
		return nil, fmt.Errorf("failed to record status history: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("transaction commit failed: %w", err)
	}

	return s.repo.GetComplaintByID(complaintID)
}

func (s *complaintService) TransferComplaint(complaintID uint, toBranchID uint, reason string, actingUserID uint) error {
	complaint, err := s.repo.GetComplaintByID(complaintID)
	if err != nil {
		return fmt.Errorf("complaint not found: %w", err)
	}

	if complaint.ReceivingBranchID == toBranchID {
		return errors.New("cannot transfer complaint to the same branch")
	}
	if strings.TrimSpace(reason) == "" {
		return errors.New("transfer reason is required")
	}

	tx, err := s.repo.BeginTx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update receiving branch and status to 'Transferred'
	transferMsg := fmt.Sprintf("Complaint transferred to jurisdictional branch for further inquiry.")
	_, err = tx.Exec(`UPDATE complaint SET 
		receiving_branch_id = ?, 
		current_status = 'Transferred', 
		public_status_message = ?, 
		version = version + 1 
		WHERE complaint_id = ? AND version = ?`,
		toBranchID, transferMsg, complaintID, complaint.Version)
	if err != nil {
		return err
	}

	// Record transfer history
	transfer := &models.ComplaintTransferHistory{
		ComplaintID:         complaintID,
		FromBranchID:        complaint.ReceivingBranchID,
		ToBranchID:          toBranchID,
		TransferReason:      reason,
		TransferredByUserID: actingUserID,
	}
	if err := s.repo.RecordTransfer(tx, transfer); err != nil {
		return err
	}

	// Record status history
	prevStatus := complaint.CurrentStatus
	history := &models.ComplaintStatusHistory{
		ComplaintID:    complaintID,
		PreviousStatus: &prevStatus,
		NewStatus:      "Transferred",
		Decision:       "Jurisdictional Transfer",
		Reason:         &reason,
		ActingUserID:   &actingUserID,
		ActingBranchID: &complaint.ReceivingBranchID,
	}
	if err := s.repo.AddStatusHistory(tx, history); err != nil {
		return err
	}

	return tx.Commit()
}

func (s *complaintService) ListComplaints(filter models.ComplaintFilter) ([]models.Complaint, int, error) {
	return s.repo.ListComplaints(filter)
}

func (s *complaintService) GetStatusHistory(complaintID uint) ([]models.ComplaintStatusHistory, error) {
	return s.repo.GetStatusHistory(complaintID)
}

func (s *complaintService) GetTransferHistory(complaintID uint) ([]models.ComplaintTransferHistory, error) {
	return s.repo.GetTransferHistory(complaintID)
}

func (s *complaintService) DeleteComplaint(complaintID uint) error {
	return s.repo.DeleteComplaint(complaintID)
}
