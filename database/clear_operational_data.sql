-- ============================================================================
-- ORCUS System: Reset & Clear Operational Transaction Data
-- Preserves: Users, Officers, Roles, Branches, Complaint Categories, Geography, Schema
-- Clears: Complaints, GDs, FIRs, Cases, Evidence, Suspects, Victims, Witnesses, Audit Logs
-- ============================================================================

USE orcus_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_log;
TRUNCATE TABLE case_assignment_history;
TRUNCATE TABLE case_location;
TRUNCATE TABLE case_status_history;
TRUNCATE TABLE case_suspect;
TRUNCATE TABLE case_victim;
TRUNCATE TABLE case_witness;
TRUNCATE TABLE victim_evidence;
TRUNCATE TABLE victim_location;
TRUNCATE TABLE evidence_status_history;
TRUNCATE TABLE evidence;
TRUNCATE TABLE investigation_activity;
TRUNCATE TABLE `case`;
TRUNCATE TABLE fir_legal_section;
TRUNCATE TABLE fir_status_history;
TRUNCATE TABLE fir;
TRUNCATE TABLE gd_status_history;
TRUNCATE TABLE gd;
TRUNCATE TABLE complaint_transfer_history;
TRUNCATE TABLE complaint_status_history;
TRUNCATE TABLE complaint;
TRUNCATE TABLE complainant_contact;
TRUNCATE TABLE complainant;
TRUNCATE TABLE witness;
TRUNCATE TABLE victim;
TRUNCATE TABLE suspect;
TRUNCATE TABLE location;

-- Reset Sequence Generator Counters to start fresh from #1
TRUNCATE TABLE system_sequence;

SET FOREIGN_KEY_CHECKS = 1;
