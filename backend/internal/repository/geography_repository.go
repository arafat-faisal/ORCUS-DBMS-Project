package repository

import (
	"orcus-backend/internal/models"

	"github.com/jmoiron/sqlx"
)

type GeographyRepository interface {
	GetDivisions() ([]models.GeoDivision, error)
	GetDistricts(divisionID *uint) ([]models.GeoDistrict, error)
	GetUpazilas(districtID *uint) ([]models.GeoUpazila, error)
	GetThanas(districtID *uint) ([]models.GeoThana, error)
}

type geographyRepository struct {
	db *sqlx.DB
}

func NewGeographyRepository(db *sqlx.DB) GeographyRepository {
	return &geographyRepository{db: db}
}

func (r *geographyRepository) GetDivisions() ([]models.GeoDivision, error) {
	var divisions []models.GeoDivision
	err := r.db.Select(&divisions, "SELECT division_id, name_en, name_bn, code FROM geo_division ORDER BY division_id ASC")
	if err != nil {
		return nil, err
	}
	return divisions, nil
}

func (r *geographyRepository) GetDistricts(divisionID *uint) ([]models.GeoDistrict, error) {
	var districts []models.GeoDistrict
	var err error
	if divisionID != nil && *divisionID > 0 {
		err = r.db.Select(&districts, "SELECT district_id, division_id, name_en, name_bn, code FROM geo_district WHERE division_id = ? ORDER BY name_en ASC", *divisionID)
	} else {
		err = r.db.Select(&districts, "SELECT district_id, division_id, name_en, name_bn, code FROM geo_district ORDER BY division_id ASC, name_en ASC")
	}
	if err != nil {
		return nil, err
	}
	return districts, nil
}

func (r *geographyRepository) GetUpazilas(districtID *uint) ([]models.GeoUpazila, error) {
	var upazilas []models.GeoUpazila
	var err error
	if districtID != nil && *districtID > 0 {
		err = r.db.Select(&upazilas, "SELECT upazila_id, district_id, name_en, name_bn FROM geo_upazila WHERE district_id = ? ORDER BY name_en ASC", *districtID)
	} else {
		err = r.db.Select(&upazilas, "SELECT upazila_id, district_id, name_en, name_bn FROM geo_upazila ORDER BY district_id ASC, name_en ASC")
	}
	if err != nil {
		return nil, err
	}
	return upazilas, nil
}

func (r *geographyRepository) GetThanas(districtID *uint) ([]models.GeoThana, error) {
	var thanas []models.GeoThana
	var err error
	if districtID != nil && *districtID > 0 {
		err = r.db.Select(&thanas, "SELECT thana_id, district_id, name_en, name_bn, code FROM geo_thana WHERE district_id = ? ORDER BY name_en ASC", *districtID)
	} else {
		err = r.db.Select(&thanas, "SELECT thana_id, district_id, name_en, name_bn, code FROM geo_thana ORDER BY district_id ASC, name_en ASC")
	}
	if err != nil {
		return nil, err
	}
	return thanas, nil
}
