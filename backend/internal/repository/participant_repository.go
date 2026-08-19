// ============================================================================
// [ORIGIN: Ayshee Islam Liza (241400045) - Module 3: Participants & Location]
// File: backend/internal/repository/participant_repository.go
// Purpose: Repository for suspect, victim, witness, location, and junction bridge tables.
//
// [INTEGRATION NOTE]: Enhanced by Faisal (241400060) to provide full parameterized
// SQL queries and support the cross-case criminal profile view v_suspect_dossier.
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

type ParticipantRepository struct {
	db *sqlx.DB
}

func NewParticipantRepository(db *sqlx.DB) *ParticipantRepository {
	return &ParticipantRepository{db: db}
}

// ----------------------------------------------------------------------------
// Suspect Operations
// ----------------------------------------------------------------------------

func (r *ParticipantRepository) CreateSuspect(ctx context.Context, req *models.CreateSuspectRequest) (uint, error) {
	query := `
		INSERT INTO suspect (first_name, last_name, age, date_of_birth, identification_sign, suspicion_level, status)
		VALUES (?, ?, ?, NULLIF(?, ''), ?, ?, COALESCE(NULLIF(?, ''), 'Under Investigation'))
	`
	res, err := r.db.ExecContext(ctx, query, req.FirstName, req.LastName, req.Age, req.DateOfBirth, req.IdentificationSign, req.SuspicionLevel, req.Status)
	if err != nil {
		return 0, fmt.Errorf("error inserting suspect: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *ParticipantRepository) GetAllSuspects(ctx context.Context, search, suspicionLevel, status string) ([]models.Suspect, error) {
	suspects := make([]models.Suspect, 0)
	query := "SELECT suspect_id, first_name, last_name, age, date_of_birth, identification_sign, suspicion_level, status FROM suspect WHERE 1=1"
	args := make([]interface{}, 0)

	if search != "" {
		query += " AND (first_name LIKE ? OR last_name LIKE ? OR identification_sign LIKE ?)"
		pattern := "%" + search + "%"
		args = append(args, pattern, pattern, pattern)
	}

	if suspicionLevel != "" {
		query += " AND suspicion_level = ?"
		args = append(args, suspicionLevel)
	}

	if status != "" {
		query += " AND status = ?"
		args = append(args, status)
	}

	query += " ORDER BY suspect_id ASC"

	err := r.db.SelectContext(ctx, &suspects, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching suspects: %w", err)
	}
	return suspects, nil
}

func (r *ParticipantRepository) GetSuspectByID(ctx context.Context, id uint) (*models.Suspect, error) {
	var s models.Suspect
	query := "SELECT suspect_id, first_name, last_name, age, date_of_birth, identification_sign, suspicion_level, status FROM suspect WHERE suspect_id = ? LIMIT 1"
	err := r.db.GetContext(ctx, &s, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &s, nil
}

func (r *ParticipantRepository) GetSuspectDossier(ctx context.Context, suspectID uint) ([]models.SuspectDossierItem, error) {
	items := make([]models.SuspectDossierItem, 0)
	query := `
		SELECT 
			suspect_id,
			suspect_name,
			age,
			suspicion_level,
			suspect_status,
			identification_sign,
			case_id,
			case_title,
			case_status,
			role_in_crime
		FROM v_suspect_dossier
		WHERE suspect_id = ?
		ORDER BY case_id ASC
	`
	err := r.db.SelectContext(ctx, &items, query, suspectID)
	if err != nil {
		return nil, fmt.Errorf("error querying suspect dossier view: %w", err)
	}
	return items, nil
}

// ----------------------------------------------------------------------------
// Victim Operations
// ----------------------------------------------------------------------------

func (r *ParticipantRepository) CreateVictim(ctx context.Context, req *models.CreateVictimRequest) (uint, error) {
	query := `
		INSERT INTO victim (name, phone, age, identification_sign, condition_notes, is_deceased)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.ExecContext(ctx, query, req.Name, req.Phone, req.Age, req.IdentificationSign, req.ConditionNotes, req.IsDeceased)
	if err != nil {
		return 0, fmt.Errorf("error inserting victim: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *ParticipantRepository) GetAllVictims(ctx context.Context) ([]models.Victim, error) {
	victims := make([]models.Victim, 0)
	query := "SELECT victim_id, name, phone, age, identification_sign, condition_notes, is_deceased FROM victim ORDER BY victim_id ASC"
	err := r.db.SelectContext(ctx, &victims, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching victims: %w", err)
	}
	return victims, nil
}

// ----------------------------------------------------------------------------
// Witness Operations
// ----------------------------------------------------------------------------

func (r *ParticipantRepository) CreateWitness(ctx context.Context, req *models.CreateWitnessRequest) (uint, error) {
	query := `
		INSERT INTO witness (name, phone, age, identification_sign, reliability, is_protected, statement_summary)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	res, err := r.db.ExecContext(ctx, query, req.Name, req.Phone, req.Age, req.IdentificationSign, req.Reliability, req.IsProtected, req.StatementSummary)
	if err != nil {
		return 0, fmt.Errorf("error inserting witness: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *ParticipantRepository) GetAllWitnesses(ctx context.Context, protectedOnly bool) ([]models.Witness, error) {
	witnesses := make([]models.Witness, 0)
	query := "SELECT witness_id, name, phone, age, identification_sign, reliability, is_protected, statement_summary FROM witness WHERE 1=1"
	if protectedOnly {
		query += " AND is_protected = TRUE"
	}
	query += " ORDER BY witness_id ASC"

	err := r.db.SelectContext(ctx, &witnesses, query)
	if err != nil {
		return nil, fmt.Errorf("error fetching witnesses: %w", err)
	}
	return witnesses, nil
}

// ----------------------------------------------------------------------------
// Location Operations
// ----------------------------------------------------------------------------

func (r *ParticipantRepository) CreateLocation(ctx context.Context, req *models.CreateLocationRequest) (uint, error) {
	query := "INSERT INTO location (gps_coordinates, address, area, city) VALUES (?, ?, ?, ?)"
	res, err := r.db.ExecContext(ctx, query, req.GPSCoordinates, req.Address, req.Area, req.City)
	if err != nil {
		return 0, fmt.Errorf("error inserting location: %w", err)
	}
	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *ParticipantRepository) GetAllLocations(ctx context.Context, city string) ([]models.Location, error) {
	locations := make([]models.Location, 0)
	query := "SELECT location_id, gps_coordinates, address, area, city FROM location WHERE 1=1"
	args := make([]interface{}, 0)

	if city != "" {
		query += " AND city = ?"
		args = append(args, city)
	}

	query += " ORDER BY city ASC, area ASC"
	err := r.db.SelectContext(ctx, &locations, query, args...)
	if err != nil {
		return nil, fmt.Errorf("error fetching locations: %w", err)
	}
	return locations, nil
}

// ----------------------------------------------------------------------------
// Junction Linking Operations
// ----------------------------------------------------------------------------

func (r *ParticipantRepository) LinkSuspectToCase(ctx context.Context, caseID, suspectID uint, roleInCrime string) error {
	query := "INSERT INTO case_suspect (case_id, suspect_id, role_in_crime) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE role_in_crime = VALUES(role_in_crime)"
	_, err := r.db.ExecContext(ctx, query, caseID, suspectID, roleInCrime)
	return err
}

func (r *ParticipantRepository) LinkVictimToCase(ctx context.Context, caseID, victimID uint, impactType string) error {
	query := "INSERT INTO case_victim (case_id, victim_id, impact_type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE impact_type = VALUES(impact_type)"
	_, err := r.db.ExecContext(ctx, query, caseID, victimID, impactType)
	return err
}

func (r *ParticipantRepository) LinkWitnessToCase(ctx context.Context, caseID, witnessID uint, statement string) error {
	query := "INSERT INTO case_witness (case_id, witness_id, testimony_summary) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE testimony_summary = VALUES(testimony_summary)"
	_, err := r.db.ExecContext(ctx, query, caseID, witnessID, statement)
	return err
}

func (r *ParticipantRepository) LinkLocationToCase(ctx context.Context, caseID, locationID uint, role string) error {
	query := "INSERT INTO case_location (case_id, location_id, location_role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE location_role = VALUES(location_role)"
	_, err := r.db.ExecContext(ctx, query, caseID, locationID, role)
	return err
}

func (r *ParticipantRepository) GetCaseSuspects(ctx context.Context, caseID uint) ([]models.CaseSuspectLink, error) {
	links := make([]models.CaseSuspectLink, 0)
	query := `
		SELECT 
			cs.case_id,
			cs.suspect_id,
			s.first_name,
			s.last_name,
			s.suspicion_level,
			s.status,
			s.identification_sign,
			cs.role_in_crime
		FROM case_suspect cs
		JOIN suspect s ON cs.suspect_id = s.suspect_id
		WHERE cs.case_id = ?
	`
	err := r.db.SelectContext(ctx, &links, query, caseID)
	return links, err
}

func (r *ParticipantRepository) GetCaseVictims(ctx context.Context, caseID uint) ([]models.CaseVictimLink, error) {
	links := make([]models.CaseVictimLink, 0)
	query := `
		SELECT 
			cv.case_id,
			cv.victim_id,
			v.name,
			v.phone,
			v.is_deceased,
			cv.impact_type
		FROM case_victim cv
		JOIN victim v ON cv.victim_id = v.victim_id
		WHERE cv.case_id = ?
	`
	err := r.db.SelectContext(ctx, &links, query, caseID)
	return links, err
}

func (r *ParticipantRepository) GetCaseWitnesses(ctx context.Context, caseID uint) ([]models.CaseWitnessLink, error) {
	links := make([]models.CaseWitnessLink, 0)
	query := `
		SELECT 
			cw.case_id,
			cw.witness_id,
			w.name,
			w.reliability,
			w.is_protected,
			cw.testimony_summary
		FROM case_witness cw
		JOIN witness w ON cw.witness_id = w.witness_id
		WHERE cw.case_id = ?
	`
	err := r.db.SelectContext(ctx, &links, query, caseID)
	return links, err
}

func (r *ParticipantRepository) GetCaseLocations(ctx context.Context, caseID uint) ([]models.CaseLocationLink, error) {
	links := make([]models.CaseLocationLink, 0)
	query := `
		SELECT 
			cl.case_id,
			cl.location_id,
			l.address,
			l.area,
			l.city,
			l.gps_coordinates,
			cl.location_role
		FROM case_location cl
		JOIN location l ON cl.location_id = l.location_id
		WHERE cl.case_id = ?
	`
	err := r.db.SelectContext(ctx, &links, query, caseID)
	return links, err
}
