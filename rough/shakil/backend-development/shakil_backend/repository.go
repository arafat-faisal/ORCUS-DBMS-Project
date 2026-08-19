package shakil_backend

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type DBTX interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)
	QueryContext(context.Context, string, ...any) (*sql.Rows, error)
	QueryRowContext(context.Context, string, ...any) *sql.Row
}

type Repository struct {
	db DBTX
}

func NewRepository(db DBTX) *Repository { return &Repository{db: db} }

func (r *Repository) CreateComplainant(ctx context.Context, name string, contacts []Contact) (Complainant, error) {
	db, ok := r.db.(*sql.DB)
	if !ok { return Complainant{}, fmt.Errorf("transaction requires *sql.DB") }

	tx, err := db.BeginTx(ctx, nil)
	if err != nil { return Complainant{}, err }
	defer tx.Rollback()

	res, err := tx.ExecContext(ctx, `INSERT INTO complainant (name) VALUES (?)`, name)
	if err != nil { return Complainant{}, err }
	id, err := res.LastInsertId()
	if err != nil { return Complainant{}, err }

	out := Complainant{ComplainantID: uint64(id), Name: name, Contacts: []Contact{}}
	for _, c := range contacts {
		res, err := tx.ExecContext(ctx, `
			INSERT INTO complainant_contact
				(complainant_id, contact_type, contact_value, is_primary)
			VALUES (?, ?, ?, ?)`,
			id, c.ContactType, c.ContactValue, c.IsPrimary)
		if err != nil { return Complainant{}, err }

		cid, err := res.LastInsertId()
		if err != nil { return Complainant{}, err }
		c.ContactID = uint64(cid)
		c.ComplainantID = uint64(id)
		out.Contacts = append(out.Contacts, c)
	}

	if err := tx.Commit(); err != nil { return Complainant{}, err }
	return out, nil
}

func (r *Repository) ListComplainants(ctx context.Context, search string, page, limit int) (Page[Complainant], error) {
	where := "1=1"
	args := []any{}
	if strings.TrimSpace(search) != "" {
		where += ` AND c.name LIKE CONCAT('%', ?, '%')`
		args = append(args, search)
	}

	var total int
	if err := r.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM complainant c WHERE `+where, args...).Scan(&total); err != nil {
		return Page[Complainant]{}, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.complainant_id, c.name
		FROM complainant c
		WHERE `+where+`
		ORDER BY c.complainant_id DESC
		LIMIT ? OFFSET ?`, append(args, limit, offset)...)
	if err != nil { return Page[Complainant]{}, err }
	defer rows.Close()

	items := []Complainant{}
	for rows.Next() {
		var c Complainant
		if err := rows.Scan(&c.ComplainantID, &c.Name); err != nil { return Page[Complainant]{}, err }
		contacts, err := r.listContacts(ctx, c.ComplainantID)
		if err != nil { return Page[Complainant]{}, err }
		c.Contacts = contacts
		items = append(items, c)
	}
	return Page[Complainant]{Items: items, Page: page, Limit: limit, Total: total}, rows.Err()
}

func (r *Repository) listContacts(ctx context.Context, id uint64) ([]Contact, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT contact_id, complainant_id, contact_type, contact_value, is_primary
		FROM complainant_contact
		WHERE complainant_id = ?
		ORDER BY contact_id`, id)
	if err != nil { return nil, err }
	defer rows.Close()

	out := []Contact{}
	for rows.Next() {
		var c Contact
		if err := rows.Scan(&c.ContactID, &c.ComplainantID, &c.ContactType, &c.ContactValue, &c.IsPrimary); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repository) CreateGD(ctx context.Context, gd GD) (GD, error) {
	res, err := r.db.ExecContext(ctx, `
		INSERT INTO gd (gd_number, gd_date, subject, complainant_id)
		VALUES (?, ?, ?, ?)`,
		gd.GDNumber, gd.GDDate, gd.Subject, gd.ComplainantID)
	if err != nil { return GD{}, err }

	id, err := res.LastInsertId()
	if err != nil { return GD{}, err }
	gd.GDID = uint64(id)
	return gd, nil
}

func (r *Repository) ListGD(ctx context.Context, filters map[string]string, page, limit int) (Page[GD], error) {
	conditions := []string{"1=1"}
	args := []any{}

	for _, f := range []struct{ key, sql string }{
		{"gd_number", "g.gd_number = ?"},
		{"complainant_id", "g.complainant_id = ?"},
		{"date_from", "g.gd_date >= ?"},
		{"date_to", "g.gd_date <= ?"},
		{"search", "g.subject LIKE CONCAT('%', ?, '%')"},
	} {
		if v := filters[f.key]; v != "" {
			conditions = append(conditions, f.sql)
			args = append(args, v)
		}
	}

	where := strings.Join(conditions, " AND ")
	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM gd g WHERE `+where, args...).Scan(&total); err != nil {
		return Page[GD]{}, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(ctx, `
		SELECT g.gd_id, g.gd_number, g.gd_date, g.subject, g.complainant_id
		FROM gd g
		WHERE `+where+`
		ORDER BY g.gd_date DESC, g.gd_id DESC
		LIMIT ? OFFSET ?`, append(args, limit, offset)...)
	if err != nil { return Page[GD]{}, err }
	defer rows.Close()

	items := []GD{}
	for rows.Next() {
		var g GD
		var complainantID sql.NullInt64
		if err := rows.Scan(&g.GDID, &g.GDNumber, &g.GDDate, &g.Subject, &complainantID); err != nil {
			return Page[GD]{}, err
		}
		if complainantID.Valid {
			v := uint64(complainantID.Int64)
			g.ComplainantID = &v
		}
		items = append(items, g)
	}
	return Page[GD]{Items: items, Page: page, Limit: limit, Total: total}, rows.Err()
}

func (r *Repository) ListLegalSections(ctx context.Context, search, code string) ([]LegalSection, error) {
	conditions := []string{"1=1"}
	args := []any{}

	if code != "" {
		conditions = append(conditions, "section_code = ?")
		args = append(args, code)
	}
	if search != "" {
		conditions = append(conditions, `(section_code LIKE CONCAT('%', ?, '%') OR section_title LIKE CONCAT('%', ?, '%'))`)
		args = append(args, search, search)
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT section_id, section_code, section_title, description
		FROM legal_section
		WHERE `+strings.Join(conditions, " AND ")+`
		ORDER BY section_code`, args...)
	if err != nil { return nil, err }
	defer rows.Close()

	out := []LegalSection{}
	for rows.Next() {
		var s LegalSection
		if err := rows.Scan(&s.SectionID, &s.SectionCode, &s.SectionTitle, &s.Description); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *Repository) CreateFIR(ctx context.Context, fir FIR, sectionIDs []uint64) (FIR, error) {
	db, ok := r.db.(*sql.DB)
	if !ok { return FIR{}, fmt.Errorf("transaction requires *sql.DB") }

	tx, err := db.BeginTx(ctx, nil)
	if err != nil { return FIR{}, err }
	defer tx.Rollback()

	var gdID any
	if fir.GDID != nil { gdID = *fir.GDID }

	res, err := tx.ExecContext(ctx, `
		INSERT INTO fir (fir_number, crime_category, filed_date, gd_id)
		VALUES (?, ?, ?, ?)`,
		fir.FIRNumber, fir.CrimeCategory, fir.FiledDate, gdID)
	if err != nil { return FIR{}, err }

	id, err := res.LastInsertId()
	if err != nil { return FIR{}, err }
	fir.FIRID = uint64(id)

	for _, sectionID := range sectionIDs {
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO fir_legal_section (fir_id, section_id)
			VALUES (?, ?)`, id, sectionID); err != nil {
			return FIR{}, err
		}
	}

	sections, err := r.sectionsForFIRTx(ctx, tx, fir.FIRID)
	if err != nil { return FIR{}, err }
	fir.LegalSections = sections

	if err := tx.Commit(); err != nil { return FIR{}, err }
	return fir, nil
}

func (r *Repository) sectionsForFIRTx(ctx context.Context, tx *sql.Tx, firID uint64) ([]LegalSection, error) {
	rows, err := tx.QueryContext(ctx, `
		SELECT ls.section_id, ls.section_code, ls.section_title, ls.description
		FROM legal_section ls
		INNER JOIN fir_legal_section fls ON fls.section_id = ls.section_id
		WHERE fls.fir_id = ?
		ORDER BY ls.section_code`, firID)
	if err != nil { return nil, err }
	defer rows.Close()

	out := []LegalSection{}
	for rows.Next() {
		var s LegalSection
		if err := rows.Scan(&s.SectionID, &s.SectionCode, &s.SectionTitle, &s.Description); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *Repository) sectionsForFIR(ctx context.Context, firID uint64) ([]LegalSection, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT ls.section_id, ls.section_code, ls.section_title, ls.description
		FROM legal_section ls
		INNER JOIN fir_legal_section fls ON fls.section_id = ls.section_id
		WHERE fls.fir_id = ?
		ORDER BY ls.section_code`, firID)
	if err != nil { return nil, err }
	defer rows.Close()

	out := []LegalSection{}
	for rows.Next() {
		var s LegalSection
		if err := rows.Scan(&s.SectionID, &s.SectionCode, &s.SectionTitle, &s.Description); err != nil {
			return nil, err
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r *Repository) ListFIR(ctx context.Context, filters map[string]string, page, limit int) (Page[FIR], error) {
	conditions := []string{"1=1"}
	args := []any{}

	for _, f := range []struct{ key, sql string }{
		{"fir_number", "f.fir_number = ?"},
		{"crime_category", "f.crime_category = ?"},
		{"gd_id", "f.gd_id = ?"},
		{"date_from", "f.filed_date >= ?"},
		{"date_to", "f.filed_date <= ?"},
	} {
		if v := filters[f.key]; v != "" {
			conditions = append(conditions, f.sql)
			args = append(args, v)
		}
	}
	if v := filters["section_code"]; v != "" {
		conditions = append(conditions, `EXISTS (
			SELECT 1 FROM fir_legal_section fls
			INNER JOIN legal_section ls ON ls.section_id = fls.section_id
			WHERE fls.fir_id = f.fir_id AND ls.section_code = ?
		)`)
		args = append(args, v)
	}

	where := strings.Join(conditions, " AND ")
	var total int
	if err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM fir f WHERE `+where, args...).Scan(&total); err != nil {
		return Page[FIR]{}, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(ctx, `
		SELECT f.fir_id, f.fir_number, f.crime_category, f.filed_date, f.gd_id
		FROM fir f
		WHERE `+where+`
		ORDER BY f.filed_date DESC, f.fir_id DESC
		LIMIT ? OFFSET ?`, append(args, limit, offset)...)
	if err != nil { return Page[FIR]{}, err }
	defer rows.Close()

	items := []FIR{}
	for rows.Next() {
		var f FIR
		var gdID sql.NullInt64
		if err := rows.Scan(&f.FIRID, &f.FIRNumber, &f.CrimeCategory, &f.FiledDate, &gdID); err != nil {
			return Page[FIR]{}, err
		}
		if gdID.Valid {
			v := uint64(gdID.Int64)
			f.GDID = &v
		}
		sections, err := r.sectionsForFIR(ctx, f.FIRID)
		if err != nil { return Page[FIR]{}, err }
		f.LegalSections = sections
		items = append(items, f)
	}
	return Page[FIR]{Items: items, Page: page, Limit: limit, Total: total}, rows.Err()
}

func (r *Repository) CreateCase(ctx context.Context, c Case) (Case, error) {
	var firID any
	if c.FIRID != nil { firID = *c.FIRID }
	var assigned any
	if c.AssignedDate != nil { assigned = *c.AssignedDate }

	res, err := r.db.ExecContext(ctx, `
		INSERT INTO \`case\` (case_title, status, opened_date, assigned_date, fir_id)
		VALUES (?, ?, ?, ?, ?)`,
		c.CaseTitle, c.Status, c.OpenedDate, assigned, firID)
	if err != nil { return Case{}, err }

	id, err := res.LastInsertId()
	if err != nil { return Case{}, err }
	c.CaseID = uint64(id)
	return c, nil
}

func (r *Repository) SearchCases(ctx context.Context, filters map[string]string, page, limit int) (Page[Case], error) {
	conditions := []string{"1=1"}
	args := []any{}

	fields := []struct{ key, sql string }{
		{"case_id", "c.case_id = ?"},
		{"status", "c.status = ?"},
		{"fir_id", "c.fir_id = ?"},
		{"gd_number", "g.gd_number = ?"},
		{"fir_number", "f.fir_number = ?"},
		{"complainant_id", "g.complainant_id = ?"},
		{"crime_category", "f.crime_category = ?"},
		{"opened_from", "c.opened_date >= ?"},
		{"opened_to", "c.opened_date <= ?"},
		{"search", "c.case_title LIKE CONCAT('%', ?, '%')"},
	}
	for _, f := range fields {
		if v := filters[f.key]; v != "" {
			conditions = append(conditions, f.sql)
			args = append(args, v)
		}
	}

	where := strings.Join(conditions, " AND ")
	joins := `
		LEFT JOIN fir f ON f.fir_id = c.fir_id
		LEFT JOIN gd g ON g.gd_id = f.gd_id`

	var total int
	if err := r.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM \`case\` c `+joins+` WHERE `+where, args...).Scan(&total); err != nil {
		return Page[Case]{}, err
	}

	offset := (page - 1) * limit
	rows, err := r.db.QueryContext(ctx, `
		SELECT c.case_id, c.case_title, c.status, c.opened_date, c.assigned_date, c.fir_id
		FROM \`case\` c `+joins+`
		WHERE `+where+`
		ORDER BY c.opened_date DESC, c.case_id DESC
		LIMIT ? OFFSET ?`, append(args, limit, offset)...)
	if err != nil { return Page[Case]{}, err }
	defer rows.Close()

	items := []Case{}
	for rows.Next() {
		var c Case
		var assigned sql.NullString
		var firID sql.NullInt64
		if err := rows.Scan(&c.CaseID, &c.CaseTitle, &c.Status, &c.OpenedDate, &assigned, &firID); err != nil {
			return Page[Case]{}, err
		}
		if assigned.Valid { c.AssignedDate = &assigned.String }
		if firID.Valid {
			v := uint64(firID.Int64)
			c.FIRID = &v
		}
		items = append(items, c)
	}
	return Page[Case]{Items: items, Page: page, Limit: limit, Total: total}, rows.Err()
}

func (r *Repository) GetCaseDossier(ctx context.Context, caseID uint64) (CaseDossier, error) {
	var out CaseDossier
	var c Case
	var assigned sql.NullString
	var firID sql.NullInt64

	err := r.db.QueryRowContext(ctx, `
		SELECT case_id, case_title, status, opened_date, assigned_date, fir_id
		FROM \`case\`
		WHERE case_id = ?`, caseID).
		Scan(&c.CaseID, &c.CaseTitle, &c.Status, &c.OpenedDate, &assigned, &firID)

	if err == sql.ErrNoRows { return out, ErrNotFound }
	if err != nil { return out, err }

	if assigned.Valid { c.AssignedDate = &assigned.String }
	if firID.Valid {
		v := uint64(firID.Int64)
		c.FIRID = &v
	}
	out.Case = c

	history, err := r.GetCaseHistory(ctx, caseID)
	if err != nil { return out, err }
	out.StatusHistory = history

	if c.FIRID == nil { return out, nil }

	var f FIR
	var gdID sql.NullInt64
	err = r.db.QueryRowContext(ctx, `
		SELECT fir_id, fir_number, crime_category, filed_date, gd_id
		FROM fir WHERE fir_id = ?`, *c.FIRID).
		Scan(&f.FIRID, &f.FIRNumber, &f.CrimeCategory, &f.FiledDate, &gdID)
	if err == sql.ErrNoRows { return out, nil }
	if err != nil { return out, err }

	if gdID.Valid {
		v := uint64(gdID.Int64)
		f.GDID = &v
	}
	f.LegalSections, err = r.sectionsForFIR(ctx, f.FIRID)
	if err != nil { return out, err }
	out.FIR = &f
	out.LegalSections = f.LegalSections

	if f.GDID == nil { return out, nil }

	var g GD
	var complainantID sql.NullInt64
	err = r.db.QueryRowContext(ctx, `
		SELECT gd_id, gd_number, gd_date, subject, complainant_id
		FROM gd WHERE gd_id = ?`, *f.GDID).
		Scan(&g.GDID, &g.GDNumber, &g.GDDate, &g.Subject, &complainantID)
	if err == sql.ErrNoRows { return out, nil }
	if err != nil { return out, err }

	if complainantID.Valid {
		v := uint64(complainantID.Int64)
		g.ComplainantID = &v
	}
	out.GD = &g

	if g.ComplainantID == nil { return out, nil }

	var p Complainant
	err = r.db.QueryRowContext(ctx, `
		SELECT complainant_id, name
		FROM complainant WHERE complainant_id = ?`, *g.ComplainantID).
		Scan(&p.ComplainantID, &p.Name)
	if err == sql.ErrNoRows { return out, nil }
	if err != nil { return out, err }

	p.Contacts, err = r.listContacts(ctx, p.ComplainantID)
	if err != nil { return out, err }
	out.Complainant = &p

	return out, nil
}

func (r *Repository) TransitionCaseStatus(ctx context.Context, caseID uint64, status, remarks string) (Case, error) {
	db, ok := r.db.(*sql.DB)
	if !ok { return Case{}, fmt.Errorf("transaction requires *sql.DB") }

	tx, err := db.BeginTx(ctx, nil)
	if err != nil { return Case{}, err }
	defer tx.Rollback()

	var c Case
	var assigned sql.NullString
	var firID sql.NullInt64

	err = tx.QueryRowContext(ctx, `
		SELECT case_id, case_title, status, opened_date, assigned_date, fir_id
		FROM \`case\`
		WHERE case_id = ?
		FOR UPDATE`, caseID).
		Scan(&c.CaseID, &c.CaseTitle, &c.Status, &c.OpenedDate, &assigned, &firID)

	if err == sql.ErrNoRows { return Case{}, ErrNotFound }
	if err != nil { return Case{}, err }

	if assigned.Valid { c.AssignedDate = &assigned.String }
	if firID.Valid {
		v := uint64(firID.Int64)
		c.FIRID = &v
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE \`case\` SET status = ? WHERE case_id = ?`,
		status, caseID); err != nil {
		return Case{}, err
	}

	var remarksValue any
	if strings.TrimSpace(remarks) != "" { remarksValue = remarks }

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO case_status_history
			(case_id, status, changed_at, remarks)
		VALUES (?, ?, ?, ?)`,
		caseID, status, time.Now().UTC(), remarksValue); err != nil {
		return Case{}, err
	}

	if err := tx.Commit(); err != nil { return Case{}, err }
	c.Status = status
	return c, nil
}

func (r *Repository) GetCaseHistory(ctx context.Context, caseID uint64) ([]CaseStatusHistory, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT history_id, case_id, status, changed_at, remarks
		FROM case_status_history
		WHERE case_id = ?
		ORDER BY changed_at ASC, history_id ASC`, caseID)
	if err != nil { return nil, err }
	defer rows.Close()

	out := []CaseStatusHistory{}
	for rows.Next() {
		var h CaseStatusHistory
		var remarks sql.NullString
		if err := rows.Scan(&h.HistoryID, &h.CaseID, &h.Status, &h.ChangedAt, &remarks); err != nil {
			return nil, err
		}
		if remarks.Valid { h.Remarks = &remarks.String }
		out = append(out, h)
	}
	return out, rows.Err()
}
