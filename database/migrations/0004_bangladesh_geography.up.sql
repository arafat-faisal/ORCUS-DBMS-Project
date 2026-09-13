-- ============================================================================
-- Migration: 0004_bangladesh_geography.up.sql
-- Description: Normalized Bangladesh administrative hierarchy, location enhancements, and branch metadata
-- ============================================================================

-- 1. Administrative Divisions
CREATE TABLE IF NOT EXISTS geo_division (
    division_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name_en     VARCHAR(100) NOT NULL UNIQUE,
    name_bn     VARCHAR(150) NOT NULL,
    code        VARCHAR(10)  NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Administrative Districts
CREATE TABLE IF NOT EXISTS geo_district (
    district_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    division_id INT UNSIGNED NOT NULL,
    name_en     VARCHAR(100) NOT NULL,
    name_bn     VARCHAR(150) NOT NULL,
    code        VARCHAR(10)  NOT NULL UNIQUE,
    KEY idx_district_division (division_id),
    CONSTRAINT fk_district_division FOREIGN KEY (division_id)
        REFERENCES geo_division (division_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Administrative Upazilas (Sub-districts)
CREATE TABLE IF NOT EXISTS geo_upazila (
    upazila_id  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    district_id INT UNSIGNED NOT NULL,
    name_en     VARCHAR(100) NOT NULL,
    name_bn     VARCHAR(150) NOT NULL,
    KEY idx_upazila_district (district_id),
    CONSTRAINT fk_upazila_district FOREIGN KEY (district_id)
        REFERENCES geo_district (district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Police Thanas / Jurisdictional Stations
CREATE TABLE IF NOT EXISTS geo_thana (
    thana_id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    district_id INT UNSIGNED NOT NULL,
    name_en     VARCHAR(100) NOT NULL,
    name_bn     VARCHAR(150) NOT NULL,
    code        VARCHAR(20)  NULL,
    KEY idx_thana_district (district_id),
    CONSTRAINT fk_thana_district FOREIGN KEY (district_id)
        REFERENCES geo_district (district_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Enhance `location` table with detailed administrative hierarchy
ALTER TABLE location
    ADD COLUMN IF NOT EXISTS division_id INT UNSIGNED NULL AFTER city,
    ADD COLUMN IF NOT EXISTS district_id INT UNSIGNED NULL AFTER division_id,
    ADD COLUMN IF NOT EXISTS upazila_id INT UNSIGNED NULL AFTER district_id,
    ADD COLUMN IF NOT EXISTS thana_id INT UNSIGNED NULL AFTER upazila_id,
    ADD COLUMN IF NOT EXISTS union_ward VARCHAR(100) NULL AFTER thana_id,
    ADD COLUMN IF NOT EXISTS village_mahalla VARCHAR(150) NULL AFTER union_ward,
    ADD COLUMN IF NOT EXISTS road VARCHAR(150) NULL AFTER village_mahalla,
    ADD COLUMN IF NOT EXISTS house_holding VARCHAR(100) NULL AFTER road,
    ADD COLUMN IF NOT EXISTS landmark VARCHAR(200) NULL AFTER house_holding,
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10) NULL AFTER landmark,
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL AFTER postal_code,
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL AFTER latitude,
    ADD CONSTRAINT fk_location_division FOREIGN KEY IF NOT EXISTS (division_id)
        REFERENCES geo_division (division_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_location_district FOREIGN KEY IF NOT EXISTS (district_id)
        REFERENCES geo_district (district_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_location_upazila FOREIGN KEY IF NOT EXISTS (upazila_id)
        REFERENCES geo_upazila (upazila_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_location_thana FOREIGN KEY IF NOT EXISTS (thana_id)
        REFERENCES geo_thana (thana_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

-- 6. Enhance `agency_branch` with administrative hierarchy & contact details
ALTER TABLE agency_branch
    ADD COLUMN IF NOT EXISTS name_bn VARCHAR(150) NULL AFTER branch_name,
    ADD COLUMN IF NOT EXISTS branch_code VARCHAR(30) NULL AFTER name_bn,
    ADD COLUMN IF NOT EXISTS branch_type VARCHAR(50) NOT NULL DEFAULT 'District Station' AFTER branch_code,
    ADD COLUMN IF NOT EXISTS division_id INT UNSIGNED NULL AFTER district,
    ADD COLUMN IF NOT EXISTS district_id INT UNSIGNED NULL AFTER division_id,
    ADD COLUMN IF NOT EXISTS thana_id INT UNSIGNED NULL AFTER district_id,
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20) NULL AFTER thana_id,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER contact_number,
    ADD CONSTRAINT uq_branch_code UNIQUE IF NOT EXISTS (branch_code),
    ADD CONSTRAINT fk_branch_division FOREIGN KEY IF NOT EXISTS (division_id)
        REFERENCES geo_division (division_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_branch_district FOREIGN KEY IF NOT EXISTS (district_id)
        REFERENCES geo_district (district_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    ADD CONSTRAINT fk_branch_thana FOREIGN KEY IF NOT EXISTS (thana_id)
        REFERENCES geo_thana (thana_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL;

-- 7. Seed Official Bangladesh Divisions (8 Divisions)
INSERT INTO geo_division (division_id, name_en, name_bn, code) VALUES
    (1, 'Dhaka', 'ঢাকা', 'DHK'),
    (2, 'Chattogram', 'চট্টগ্রাম', 'CTG'),
    (3, 'Rajshahi', 'রাজশাহী', 'RAJ'),
    (4, 'Khulna', 'খুলনা', 'KHL'),
    (5, 'Barishal', 'বরিশাল', 'BAR'),
    (6, 'Sylhet', 'সিলেট', 'SYL'),
    (7, 'Rangpur', 'রংপুর', 'RNG'),
    (8, 'Mymensingh', 'ময়মনসিংহ', 'MYM')
ON DUPLICATE KEY UPDATE name_bn = VALUES(name_bn), code = VALUES(code);

-- 8. Seed Major Districts
INSERT INTO geo_district (district_id, division_id, name_en, name_bn, code) VALUES
    (1, 1, 'Dhaka', 'ঢাকা', 'DHK-01'),
    (2, 1, 'Gazipur', 'গাজীপুর', 'GZP-02'),
    (3, 1, 'Narayanganj', 'নারায়ণগঞ্জ', 'NRG-03'),
    (4, 2, 'Chattogram', 'চট্টগ্রাম', 'CTG-04'),
    (5, 2, 'Cox''s Bazar', 'কক্সবাজার', 'CXB-05'),
    (6, 3, 'Rajshahi', 'রাজশাহী', 'RAJ-06'),
    (7, 4, 'Khulna', 'খুলনা', 'KHL-07'),
    (8, 6, 'Sylhet', 'সিলেট', 'SYL-08')
ON DUPLICATE KEY UPDATE name_bn = VALUES(name_bn), code = VALUES(code);

-- 9. Seed Key Thanas
INSERT INTO geo_thana (thana_id, district_id, name_en, name_bn, code) VALUES
    (1, 1, 'Motijheel', 'মতিঝিল', 'MOT'),
    (2, 1, 'Dhanmondi', 'ধানমন্ডি', 'DHM'),
    (3, 1, 'Gulshan', 'গুলশান', 'GUL'),
    (4, 1, 'Uttara', 'উত্তরা', 'UTR'),
    (5, 1, 'Mirpur', 'মিরপুর', 'MIR'),
    (6, 1, 'Kotwali', 'কোতোয়ালী', 'KTW'),
    (7, 1, 'Tejgaon', 'তেজগাঁও', 'TGK'),
    (8, 1, 'Ramna', 'রমনা', 'RMN'),
    (9, 4, 'Panchlaish', 'পাঁচলাইশ', 'PNC'),
    (10, 4, 'Kotwali (Chattogram)', 'কোতোয়ালী (চট্টগ্রাম)', 'CKT'),
    (11, 8, 'Kotwali (Sylhet)', 'কোতোয়ালী (সিলেট)', 'SKT')
ON DUPLICATE KEY UPDATE name_bn = VALUES(name_bn), code = VALUES(code);

-- 10. Update existing branches with division, district, code, and Bengali names
UPDATE agency_branch SET 
    name_bn = 'মতিঝিল আঞ্চলিক তদন্ত ইউনিট',
    branch_code = 'BR-DHK-MOT',
    branch_type = 'Metropolitan Division',
    division_id = 1,
    district_id = 1,
    thana_id = 1,
    contact_number = '+8802223381001'
WHERE branch_name LIKE '%Motijheel%' OR branch_id = 1;

UPDATE agency_branch SET 
    name_bn = 'ধানমন্ডি বিশেষ সাইবার ও অপরাধ শাখা',
    branch_code = 'BR-DHK-DHM',
    branch_type = 'Specialized Unit',
    division_id = 1,
    district_id = 1,
    thana_id = 2,
    contact_number = '+8802223381002'
WHERE branch_name LIKE '%Dhanmondi%' OR branch_id = 2;

UPDATE agency_branch SET 
    name_bn = 'গুলশান ইন্টেলিজেন্স ও অর্গানাইজড ক্রাইম ব্যুরো',
    branch_code = 'BR-DHK-GUL',
    branch_type = 'Headquarters',
    division_id = 1,
    district_id = 1,
    thana_id = 3,
    contact_number = '+8802223381003'
WHERE branch_name LIKE '%Gulshan%' OR branch_id = 3;

UPDATE agency_branch SET 
    name_bn = 'উত্তরা উত্তর সার্কেল তদন্ত কেন্দ্র',
    branch_code = 'BR-DHK-UTR',
    branch_type = 'District Station',
    division_id = 1,
    district_id = 1,
    thana_id = 4,
    contact_number = '+8802223381004'
WHERE branch_name LIKE '%Uttara%' OR branch_id = 4;
