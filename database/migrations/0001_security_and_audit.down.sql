-- ============================================================================
-- Migration: 0001_security_and_audit.down.sql
-- Description: Reverts security columns and audit log
-- ============================================================================

DROP TABLE IF EXISTS audit_log;

ALTER TABLE `user`
    DROP COLUMN IF EXISTS locked_until,
    DROP COLUMN IF EXISTS failed_login_attempts,
    DROP COLUMN IF EXISTS last_login_at,
    DROP COLUMN IF EXISTS is_active;
