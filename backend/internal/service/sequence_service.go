package service

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type SequenceService interface {
	NextVal(runner sqlx.Ext, sequenceKey string) (uint64, error)
	GenerateComplaintTrackingCode(runner sqlx.Ext, divCode string) (string, error)
	GenerateGDNumber(runner sqlx.Ext, branchCode string) (string, error)
	GenerateFIRNumber(runner sqlx.Ext, branchCode string) (string, error)
	GenerateCaseNumber(runner sqlx.Ext, branchCode string) (string, error)
	GenerateEvidenceRef(runner sqlx.Ext, caseNumber string, caseID uint) (string, int, error)
}

type sequenceService struct {
	db *sqlx.DB
}

func NewSequenceService(db *sqlx.DB) SequenceService {
	return &sequenceService{db: db}
}

// NextVal atomically increments and returns the next value for a given sequence_key
func (s *sequenceService) NextVal(runner sqlx.Ext, sequenceKey string) (uint64, error) {
	cleanKey := strings.ToUpper(strings.TrimSpace(sequenceKey))
	if cleanKey == "" {
		cleanKey = "GENERIC"
	}

	query := `INSERT INTO system_sequence (sequence_key, current_val)
		VALUES (?, 1)
		ON DUPLICATE KEY UPDATE current_val = LAST_INSERT_ID(current_val + 1);`

	var res sql.Result
	var err error

	if runner != nil {
		res, err = runner.Exec(query, cleanKey)
	} else {
		res, err = s.db.Exec(query, cleanKey)
	}
	if err != nil {
		return 0, fmt.Errorf("failed to increment sequence '%s': %w", cleanKey, err)
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last insert id for sequence '%s': %w", cleanKey, err)
	}

	return uint64(id), nil
}

func (s *sequenceService) GenerateComplaintTrackingCode(runner sqlx.Ext, divCode string) (string, error) {
	code := strings.ToUpper(strings.TrimSpace(divCode))
	if code == "" {
		code = "DHK"
	}
	year := time.Now().Year()
	seqKey := fmt.Sprintf("CMP-%s-%d", code, year)

	val, err := s.NextVal(runner, seqKey)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("CMP-%s-%d-%06d", code, year, val), nil
}

func (s *sequenceService) GenerateGDNumber(runner sqlx.Ext, branchCode string) (string, error) {
	cleanBranch := strings.ToUpper(strings.TrimSpace(branchCode))
	cleanBranch = strings.TrimPrefix(cleanBranch, "BR-")
	if cleanBranch == "" {
		cleanBranch = "DHK-MOT"
	}
	year := time.Now().Year()
	seqKey := fmt.Sprintf("GD-%s-%d", cleanBranch, year)

	val, err := s.NextVal(runner, seqKey)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("GD-%s-%d-%06d", cleanBranch, year, val), nil
}

func (s *sequenceService) GenerateFIRNumber(runner sqlx.Ext, branchCode string) (string, error) {
	cleanBranch := strings.ToUpper(strings.TrimSpace(branchCode))
	cleanBranch = strings.TrimPrefix(cleanBranch, "BR-")
	if cleanBranch == "" {
		cleanBranch = "DHK-MOT"
	}
	year := time.Now().Year()
	seqKey := fmt.Sprintf("FIR-%s-%d", cleanBranch, year)

	val, err := s.NextVal(runner, seqKey)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("FIR-%s-%d-%06d", cleanBranch, year, val), nil
}

func (s *sequenceService) GenerateCaseNumber(runner sqlx.Ext, branchCode string) (string, error) {
	cleanBranch := strings.ToUpper(strings.TrimSpace(branchCode))
	cleanBranch = strings.TrimPrefix(cleanBranch, "BR-")
	if cleanBranch == "" {
		cleanBranch = "DHK-MOT"
	}
	year := time.Now().Year()
	seqKey := fmt.Sprintf("CASE-%s-%d", cleanBranch, year)

	val, err := s.NextVal(runner, seqKey)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("CASE-%s-%d-%06d", cleanBranch, year, val), nil
}

func (s *sequenceService) GenerateEvidenceRef(runner sqlx.Ext, caseNumber string, caseID uint) (string, int, error) {
	seqKey := fmt.Sprintf("EVID-CASE-%d", caseID)
	val, err := s.NextVal(runner, seqKey)
	if err != nil {
		return "", 0, err
	}

	evidenceNo := int(val)
	evidenceRef := fmt.Sprintf("%s-E%03d", caseNumber, evidenceNo)
	return evidenceRef, evidenceNo, nil
}
