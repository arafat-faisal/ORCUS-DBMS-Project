-- ============================================================================
-- ORCUS - Organized Crime Understanding System
-- Database Management Laboratory Project (Summer 2026)
-- Target RDBMS : MySQL 8.0+ / MariaDB 10.4+ (XAMPP Default)
-- Engine       : InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Normalized   : Third Normal Form (3NF)
--
-- Authors:
--   1. Md. Arafat Hossain Faisal (241400060) - Organization & Access Control
--   2. A.K. Md. Shakil Hossain   (241400043) - Investigation Intake
--   3. Ayshee Islam Liza         (241400045) - Participants, Location & Evidence
-- ============================================================================

-- Create database fresh
DROP DATABASE IF EXISTS orcus_db;
CREATE DATABASE orcus_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE orcus_db;

-- ----------------------------------------------------------------------------
-- Drop existing tables in reverse dependency order (safe script re-run)
-- ----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS victim_evidence;
DROP TABLE IF EXISTS victim_location;
DROP TABLE IF EXISTS case_location;
DROP TABLE IF EXISTS case_witness;
DROP TABLE IF EXISTS case_victim;
DROP TABLE IF EXISTS case_suspect;
DROP TABLE IF EXISTS evidence_status_history;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS case_status_history;
DROP TABLE IF EXISTS `case`;
DROP TABLE IF EXISTS fir_legal_section;
DROP TABLE IF EXISTS legal_section;
DROP TABLE IF EXISTS fir;
DROP TABLE IF EXISTS gd;
DROP TABLE IF EXISTS complainant_contact;
DROP TABLE IF EXISTS complainant;
DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS witness;
DROP TABLE IF EXISTS victim;
DROP TABLE IF EXISTS suspect;
DROP TABLE IF EXISTS user_role;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS officer;
DROP TABLE IF EXISTS agency_branch;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- MODULE 1: ORGANIZATION & ACCESS CONTROL (Faisal)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AGENCY_BRANCH : Physical agency branches across districts
-- ----------------------------------------------------------------------------
CREATE TABLE agency_branch (
    branch_id   INT UNSIGNED AUTO_INCREMENT,
    branch_name VARCHAR(100) NOT NULL,
    district    VARCHAR(100) NOT NULL,
    PRIMARY KEY (branch_id),
    UNIQUE KEY uq_branch_name_district (branch_name, district),
    KEY idx_branch_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. OFFICER : Sworn investigation officers employed at a branch (EMPLOYS, 1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE officer (
    officer_id INT UNSIGNED AUTO_INCREMENT,
    badge_no   VARCHAR(20)  NOT NULL,
    first_name VARCHAR(50)  NOT NULL,
    last_name  VARCHAR(50)  NOT NULL,
    rank       VARCHAR(50)  NOT NULL,
    branch_id  INT UNSIGNED NOT NULL,
    PRIMARY KEY (officer_id),
    UNIQUE KEY uq_officer_badge (badge_no),
    KEY idx_officer_name (last_name, first_name),
    CONSTRAINT fk_officer_branch FOREIGN KEY (branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. USER : System login credentials, optionally mapped to an officer (MAPS_TO, 0..1 : 0..1)
-- ----------------------------------------------------------------------------
CREATE TABLE `user` (
    user_id       INT UNSIGNED AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    officer_id    INT UNSIGNED NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_username (username),
    UNIQUE KEY uq_user_officer (officer_id),
    CONSTRAINT chk_user_username_len CHECK (CHAR_LENGTH(username) >= 3),
    CONSTRAINT fk_user_officer FOREIGN KEY (officer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. ROLE : System access roles (e.g. Admin, Lead Investigator, Evidence Custodian)
-- ----------------------------------------------------------------------------
CREATE TABLE role (
    role_id     INT UNSIGNED AUTO_INCREMENT,
    role_name   VARCHAR(50)  NOT NULL,
    description VARCHAR(255) NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. USER_ROLE : Bridge table for M:N HAS_ROLE relationship
-- ----------------------------------------------------------------------------
CREATE TABLE user_role (
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id)
        REFERENCES role (role_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 2: INVESTIGATION INTAKE (Shakil)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6. COMPLAINANT : Persons filing complaints or incident reports
-- ----------------------------------------------------------------------------
CREATE TABLE complainant (
    complainant_id INT UNSIGNED AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    PRIMARY KEY (complainant_id),
    KEY idx_complainant_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. COMPLAINANT_CONTACT : Multivalued phone/email contacts (1NF normalization)
-- ----------------------------------------------------------------------------
CREATE TABLE complainant_contact (
    contact_id     INT UNSIGNED AUTO_INCREMENT,
    complainant_id INT UNSIGNED NOT NULL,
    contact_type   VARCHAR(20)  NOT NULL,
    contact_value  VARCHAR(100) NOT NULL,
    is_primary     BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (contact_id),
    CONSTRAINT fk_contact_complainant FOREIGN KEY (complainant_id)
        REFERENCES complainant (complainant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_contact_type CHECK (contact_type IN ('phone', 'email'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. GD : General Diary incident record (FILES, 1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE gd (
    gd_id          INT UNSIGNED AUTO_INCREMENT,
    gd_number      VARCHAR(50)  NOT NULL,
    gd_date        DATE         NOT NULL,
    subject        TEXT         NOT NULL,
    complainant_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (gd_id),
    UNIQUE KEY uq_gd_number (gd_number),
    KEY idx_gd_date (gd_date),
    CONSTRAINT fk_gd_complainant FOREIGN KEY (complainant_id)
        REFERENCES complainant (complainant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. FIR : First Information Report, optionally escalated from GD (LEADS_TO, 0..1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE fir (
    fir_id         INT UNSIGNED AUTO_INCREMENT,
    fir_number     VARCHAR(50)  NOT NULL,
    crime_category VARCHAR(100) NOT NULL,
    filed_date     DATE         NOT NULL,
    gd_id          INT UNSIGNED NULL,
    PRIMARY KEY (fir_id),
    UNIQUE KEY uq_fir_number (fir_number),
    KEY idx_fir_filed_date (filed_date),
    KEY idx_fir_crime_category (crime_category),
    CONSTRAINT fk_fir_gd FOREIGN KEY (gd_id)
        REFERENCES gd (gd_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. LEGAL_SECTION : Statutory penal code reference sections
-- ----------------------------------------------------------------------------
CREATE TABLE legal_section (
    section_id    INT UNSIGNED AUTO_INCREMENT,
    section_code  VARCHAR(30)  NOT NULL,
    section_title VARCHAR(150) NOT NULL,
    description   TEXT         NULL,
    PRIMARY KEY (section_id),
    UNIQUE KEY uq_legal_section_code (section_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. FIR_LEGAL_SECTION : M:N bridge between FIR and legal penal sections
-- ----------------------------------------------------------------------------
CREATE TABLE fir_legal_section (
    fir_id     INT UNSIGNED NOT NULL,
    section_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (fir_id, section_id),
    CONSTRAINT fk_fir_legal_section_fir FOREIGN KEY (fir_id)
        REFERENCES fir (fir_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_fir_legal_section_section FOREIGN KEY (section_id)
        REFERENCES legal_section (section_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. CASE : Formal investigation case, optionally opened from FIR (OPENS, 0..1:N)
-- ----------------------------------------------------------------------------
CREATE TABLE `case` (
    case_id          INT UNSIGNED AUTO_INCREMENT,
    case_title       VARCHAR(200) NOT NULL,
    status           VARCHAR(30)  NOT NULL DEFAULT 'Open',
    opened_date      DATE         NOT NULL,
    assigned_date    DATE         NULL,
    fir_id           INT UNSIGNED NULL,
    lead_officer_id  INT UNSIGNED NULL,
    PRIMARY KEY (case_id),
    KEY idx_case_status (status),
    KEY idx_case_opened_date (opened_date),
    CONSTRAINT chk_case_status CHECK (status IN ('Open', 'Under Investigation', 'Pending Review', 'Closed', 'Reopened', 'Archived')),
    CONSTRAINT fk_case_fir FOREIGN KEY (fir_id)
        REFERENCES fir (fir_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_case_lead_officer FOREIGN KEY (lead_officer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. CASE_STATUS_HISTORY : Append-only log of case lifecycle transitions
-- ----------------------------------------------------------------------------
CREATE TABLE case_status_history (
    history_id         INT UNSIGNED AUTO_INCREMENT,
    case_id            INT UNSIGNED NOT NULL,
    status             VARCHAR(30)  NOT NULL,
    changed_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks            TEXT         NULL,
    changed_by_user_id INT UNSIGNED NULL,
    PRIMARY KEY (history_id),
    KEY idx_case_history_status (status),
    KEY idx_case_history_changed_at (changed_at),
    CONSTRAINT fk_case_history_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_case_history_user FOREIGN KEY (changed_by_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- MODULE 3: PARTICIPANTS, LOCATION & EVIDENCE (Ayshee / Liza)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 14. SUSPECT : Persons suspected in crimes
-- ----------------------------------------------------------------------------
CREATE TABLE suspect (
    suspect_id          INT UNSIGNED AUTO_INCREMENT,
    first_name          VARCHAR(50)  NOT NULL,
    last_name           VARCHAR(50)  NOT NULL,
    age                 INT          NULL,
    date_of_birth       DATE         NULL,
    identification_sign VARCHAR(255) NULL,
    suspicion_level     ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
    status              VARCHAR(50)  NOT NULL DEFAULT 'Under Investigation',
    PRIMARY KEY (suspect_id),
    KEY idx_suspect_name (last_name, first_name),
    KEY idx_suspect_suspicion (suspicion_level),
    CONSTRAINT chk_suspect_age CHECK (age IS NULL OR (age >= 0 AND age <= 120))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. VICTIM : Persons affected by investigated crimes
-- ----------------------------------------------------------------------------
CREATE TABLE victim (
    victim_id           INT UNSIGNED AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(20)  NULL,
    age                 INT          NULL,
    identification_sign VARCHAR(255) NULL,
    condition_notes     VARCHAR(255) NULL,
    is_deceased         BOOLEAN      NOT NULL DEFAULT FALSE,
    PRIMARY KEY (victim_id),
    KEY idx_victim_name (name),
    CONSTRAINT chk_victim_age CHECK (age IS NULL OR (age >= 0 AND age <= 120))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. WITNESS : Witnesses and confidential informants
-- ----------------------------------------------------------------------------
CREATE TABLE witness (
    witness_id          INT UNSIGNED AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(20)  NULL,
    age                 INT          NULL,
    identification_sign VARCHAR(255) NULL,
    reliability         VARCHAR(50)  NOT NULL DEFAULT 'Reliable',
    is_protected        BOOLEAN      NOT NULL DEFAULT FALSE,
    statement_summary   TEXT         NULL,
    PRIMARY KEY (witness_id),
    KEY idx_witness_name (name),
    CONSTRAINT chk_witness_age CHECK (age IS NULL OR (age >= 0 AND age <= 120))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. LOCATION : Geographical sites (crime scenes, search locations)
-- ----------------------------------------------------------------------------
CREATE TABLE location (
    location_id     INT UNSIGNED AUTO_INCREMENT,
    gps_coordinates VARCHAR(50)  NULL,
    address         VARCHAR(255) NOT NULL,
    area            VARCHAR(100) NOT NULL,
    city            VARCHAR(100) NOT NULL,
    PRIMARY KEY (location_id),
    KEY idx_location_city_area (city, area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. EVIDENCE : Weak entity under CASE (COLLECTS, 1:N mandatory)
-- Identified by Case_ID + Evidence_No
-- ----------------------------------------------------------------------------
CREATE TABLE evidence (
    evidence_id             INT UNSIGNED AUTO_INCREMENT,
    case_id                 INT UNSIGNED NOT NULL,
    evidence_no             INT UNSIGNED NOT NULL,
    title                   VARCHAR(150) NOT NULL,
    description             TEXT         NULL,
    evidence_type           VARCHAR(50)  NOT NULL,
    status                  VARCHAR(50)  NOT NULL DEFAULT 'Collected',
    collected_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    collected_by_officer_id INT UNSIGNED NULL,
    storage_location        VARCHAR(150) NULL,
    PRIMARY KEY (evidence_id),
    UNIQUE KEY uq_case_evidence_no (case_id, evidence_no),
    KEY idx_evidence_status (status),
    KEY idx_evidence_type (evidence_type),
    CONSTRAINT chk_evidence_type CHECK (evidence_type IN ('Physical', 'Digital', 'Documentary', 'Biological', 'Forensic', 'Weapon', 'Narcotics', 'Other')),
    CONSTRAINT chk_evidence_status CHECK (status IN ('Collected', 'In Lab Analysis', 'Stored in Vault', 'Presented in Court', 'Archived', 'Disposed')),
    CONSTRAINT fk_evidence_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_evidence_officer FOREIGN KEY (collected_by_officer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. EVIDENCE_STATUS_HISTORY : Append-only audit log for chain of custody
-- ----------------------------------------------------------------------------
CREATE TABLE evidence_status_history (
    history_id         INT UNSIGNED AUTO_INCREMENT,
    evidence_id        INT UNSIGNED NOT NULL,
    status             VARCHAR(50)  NOT NULL,
    changed_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks            VARCHAR(255) NULL,
    changed_by_user_id INT UNSIGNED NULL,
    PRIMARY KEY (history_id),
    KEY idx_evidence_history_status (status),
    KEY idx_evidence_history_changed_at (changed_at),
    CONSTRAINT fk_evidence_history_evidence FOREIGN KEY (evidence_id)
        REFERENCES evidence (evidence_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_evidence_history_user FOREIGN KEY (changed_by_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- BRIDGE (JUNCTION) TABLES FOR M:N RELATIONSHIPS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 20. CASE_SUSPECT : M:N SUSPECTED_IN between CASE and SUSPECT
-- ----------------------------------------------------------------------------
CREATE TABLE case_suspect (
    case_id       INT UNSIGNED NOT NULL,
    suspect_id    INT UNSIGNED NOT NULL,
    role_in_crime VARCHAR(100) NULL,
    PRIMARY KEY (case_id, suspect_id),
    CONSTRAINT fk_case_suspect_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_case_suspect_suspect FOREIGN KEY (suspect_id)
        REFERENCES suspect (suspect_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 21. CASE_VICTIM : M:N AFFECTED_BY between CASE and VICTIM
-- ----------------------------------------------------------------------------
CREATE TABLE case_victim (
    case_id     INT UNSIGNED NOT NULL,
    victim_id   INT UNSIGNED NOT NULL,
    impact_type VARCHAR(100) NULL,
    PRIMARY KEY (case_id, victim_id),
    CONSTRAINT fk_case_victim_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_case_victim_victim FOREIGN KEY (victim_id)
        REFERENCES victim (victim_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 22. CASE_WITNESS : M:N HAS_WITNESS between CASE and WITNESS
-- ----------------------------------------------------------------------------
CREATE TABLE case_witness (
    case_id           INT UNSIGNED NOT NULL,
    witness_id        INT UNSIGNED NOT NULL,
    testimony_summary TEXT         NULL,
    PRIMARY KEY (case_id, witness_id),
    CONSTRAINT fk_case_witness_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_case_witness_witness FOREIGN KEY (witness_id)
        REFERENCES witness (witness_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 23. CASE_LOCATION : M:N OCCURS_AT between CASE and LOCATION
-- ----------------------------------------------------------------------------
CREATE TABLE case_location (
    case_id       INT UNSIGNED NOT NULL,
    location_id   INT UNSIGNED NOT NULL,
    location_role VARCHAR(100) NOT NULL DEFAULT 'Crime Scene',
    PRIMARY KEY (case_id, location_id),
    CONSTRAINT fk_case_location_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_case_location_location FOREIGN KEY (location_id)
        REFERENCES location (location_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 24. VICTIM_LOCATION : M:N mapping between VICTIM and related LOCATION
-- ----------------------------------------------------------------------------
CREATE TABLE victim_location (
    victim_id   INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (victim_id, location_id),
    CONSTRAINT fk_victim_location_victim FOREIGN KEY (victim_id)
        REFERENCES victim (victim_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_victim_location_location FOREIGN KEY (location_id)
        REFERENCES location (location_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 25. VICTIM_EVIDENCE : M:N mapping between VICTIM and associated EVIDENCE
-- ----------------------------------------------------------------------------
CREATE TABLE victim_evidence (
    victim_id   INT UNSIGNED NOT NULL,
    evidence_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (victim_id, evidence_id),
    CONSTRAINT fk_victim_evidence_victim FOREIGN KEY (victim_id)
        REFERENCES victim (victim_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_victim_evidence_evidence FOREIGN KEY (evidence_id)
        REFERENCES evidence (evidence_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
