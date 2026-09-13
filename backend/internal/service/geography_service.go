package service

import (
	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type GeographyService interface {
	GetDivisions() ([]models.GeoDivision, error)
	GetDistricts(divisionID *uint) ([]models.GeoDistrict, error)
	GetUpazilas(districtID *uint) ([]models.GeoUpazila, error)
	GetThanas(districtID *uint) ([]models.GeoThana, error)
}

type geographyService struct {
	repo repository.GeographyRepository
}

func NewGeographyService(repo repository.GeographyRepository) GeographyService {
	return &geographyService{repo: repo}
}

func (s *geographyService) GetDivisions() ([]models.GeoDivision, error) {
	return s.repo.GetDivisions()
}

func (s *geographyService) GetDistricts(divisionID *uint) ([]models.GeoDistrict, error) {
	return s.repo.GetDistricts(divisionID)
}

func (s *geographyService) GetUpazilas(districtID *uint) ([]models.GeoUpazila, error) {
	return s.repo.GetUpazilas(districtID)
}

func (s *geographyService) GetThanas(districtID *uint) ([]models.GeoThana, error) {
	return s.repo.GetThanas(districtID)
}
