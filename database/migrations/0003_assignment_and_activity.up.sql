-- ============================================================================
-- Migration: 0003_assignment_and_activity.up.sql
-- Description: Case assignment history, case diary/activity log, and case metadata enhancements
-- ============================================================================

-- 1. Enhance `case` table with governance fields
ALTER TABLE `case`
    ADD COLUMN IF NOT EXISTS case_number VARCHAR(50) NULL AFTER case_id,
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'Medium' AFTER status,
    ADD COLUMN IF NOT EXISTS lead_branch_id INT UNSIGNED NULL AFTER lead_officer_id,
    ADD COLUMN IF NOT EXISTS supervising_officer_id INT UNSIGNED NULL AFTER lead_branch_id,
    ADD COLUMN IF NOT EXISTS confidentiality_level VARCHAR(30) NOT NULL DEFAULT 'Standard' AFTER supervising_officer_id,
    ADD COLUMN IF NOT EXISTS review_deadline DATE NULL AFTER assigned_date,
    ADD COLUMN IF NOT EXISTS closure_date DATE NULL AFTER review_deadline,
    ADD COLUMN IF NOT EXISTS closure_reason TEXT NULL AFTER closure_date,
    ADD COLUMN IF NOT EXISTS reopen_reason TEXT NULL AFTER closure_reason,
    ADD COLUMN IF NOT EXISTS version INT UNSIGNED NOT NULL DEFAULT 1 AFTER reopen_reason,
    ADD CONSTRAINT uq_case_number UNIQUE IF NOT EXISTS (case_number),
    ADD CONSTRAINT fk_case_lead_branch FOREIGN KEY IF NOT EXISTS (lead_branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    ADD CONSTRAINT fk_case_supervisor FOREIGN KEY IF NOT EXISTS (supervising_officer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

-- 2. Case Assignment History (Preserves all historical assignments, supports reassignment)
CREATE TABLE IF NOT EXISTS case_assignment_history (
    assignment_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id             INT UNSIGNED NOT NULL,
    officer_id          INT UNSIGNED NOT NULL,
    assignment_role     VARCHAR(50) NOT NULL DEFAULT 'Lead Investigator',
    assigned_by_user_id INT UNSIGNED NOT NULL,
    assigned_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_from      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_to        TIMESTAMP NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'Active',
    handover_notes      TEXT NULL,
    transfer_reason     TEXT NULL,
    branch_id           INT UNSIGNED NOT NULL,
    KEY idx_cah_case (case_id),
    KEY idx_cah_officer (officer_id),
    KEY idx_cah_status (status),
    KEY idx_cah_branch (branch_id),
    CONSTRAINT fk_cah_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cah_officer FOREIGN KEY (officer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cah_user FOREIGN KEY (assigned_by_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cah_branch FOREIGN KEY (branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Investigation Activity (Case Diary - Append-oriented log of investigation steps)
CREATE TABLE IF NOT EXISTS investigation_activity (
    activity_id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    case_id                   INT UNSIGNED NOT NULL,
    activity_type             VARCHAR(50) NOT NULL,
    title                     VARCHAR(200) NOT NULL,
    description               TEXT NOT NULL,
    occurred_at               DATETIME NOT NULL,
    recorded_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by_user_id       INT UNSIGNED NOT NULL,
    officer_id                INT UNSIGNED NULL,
    branch_id                 INT UNSIGNED NULL,
    visibility                VARCHAR(20) NOT NULL DEFAULT 'Internal',
    attachment_ref            VARCHAR(255) NULL,
    correction_of_activity_id INT UNSIGNED NULL,
    status                    VARCHAR(20) NOT NULL DEFAULT 'Active',
    version                   INT UNSIGNED NOT NULL DEFAULT 1,
    KEY idx_ia_case (case_id),
    KEY idx_ia_type (activity_type),
    KEY idx_ia_occurred (occurred_at),
    KEY idx_ia_recorded (recorded_at),
    CONSTRAINT fk_ia_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_ia_user FOREIGN KEY (recorded_by_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_ia_officer FOREIGN KEY (officer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_ia_branch FOREIGN KEY (branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_ia_correction FOREIGN KEY (correction_of_activity_id)
        REFERENCES investigation_activity (activity_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Backfill initial assignments for existing cases
INSERT INTO case_assignment_history (case_id, officer_id, assignment_role, assigned_by_user_id, status, branch_id)
SELECT 
    c.case_id,
    c.lead_officer_id,
    'Lead Investigator',
    COALESCE(u.user_id, 1),
    'Active',
    o.branch_id
FROM `case` c
JOIN officer o ON c.lead_officer_id = o.officer_id
LEFT JOIN `user` u ON u.officer_id = o.officer_id
WHERE c.lead_officer_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM case_assignment_history cah WHERE cah.case_id = c.case_id AND cah.officer_id = c.lead_officer_id
  );
