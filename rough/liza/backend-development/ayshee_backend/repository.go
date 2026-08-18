package main

import (
	"database/sql"
	"fmt"
)

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) FetchSuspects(name string) ([]Suspect, error) {
	query := "SELECT Suspect_ID, Name, Age, Identification_Sign, Suspicion_Level, Status FROM SUSPECT WHERE 1=1"
	var args []interface{}
	if name != "" {
		query += " AND Name LIKE ?"
		args = append(args, "%"+name+"%")
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Suspect
	for rows.Next() {
		var s Suspect
		if err := rows.Scan(&s.ID, &s.Name, &s.Age, &s.IdentificationSign, &s.SuspicionLevel, &s.Status); err != nil {
			return nil, err
		}
		list = append(list, s)
	}
	return list, nil
}

func (r *Repository) UpdateStatusWithTx(evidenceID int, newStatus, remarks string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}

	res, err := tx.Exec("UPDATE EVIDENCE SET Status = ? WHERE Evidence_Number = ?", newStatus, evidenceID)
	if err != nil {
		tx.Rollback()
		return err
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		tx.Rollback()
		return fmt.Errorf("evidence record #%d not found", evidenceID)
	}

	_, err = tx.Exec("INSERT INTO EVIDENCE_STATUS_HISTORY (Evidence_Number, Status, Remarks) VALUES (?, ?, ?)", evidenceID, newStatus, remarks)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}