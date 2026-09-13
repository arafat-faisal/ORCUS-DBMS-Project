// ============================================================================
// [ORIGIN: A.K. Md. Shakil Hossain (241400043) - Module 2: Investigation Intake & Cases]
// File: backend/internal/repository/intake_repository.go
// Purpose: Repository for complainant, contacts, gd, fir, and legal_section tables.
//
// [INTEGRATION NOTE]: Harmonized by Faisal (241400060) to support atomic transactions
// for FIR creation with legal sections and hydrated complainant contact lists.
// ============================================================================

package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type IntakeRepository struct {
	db *sqlx.DB
}

func NewIntakeRepository(db *sqlx.DB) *IntakeRepository {
	return &IntakeRepository{db: db}
}

// ----------------------------------------------------------------------------
// Complainant & Contact Operations
// ----------------------------------------------------------------------------

func (r *IntakeRepository) CreateComplainantWithContacts(ctx context.Context, req *models.CreateComplainantRequest) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to start complainant transaction: %w", err)
	}
	defer tx.Rollback()

	insertComplainant := "INSERT INTO complainant (name) VALUES (?)"
	res, err := tx.ExecContext(ctx, insertComplainant, req.Name)
	if err != nil {
		return 0, fmt.Errorf("error inserting complainant: %w", err)
	}

	complainantID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	insertContact := "INSERT INTO complainant_contact (complainant_id, contact_type, contact_value, is_primary) VALUES (?, ?, ?, ?)"
	for _, c := range req.Contacts {
		_, err := tx.ExecContext(ctx, insertContact, complainantID, c.ContactType, c.ContactValue, c.IsPrimary)
		if err != nil {
			return 0, fmt.Errorf("error inserting complainant contact: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit complainant creation: %w", err)
	}

	return uint(complainantID), nil
}

func (r *IntakeRepository) GetAllComplainants(ctx context.Context) ([]models.Complainant, error) {
	complainants := make([]models.Complainant, 0)
	query := "SELECT complainant_id, name FROM complainant ORDER BY complainant_id ASC"
	err := r.db.SelectContext(ctx, &complainants, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching complainants: %w", err)
	}

	// Hydrate contacts
	for i := range complainants {
		var contacts []models.ComplainantContact
		contactQuery := "SELECT contact_id, complainant_id, contact_type, contact_value, is_primary FROM complainant_contact WHERE complainant_id = ?"
		_ = r.db.SelectContext(ctx, &contacts, contactQuery, complainants[i].ComplainantID)
		complainants[i].Contacts = contacts
	}

	return complainants, nil
}

func (r *IntakeRepository) GetComplainantByID(ctx context.Context, id uint) (*models.Complainant, error) {
	var c models.Complainant
	query := "SELECT complainant_id, name FROM complainant WHERE complainant_id = ? LIMIT 1"
	err := r.db.GetContext(ctx, &c, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	var contacts []models.ComplainantContact
	contactQuery := "SELECT contact_id, complainant_id, contact_type, contact_value, is_primary FROM complainant_contact WHERE complainant_id = ?"
	_ = r.db.SelectContext(ctx, &contacts, contactQuery, c.ComplainantID)
	c.Contacts = contacts

	return &c, nil
}

// ----------------------------------------------------------------------------
// General Diary (GD) Operations
// ----------------------------------------------------------------------------

func (r *IntakeRepository) GetBranchCode(ctx context.Context, branchID uint) (string, error) {
	var code sql.NullString
	query := "SELECT branch_code FROM agency_branch WHERE branch_id = ?"
	err := r.db.GetContext(ctx, &code, query, branchID)
	if err != nil {
		return "DHK-MOT", nil // Safe default
	}
	if code.Valid && code.String != "" {
		return code.String, nil
	}
	return "DHK-MOT", nil
}

func (r *IntakeRepository) CreateGDWithHistory(
	ctx context.Context,
	gd *models.GD,
	history *models.GDStatusHistory,
	optComplaintID *uint,
) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to begin GD transaction: %w", err)
	}
	defer tx.Rollback()

	if gd.BranchID == 0 {
		gd.BranchID = 1
	}
	if gd.CurrentStatus == "" {
		gd.CurrentStatus = "Approved"
	}
	if gd.GDDate.IsZero() {
		gd.GDDate = time.Now()
	}

	insertGD := `
		INSERT INTO gd (
			gd_number, branch_id, gd_date, subject, current_status, incident_place,
			complainant_id, complaint_id, created_by_user_id, approved_by_user_id, approved_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`
	res, err := tx.ExecContext(
		ctx,
		insertGD,
		gd.GDNumber,
		gd.BranchID,
		gd.GDDate,
		gd.Subject,
		gd.CurrentStatus,
		gd.IncidentPlace,
		gd.ComplainantID,
		gd.ComplaintID,
		gd.CreatedByUserID,
		gd.ApprovedByUserID,
		gd.ApprovedAt,
	)
	if err != nil {
		return 0, fmt.Errorf("error inserting GD: %w", err)
	}

	gdID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Insert GD Status History
	if history != nil {
		insertHistory := `
			INSERT INTO gd_status_history (
				gd_id, previous_status, new_status, decision, reason, acting_user_id, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?);
		`
		createdAt := time.Now()
		if !history.CreatedAt.IsZero() {
			createdAt = history.CreatedAt
		}
		_, err = tx.ExecContext(
			ctx,
			insertHistory,
			gdID,
			history.PreviousStatus,
			history.NewStatus,
			history.Decision,
			history.Reason,
			history.ActingUserID,
			createdAt,
		)
		if err != nil {
			return 0, fmt.Errorf("error inserting gd_status_history: %w", err)
		}
	}

	// If linked to source complaint, update complaint status transactionally
	if optComplaintID != nil && *optComplaintID > 0 {
		updateComplaint := `
			UPDATE complaint 
			SET current_status = 'Converted to GD', updated_at = NOW() 
			WHERE complaint_id = ?;
		`
		_, err = tx.ExecContext(ctx, updateComplaint, *optComplaintID)
		if err != nil {
			return 0, fmt.Errorf("error updating source complaint status: %w", err)
		}

		insertComplaintHist := `
			INSERT INTO complaint_status_history (
				complaint_id, previous_status, new_status, decision, reason, acting_user_id, created_at
			) VALUES (?, 'Verified', 'Converted to GD', 'Converted to General Diary', ?, ?, NOW());
		`
		var reason string
		if history != nil && history.Reason != nil {
			reason = *history.Reason
		} else {
			reason = fmt.Sprintf("General Diary %s registered from complaint.", gd.GDNumber)
		}
		var actingUser *uint
		if history != nil {
			actingUser = history.ActingUserID
		}
		_, err = tx.ExecContext(ctx, insertComplaintHist, *optComplaintID, reason, actingUser)
		if err != nil {
			return 0, fmt.Errorf("error inserting complaint status history for GD conversion: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit GD creation transaction: %w", err)
	}

	return uint(gdID), nil
}

func (r *IntakeRepository) CreateGD(ctx context.Context, req *models.CreateGDRequest) (uint, error) {
	gdDate, _ := time.Parse("2006-01-02", req.GDDate)
	if gdDate.IsZero() {
		gdDate = time.Now()
	}

	branchID := req.BranchID
	if branchID == 0 {
		branchID = 1
	}

	gd := &models.GD{
		GDNumber:      req.GDNumber,
		BranchID:      branchID,
		GDDate:        gdDate,
		Subject:       req.Subject,
		IncidentPlace: &req.IncidentPlace,
		ComplainantID: req.ComplainantID,
		ComplaintID:   req.ComplaintID,
		CurrentStatus: "Approved",
	}

	reason := "Direct GD Registration"
	hist := &models.GDStatusHistory{
		NewStatus: "Approved",
		Decision:  "General Diary Approved",
		Reason:    &reason,
		CreatedAt: time.Now(),
	}

	return r.CreateGDWithHistory(ctx, gd, hist, req.ComplaintID)
}

func (r *IntakeRepository) GetAllGDs(ctx context.Context, complainantID uint) ([]models.GD, error) {
	return r.FilterGDs(ctx, complainantID, 0, "", "")
}

func (r *IntakeRepository) FilterGDs(ctx context.Context, complainantID uint, branchID uint, status string, search string) ([]models.GD, error) {
	gds := make([]models.GD, 0)
	query := `
		SELECT 
			g.gd_id,
			g.gd_number,
			g.branch_id,
			b.branch_name,
			g.gd_date,
			g.subject,
			g.current_status,
			g.incident_place,
			g.complainant_id,
			c.name AS complainant_name,
			g.complaint_id,
			g.created_by_user_id,
			g.approved_by_user_id,
			g.approved_at,
			g.created_at,
			g.updated_at
		FROM gd g
		LEFT JOIN complainant c ON g.complainant_id = c.complainant_id
		LEFT JOIN agency_branch b ON g.branch_id = b.branch_id
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if complainantID > 0 {
		query += " AND g.complainant_id = ?"
		args = append(args, complainantID)
	}
	if branchID > 0 {
		query += " AND g.branch_id = ?"
		args = append(args, branchID)
	}
	if status != "" {
		query += " AND g.current_status = ?"
		args = append(args, status)
	}
	if search != "" {
		query += " AND (g.gd_number LIKE ? OR g.subject LIKE ? OR c.name LIKE ?)"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}

	query += " ORDER BY g.gd_date DESC, g.gd_id DESC"

	err := r.db.SelectContext(ctx, &gds, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching GDs: %w", err)
	}
	return gds, nil
}

func (r *IntakeRepository) GetGDByID(ctx context.Context, id uint) (*models.GD, error) {
	var g models.GD
	query := `
		SELECT 
			g.gd_id,
			g.gd_number,
			g.branch_id,
			b.branch_name,
			g.gd_date,
			g.subject,
			g.current_status,
			g.incident_place,
			g.complainant_id,
			c.name AS complainant_name,
			(SELECT contact_value FROM complainant_contact cc WHERE cc.complainant_id = g.complainant_id AND cc.is_primary = 1 LIMIT 1) AS complainant_phone,
			g.complaint_id,
			g.created_by_user_id,
			g.approved_by_user_id,
			g.approved_at,
			g.created_at,
			g.updated_at
		FROM gd g
		LEFT JOIN complainant c ON g.complainant_id = c.complainant_id
		LEFT JOIN agency_branch b ON g.branch_id = b.branch_id
		WHERE g.gd_id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &g, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &g, nil
}

func (r *IntakeRepository) GetGDHistory(ctx context.Context, gdID uint) ([]models.GDStatusHistory, error) {
	histories := make([]models.GDStatusHistory, 0)
	query := `
		SELECT 
			gsh.history_id,
			gsh.gd_id,
			gsh.previous_status,
			gsh.new_status,
			gsh.decision,
			gsh.reason,
			gsh.acting_user_id,
			u.username AS acting_username,
			gsh.created_at
		FROM gd_status_history gsh
		LEFT JOIN user u ON gsh.acting_user_id = u.user_id
		WHERE gsh.gd_id = ?
		ORDER BY gsh.created_at DESC, gsh.history_id DESC;
	`
	err := r.db.SelectContext(ctx, &histories, query, gdID)
	if err != nil {
		return nil, fmt.Errorf("error fetching GD status history: %w", err)
	}
	return histories, nil
}

func (r *IntakeRepository) UpdateGDStatus(
	ctx context.Context,
	gdID uint,
	previousStatus string,
	newStatus string,
	decision string,
	reason string,
	userID *uint,
) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin GD status transaction: %w", err)
	}
	defer tx.Rollback()

	updateGD := `
		UPDATE gd 
		SET current_status = ?, updated_at = NOW() 
		WHERE gd_id = ?;
	`
	_, err = tx.ExecContext(ctx, updateGD, newStatus, gdID)
	if err != nil {
		return fmt.Errorf("failed to update GD status: %w", err)
	}

	insertHistory := `
		INSERT INTO gd_status_history (
			gd_id, previous_status, new_status, decision, reason, acting_user_id, created_at
		) VALUES (?, ?, ?, ?, ?, ?, NOW());
	`
	_, err = tx.ExecContext(ctx, insertHistory, gdID, previousStatus, newStatus, decision, reason, userID)
	if err != nil {
		return fmt.Errorf("failed to insert GD status history: %w", err)
	}

	return tx.Commit()
}

// ----------------------------------------------------------------------------
// FIR & Legal Section Operations
// ----------------------------------------------------------------------------

func (r *IntakeRepository) CreateFIRWithLegalSectionsAndHistory(
	ctx context.Context,
	fir *models.FIR,
	sectionIDs []uint,
	history *models.FIRStatusHistory,
	optComplaintID *uint,
	optGDID *uint,
) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to begin FIR transaction: %w", err)
	}
	defer tx.Rollback()

	if fir.BranchID == 0 {
		fir.BranchID = 1
	}
	if fir.CurrentStatus == "" {
		fir.CurrentStatus = "Registered"
	}
	if fir.FiledDate.IsZero() {
		fir.FiledDate = time.Now()
	}
	if fir.SourceType == "" {
		if optGDID != nil {
			fir.SourceType = "From GD"
		} else if optComplaintID != nil {
			fir.SourceType = "Direct Complaint"
		} else {
			fir.SourceType = "Station Entry"
		}
	}

	insertFIR := `
		INSERT INTO fir (
			fir_number, branch_id, complainant_id, crime_category, current_status,
			place_of_occurrence, incident_date, incident_time, filed_date, gd_id,
			source_complaint_id, source_type, created_by_user_id, approved_by_user_id, approved_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
	`
	res, err := tx.ExecContext(
		ctx,
		insertFIR,
		fir.FIRNumber,
		fir.BranchID,
		fir.ComplainantID,
		fir.CrimeCategory,
		fir.CurrentStatus,
		fir.PlaceOfOccurrence,
		fir.IncidentDate,
		fir.IncidentTime,
		fir.FiledDate,
		fir.GDID,
		fir.SourceComplaintID,
		fir.SourceType,
		fir.CreatedByUserID,
		fir.ApprovedByUserID,
		fir.ApprovedAt,
	)
	if err != nil {
		return 0, fmt.Errorf("error inserting FIR: %w", err)
	}

	firID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	// Insert legal sections
	insertSection := "INSERT INTO fir_legal_section (fir_id, section_id) VALUES (?, ?)"
	for _, sectionID := range sectionIDs {
		_, err := tx.ExecContext(ctx, insertSection, firID, sectionID)
		if err != nil {
			return 0, fmt.Errorf("error inserting fir_legal_section: %w", err)
		}
	}

	// Insert FIR Status History
	if history != nil {
		insertHistory := `
			INSERT INTO fir_status_history (
				fir_id, previous_status, new_status, decision, reason, acting_user_id, created_at
			) VALUES (?, ?, ?, ?, ?, ?, ?);
		`
		createdAt := time.Now()
		if !history.CreatedAt.IsZero() {
			createdAt = history.CreatedAt
		}
		_, err = tx.ExecContext(
			ctx,
			insertHistory,
			firID,
			history.PreviousStatus,
			history.NewStatus,
			history.Decision,
			history.Reason,
			history.ActingUserID,
			createdAt,
		)
		if err != nil {
			return 0, fmt.Errorf("error inserting fir_status_history: %w", err)
		}
	}

	// If converted from complaint, update complaint status
	if optComplaintID != nil && *optComplaintID > 0 {
		updateComplaint := `
			UPDATE complaint 
			SET current_status = 'Converted to FIR', updated_at = NOW() 
			WHERE complaint_id = ?;
		`
		_, err = tx.ExecContext(ctx, updateComplaint, *optComplaintID)
		if err != nil {
			return 0, fmt.Errorf("error updating complaint status for FIR conversion: %w", err)
		}

		insertComplaintHist := `
			INSERT INTO complaint_status_history (
				complaint_id, previous_status, new_status, decision, reason, acting_user_id, created_at
			) VALUES (?, 'Verified', 'Converted to FIR', 'Converted to FIR', ?, ?, NOW());
		`
		var reason string
		if history != nil && history.Reason != nil {
			reason = *history.Reason
		} else {
			reason = fmt.Sprintf("FIR %s registered from complaint.", fir.FIRNumber)
		}
		var actingUser *uint
		if history != nil {
			actingUser = history.ActingUserID
		}
		_, err = tx.ExecContext(ctx, insertComplaintHist, *optComplaintID, reason, actingUser)
		if err != nil {
			return 0, fmt.Errorf("error inserting complaint status history for FIR conversion: %w", err)
		}
	}

	// If linked from GD, update GD status
	if optGDID != nil && *optGDID > 0 {
		updateGD := `
			UPDATE gd 
			SET current_status = 'Linked to FIR', updated_at = NOW() 
			WHERE gd_id = ?;
		`
		_, err = tx.ExecContext(ctx, updateGD, *optGDID)
		if err != nil {
			return 0, fmt.Errorf("error updating GD status on FIR linkage: %w", err)
		}

		insertGDHist := `
			INSERT INTO gd_status_history (
				gd_id, previous_status, new_status, decision, reason, acting_user_id, created_at
			) VALUES (?, 'Approved', 'Linked to FIR', 'Escalated to FIR', ?, ?, NOW());
		`
		gdReason := fmt.Sprintf("General Diary escalated to cognizable FIR %s.", fir.FIRNumber)
		var actingUser *uint
		if history != nil {
			actingUser = history.ActingUserID
		}
		_, err = tx.ExecContext(ctx, insertGDHist, *optGDID, gdReason, actingUser)
		if err != nil {
			return 0, fmt.Errorf("error inserting GD status history on FIR linkage: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit FIR transaction: %w", err)
	}

	return uint(firID), nil
}

func (r *IntakeRepository) CreateFIRWithLegalSections(ctx context.Context, req *models.CreateFIRRequest) (uint, error) {
	filedDate, _ := time.Parse("2006-01-02", req.FiledDate)
	if filedDate.IsZero() {
		filedDate = time.Now()
	}

	branchID := req.BranchID
	if branchID == 0 {
		branchID = 1
	}

	fir := &models.FIR{
		FIRNumber:         req.FIRNumber,
		BranchID:          branchID,
		ComplainantID:     req.ComplainantID,
		CrimeCategory:     req.CrimeCategory,
		PlaceOfOccurrence: &req.PlaceOfOccurrence,
		FiledDate:         filedDate,
		GDID:              req.GDID,
		SourceComplaintID: req.SourceComplaintID,
		SourceType:        req.SourceType,
		CurrentStatus:     "Registered",
	}

	reason := "Direct FIR Registration"
	hist := &models.FIRStatusHistory{
		NewStatus: "Registered",
		Decision:  "First Information Report Registered",
		Reason:    &reason,
		CreatedAt: time.Now(),
	}

	return r.CreateFIRWithLegalSectionsAndHistory(ctx, fir, req.SectionIDs, hist, req.SourceComplaintID, req.GDID)
}

func (r *IntakeRepository) GetAllFIRs(ctx context.Context, category string) ([]models.FIR, error) {
	return r.FilterFIRs(ctx, category, 0, "", "")
}

func (r *IntakeRepository) FilterFIRs(ctx context.Context, category string, branchID uint, status string, search string) ([]models.FIR, error) {
	firs := make([]models.FIR, 0)
	query := `
		SELECT 
			f.fir_id,
			f.fir_number,
			f.branch_id,
			b.branch_name,
			f.complainant_id,
			c.name AS complainant_name,
			f.crime_category,
			f.current_status,
			f.place_of_occurrence,
			f.incident_date,
			f.incident_time,
			f.filed_date,
			f.gd_id,
			g.gd_number,
			f.source_complaint_id,
			f.source_type,
			f.created_by_user_id,
			f.approved_by_user_id,
			f.approved_at,
			f.created_at,
			f.updated_at
		FROM fir f
		LEFT JOIN agency_branch b ON f.branch_id = b.branch_id
		LEFT JOIN complainant c ON f.complainant_id = c.complainant_id
		LEFT JOIN gd g ON f.gd_id = g.gd_id
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if category != "" {
		query += " AND f.crime_category LIKE ?"
		args = append(args, "%"+category+"%")
	}
	if branchID > 0 {
		query += " AND f.branch_id = ?"
		args = append(args, branchID)
	}
	if status != "" {
		query += " AND f.current_status = ?"
		args = append(args, status)
	}
	if search != "" {
		query += " AND (f.fir_number LIKE ? OR f.crime_category LIKE ? OR c.name LIKE ?)"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}

	query += " ORDER BY f.filed_date DESC, f.fir_id DESC"

	err := r.db.SelectContext(ctx, &firs, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching FIRs: %w", err)
	}

	// Hydrate legal sections
	for i := range firs {
		var sections []models.LegalSection
		sectionQuery := `
			SELECT ls.section_id, ls.section_code, ls.section_title, ls.description
			FROM legal_section ls
			JOIN fir_legal_section fls ON ls.section_id = fls.section_id
			WHERE fls.fir_id = ?
			ORDER BY ls.section_code ASC
		`
		_ = r.db.SelectContext(ctx, &sections, sectionQuery, firs[i].FIRID)
		firs[i].LegalSections = sections
	}

	return firs, nil
}

func (r *IntakeRepository) GetFIRByID(ctx context.Context, id uint) (*models.FIR, error) {
	var f models.FIR
	query := `
		SELECT 
			f.fir_id,
			f.fir_number,
			f.branch_id,
			b.branch_name,
			f.complainant_id,
			c.name AS complainant_name,
			(SELECT contact_value FROM complainant_contact cc WHERE cc.complainant_id = f.complainant_id AND cc.is_primary = 1 LIMIT 1) AS complainant_phone,
			f.crime_category,
			f.current_status,
			f.place_of_occurrence,
			f.incident_date,
			f.incident_time,
			f.filed_date,
			f.gd_id,
			g.gd_number,
			f.source_complaint_id,
			f.source_type,
			f.created_by_user_id,
			f.approved_by_user_id,
			f.approved_at,
			f.created_at,
			f.updated_at
		FROM fir f
		LEFT JOIN agency_branch b ON f.branch_id = b.branch_id
		LEFT JOIN complainant c ON f.complainant_id = c.complainant_id
		LEFT JOIN gd g ON f.gd_id = g.gd_id
		WHERE f.fir_id = ?
		LIMIT 1
	`
	err := r.db.GetContext(ctx, &f, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	var sections []models.LegalSection
	sectionQuery := `
		SELECT ls.section_id, ls.section_code, ls.section_title, ls.description
		FROM legal_section ls
		JOIN fir_legal_section fls ON ls.section_id = fls.section_id
		WHERE fls.fir_id = ?
		ORDER BY ls.section_code ASC
	`
	_ = r.db.SelectContext(ctx, &sections, sectionQuery, f.FIRID)
	f.LegalSections = sections

	return &f, nil
}

func (r *IntakeRepository) GetFIRHistory(ctx context.Context, firID uint) ([]models.FIRStatusHistory, error) {
	histories := make([]models.FIRStatusHistory, 0)
	query := `
		SELECT 
			fsh.history_id,
			fsh.fir_id,
			fsh.previous_status,
			fsh.new_status,
			fsh.decision,
			fsh.reason,
			fsh.acting_user_id,
			u.username AS acting_username,
			fsh.created_at
		FROM fir_status_history fsh
		LEFT JOIN user u ON fsh.acting_user_id = u.user_id
		WHERE fsh.fir_id = ?
		ORDER BY fsh.created_at DESC, fsh.history_id DESC;
	`
	err := r.db.SelectContext(ctx, &histories, query, firID)
	if err != nil {
		return nil, fmt.Errorf("error fetching FIR status history: %w", err)
	}
	return histories, nil
}

func (r *IntakeRepository) UpdateFIRStatus(
	ctx context.Context,
	firID uint,
	previousStatus string,
	newStatus string,
	decision string,
	reason string,
	userID *uint,
) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin FIR status transaction: %w", err)
	}
	defer tx.Rollback()

	updateFIR := `
		UPDATE fir 
		SET current_status = ?, updated_at = NOW() 
		WHERE fir_id = ?;
	`
	_, err = tx.ExecContext(ctx, updateFIR, newStatus, firID)
	if err != nil {
		return fmt.Errorf("failed to update FIR status: %w", err)
	}

	insertHistory := `
		INSERT INTO fir_status_history (
			fir_id, previous_status, new_status, decision, reason, acting_user_id, created_at
		) VALUES (?, ?, ?, ?, ?, ?, NOW());
	`
	_, err = tx.ExecContext(ctx, insertHistory, firID, previousStatus, newStatus, decision, reason, userID)
	if err != nil {
		return fmt.Errorf("failed to insert FIR status history: %w", err)
	}

	return tx.Commit()
}

func (r *IntakeRepository) GetAllLegalSections(ctx context.Context) ([]models.LegalSection, error) {
	sections := make([]models.LegalSection, 0)
	query := "SELECT section_id, section_code, section_title, description FROM legal_section ORDER BY section_code ASC"
	err := r.db.SelectContext(ctx, &sections, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching legal sections: %w", err)
	}
	return sections, nil
}

// DeleteGD removes a GD after unlinking it from FIRs and deleting its status history
func (r *IntakeRepository) DeleteGD(ctx context.Context, gdID uint) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "UPDATE fir SET gd_id = NULL WHERE gd_id = ?", gdID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM gd_status_history WHERE gd_id = ?", gdID); err != nil {
		return err
	}
	res, err := tx.ExecContext(ctx, "DELETE FROM gd WHERE gd_id = ?", gdID)
	if err != nil {
		return fmt.Errorf("failed to delete gd: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return errors.New("gd not found")
	}

	return tx.Commit()
}

// DeleteFIR removes an FIR after unlinking it from cases and deleting its status history & legal sections
func (r *IntakeRepository) DeleteFIR(ctx context.Context, firID uint) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx, "UPDATE `case` SET fir_id = NULL WHERE fir_id = ?", firID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM fir_legal_section WHERE fir_id = ?", firID); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, "DELETE FROM fir_status_history WHERE fir_id = ?", firID); err != nil {
		return err
	}
	res, err := tx.ExecContext(ctx, "DELETE FROM fir WHERE fir_id = ?", firID)
	if err != nil {
		return fmt.Errorf("failed to delete fir: %w", err)
	}
	rows, err := res.RowsAffected()
	if err != nil || rows == 0 {
		return errors.New("fir not found")
	}

	return tx.Commit()
}
