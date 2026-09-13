-- ============================================================================
-- Migration: 0004_bangladesh_geography.down.sql
-- Description: Revert Bangladesh administrative geography tables and columns
-- ============================================================================

ALTER TABLE agency_branch
    DROP FOREIGN KEY IF EXISTS fk_branch_thana,
    DROP FOREIGN KEY IF EXISTS fk_branch_district,
    DROP FOREIGN KEY IF EXISTS fk_branch_division,
    DROP INDEX IF EXISTS uq_branch_code,
    DROP COLUMN IF EXISTS is_active,
    DROP COLUMN IF EXISTS contact_number,
    DROP COLUMN IF EXISTS thana_id,
    DROP COLUMN IF EXISTS district_id,
    DROP COLUMN IF EXISTS division_id,
    DROP COLUMN IF EXISTS branch_type,
    DROP COLUMN IF EXISTS branch_code,
    DROP COLUMN IF EXISTS name_bn;

ALTER TABLE location
    DROP FOREIGN KEY IF EXISTS fk_location_thana,
    DROP FOREIGN KEY IF EXISTS fk_location_upazila,
    DROP FOREIGN KEY IF EXISTS fk_location_district,
    DROP FOREIGN KEY IF EXISTS fk_location_division,
    DROP COLUMN IF EXISTS longitude,
    DROP COLUMN IF EXISTS latitude,
    DROP COLUMN IF EXISTS postal_code,
    DROP COLUMN IF EXISTS landmark,
    DROP COLUMN IF EXISTS house_holding,
    DROP COLUMN IF EXISTS road,
    DROP COLUMN IF EXISTS village_mahalla,
    DROP COLUMN IF EXISTS union_ward,
    DROP COLUMN IF EXISTS thana_id,
    DROP COLUMN IF EXISTS upazila_id,
    DROP COLUMN IF EXISTS district_id,
    DROP COLUMN IF EXISTS division_id;

DROP TABLE IF EXISTS geo_thana;
DROP TABLE IF EXISTS geo_upazila;
DROP TABLE IF EXISTS geo_district;
DROP TABLE IF EXISTS geo_division;
