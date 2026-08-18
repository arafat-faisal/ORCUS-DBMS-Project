-- ============================================================================
-- ORCUS Investigation Agency - Database Views
-- Target RDBMS : MySQL 8.0+ / MariaDB 10.4+ (XAMPP)
-- Database     : orcus_db
-- Description  : Standardized views for reporting, dashboards, and APIs.
-- ============================================================================

USE orcus_db;

-- ----------------------------------------------------------------------------
-- 1. v_case_overview
-- Unified executive dashboard view combining case info, lead investigator,
-- source FIR, branch, and participant/evidence metrics.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_case_overview AS
SELECT
    c.case_id,
    c.case_title,
    c.status AS case_status,
    c.opened_date,
    c.assigned_date,
    f.fir_number,
    f.crime_category,
    g.gd_number,
    o.badge_no AS lead_officer_badge,
    CONCAT(o.first_name, ' ', o.last_name) AS lead_officer_name,
    o.rank AS lead_officer_rank,
    b.branch_name,
    b.district,
    (SELECT COUNT(*) FROM case_suspect cs WHERE cs.case_id = c.case_id) AS suspect_count,
    (SELECT COUNT(*) FROM case_victim cv WHERE cv.case_id = c.case_id) AS victim_count,
    (SELECT COUNT(*) FROM case_witness cw WHERE cw.case_id = c.case_id) AS witness_count,
    (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.case_id) AS evidence_count
FROM `case` c
LEFT JOIN fir f ON c.fir_id = f.fir_id
LEFT JOIN gd g ON f.gd_id = g.gd_id
LEFT JOIN officer o ON c.lead_officer_id = o.officer_id
LEFT JOIN agency_branch b ON o.branch_id = b.branch_id;

-- ----------------------------------------------------------------------------
-- 2. v_evidence_chain_of_custody
-- Complete chronological chain-of-custody audit log for evidence items.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_evidence_chain_of_custody AS
SELECT
    e.evidence_id,
    c.case_id,
    c.case_title,
    e.evidence_no,
    e.title AS evidence_title,
    e.evidence_type,
    e.storage_location,
    h.history_id,
    h.status AS logged_status,
    h.changed_at,
    h.remarks,
    u.username AS updated_by_username,
    CONCAT(o.first_name, ' ', o.last_name) AS updated_by_officer
FROM evidence e
JOIN `case` c ON e.case_id = c.case_id
JOIN evidence_status_history h ON e.evidence_id = h.evidence_id
LEFT JOIN `user` u ON h.changed_by_user_id = u.user_id
LEFT JOIN officer o ON u.officer_id = o.officer_id;

-- ----------------------------------------------------------------------------
-- 3. v_officer_caseload
-- Resource allocation and workload analytics per officer.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_officer_caseload AS
SELECT
    o.officer_id,
    o.badge_no,
    CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
    o.rank,
    b.branch_name,
    b.district,
    COUNT(c.case_id) AS total_cases_assigned,
    SUM(CASE WHEN c.status IN ('Open', 'Under Investigation', 'Pending Review') THEN 1 ELSE 0 END) AS active_cases,
    SUM(CASE WHEN c.status = 'Closed' THEN 1 ELSE 0 END) AS closed_cases
FROM officer o
JOIN agency_branch b ON o.branch_id = b.branch_id
LEFT JOIN `case` c ON o.officer_id = c.lead_officer_id
GROUP BY o.officer_id, o.badge_no, o.first_name, o.last_name, o.rank, b.branch_name, b.district;

-- ----------------------------------------------------------------------------
-- 4. v_suspect_dossier
-- Comprehensive suspect profile aggregated across all linked cases.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_suspect_dossier AS
SELECT
    s.suspect_id,
    CONCAT(s.first_name, ' ', s.last_name) AS suspect_name,
    s.age,
    s.suspicion_level,
    s.status AS suspect_status,
    s.identification_sign,
    c.case_id,
    c.case_title,
    c.status AS case_status,
    cs.role_in_crime
FROM suspect s
JOIN case_suspect cs ON s.suspect_id = cs.suspect_id
JOIN `case` c ON cs.case_id = c.case_id;

-- ----------------------------------------------------------------------------
-- 5. v_fir_case_pipeline
-- Intake pipeline tracking intake progression: GD -> FIR -> Legal Sections -> Case.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_fir_case_pipeline AS
SELECT
    f.fir_id,
    f.fir_number,
    f.crime_category,
    f.filed_date,
    g.gd_number,
    g.gd_date,
    cmp.name AS complainant_name,
    GROUP_CONCAT(DISTINCT ls.section_code ORDER BY ls.section_code SEPARATOR ', ') AS applicable_legal_sections,
    c.case_id,
    c.case_title,
    c.status AS case_status
FROM fir f
LEFT JOIN gd g ON f.gd_id = g.gd_id
LEFT JOIN complainant cmp ON g.complainant_id = cmp.complainant_id
LEFT JOIN fir_legal_section fls ON f.fir_id = fls.fir_id
LEFT JOIN legal_section ls ON fls.section_id = ls.section_id
LEFT JOIN `case` c ON f.fir_id = c.fir_id
GROUP BY f.fir_id, f.fir_number, f.crime_category, f.filed_date, g.gd_number, g.gd_date, cmp.name, c.case_id, c.case_title, c.status;
