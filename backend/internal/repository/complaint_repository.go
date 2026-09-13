package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type ComplaintRepository interface {
	BeginTx() (*sqlx.Tx, error)
	GetCategories() ([]models.ComplaintCategory, error)
	CreateComplaint(runner sqlx.Ext, c *models.Complaint) (uint, error)
	GetComplaintByID(id uint) (*models.Complaint, error)
	GetComplaintByTrackingCode(trackingCode string) (*models.Complaint, error)
	ListComplaints(filter models.ComplaintFilter) ([]models.Complaint, int, error)
	AddStatusHistory(runner sqlx.Ext, h *models.ComplaintStatusHistory) error
	GetStatusHistory(complaintID uint) ([]models.ComplaintStatusHistory, error)
	UpdateComplaintStatus(runner sqlx.Ext, complaintID uint, newStatus string, publicMsg *string, internalNotes *string, reviewerID *uint, currentVersion uint) error
	RecordTransfer(runner sqlx.Ext, t *models.ComplaintTransferHistory) error
	GetTransferHistory(complaintID uint) ([]models.ComplaintTransferHistory, error)
	GetBranchCode(branchID uint) (string, error)
}

type complaintRepository struct {
	db *sqlx.DB
}

func NewComplaintRepository(db *sqlx.DB) ComplaintRepository {
	return &complaintRepository{db: db}
}

func (r *complaintRepository) BeginTx() (*sqlx.Tx, error) {
	return r.db.Beginx()
}

func (r *complaintRepository) GetCategories() ([]models.ComplaintCategory, error) {
	var categories []models.ComplaintCategory
	err := r.db.Select(&categories, "SELECT category_id, name_en, name_bn, description, is_cognizable, created_at FROM complaint_category ORDER BY is_cognizable DESC, name_en ASC")
	if err != nil {
		return nil, err
	}
	return categories, nil
}

func (r *complaintRepository) CreateComplaint(runner sqlx.Ext, c *models.Complaint) (uint, error) {
	query := `INSERT INTO complaint (
		tracking_code, complainant_id, submission_channel, title, description,
		incident_date, incident_time, approximate_time, location_id, complaint_category_id,
		urgency, receiving_branch_id, assigned_reviewer_id, current_status, confidentiality_level,
		public_status_message, internal_notes, created_by_user_id
	) VALUES (
		?, ?, ?, ?, ?,
		?, ?, ?, ?, ?,
		?, ?, ?, ?, ?,
		?, ?, ?
	)`

	var res sql.Result
	var err error
	if runner != nil {
		res, err = runner.Exec(query,
			c.TrackingCode, c.ComplainantID, c.SubmissionChannel, c.Title, c.Description,
			c.IncidentDate, c.IncidentTime, c.ApproximateTime, c.LocationID, c.ComplaintCategoryID,
			c.Urgency, c.ReceivingBranchID, c.AssignedReviewerID, c.CurrentStatus, c.ConfidentialityLevel,
			c.PublicStatusMessage, c.InternalNotes, c.CreatedByUserID,
		)
	} else {
		res, err = r.db.Exec(query,
			c.TrackingCode, c.ComplainantID, c.SubmissionChannel, c.Title, c.Description,
			c.IncidentDate, c.IncidentTime, c.ApproximateTime, c.LocationID, c.ComplaintCategoryID,
			c.Urgency, c.ReceivingBranchID, c.AssignedReviewerID, c.CurrentStatus, c.ConfidentialityLevel,
			c.PublicStatusMessage, c.InternalNotes, c.CreatedByUserID,
		)
	}
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func (r *complaintRepository) GetComplaintByID(id uint) (*models.Complaint, error) {
	query := `SELECT 
		c.complaint_id, c.tracking_code, c.complainant_id, c.submission_channel, c.title, c.description,
		c.incident_date, c.incident_time, c.approximate_time, c.location_id, c.complaint_category_id,
		c.urgency, c.receiving_branch_id, c.assigned_reviewer_id, c.current_status, c.confidentiality_level,
		c.public_status_message, c.internal_notes, c.submitted_at, c.reviewed_at, c.closed_at,
		c.created_by_user_id, c.updated_at, c.version,
		comp.name AS complainant_name,
		COALESCE(cc.contact_value, '') AS complainant_phone,
		COALESCE(cat.name_en, 'Uncategorized') AS category_name,
		b.branch_name,
		CONCAT(COALESCE(o.first_name, ''), ' ', COALESCE(o.last_name, '')) AS reviewer_name
	FROM complaint c
	JOIN complainant comp ON c.complainant_id = comp.complainant_id
	LEFT JOIN complainant_contact cc ON comp.complainant_id = cc.complainant_id AND cc.is_primary = TRUE
	LEFT JOIN complaint_category cat ON c.complaint_category_id = cat.category_id
	JOIN agency_branch b ON c.receiving_branch_id = b.branch_id
	LEFT JOIN officer o ON c.assigned_reviewer_id = o.officer_id
	WHERE c.complaint_id = ?`

	var c models.Complaint
	err := r.db.Get(&c, query, id)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *complaintRepository) GetComplaintByTrackingCode(trackingCode string) (*models.Complaint, error) {
	query := `SELECT 
		c.complaint_id, c.tracking_code, c.complainant_id, c.submission_channel, c.title, c.description,
		c.incident_date, c.incident_time, c.approximate_time, c.location_id, c.complaint_category_id,
		c.urgency, c.receiving_branch_id, c.assigned_reviewer_id, c.current_status, c.confidentiality_level,
		c.public_status_message, c.submitted_at, c.reviewed_at, c.closed_at, c.updated_at, c.version,
		comp.name AS complainant_name,
		COALESCE(cc.contact_value, '') AS complainant_phone,
		COALESCE(cat.name_en, 'Uncategorized') AS category_name,
		b.branch_name
	FROM complaint c
	JOIN complainant comp ON c.complainant_id = comp.complainant_id
	LEFT JOIN complainant_contact cc ON comp.complainant_id = cc.complainant_id AND cc.is_primary = TRUE
	LEFT JOIN complaint_category cat ON c.complaint_category_id = cat.category_id
	JOIN agency_branch b ON c.receiving_branch_id = b.branch_id
	WHERE c.tracking_code = ?`

	var c models.Complaint
	err := r.db.Get(&c, query, strings.TrimSpace(trackingCode))
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *complaintRepository) ListComplaints(filter models.ComplaintFilter) ([]models.Complaint, int, error) {
	var conditions []string
	var args []interface{}

	if filter.Status != "" {
		conditions = append(conditions, "c.current_status = ?")
		args = append(args, filter.Status)
	}
	if filter.BranchID != nil && *filter.BranchID > 0 {
		conditions = append(conditions, "c.receiving_branch_id = ?")
		args = append(args, *filter.BranchID)
	}
	if filter.CategoryID != nil && *filter.CategoryID > 0 {
		conditions = append(conditions, "c.complaint_category_id = ?")
		args = append(args, *filter.CategoryID)
	}
	if filter.Search != "" {
		searchPattern := "%" + strings.TrimSpace(filter.Search) + "%"
		conditions = append(conditions, "(c.tracking_code LIKE ? OR c.title LIKE ? OR comp.name LIKE ?)")
		args = append(args, searchPattern, searchPattern, searchPattern)
	}
	if filter.StartDate != "" {
		conditions = append(conditions, "c.submitted_at >= ?")
		args = append(args, filter.StartDate+" 00:00:00")
	}
	if filter.EndDate != "" {
		conditions = append(conditions, "c.submitted_at <= ?")
		args = append(args, filter.EndDate+" 23:59:59")
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Count total
	countQuery := fmt.Sprintf(`SELECT COUNT(*) 
		FROM complaint c 
		JOIN complainant comp ON c.complainant_id = comp.complainant_id 
		%s`, whereClause)
	var total int
	err := r.db.Get(&total, countQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	dataQuery := fmt.Sprintf(`SELECT 
		c.complaint_id, c.tracking_code, c.complainant_id, c.submission_channel, c.title, c.description,
		c.incident_date, c.incident_time, c.approximate_time, c.location_id, c.complaint_category_id,
		c.urgency, c.receiving_branch_id, c.assigned_reviewer_id, c.current_status, c.confidentiality_level,
		c.public_status_message, c.submitted_at, c.reviewed_at, c.closed_at,
		c.created_by_user_id, c.updated_at, c.version,
		comp.name AS complainant_name,
		COALESCE(cat.name_en, 'Uncategorized') AS category_name,
		b.branch_name
	FROM complaint c
	JOIN complainant comp ON c.complainant_id = comp.complainant_id
	LEFT JOIN complaint_category cat ON c.complaint_category_id = cat.category_id
	JOIN agency_branch b ON c.receiving_branch_id = b.branch_id
	%s
	ORDER BY c.submitted_at DESC
	LIMIT %d OFFSET %d`, whereClause, pageSize, offset)

	var complaints []models.Complaint
	err = r.db.Select(&complaints, dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}

	return complaints, total, nil
}

func (r *complaintRepository) AddStatusHistory(runner sqlx.Ext, h *models.ComplaintStatusHistory) error {
	query := `INSERT INTO complaint_status_history (
		complaint_id, previous_status, new_status, decision, reason, acting_user_id, acting_branch_id
	) VALUES (?, ?, ?, ?, ?, ?, ?)`

	var err error
	if runner != nil {
		_, err = runner.Exec(query, h.ComplaintID, h.PreviousStatus, h.NewStatus, h.Decision, h.Reason, h.ActingUserID, h.ActingBranchID)
	} else {
		_, err = r.db.Exec(query, h.ComplaintID, h.PreviousStatus, h.NewStatus, h.Decision, h.Reason, h.ActingUserID, h.ActingBranchID)
	}
	return err
}

func (r *complaintRepository) GetStatusHistory(complaintID uint) ([]models.ComplaintStatusHistory, error) {
	query := `SELECT 
		h.history_id, h.complaint_id, h.previous_status, h.new_status, h.decision, h.reason,
		h.acting_user_id, h.acting_branch_id, h.created_at,
		COALESCE(u.username, 'System') AS acting_username,
		COALESCE(b.branch_name, 'Headquarters') AS acting_branch
	FROM complaint_status_history h
	LEFT JOIN user u ON h.acting_user_id = u.user_id
	LEFT JOIN agency_branch b ON h.acting_branch_id = b.branch_id
	WHERE h.complaint_id = ?
	ORDER BY h.created_at ASC, h.history_id ASC`

	var history []models.ComplaintStatusHistory
	err := r.db.Select(&history, query, complaintID)
	if err != nil {
		return nil, err
	}
	return history, nil
}

func (r *complaintRepository) UpdateComplaintStatus(runner sqlx.Ext, complaintID uint, newStatus string, publicMsg *string, internalNotes *string, reviewerID *uint, currentVersion uint) error {
	query := `UPDATE complaint SET 
		current_status = ?,
		public_status_message = COALESCE(?, public_status_message),
		internal_notes = COALESCE(?, internal_notes),
		assigned_reviewer_id = COALESCE(?, assigned_reviewer_id),
		reviewed_at = CURRENT_TIMESTAMP,
		version = version + 1
	WHERE complaint_id = ? AND version = ?`

	var res sql.Result
	var err error
	if runner != nil {
		res, err = runner.Exec(query, newStatus, publicMsg, internalNotes, reviewerID, complaintID, currentVersion)
	} else {
		res, err = r.db.Exec(query, newStatus, publicMsg, internalNotes, reviewerID, complaintID, currentVersion)
	}
	if err != nil {
		return err
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return fmt.Errorf("optimistic concurrency conflict: record was modified by another transaction")
	}
	return nil
}

func (r *complaintRepository) RecordTransfer(runner sqlx.Ext, t *models.ComplaintTransferHistory) error {
	query := `INSERT INTO complaint_transfer_history (
		complaint_id, from_branch_id, to_branch_id, transfer_reason, transferred_by_user_id
	) VALUES (?, ?, ?, ?, ?)`

	var err error
	if runner != nil {
		_, err = runner.Exec(query, t.ComplaintID, t.FromBranchID, t.ToBranchID, t.TransferReason, t.TransferredByUserID)
	} else {
		_, err = r.db.Exec(query, t.ComplaintID, t.FromBranchID, t.ToBranchID, t.TransferReason, t.TransferredByUserID)
	}
	return err
}

func (r *complaintRepository) GetTransferHistory(complaintID uint) ([]models.ComplaintTransferHistory, error) {
	query := `SELECT 
		t.transfer_id, t.complaint_id, t.from_branch_id, t.to_branch_id, t.transfer_reason,
		t.transferred_by_user_id, t.transferred_at,
		fb.branch_name AS from_branch_name,
		tb.branch_name AS to_branch_name,
		u.username AS transferred_by
	FROM complaint_transfer_history t
	JOIN agency_branch fb ON t.from_branch_id = fb.branch_id
	JOIN agency_branch tb ON t.to_branch_id = tb.branch_id
	JOIN user u ON t.transferred_by_user_id = u.user_id
	WHERE t.complaint_id = ?
	ORDER BY t.transferred_at ASC`

	var transfers []models.ComplaintTransferHistory
	err := r.db.Select(&transfers, query, complaintID)
	if err != nil {
		return nil, err
	}
	return transfers, nil
}

func (r *complaintRepository) GetBranchCode(branchID uint) (string, error) {
	var code string
	err := r.db.Get(&code, "SELECT COALESCE(branch_code, 'DHK-MOT') FROM agency_branch WHERE branch_id = ?", branchID)
	if err != nil {
		return "DHK-MOT", nil
	}
	return code, nil
}
