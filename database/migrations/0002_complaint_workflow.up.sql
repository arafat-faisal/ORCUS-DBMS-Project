-- ============================================================================
-- Migration: 0002_complaint_workflow.up.sql
-- Description: Complete Complaint intake, categorization, status history, and conversion to GD/FIR
-- ============================================================================

-- 1. Complaint Categories
CREATE TABLE IF NOT EXISTS complaint_category (
    category_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_en       VARCHAR(100) NOT NULL UNIQUE,
    name_bn       VARCHAR(150) NOT NULL,
    description   TEXT NULL,
    is_cognizable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Master Complaint Table
CREATE TABLE IF NOT EXISTS complaint (
    complaint_id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tracking_code         VARCHAR(50) NOT NULL UNIQUE,
    complainant_id        INT UNSIGNED NOT NULL,
    submission_channel    VARCHAR(50) NOT NULL DEFAULT 'Officer Entry',
    title                 VARCHAR(255) NOT NULL,
    description           TEXT NOT NULL,
    incident_date         DATE NOT NULL,
    incident_time         TIME NULL,
    approximate_time      BOOLEAN NOT NULL DEFAULT FALSE,
    location_id           INT UNSIGNED NULL,
    complaint_category_id INT UNSIGNED NULL,
    urgency               VARCHAR(20) NOT NULL DEFAULT 'Medium',
    receiving_branch_id   INT UNSIGNED NOT NULL,
    assigned_reviewer_id  INT UNSIGNED NULL,
    current_status        VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    confidentiality_level VARCHAR(30) NOT NULL DEFAULT 'Standard',
    public_status_message VARCHAR(500) NULL,
    internal_notes        TEXT NULL,
    submitted_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at           TIMESTAMP NULL,
    closed_at             TIMESTAMP NULL,
    created_by_user_id    INT UNSIGNED NULL,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version               INT UNSIGNED NOT NULL DEFAULT 1,
    KEY idx_complaint_tracking (tracking_code),
    KEY idx_complaint_status (current_status),
    KEY idx_complaint_complainant (complainant_id),
    KEY idx_complaint_branch (receiving_branch_id),
    KEY idx_complaint_reviewer (assigned_reviewer_id),
    KEY idx_complaint_submitted (submitted_at),
    CONSTRAINT fk_complaint_complainant FOREIGN KEY (complainant_id)
        REFERENCES complainant (complainant_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_complaint_location FOREIGN KEY (location_id)
        REFERENCES location (location_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_complaint_category FOREIGN KEY (complaint_category_id)
        REFERENCES complaint_category (category_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_complaint_branch FOREIGN KEY (receiving_branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_complaint_reviewer FOREIGN KEY (assigned_reviewer_id)
        REFERENCES officer (officer_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_complaint_creator FOREIGN KEY (created_by_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Complaint Status History
CREATE TABLE IF NOT EXISTS complaint_status_history (
    history_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    complaint_id     INT UNSIGNED NOT NULL,
    previous_status  VARCHAR(50) NULL,
    new_status       VARCHAR(50) NOT NULL,
    decision         VARCHAR(100) NOT NULL,
    reason           TEXT NULL,
    acting_user_id   INT UNSIGNED NULL,
    acting_branch_id INT UNSIGNED NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_csh_complaint (complaint_id),
    KEY idx_csh_created (created_at),
    CONSTRAINT fk_csh_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_csh_user FOREIGN KEY (acting_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_csh_branch FOREIGN KEY (acting_branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Complaint Transfer History
CREATE TABLE IF NOT EXISTS complaint_transfer_history (
    transfer_id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    complaint_id          INT UNSIGNED NOT NULL,
    from_branch_id        INT UNSIGNED NOT NULL,
    to_branch_id          INT UNSIGNED NOT NULL,
    transfer_reason       TEXT NOT NULL,
    transferred_by_user_id INT UNSIGNED NOT NULL,
    transferred_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_cth_complaint (complaint_id),
    KEY idx_cth_transferred (transferred_at),
    CONSTRAINT fk_cth_complaint FOREIGN KEY (complaint_id)
        REFERENCES complaint (complaint_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cth_from_branch FOREIGN KEY (from_branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cth_to_branch FOREIGN KEY (to_branch_id)
        REFERENCES agency_branch (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_cth_user FOREIGN KEY (transferred_by_user_id)
        REFERENCES `user` (user_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Link GD and FIR to Complaint
ALTER TABLE gd
    ADD COLUMN IF NOT EXISTS complaint_id INT UNSIGNED NULL AFTER complainant_id,
    ADD CONSTRAINT fk_gd_complaint FOREIGN KEY IF NOT EXISTS (complaint_id)
        REFERENCES complaint (complaint_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

ALTER TABLE fir
    ADD COLUMN IF NOT EXISTS source_complaint_id INT UNSIGNED NULL AFTER gd_id,
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) NOT NULL DEFAULT 'Direct Complaint' AFTER source_complaint_id,
    ADD CONSTRAINT fk_fir_complaint FOREIGN KEY IF NOT EXISTS (source_complaint_id)
        REFERENCES complaint (complaint_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

-- 6. Seed Standard Bangladesh Complaint Categories
INSERT INTO complaint_category (name_en, name_bn, description, is_cognizable) VALUES
    ('Armed Robbery / Dacoity', 'সশস্ত্র ডাকাতি / রাহাজানি', 'Cognizable heinous offence involving group armed assault or robbery', TRUE),
    ('Cyber Harassment & Financial Fraud', 'সাইবার হয়রানি ও আর্থিক জালিয়াতি', 'Digital fraud, mobile banking compromise, online extortion or cyber harassment', TRUE),
    ('Extortion & Organized Syndicate', 'চাঁদাবাজি ও সংগঠিত অপরাধ চক্র', 'Systematic extortion, mafia racketeering, or violent intimidation', TRUE),
    ('Narcotics & Smuggling', 'মাদকদ্রব্য ও চোরাচালান', 'Distribution, smuggling, or trafficking of illegal contraband and substances', TRUE),
    ('Property & Document Theft', 'সম্পত্তি ও গুরুত্বপূর্ণ দলিল চুরি', 'Theft of physical vehicles, goods, deeds, or sensitive official records', TRUE),
    ('Missing Person / Lost Article', 'নিখোঁজ ব্যক্তি / হারানো সাধারণ ডায়েরি', 'Non-cognizable reporting for missing persons, lost NID/passport/documents', FALSE),
    ('Public Dispute & Threat', 'পারিবারিক বা স্থানীয় বিরোধ ও হুমকি', 'Non-cognizable local civil disturbance, verbal threats or boundary disputes', FALSE)
ON DUPLICATE KEY UPDATE name_bn = VALUES(name_bn), description = VALUES(description);
