-- ============================================================================
-- ORCUS Investigation Agency - Demonstration & Reporting Queries
-- Target RDBMS : MySQL 8.0+ / MariaDB 10.4+ (XAMPP)
-- Database     : orcus_db
-- Description  : Standardized SQL queries demonstrating joins, aggregations,
--                subqueries, full-text search, audit trails, and reporting.
-- ============================================================================

USE orcus_db;

-- ----------------------------------------------------------------------------
-- QUERY 1: Complete Case Dossier (Multi-Table JOIN)
-- Retrieves comprehensive case information including lead officer, source FIR,
-- source GD, and complainant details.
-- ----------------------------------------------------------------------------
SELECT
    c.case_id,
    c.case_title,
    c.status AS case_status,
    c.opened_date,
    f.fir_number,
    f.crime_category,
    g.gd_number,
    g.gd_date,
    cmp.name AS complainant_name,
    CONCAT(o.first_name, ' ', o.last_name) AS lead_officer,
    o.badge_no,
    b.branch_name,
    b.district
FROM `case` c
LEFT JOIN fir f ON c.fir_id = f.fir_id
LEFT JOIN gd g ON f.gd_id = g.gd_id
LEFT JOIN complainant cmp ON g.complainant_id = cmp.complainant_id
LEFT JOIN officer o ON c.lead_officer_id = o.officer_id
LEFT JOIN agency_branch b ON o.branch_id = b.branch_id
ORDER BY c.case_id ASC;

-- ----------------------------------------------------------------------------
-- QUERY 2: Case Participant Roster (Suspects, Victims, Witnesses per Case)
-- Demonstrates bridge table navigation and UNION of participant roles.
-- ----------------------------------------------------------------------------
SELECT
    c.case_id,
    c.case_title,
    'Suspect' AS participant_role,
    CONCAT(s.first_name, ' ', s.last_name) AS participant_name,
    s.status AS participant_status,
    cs.role_in_crime AS role_description
FROM `case` c
JOIN case_suspect cs ON c.case_id = cs.case_id
JOIN suspect s ON cs.suspect_id = s.suspect_id

UNION ALL

SELECT
    c.case_id,
    c.case_title,
    'Victim' AS participant_role,
    v.name AS participant_name,
    CASE WHEN v.is_deceased THEN 'Deceased' ELSE 'Surviving' END AS participant_status,
    cv.impact_type AS role_description
FROM `case` c
JOIN case_victim cv ON c.case_id = cv.case_id
JOIN victim v ON cv.victim_id = v.victim_id

UNION ALL

SELECT
    c.case_id,
    c.case_title,
    'Witness' AS participant_role,
    w.name AS participant_name,
    CASE WHEN w.is_protected THEN 'Protected' ELSE 'Standard' END AS participant_status,
    w.reliability AS role_description
FROM `case` c
JOIN case_witness cw ON c.case_id = cw.case_id
JOIN witness w ON cw.witness_id = w.witness_id
ORDER BY case_id, participant_role;

-- ----------------------------------------------------------------------------
-- QUERY 3: Evidence Chain of Custody Audit Trail
-- Traces complete chronological history of an evidence item.
-- ----------------------------------------------------------------------------
SELECT
    e.evidence_id,
    c.case_title,
    e.evidence_no,
    e.title AS evidence_title,
    e.evidence_type,
    e.storage_location,
    esh.status AS recorded_status,
    esh.changed_at,
    esh.remarks,
    u.username AS updated_by
FROM evidence e
JOIN `case` c ON e.case_id = c.case_id
JOIN evidence_status_history esh ON e.evidence_id = esh.evidence_id
LEFT JOIN `user` u ON esh.changed_by_user_id = u.user_id
ORDER BY e.evidence_id, esh.changed_at ASC;

-- ----------------------------------------------------------------------------
-- QUERY 4: Crime Category and Legal Section Distribution (Aggregation & Grouping)
-- Aggregates FIR counts, distinct legal sections, and active cases by crime category.
-- ----------------------------------------------------------------------------
SELECT
    f.crime_category,
    COUNT(DISTINCT f.fir_id) AS total_firs,
    COUNT(DISTINCT c.case_id) AS cases_opened,
    GROUP_CONCAT(DISTINCT ls.section_code ORDER BY ls.section_code SEPARATOR ', ') AS penal_sections_invoked
FROM fir f
LEFT JOIN fir_legal_section fls ON f.fir_id = fls.fir_id
LEFT JOIN legal_section ls ON fls.section_id = ls.section_id
LEFT JOIN `case` c ON f.fir_id = c.fir_id
GROUP BY f.crime_category
ORDER BY total_firs DESC;

-- ----------------------------------------------------------------------------
-- QUERY 5: High-Value Suspect Cross-Case Analysis (HAVING Clause & Aggregation)
-- Identifies suspects implicated in more than one active case.
-- ----------------------------------------------------------------------------
SELECT
    s.suspect_id,
    CONCAT(s.first_name, ' ', s.last_name) AS suspect_name,
    s.suspicion_level,
    s.status AS suspect_status,
    COUNT(cs.case_id) AS total_cases_implicated,
    GROUP_CONCAT(c.case_title SEPARATOR ' | ') AS linked_cases
FROM suspect s
JOIN case_suspect cs ON s.suspect_id = cs.suspect_id
JOIN `case` c ON cs.case_id = c.case_id
GROUP BY s.suspect_id, s.first_name, s.last_name, s.suspicion_level, s.status
HAVING COUNT(cs.case_id) > 1
ORDER BY total_cases_implicated DESC;

-- ----------------------------------------------------------------------------
-- QUERY 6: Officer Workload & Caseload Summary (Subquery & Outer JOIN)
-- Compares officer assignments against the branch caseload average.
-- ----------------------------------------------------------------------------
SELECT
    o.officer_id,
    o.badge_no,
    CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
    o.rank,
    b.branch_name,
    COUNT(c.case_id) AS assigned_cases,
    CASE
        WHEN COUNT(c.case_id) > (SELECT AVG(case_count) FROM (SELECT COUNT(case_id) AS case_count FROM officer LEFT JOIN `case` ON officer.officer_id = `case`.lead_officer_id GROUP BY officer.officer_id) AS sub)
        THEN 'Above Average'
        ELSE 'Normal'
    END AS workload_assessment
FROM officer o
JOIN agency_branch b ON o.branch_id = b.branch_id
LEFT JOIN `case` c ON o.officer_id = c.lead_officer_id
GROUP BY o.officer_id, o.badge_no, o.first_name, o.last_name, o.rank, b.branch_name
ORDER BY assigned_cases DESC;

-- ----------------------------------------------------------------------------
-- QUERY 7: User Authentication & Role Resolution Query
-- Used by the backend authentication service to fetch user details and all assigned roles.
-- ----------------------------------------------------------------------------
SELECT
    u.user_id,
    u.username,
    u.password_hash,
    o.officer_id,
    o.badge_no,
    CONCAT(o.first_name, ' ', o.last_name) AS officer_name,
    o.rank,
    b.branch_name,
    GROUP_CONCAT(r.role_name ORDER BY r.role_name SEPARATOR ', ') AS assigned_roles
FROM `user` u
LEFT JOIN officer o ON u.officer_id = o.officer_id
LEFT JOIN agency_branch b ON o.branch_id = b.branch_id
JOIN user_role ur ON u.user_id = ur.user_id
JOIN role r ON ur.role_id = r.role_id
WHERE u.username = 'admin_faisal'
GROUP BY u.user_id, u.username, u.password_hash, o.officer_id, o.badge_no, o.first_name, o.last_name, o.rank, b.branch_name;

-- ----------------------------------------------------------------------------
-- QUERY 8: Transaction Simulation - Atomic Evidence Status Transition
-- Demonstrates atomic state transition with status history logging.
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- Step 1: Update current evidence status
UPDATE evidence
SET status = 'Presented in Court',
    storage_location = 'Metropolitan Court Evidence Chamber'
WHERE evidence_id = 1 AND case_id = 1;

-- Step 2: Append new status entry in evidence_status_history
INSERT INTO evidence_status_history (evidence_id, status, changed_at, remarks, changed_by_user_id)
VALUES (1, 'Presented in Court', NOW(), 'Submitted to presiding judge during hearing.', 1);

COMMIT;
