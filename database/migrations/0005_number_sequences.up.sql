-- ============================================================================
-- Migration: 0005_number_sequences.up.sql
-- Description: Concurrency-safe server-side identifier sequences and strict chain-of-custody hardening
-- ============================================================================

-- 1. System Sequence Generator for Atomic Identifier Generation
CREATE TABLE IF NOT EXISTS system_sequence (
    sequence_key VARCHAR(64) NOT NULL PRIMARY KEY,
    current_val  BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pre-seed sequence generators for 2026 based on existing highest numbers
INSERT INTO system_sequence (sequence_key, current_val) VALUES
    ('CMP-DHK-2026', 10),
    ('GD-DHK-MOT-2026', 10),
    ('FIR-DHK-MOT-2026', 10),
    ('CASE-DHK-MOT-2026', 10)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 2. Evidence Table Enhancements
ALTER TABLE evidence
    ADD COLUMN IF NOT EXISTS evidence_ref VARCHAR(64) NULL AFTER evidence_no,
    ADD COLUMN IF NOT EXISTS packaging_ref VARCHAR(100) NULL AFTER description,
    ADD COLUMN IF NOT EXISTS seal_ref VARCHAR(100) NULL AFTER packaging_ref,
    ADD COLUMN IF NOT EXISTS confidentiality_level VARCHAR(30) NOT NULL DEFAULT 'Standard' AFTER status,
    ADD COLUMN IF NOT EXISTS digital_hash VARCHAR(64) NULL AFTER storage_location,
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE AFTER digital_hash,
    ADD COLUMN IF NOT EXISTS version INT UNSIGNED NOT NULL DEFAULT 1 AFTER is_archived,
    ADD CONSTRAINT uq_evidence_ref UNIQUE IF NOT EXISTS (evidence_ref);

-- 3. Strengthen Evidence Status History (Chain of Custody)
-- Alter foreign key constraint to ON DELETE RESTRICT (Prevents destructive purging of custody chain)
ALTER TABLE evidence_status_history
    DROP FOREIGN KEY IF EXISTS fk_evidence_history_evidence;

ALTER TABLE evidence_status_history
    ADD CONSTRAINT fk_evidence_history_evidence FOREIGN KEY (evidence_id)
        REFERENCES evidence (evidence_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT;

-- Add chain-of-custody transfer and verification fields
ALTER TABLE evidence_status_history
    ADD COLUMN IF NOT EXISTS action VARCHAR(50) NOT NULL DEFAULT 'Status Update' AFTER changed_by_user_id,
    ADD COLUMN IF NOT EXISTS from_custodian_id INT UNSIGNED NULL AFTER action,
    ADD COLUMN IF NOT EXISTS to_custodian_id INT UNSIGNED NULL AFTER from_custodian_id,
    ADD COLUMN IF NOT EXISTS from_location VARCHAR(150) NULL AFTER to_custodian_id,
    ADD COLUMN IF NOT EXISTS to_location VARCHAR(150) NULL AFTER from_location,
    ADD COLUMN IF NOT EXISTS seal_condition VARCHAR(30) NOT NULL DEFAULT 'Intact' AFTER to_location,
    ADD COLUMN IF NOT EXISTS transfer_reason TEXT NULL AFTER seal_condition,
    ADD COLUMN IF NOT EXISTS request_ref VARCHAR(100) NULL AFTER transfer_reason,
    ADD CONSTRAINT fk_esh_from_custodian FOREIGN KEY IF NOT EXISTS (from_custodian_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_esh_to_custodian FOREIGN KEY IF NOT EXISTS (to_custodian_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;
