-- ============================================================================
-- Migration: 0006_gd_fir_workflows.up.sql
-- Purpose: Formalize GD and FIR status lifecycles, branch linkage, and append-only status histories.
-- Academic Context: Bangladesh Investigation Management Prototype
-- ============================================================================

-- 1. Extend GD (General Diary) table with workflow attributes
ALTER TABLE `gd`
  ADD COLUMN IF NOT EXISTS `branch_id` INT(10) UNSIGNED NOT NULL DEFAULT 1 AFTER `gd_number`,
  ADD COLUMN IF NOT EXISTS `current_status` VARCHAR(50) NOT NULL DEFAULT 'Approved' AFTER `subject`,
  ADD COLUMN IF NOT EXISTS `incident_place` VARCHAR(255) DEFAULT NULL AFTER `current_status`,
  ADD COLUMN IF NOT EXISTS `created_by_user_id` INT(10) UNSIGNED DEFAULT NULL AFTER `incident_place`,
  ADD COLUMN IF NOT EXISTS `approved_by_user_id` INT(10) UNSIGNED DEFAULT NULL AFTER `created_by_user_id`,
  ADD COLUMN IF NOT EXISTS `approved_at` DATETIME DEFAULT NULL AFTER `approved_by_user_id`,
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `approved_at`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Add indexes and foreign keys to gd if not exists
SET @fk_gd_branch_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'gd' AND constraint_name = 'fk_gd_branch'
);
SET @sql_gd_branch = IF(@fk_gd_branch_exists = 0,
  'ALTER TABLE `gd` ADD CONSTRAINT `fk_gd_branch` FOREIGN KEY (`branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_gd_branch FROM @sql_gd_branch;
EXECUTE stmt_gd_branch;
DEALLOCATE PREPARE stmt_gd_branch;

SET @fk_gd_creator_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'gd' AND constraint_name = 'fk_gd_creator'
);
SET @sql_gd_creator = IF(@fk_gd_creator_exists = 0,
  'ALTER TABLE `gd` ADD CONSTRAINT `fk_gd_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_gd_creator FROM @sql_gd_creator;
EXECUTE stmt_gd_creator;
DEALLOCATE PREPARE stmt_gd_creator;

SET @fk_gd_approver_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'gd' AND constraint_name = 'fk_gd_approver'
);
SET @sql_gd_approver = IF(@fk_gd_approver_exists = 0,
  'ALTER TABLE `gd` ADD CONSTRAINT `fk_gd_approver` FOREIGN KEY (`approved_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_gd_approver FROM @sql_gd_approver;
EXECUTE stmt_gd_approver;
DEALLOCATE PREPARE stmt_gd_approver;

-- 2. Create append-only gd_status_history table
CREATE TABLE IF NOT EXISTS `gd_status_history` (
  `history_id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `gd_id` INT(10) UNSIGNED NOT NULL,
  `previous_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `decision` VARCHAR(100) NOT NULL,
  `reason` TEXT DEFAULT NULL,
  `acting_user_id` INT(10) UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_gsh_gd` (`gd_id`),
  KEY `idx_gsh_created_at` (`created_at`),
  KEY `fk_gsh_user` (`acting_user_id`),
  CONSTRAINT `fk_gsh_gd` FOREIGN KEY (`gd_id`) REFERENCES `gd` (`gd_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_gsh_user` FOREIGN KEY (`acting_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Extend FIR table with workflow attributes
ALTER TABLE `fir`
  ADD COLUMN IF NOT EXISTS `branch_id` INT(10) UNSIGNED NOT NULL DEFAULT 1 AFTER `fir_number`,
  ADD COLUMN IF NOT EXISTS `complainant_id` INT(10) UNSIGNED DEFAULT NULL AFTER `branch_id`,
  ADD COLUMN IF NOT EXISTS `current_status` VARCHAR(50) NOT NULL DEFAULT 'Registered' AFTER `crime_category`,
  ADD COLUMN IF NOT EXISTS `place_of_occurrence` VARCHAR(255) DEFAULT NULL AFTER `current_status`,
  ADD COLUMN IF NOT EXISTS `incident_date` DATE DEFAULT NULL AFTER `place_of_occurrence`,
  ADD COLUMN IF NOT EXISTS `incident_time` TIME DEFAULT NULL AFTER `incident_date`,
  ADD COLUMN IF NOT EXISTS `created_by_user_id` INT(10) UNSIGNED DEFAULT NULL AFTER `incident_time`,
  ADD COLUMN IF NOT EXISTS `approved_by_user_id` INT(10) UNSIGNED DEFAULT NULL AFTER `created_by_user_id`,
  ADD COLUMN IF NOT EXISTS `approved_at` DATETIME DEFAULT NULL AFTER `approved_by_user_id`,
  ADD COLUMN IF NOT EXISTS `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `approved_at`,
  ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`;

-- Add indexes and foreign keys to fir if not exists
SET @fk_fir_branch_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'fir' AND constraint_name = 'fk_fir_branch'
);
SET @sql_fir_branch = IF(@fk_fir_branch_exists = 0,
  'ALTER TABLE `fir` ADD CONSTRAINT `fk_fir_branch` FOREIGN KEY (`branch_id`) REFERENCES `agency_branch` (`branch_id`) ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_fir_branch FROM @sql_fir_branch;
EXECUTE stmt_fir_branch;
DEALLOCATE PREPARE stmt_fir_branch;

SET @fk_fir_complainant_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'fir' AND constraint_name = 'fk_fir_complainant'
);
SET @sql_fir_complainant = IF(@fk_fir_complainant_exists = 0,
  'ALTER TABLE `fir` ADD CONSTRAINT `fk_fir_complainant` FOREIGN KEY (`complainant_id`) REFERENCES `complainant` (`complainant_id`) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_fir_complainant FROM @sql_fir_complainant;
EXECUTE stmt_fir_complainant;
DEALLOCATE PREPARE stmt_fir_complainant;

SET @fk_fir_creator_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'fir' AND constraint_name = 'fk_fir_creator'
);
SET @sql_fir_creator = IF(@fk_fir_creator_exists = 0,
  'ALTER TABLE `fir` ADD CONSTRAINT `fk_fir_creator` FOREIGN KEY (`created_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_fir_creator FROM @sql_fir_creator;
EXECUTE stmt_fir_creator;
DEALLOCATE PREPARE stmt_fir_creator;

SET @fk_fir_approver_exists = (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = DATABASE() AND table_name = 'fir' AND constraint_name = 'fk_fir_approver'
);
SET @sql_fir_approver = IF(@fk_fir_approver_exists = 0,
  'ALTER TABLE `fir` ADD CONSTRAINT `fk_fir_approver` FOREIGN KEY (`approved_by_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;',
  'SELECT 1;'
);
PREPARE stmt_fir_approver FROM @sql_fir_approver;
EXECUTE stmt_fir_approver;
DEALLOCATE PREPARE stmt_fir_approver;

-- 4. Create append-only fir_status_history table
CREATE TABLE IF NOT EXISTS `fir_status_history` (
  `history_id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fir_id` INT(10) UNSIGNED NOT NULL,
  `previous_status` VARCHAR(50) DEFAULT NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `decision` VARCHAR(100) NOT NULL,
  `reason` TEXT DEFAULT NULL,
  `acting_user_id` INT(10) UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`history_id`),
  KEY `idx_fsh_fir` (`fir_id`),
  KEY `idx_fsh_created_at` (`created_at`),
  KEY `fk_fsh_user` (`acting_user_id`),
  CONSTRAINT `fk_fsh_fir` FOREIGN KEY (`fir_id`) REFERENCES `fir` (`fir_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_fsh_user` FOREIGN KEY (`acting_user_id`) REFERENCES `user` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Seed initial history records for existing GDs and FIRs if empty
INSERT IGNORE INTO `gd_status_history` (`gd_id`, `previous_status`, `new_status`, `decision`, `reason`, `acting_user_id`, `created_at`)
SELECT `gd_id`, 'Draft', 'Approved', 'General Diary Approved', 'Verified by Station Duty Officer upon complaint registration.', 5, `gd_date`
FROM `gd`
WHERE `gd_id` NOT IN (SELECT DISTINCT `gd_id` FROM `gd_status_history`);

INSERT IGNORE INTO `fir_status_history` (`fir_id`, `previous_status`, `new_status`, `decision`, `reason`, `acting_user_id`, `created_at`)
SELECT `fir_id`, 'Verified', 'Registered', 'First Information Report Registered', 'Cognizable offense substantiated and officially registered by Officer-in-Charge.', 4, `filed_date`
FROM `fir`
WHERE `fir_id` NOT IN (SELECT DISTINCT `fir_id` FROM `fir_status_history`);
