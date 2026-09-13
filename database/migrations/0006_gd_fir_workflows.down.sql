-- ============================================================================
-- Migration: 0006_gd_fir_workflows.down.sql
-- Purpose: Rollback GD and FIR status histories and workflow attributes safely.
-- ============================================================================

DROP TABLE IF EXISTS `fir_status_history`;
DROP TABLE IF EXISTS `gd_status_history`;

ALTER TABLE `fir`
  DROP FOREIGN KEY IF EXISTS `fk_fir_branch`,
  DROP FOREIGN KEY IF EXISTS `fk_fir_complainant`,
  DROP FOREIGN KEY IF EXISTS `fk_fir_creator`,
  DROP FOREIGN KEY IF EXISTS `fk_fir_approver`,
  DROP COLUMN IF EXISTS `branch_id`,
  DROP COLUMN IF EXISTS `complainant_id`,
  DROP COLUMN IF EXISTS `current_status`,
  DROP COLUMN IF EXISTS `place_of_occurrence`,
  DROP COLUMN IF EXISTS `incident_date`,
  DROP COLUMN IF EXISTS `incident_time`,
  DROP COLUMN IF EXISTS `created_by_user_id`,
  DROP COLUMN IF EXISTS `approved_by_user_id`,
  DROP COLUMN IF EXISTS `approved_at`,
  DROP COLUMN IF EXISTS `created_at`,
  DROP COLUMN IF EXISTS `updated_at`;

ALTER TABLE `gd`
  DROP FOREIGN KEY IF EXISTS `fk_gd_branch`,
  DROP FOREIGN KEY IF EXISTS `fk_gd_creator`,
  DROP FOREIGN KEY IF EXISTS `fk_gd_approver`,
  DROP COLUMN IF EXISTS `branch_id`,
  DROP COLUMN IF EXISTS `current_status`,
  DROP COLUMN IF EXISTS `incident_place`,
  DROP COLUMN IF EXISTS `created_by_user_id`,
  DROP COLUMN IF EXISTS `approved_by_user_id`,
  DROP COLUMN IF EXISTS `approved_at`,
  DROP COLUMN IF EXISTS `created_at`,
  DROP COLUMN IF EXISTS `updated_at`;
