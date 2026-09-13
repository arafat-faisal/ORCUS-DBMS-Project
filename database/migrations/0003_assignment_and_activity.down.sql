-- ============================================================================
-- Migration: 0003_assignment_and_activity.down.sql
-- Description: Revert case assignment history, investigation activities, and case metadata
-- ============================================================================

DROP TABLE IF EXISTS investigation_activity;
DROP TABLE IF EXISTS case_assignment_history;

ALTER TABLE `case`
    DROP FOREIGN KEY IF EXISTS fk_case_supervisor,
    DROP FOREIGN KEY IF EXISTS fk_case_lead_branch,
    DROP INDEX IF EXISTS uq_case_number,
    DROP COLUMN IF EXISTS version,
    DROP COLUMN IF EXISTS reopen_reason,
    DROP COLUMN IF EXISTS closure_reason,
    DROP COLUMN IF EXISTS closure_date,
    DROP COLUMN IF EXISTS review_deadline,
    DROP COLUMN IF EXISTS confidentiality_level,
    DROP COLUMN IF EXISTS supervising_officer_id,
    DROP COLUMN IF EXISTS lead_branch_id,
    DROP COLUMN IF EXISTS priority,
    DROP COLUMN IF EXISTS case_number;
