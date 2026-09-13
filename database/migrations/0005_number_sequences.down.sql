-- ============================================================================
-- Migration: 0005_number_sequences.down.sql
-- Description: Revert sequence generator and custody history enhancements
-- ============================================================================

ALTER TABLE evidence_status_history
    DROP FOREIGN KEY IF EXISTS fk_esh_to_custodian,
    DROP FOREIGN KEY IF EXISTS fk_esh_from_custodian,
    DROP COLUMN IF EXISTS request_ref,
    DROP COLUMN IF EXISTS transfer_reason,
    DROP COLUMN IF EXISTS seal_condition,
    DROP COLUMN IF EXISTS to_location,
    DROP COLUMN IF EXISTS from_location,
    DROP COLUMN IF EXISTS to_custodian_id,
    DROP COLUMN IF EXISTS from_custodian_id,
    DROP COLUMN IF EXISTS action;

ALTER TABLE evidence_status_history
    DROP FOREIGN KEY IF EXISTS fk_evidence_history_evidence;

ALTER TABLE evidence_status_history
    ADD CONSTRAINT fk_evidence_history_evidence FOREIGN KEY (evidence_id)
        REFERENCES evidence (evidence_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE;

ALTER TABLE evidence
    DROP INDEX IF EXISTS uq_evidence_ref,
    DROP COLUMN IF EXISTS version,
    DROP COLUMN IF EXISTS is_archived,
    DROP COLUMN IF EXISTS digital_hash,
    DROP COLUMN IF EXISTS confidentiality_level,
    DROP COLUMN IF EXISTS seal_ref,
    DROP COLUMN IF EXISTS packaging_ref,
    DROP COLUMN IF EXISTS evidence_ref;

DROP TABLE IF EXISTS system_sequence;
