-- ============================================================================
-- ORCUS Investigation Agency - Database Schema
-- Module  : Investigation Intake
-- Author  : A.K. Md. Shakil Hossain (241400043)
-- Target  : MySQL 8 / MariaDB (XAMPP)
-- Tables  : complainant, complainant_contact, gd, fir,
--           legal_section, fir_legal_section, case, case_status_history
-- ============================================================================

-- ----------------------------------------------------------------------------
-- COMPLAINANT : individuals filing complaints or reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complainant (
    complainant_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name           VARCHAR(100) NOT NULL,
    PRIMARY KEY (complainant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- COMPLAINANT_CONTACT : multivalued contact numbers/emails (1NF normalization)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS complainant_contact (
    contact_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    complainant_id INT UNSIGNED NOT NULL,
    contact_type   VARCHAR(20) NOT NULL,
    contact_value  VARCHAR(100) NOT NULL,
    is_primary     BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (contact_id),
    CONSTRAINT fk_contact_complainant
        FOREIGN KEY (complainant_id)
        REFERENCES complainant (complainant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_contact_type
        CHECK (contact_type IN ('phone', 'email'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- GD : General Diary records
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gd (
    gd_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    gd_number      VARCHAR(50) NOT NULL,
    gd_date        DATE NOT NULL,
    subject        TEXT NOT NULL,
    complainant_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (gd_id),
    UNIQUE KEY uq_gd_number (gd_number),
    CONSTRAINT fk_gd_complainant
        FOREIGN KEY (complainant_id)
        REFERENCES complainant (complainant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- FIR : First Information Report records
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fir (
    fir_id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    fir_number     VARCHAR(50) NOT NULL,
    crime_category VARCHAR(100) NOT NULL,
    filed_date     DATE NOT NULL,
    gd_id          INT UNSIGNED NULL,
    PRIMARY KEY (fir_id),
    UNIQUE KEY uq_fir_number (fir_number),
    CONSTRAINT fk_fir_gd
        FOREIGN KEY (gd_id)
        REFERENCES gd (gd_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- LEGAL_SECTION : penal code / statutory law sections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS legal_section (
    section_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
    section_code  VARCHAR(30) NOT NULL,
    section_title VARCHAR(150) NOT NULL,
    description   TEXT NULL,
    PRIMARY KEY (section_id),
    UNIQUE KEY uq_legal_section_code (section_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- FIR_LEGAL_SECTION : M:N bridge between FIR and statutory sections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fir_legal_section (
    fir_id     INT UNSIGNED NOT NULL,
    section_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (fir_id, section_id),
    CONSTRAINT fk_fir_legal_section_fir
        FOREIGN KEY (fir_id)
        REFERENCES fir (fir_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_fir_legal_section_section
        FOREIGN KEY (section_id)
        REFERENCES legal_section (section_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- CASE : primary investigation case files
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `case` (
    case_id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
    case_title    VARCHAR(200) NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'Open',
    opened_date   DATE NOT NULL,
    assigned_date DATE NULL,
    fir_id        INT UNSIGNED NULL,
    PRIMARY KEY (case_id),
    CONSTRAINT fk_case_fir
        FOREIGN KEY (fir_id)
        REFERENCES fir (fir_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- CASE_STATUS_HISTORY : append-only log of case state transitions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS case_status_history (
    history_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    case_id    INT UNSIGNED NOT NULL,
    status     VARCHAR(30) NOT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks    TEXT NULL,
    PRIMARY KEY (history_id),
    CONSTRAINT fk_case_status_history_case
        FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Indexes for Search and Query Optimization
-- ----------------------------------------------------------------------------
CREATE INDEX idx_complainant_name ON complainant (name);
CREATE INDEX idx_gd_date ON gd (gd_date);
CREATE INDEX idx_fir_filed_date ON fir (filed_date);
CREATE INDEX idx_fir_crime_category ON fir (crime_category);
CREATE INDEX idx_case_status ON `case` (status);
CREATE INDEX idx_case_opened_date ON `case` (opened_date);
CREATE INDEX idx_case_status_history_case ON case_status_history (case_id);
CREATE INDEX idx_case_status_history_changed_at ON case_status_history (changed_at);
