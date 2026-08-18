-- ============================================================================
-- ORCUS Investigation Agency - Database Schema
-- Module  : Organization & Access Control
-- Author  : Md. Arafat Hossain Faisal (241400060)
-- Target  : MySQL 8 / MariaDB (XAMPP)
-- Tables  : AGENCY_BRANCH, OFFICER, USER, ROLE, USER_ROLE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- AGENCY_BRANCH : physical office of the agency
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS AGENCY_BRANCH (
    branch_id    INT UNSIGNED AUTO_INCREMENT,
    branch_name  VARCHAR(100) NOT NULL,
    district     VARCHAR(100) NOT NULL,
    PRIMARY KEY (branch_id),
    UNIQUE KEY uq_branch_name_district (branch_name, district),
    KEY idx_branch_district (district)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- OFFICER : officer employed at one branch
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS OFFICER (
    officer_id  INT UNSIGNED AUTO_INCREMENT,
    badge_no    VARCHAR(20)  NOT NULL,
    first_name  VARCHAR(50)  NOT NULL,
    last_name   VARCHAR(50)  NOT NULL,
    rank        VARCHAR(50)  NOT NULL,
    branch_id   INT UNSIGNED NOT NULL,
    PRIMARY KEY (officer_id),
    UNIQUE KEY uq_officer_badge (badge_no),
    KEY idx_officer_name (last_name, first_name),
    CONSTRAINT fk_officer_branch FOREIGN KEY (branch_id)
        REFERENCES AGENCY_BRANCH (branch_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USER : login account; optionally maps to one officer (0..1 : 0..1)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USER (
    user_id       INT UNSIGNED AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    officer_id    INT UNSIGNED NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_user_username (username),
    UNIQUE KEY uq_user_officer (officer_id),
    CONSTRAINT chk_user_username_len CHECK (CHAR_LENGTH(username) >= 3),
    CONSTRAINT fk_user_officer FOREIGN KEY (officer_id)
        REFERENCES OFFICER (officer_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- ROLE : access role grantable to users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ROLE (
    role_id     INT UNSIGNED AUTO_INCREMENT,
    role_name   VARCHAR(50)  NOT NULL,
    description VARCHAR(255) NULL,
    PRIMARY KEY (role_id),
    UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- USER_ROLE : bridge table for M:N HAS_ROLE between USER and ROLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS USER_ROLE (
    user_id INT UNSIGNED NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_role_user FOREIGN KEY (user_id)
        REFERENCES USER (user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role FOREIGN KEY (role_id)
        REFERENCES ROLE (role_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;