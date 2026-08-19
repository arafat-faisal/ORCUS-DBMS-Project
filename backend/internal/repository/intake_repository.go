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

func (r *IntakeRepository) CreateGD(ctx context.Context, req *models.CreateGDRequest) (uint, error) {
	query := "INSERT INTO gd (gd_number, gd_date, subject, complainant_id) VALUES (?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, req.GDNumber, req.GDDate, req.Subject, req.ComplainantID)
	if err != nil {
		return 0, fmt.Errorf("error inserting GD: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *IntakeRepository) GetAllGDs(ctx context.Context, complainantID uint) ([]models.GD, error) {
	gds := make([]models.GD, 0)
	query := `
		SELECT 
			g.gd_id,
			g.gd_number,
			g.gd_date,
			g.subject,
			g.complainant_id,
			c.name AS complainant_name
		FROM gd g
		JOIN complainant c ON g.complainant_id = c.complainant_id
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if complainantID > 0 {
		query += " AND g.complainant_id = ?"
		args = append(args, complainantID)
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
			g.gd_date,
			g.subject,
			g.complainant_id,
			c.name AS complainant_name
		FROM gd g
		JOIN complainant c ON g.complainant_id = c.complainant_id
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

// ----------------------------------------------------------------------------
// FIR & Legal Section Operations
// ----------------------------------------------------------------------------

func (r *IntakeRepository) CreateFIRWithLegalSections(ctx context.Context, req *models.CreateFIRRequest) (uint, error) {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to begin FIR transaction: %w", err)
	}
	defer tx.Rollback()

	insertFIR := "INSERT INTO fir (fir_number, crime_category, filed_date, gd_id) VALUES (?, ?, ?, ?)"
	res, err := tx.ExecContext(ctx, insertFIR, req.FIRNumber, req.CrimeCategory, req.FiledDate, req.GDID)
	if err != nil {
		return 0, fmt.Errorf("error inserting FIR: %w", err)
	}

	firID, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	insertSection := "INSERT INTO fir_legal_section (fir_id, section_id) VALUES (?, ?)"
	for _, sectionID := range req.SectionIDs {
		_, err := tx.ExecContext(ctx, insertSection, firID, sectionID)
		if err != nil {
			return 0, fmt.Errorf("error inserting fir_legal_section: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, fmt.Errorf("failed to commit FIR transaction: %w", err)
	}

	return uint(firID), nil
}

func (r *IntakeRepository) GetAllFIRs(ctx context.Context, category string) ([]models.FIR, error) {
	firs := make([]models.FIR, 0)
	query := `
		SELECT 
			f.fir_id,
			f.fir_number,
			f.crime_category,
			f.filed_date,
			f.gd_id,
			g.gd_number
		FROM fir f
		LEFT JOIN gd g ON f.gd_id = g.gd_id
		WHERE 1=1
	`
	args := make([]interface{}, 0)

	if category != "" {
		query += " AND f.crime_category LIKE ?"
		args = append(args, "%"+category+"%")
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
			f.crime_category,
			f.filed_date,
			f.gd_id,
			g.gd_number
		FROM fir f
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

func (r *IntakeRepository) GetAllLegalSections(ctx context.Context) ([]models.LegalSection, error) {
	sections := make([]models.LegalSection, 0)
	query := "SELECT section_id, section_code, section_title, description FROM legal_section ORDER BY section_code ASC"
	err := r.db.SelectContext(ctx, &sections, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching legal sections: %w", err)
	}
	return sections, nil
}
