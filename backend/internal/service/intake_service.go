// ============================================================================
// File: backend/internal/service/intake_service.go
// Purpose: Business logic for Complainants, General Diary (GD), FIR, and Legal Sections.
// Workflow: GD State Machine, FIR State Machine, Server-side Identifiers, and Transactional Conversions.
// ============================================================================

package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

var (
	ErrInvalidGDTransition  = errors.New("invalid GD status transition")
	ErrInvalidFIRTransition = errors.New("invalid FIR status transition")
	ErrGDAlreadyLinked      = errors.New("GD is already linked to an FIR")
)

var validGDTransitions = map[string][]string{
	"Draft":                  {"Submitted for Approval"},
	"Submitted for Approval": {"Approved", "Closed"},
	"Approved":               {"Assigned for Inquiry", "Linked to FIR", "Closed"},
	"Assigned for Inquiry":   {"Inquiry in Progress", "Closed"},
	"Inquiry in Progress":    {"Resolved", "Closed", "Linked to FIR"},
	"Resolved":               {"Closed"},
	"Linked to FIR":          {"Closed"},
}

var validFIRTransitions = map[string][]string{
	"Draft":                      {"Submitted for Verification"},
	"Submitted for Verification": {"Verified", "Closed"},
	"Verified":                   {"Registered", "Closed"},
	"Registered":                 {"Investigation Pending", "Case Opened", "Linked to Existing Case", "Closed"},
	"Investigation Pending":      {"Case Opened", "Linked to Existing Case", "Closed"},
	"Case Opened":                {"Closed", "Archived"},
	"Linked to Existing Case":    {"Closed", "Archived"},
	"Closed":                     {"Archived"},
}

type IntakeService struct {
	intakeRepo *repository.IntakeRepository
	seqService SequenceService
}

func NewIntakeService(intakeRepo *repository.IntakeRepository, seqService SequenceService) *IntakeService {
	return &IntakeService{
		intakeRepo: intakeRepo,
		seqService: seqService,
	}
}

// ----------------------------------------------------------------------------
// Complainants
// ----------------------------------------------------------------------------

func (s *IntakeService) CreateComplainant(ctx context.Context, req *models.CreateComplainantRequest) (*models.Complainant, error) {
	id, err := s.intakeRepo.CreateComplainantWithContacts(ctx, req)
	if err != nil {
		return nil, err
	}
	return s.intakeRepo.GetComplainantByID(ctx, id)
}

func (s *IntakeService) ListComplainants(ctx context.Context) ([]models.Complainant, error) {
	return s.intakeRepo.GetAllComplainants(ctx)
}

func (s *IntakeService) GetComplainant(ctx context.Context, id uint) (*models.Complainant, error) {
	return s.intakeRepo.GetComplainantByID(ctx, id)
}

// ----------------------------------------------------------------------------
// General Diary (GD) Workflow
// ----------------------------------------------------------------------------

func (s *IntakeService) CreateGD(ctx context.Context, req *models.CreateGDRequest, actingUserID *uint) (*models.GD, error) {
	branchID := req.BranchID
	if branchID == 0 {
		branchID = 1
	}

	// Auto-generate GD number server-side if not provided
	gdNumber := strings.TrimSpace(req.GDNumber)
	if gdNumber == "" {
		branchCode, _ := s.intakeRepo.GetBranchCode(ctx, branchID)
		generated, err := s.seqService.GenerateGDNumber(nil, branchCode)
		if err != nil {
			return nil, fmt.Errorf("failed to generate GD number: %w", err)
		}
		gdNumber = generated
	}

	gdDate, _ := time.Parse("2006-01-02", req.GDDate)
	if gdDate.IsZero() {
		gdDate = time.Now()
	}

	var place *string
	if req.IncidentPlace != "" {
		place = &req.IncidentPlace
	}

	gd := &models.GD{
		GDNumber:         gdNumber,
		BranchID:         branchID,
		GDDate:           gdDate,
		Subject:          req.Subject,
		CurrentStatus:    "Approved",
		IncidentPlace:    place,
		ComplainantID:    req.ComplainantID,
		ComplaintID:      req.ComplaintID,
		CreatedByUserID:  actingUserID,
		ApprovedByUserID: actingUserID,
	}
	now := time.Now()
	gd.ApprovedAt = &now

	reason := "General Diary entry created and registered at station"
	hist := &models.GDStatusHistory{
		NewStatus:    "Approved",
		Decision:     "General Diary Approved",
		Reason:       &reason,
		ActingUserID: actingUserID,
		CreatedAt:    now,
	}

	id, err := s.intakeRepo.CreateGDWithHistory(ctx, gd, hist, req.ComplaintID)
	if err != nil {
		return nil, err
	}
	return s.intakeRepo.GetGDByID(ctx, id)
}

func (s *IntakeService) FilterGDs(ctx context.Context, complainantID uint, branchID uint, status string, search string) ([]models.GD, error) {
	return s.intakeRepo.FilterGDs(ctx, complainantID, branchID, status, search)
}

func (s *IntakeService) ListGDs(ctx context.Context, complainantID uint) ([]models.GD, error) {
	return s.intakeRepo.GetAllGDs(ctx, complainantID)
}

func (s *IntakeService) GetGD(ctx context.Context, id uint) (*models.GD, error) {
	return s.intakeRepo.GetGDByID(ctx, id)
}

func (s *IntakeService) GetGDHistory(ctx context.Context, gdID uint) ([]models.GDStatusHistory, error) {
	return s.intakeRepo.GetGDHistory(ctx, gdID)
}

func (s *IntakeService) UpdateGDStatus(
	ctx context.Context,
	gdID uint,
	req *models.UpdateGDStatusRequest,
	actingUserID *uint,
) error {
	existing, err := s.intakeRepo.GetGDByID(ctx, gdID)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("GD record not found")
	}

	// Validate status transition
	current := existing.CurrentStatus
	allowed, exists := validGDTransitions[current]
	if !exists {
		return fmt.Errorf("%w: terminal state '%s'", ErrInvalidGDTransition, current)
	}

	isAllowed := false
	for _, target := range allowed {
		if target == req.NewStatus {
			isAllowed = true
			break
		}
	}
	if !isAllowed {
		return fmt.Errorf("%w: cannot transition from '%s' to '%s'", ErrInvalidGDTransition, current, req.NewStatus)
	}

	return s.intakeRepo.UpdateGDStatus(
		ctx,
		gdID,
		current,
		req.NewStatus,
		req.Decision,
		req.Reason,
		actingUserID,
	)
}

// ConvertComplaintToGD converts an assessed complaint to a formal GD in a single database transaction
func (s *IntakeService) ConvertComplaintToGD(
	ctx context.Context,
	complaintID uint,
	req *models.ConvertComplaintToGDRequest,
	complainantID uint,
	branchID uint,
	actingUserID *uint,
) (*models.GD, error) {
	branchCode, _ := s.intakeRepo.GetBranchCode(ctx, branchID)
	gdNumber, err := s.seqService.GenerateGDNumber(nil, branchCode)
	if err != nil {
		return nil, fmt.Errorf("failed to generate GD number for conversion: %w", err)
	}

	now := time.Now()
	var place *string
	if req.IncidentPlace != "" {
		place = &req.IncidentPlace
	}

	gd := &models.GD{
		GDNumber:         gdNumber,
		BranchID:         branchID,
		GDDate:           now,
		Subject:          req.Subject,
		CurrentStatus:    "Approved",
		IncidentPlace:    place,
		ComplainantID:    complainantID,
		ComplaintID:      &complaintID,
		CreatedByUserID:  actingUserID,
		ApprovedByUserID: actingUserID,
		ApprovedAt:       &now,
	}

	reason := fmt.Sprintf("General Diary registered from evaluated complaint ID #%d", complaintID)
	hist := &models.GDStatusHistory{
		NewStatus:    "Approved",
		Decision:     "Approved from Citizen Complaint",
		Reason:       &reason,
		ActingUserID: actingUserID,
		CreatedAt:    now,
	}

	id, err := s.intakeRepo.CreateGDWithHistory(ctx, gd, hist, &complaintID)
	if err != nil {
		return nil, err
	}

	return s.intakeRepo.GetGDByID(ctx, id)
}

// ----------------------------------------------------------------------------
// FIR Workflow
// ----------------------------------------------------------------------------

func (s *IntakeService) CreateFIR(ctx context.Context, req *models.CreateFIRRequest, actingUserID *uint) (*models.FIR, error) {
	branchID := req.BranchID
	if branchID == 0 {
		branchID = 1
	}

	// Auto-generate FIR number server-side if not provided
	firNumber := strings.TrimSpace(req.FIRNumber)
	if firNumber == "" {
		branchCode, _ := s.intakeRepo.GetBranchCode(ctx, branchID)
		generated, err := s.seqService.GenerateFIRNumber(nil, branchCode)
		if err != nil {
			return nil, fmt.Errorf("failed to generate FIR number: %w", err)
		}
		firNumber = generated
	}

	filedDate, _ := time.Parse("2006-01-02", req.FiledDate)
	if filedDate.IsZero() {
		filedDate = time.Now()
	}

	var incDate *time.Time
	if req.IncidentDate != "" {
		t, err := time.Parse("2006-01-02", req.IncidentDate)
		if err == nil {
			incDate = &t
		}
	}

	var incTime *string
	if req.IncidentTime != "" {
		incTime = &req.IncidentTime
	}

	var place *string
	if req.PlaceOfOccurrence != "" {
		place = &req.PlaceOfOccurrence
	}

	now := time.Now()
	fir := &models.FIR{
		FIRNumber:         firNumber,
		BranchID:          branchID,
		ComplainantID:     req.ComplainantID,
		CrimeCategory:     req.CrimeCategory,
		CurrentStatus:     "Registered",
		PlaceOfOccurrence: place,
		IncidentDate:      incDate,
		IncidentTime:      incTime,
		FiledDate:         filedDate,
		GDID:              req.GDID,
		SourceComplaintID: req.SourceComplaintID,
		SourceType:        req.SourceType,
		CreatedByUserID:   actingUserID,
		ApprovedByUserID:  actingUserID,
		ApprovedAt:        &now,
	}

	reason := "First Information Report officially registered at station"
	hist := &models.FIRStatusHistory{
		NewStatus:    "Registered",
		Decision:     "First Information Report Registered",
		Reason:       &reason,
		ActingUserID: actingUserID,
		CreatedAt:    now,
	}

	id, err := s.intakeRepo.CreateFIRWithLegalSectionsAndHistory(ctx, fir, req.SectionIDs, hist, req.SourceComplaintID, req.GDID)
	if err != nil {
		return nil, err
	}
	return s.intakeRepo.GetFIRByID(ctx, id)
}

func (s *IntakeService) FilterFIRs(ctx context.Context, category string, branchID uint, status string, search string) ([]models.FIR, error) {
	return s.intakeRepo.FilterFIRs(ctx, category, branchID, status, search)
}

func (s *IntakeService) ListFIRs(ctx context.Context, category string) ([]models.FIR, error) {
	return s.intakeRepo.GetAllFIRs(ctx, category)
}

func (s *IntakeService) GetFIR(ctx context.Context, id uint) (*models.FIR, error) {
	return s.intakeRepo.GetFIRByID(ctx, id)
}

func (s *IntakeService) GetFIRHistory(ctx context.Context, firID uint) ([]models.FIRStatusHistory, error) {
	return s.intakeRepo.GetFIRHistory(ctx, firID)
}

func (s *IntakeService) UpdateFIRStatus(
	ctx context.Context,
	firID uint,
	req *models.UpdateFIRStatusRequest,
	actingUserID *uint,
) error {
	existing, err := s.intakeRepo.GetFIRByID(ctx, firID)
	if err != nil {
		return err
	}
	if existing == nil {
		return errors.New("FIR record not found")
	}

	current := existing.CurrentStatus
	allowed, exists := validFIRTransitions[current]
	if !exists {
		return fmt.Errorf("%w: terminal state '%s'", ErrInvalidFIRTransition, current)
	}

	isAllowed := false
	for _, target := range allowed {
		if target == req.NewStatus {
			isAllowed = true
			break
		}
	}
	if !isAllowed {
		return fmt.Errorf("%w: cannot transition from '%s' to '%s'", ErrInvalidFIRTransition, current, req.NewStatus)
	}

	return s.intakeRepo.UpdateFIRStatus(
		ctx,
		firID,
		current,
		req.NewStatus,
		req.Decision,
		req.Reason,
		actingUserID,
	)
}

// ConvertComplaintToFIR directly converts an assessed complaint to an FIR in a single database transaction
func (s *IntakeService) ConvertComplaintToFIR(
	ctx context.Context,
	complaintID uint,
	req *models.ConvertComplaintToFIRRequest,
	complainantID uint,
	branchID uint,
	actingUserID *uint,
) (*models.FIR, error) {
	branchCode, _ := s.intakeRepo.GetBranchCode(ctx, branchID)
	firNumber, err := s.seqService.GenerateFIRNumber(nil, branchCode)
	if err != nil {
		return nil, fmt.Errorf("failed to generate FIR number for conversion: %w", err)
	}

	now := time.Now()
	var incDate *time.Time
	if req.IncidentDate != "" {
		t, err := time.Parse("2006-01-02", req.IncidentDate)
		if err == nil {
			incDate = &t
		}
	}

	var incTime *string
	if req.IncidentTime != "" {
		incTime = &req.IncidentTime
	}

	var place *string
	if req.PlaceOfOccurrence != "" {
		place = &req.PlaceOfOccurrence
	}

	fir := &models.FIR{
		FIRNumber:         firNumber,
		BranchID:          branchID,
		ComplainantID:     &complainantID,
		CrimeCategory:     req.CrimeCategory,
		CurrentStatus:     "Registered",
		PlaceOfOccurrence: place,
		IncidentDate:      incDate,
		IncidentTime:      incTime,
		FiledDate:         now,
		SourceComplaintID: &complaintID,
		SourceType:        "Direct Complaint",
		CreatedByUserID:   actingUserID,
		ApprovedByUserID:  actingUserID,
		ApprovedAt:        &now,
	}

	reason := fmt.Sprintf("Direct FIR registered from assessed complaint ID #%d", complaintID)
	hist := &models.FIRStatusHistory{
		NewStatus:    "Registered",
		Decision:     "Registered directly from Complaint",
		Reason:       &reason,
		ActingUserID: actingUserID,
		CreatedAt:    now,
	}

	id, err := s.intakeRepo.CreateFIRWithLegalSectionsAndHistory(ctx, fir, req.SectionIDs, hist, &complaintID, nil)
	if err != nil {
		return nil, err
	}

	return s.intakeRepo.GetFIRByID(ctx, id)
}

// LinkGDToFIR escalates a General Diary to an FIR in a single database transaction
func (s *IntakeService) LinkGDToFIR(
	ctx context.Context,
	gdID uint,
	req *models.LinkGDToFIRRequest,
	actingUserID *uint,
) (*models.FIR, error) {
	gd, err := s.intakeRepo.GetGDByID(ctx, gdID)
	if err != nil {
		return nil, err
	}
	if gd == nil {
		return nil, errors.New("GD record not found")
	}
	if gd.CurrentStatus == "Linked to FIR" {
		return nil, ErrGDAlreadyLinked
	}

	branchCode, _ := s.intakeRepo.GetBranchCode(ctx, gd.BranchID)
	firNumber, err := s.seqService.GenerateFIRNumber(nil, branchCode)
	if err != nil {
		return nil, fmt.Errorf("failed to generate FIR number for GD linkage: %w", err)
	}

	now := time.Now()
	var place *string
	if req.PlaceOfOccurrence != "" {
		place = &req.PlaceOfOccurrence
	} else {
		place = gd.IncidentPlace
	}

	fir := &models.FIR{
		FIRNumber:         firNumber,
		BranchID:          gd.BranchID,
		ComplainantID:     &gd.ComplainantID,
		CrimeCategory:     req.CrimeCategory,
		CurrentStatus:     "Registered",
		PlaceOfOccurrence: place,
		FiledDate:         now,
		GDID:              &gdID,
		SourceType:        "From GD",
		CreatedByUserID:   actingUserID,
		ApprovedByUserID:  actingUserID,
		ApprovedAt:        &now,
	}

	reason := fmt.Sprintf("Escalated from General Diary %s to formal FIR", gd.GDNumber)
	hist := &models.FIRStatusHistory{
		NewStatus:    "Registered",
		Decision:     "Registered upon GD Escalation",
		Reason:       &reason,
		ActingUserID: actingUserID,
		CreatedAt:    now,
	}

	id, err := s.intakeRepo.CreateFIRWithLegalSectionsAndHistory(ctx, fir, req.SectionIDs, hist, nil, &gdID)
	if err != nil {
		return nil, err
	}

	return s.intakeRepo.GetFIRByID(ctx, id)
}

func (s *IntakeService) ListLegalSections(ctx context.Context) ([]models.LegalSection, error) {
	return s.intakeRepo.GetAllLegalSections(ctx)
}

func (s *IntakeService) DeleteGD(ctx context.Context, gdID uint) error {
	return s.intakeRepo.DeleteGD(ctx, gdID)
}

func (s *IntakeService) DeleteFIR(ctx context.Context, firID uint) error {
	return s.intakeRepo.DeleteFIR(ctx, firID)
}
