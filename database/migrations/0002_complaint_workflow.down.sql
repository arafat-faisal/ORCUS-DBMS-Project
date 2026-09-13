-- ============================================================================
-- Migration: 0002_complaint_workflow.down.sql
-- Description: Revert Complaint intake and related foreign keys
-- ============================================================================

ALTER TABLE fir
    DROP FOREIGN KEY IF EXISTS fk_fir_complaint,
    DROP COLUMN IF EXISTS source_type,
    DROP COLUMN IF EXISTS source_complaint_id;

ALTER TABLE gd
    DROP FOREIGN KEY IF EXISTS fk_gd_complaint,
    DROP COLUMN IF EXISTS complaint_id;

DROP TABLE IF EXISTS complaint_transfer_history;
DROP TABLE IF EXISTS complaint_status_history;
DROP TABLE IF EXISTS complaint;
DROP TABLE IF EXISTS complaint_category;
