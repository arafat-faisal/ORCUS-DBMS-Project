package models

// GeoDivision maps to table `geo_division`
type GeoDivision struct {
	DivisionID uint   `db:"division_id" json:"division_id"`
	NameEn     string `db:"name_en" json:"name_en"`
	NameBn     string `db:"name_bn" json:"name_bn"`
	Code       string `db:"code" json:"code"`
}

// GeoDistrict maps to table `geo_district`
type GeoDistrict struct {
	DistrictID uint   `db:"district_id" json:"district_id"`
	DivisionID uint   `db:"division_id" json:"division_id"`
	NameEn     string `db:"name_en" json:"name_en"`
	NameBn     string `db:"name_bn" json:"name_bn"`
	Code       string `db:"code" json:"code"`
}

// GeoUpazila maps to table `geo_upazila`
type GeoUpazila struct {
	UpazilaID  uint   `db:"upazila_id" json:"upazila_id"`
	DistrictID uint   `db:"district_id" json:"district_id"`
	NameEn     string `db:"name_en" json:"name_en"`
	NameBn     string `db:"name_bn" json:"name_bn"`
}

// GeoThana maps to table `geo_thana`
type GeoThana struct {
	ThanaID    uint    `db:"thana_id" json:"thana_id"`
	DistrictID uint    `db:"district_id" json:"district_id"`
	NameEn     string  `db:"name_en" json:"name_en"`
	NameBn     string  `db:"name_bn" json:"name_bn"`
	Code       *string `db:"code" json:"code,omitempty"`
}
