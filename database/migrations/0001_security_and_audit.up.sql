-- ============================================================================
-- Migration: 0001_security_and_audit.up.sql
-- Description: Schema migrations tracking, user security columns, roles, and audit log
-- ============================================================================

-- 1. Migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) NOT NULL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Enhanced security columns on `user` table
ALTER TABLE `user`
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER officer_id,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP NULL AFTER is_active,
    ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0 AFTER last_login_at,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL AFTER failed_login_attempts;

-- 3. System-Wide Append-Only Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(64) NULL,
    user_id INT UNSIGNED NULL,
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id VARCHAR(100) NULL,
    action VARCHAR(50) NOT NULL,
    route VARCHAR(255) NOT NULL,
    http_method VARCHAR(10) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    branch_id INT UNSIGNED NULL,
    before_summary TEXT NULL,
    after_summary TEXT NULL,
    result VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_user (user_id),
    KEY idx_audit_event_type (event_type),
    KEY idx_audit_entity (entity_type, entity_id),
    KEY idx_audit_branch (branch_id),
    KEY idx_audit_created_at (created_at),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_audit_branch FOREIGN KEY (branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Standard 8 Investigation Roles Alignment
INSERT INTO `role` (role_name, description) VALUES
    ('Administrator', 'System configuration, account management, and branch governance')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('Duty Officer', 'Intake desk officer managing complaint registration and initial verification')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('Officer-in-Charge', 'Branch leadership approving GD/FIR registration and assigning investigation leads')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('Investigating Officer', 'Lead or supporting officer assigned to open cases and evidence gathering')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('Evidence Officer', 'Custodian managing physical evidence storage, transfers, and chain-of-custody')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('Supervising Officer', 'Senior oversight officer reviewing case progress, status changes, and closure')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('System Auditor', 'Read-only access to audit logs, compliance records, and security events')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `role` (role_name, description) VALUES
    ('Public Complainant', 'Citizen account for submitting and tracking safe complaint progress')
ON DUPLICATE KEY UPDATE description = VALUES(description);
