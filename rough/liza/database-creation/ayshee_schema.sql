-- ============================================================================
-- ORCUS Investigation Agency - Database Schema
-- Module  : Participants, Location & Evidence
-- Author  : Ayshee Islam Liza (241400045)
-- Target  : MySQL 8 / MariaDB (XAMPP)
-- Tables  : suspect, victim, witness, location, evidence,
--           evidence_status_history, case_suspect, case_victim,
--           case_witness, case_location, victim_location, victim_evidence
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SUSPECT : individuals under investigation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suspect (
    suspect_id          INT UNSIGNED AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    age                 INT CHECK (age >= 0 AND age <= 120),
    identification_sign VARCHAR(255) NULL,
    suspicion_level     ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Low',
    status              VARCHAR(50) NOT NULL DEFAULT 'Under Investigation',
    PRIMARY KEY (suspect_id),
    KEY idx_suspect_name (name),
    KEY idx_suspect_suspicion (suspicion_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- VICTIM : affected individuals
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS victim (
    victim_id           INT UNSIGNED AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(20) NULL,
    age                 INT CHECK (age >= 0 AND age <= 120),
    identification_sign VARCHAR(255) NULL,
    victim_condition    VARCHAR(100) NULL,
    is_deceased         BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (victim_id),
    KEY idx_victim_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- WITNESS : witnesses and informants
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS witness (
    witness_id          INT UNSIGNED AUTO_INCREMENT,
    name                VARCHAR(100) NOT NULL,
    phone               VARCHAR(20) NULL,
    age                 INT CHECK (age >= 0 AND age <= 120),
    identification_sign VARCHAR(255) NULL,
    reliability_note    VARCHAR(255) NULL,
    is_protected        BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (witness_id),
    KEY idx_witness_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- LOCATION : crime scenes and incident sites
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS location (
    location_id INT UNSIGNED AUTO_INCREMENT,
    gps         VARCHAR(50) NULL,
    address     VARCHAR(255) NOT NULL,
    area        VARCHAR(100) NOT NULL,
    city        VARCHAR(100) NOT NULL,
    PRIMARY KEY (location_id),
    KEY idx_location_city_area (city, area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- EVIDENCE : items collected for cases (weak entity identified by case_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
    evidence_id         INT UNSIGNED AUTO_INCREMENT,
    case_id             INT UNSIGNED NOT NULL,
    evidence_no         INT UNSIGNED NOT NULL,
    title               VARCHAR(150) NOT NULL,
    content             TEXT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'Collected',
    evidence_type       VARCHAR(50) NOT NULL,
    collection_datetime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (evidence_id),
    UNIQUE KEY uq_case_evidence_no (case_id, evidence_no),
    KEY idx_evidence_status (status),
    KEY idx_evidence_type (evidence_type),
    CONSTRAINT fk_evidence_case FOREIGN KEY (case_id)
        REFERENCES `case` (case_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- EVIDENCE_STATUS_HISTORY : append-only audit trail of evidence status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_status_history (
    history_id   INT UNSIGNED AUTO_INCREMENT,
    evidence_id  INT UNSIGNED NOT NULL,
    status       VARCHAR(50) NOT NULL,
    changed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks      VARCHAR(255) NULL,
    PRIMARY KEY (history_id),
    KEY idx_evidence_history_status (status),
    KEY idx_evidence_history_changed_at (changed_at),
    CONSTRAINT fk_evidence_history_evidence FOREIGN KEY (evidence_id)
        REFERENCES evidence (evidence_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- Bridge Tables (M:N Relationships)
-- ----------------------------------------------------------------------------

-- CASE_SUSPECT : links cases to suspects
CREATE TABLE IF NOT EXISTS case_suspect (
    case_id    INT UNSIGNED NOT NULL,
    suspect_id INT UNSIGNED NOT NULL,
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

-- CASE_VICTIM : links cases to victims
CREATE TABLE IF NOT EXISTS case_victim (
    case_id   INT UNSIGNED NOT NULL,
    victim_id INT UNSIGNED NOT NULL,
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

-- CASE_WITNESS : links cases to witnesses
CREATE TABLE IF NOT EXISTS case_witness (
    case_id    INT UNSIGNED NOT NULL,
    witness_id INT UNSIGNED NOT NULL,
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

-- CASE_LOCATION : links cases to incident locations (OCCURS_AT)
CREATE TABLE IF NOT EXISTS case_location (
    case_id     INT UNSIGNED NOT NULL,
    location_id INT UNSIGNED NOT NULL,
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

-- VICTIM_LOCATION : links victims to relevant locations
CREATE TABLE IF NOT EXISTS victim_location (
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

-- VICTIM_EVIDENCE : links victims to relevant evidence items
CREATE TABLE IF NOT EXISTS victim_evidence (
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
