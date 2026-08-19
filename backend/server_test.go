// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Unified Integration Test Suite]
// File: backend/server_test.go
// Purpose: Validates all three integrated modules and database views against MySQL orcus_db.
// ============================================================================

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"orcus-backend/internal/config"
	"orcus-backend/internal/database"
	"orcus-backend/internal/handler"
	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

func setupTestServer(t *testing.T) (*gin.Engine, string) {
	cfg := &config.Config{
		DBUser:       "root",
		DBPassword:   "",
		DBHost:       "127.0.0.1",
		DBPort:       "3306",
		DBName:       "orcus_db",
		JWTSecret:    "test-master-integration-secret",
		JWTExpiresIn: "24h",
		GinMode:      "test",
	}

	db, err := database.Connect(cfg)
	if err != nil {
		t.Skipf("Skipping test: Local MySQL connection failed: %v", err)
	}

	// Initialize Repositories
	authRepo := repository.NewAuthRepository(db.DB)
	orgRepo := repository.NewOrganizationRepository(db.DB)
	intakeRepo := repository.NewIntakeRepository(db.DB)
	caseRepo := repository.NewCaseRepository(db.DB)
	partRepo := repository.NewParticipantRepository(db.DB)
	evidRepo := repository.NewEvidenceRepository(db.DB)
	analytRepo := repository.NewAnalyticsRepository(db.DB)

	// Initialize Services
	authService := service.NewAuthService(authRepo, cfg.JWTSecret)
	orgService := service.NewOrganizationService(orgRepo)
	intakeService := service.NewIntakeService(intakeRepo)
	caseService := service.NewCaseService(caseRepo, partRepo, evidRepo)
	partService := service.NewParticipantService(partRepo)
	evidService := service.NewEvidenceService(evidRepo)
	analytService := service.NewAnalyticsService(analytRepo)

	// Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	orgHandler := handler.NewOrganizationHandler(orgService)
	intakeHandler := handler.NewIntakeHandler(intakeService)
	caseHandler := handler.NewCaseHandler(caseService)
	partHandler := handler.NewParticipantHandler(partService)
	locHandler := handler.NewLocationHandler(partService)
	evidHandler := handler.NewEvidenceHandler(evidService)
	analytHandler := handler.NewAnalyticsHandler(analytService)

	router := handler.SetupMasterRouter(&handler.RouterParams{
		JWTSecret:     cfg.JWTSecret,
		AuthHandler:   authHandler,
		OrgHandler:    orgHandler,
		IntakeHandler: intakeHandler,
		CaseHandler:   caseHandler,
		PartHandler:   partHandler,
		LocHandler:    locHandler,
		EvidHandler:   evidHandler,
		AnalytHandler: analytHandler,
	})

	return router, cfg.JWTSecret
}

func getAdminToken(t *testing.T, router *gin.Engine) string {
	loginPayload, _ := json.Marshal(models.LoginRequest{
		Username: "admin_faisal",
		Password: "password123",
	})
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginPayload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Login failed with status %d: %s", w.Code, w.Body.String())
	}

	var resp struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	return resp.Data.Token
}

// ----------------------------------------------------------------------------
// Test 1: Module 1 (Faisal) - Auth & Organization
// ----------------------------------------------------------------------------

func TestModule1_AuthAndOrganization(t *testing.T) {
	router, _ := setupTestServer(t)
	token := getAdminToken(t, router)

	// Profile check
	req, _ := http.NewRequest("GET", "/api/v1/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /auth/me, got %d", w.Code)
	}

	// Branches
	reqB, _ := http.NewRequest("GET", "/api/v1/branches", nil)
	reqB.Header.Set("Authorization", "Bearer "+token)
	wB := httptest.NewRecorder()
	router.ServeHTTP(wB, reqB)
	if wB.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /branches, got %d", wB.Code)
	}

	// Officers & Caseload view
	reqC, _ := http.NewRequest("GET", "/api/v1/officers/caseload", nil)
	reqC.Header.Set("Authorization", "Bearer "+token)
	wC := httptest.NewRecorder()
	router.ServeHTTP(wC, reqC)
	if wC.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /officers/caseload, got %d", wC.Code)
	}
}

// ----------------------------------------------------------------------------
// Test 2: Module 2 (Shakil) - Intake, FIR & Case Lifecycle
// ----------------------------------------------------------------------------

func TestModule2_IntakeAndCases(t *testing.T) {
	router, _ := setupTestServer(t)
	token := getAdminToken(t, router)

	// 1. Create Complainant
	compPayload, _ := json.Marshal(models.CreateComplainantRequest{
		Name: "Test Complainant Integration",
		Contacts: []models.ComplainantContactDTO{
			{ContactType: "phone", ContactValue: "01799999999", IsPrimary: true},
		},
	})
	reqC, _ := http.NewRequest("POST", "/api/v1/complainants", bytes.NewBuffer(compPayload))
	reqC.Header.Set("Authorization", "Bearer "+token)
	reqC.Header.Set("Content-Type", "application/json")
	wC := httptest.NewRecorder()
	router.ServeHTTP(wC, reqC)
	if wC.Code != http.StatusCreated {
		t.Fatalf("Failed to create complainant: %d - %s", wC.Code, wC.Body.String())
	}

	// 2. Search Cases
	reqS, _ := http.NewRequest("GET", "/api/v1/cases?status=Open", nil)
	reqS.Header.Set("Authorization", "Bearer "+token)
	wS := httptest.NewRecorder()
	router.ServeHTTP(wS, reqS)
	if wS.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /cases search, got %d", wS.Code)
	}

	// 3. Case Dossier
	reqD, _ := http.NewRequest("GET", "/api/v1/cases/1", nil)
	reqD.Header.Set("Authorization", "Bearer "+token)
	wD := httptest.NewRecorder()
	router.ServeHTTP(wD, reqD)
	if wD.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /cases/1 dossier, got %d", wD.Code)
	}
}

// ----------------------------------------------------------------------------
// Test 3: Module 3 (Liza) - Participants, Evidence & Chain of Custody
// ----------------------------------------------------------------------------

func TestModule3_ParticipantsAndEvidence(t *testing.T) {
	router, _ := setupTestServer(t)
	token := getAdminToken(t, router)

	// 1. Suspects & Dossier view
	reqS, _ := http.NewRequest("GET", "/api/v1/suspects/1/dossier", nil)
	reqS.Header.Set("Authorization", "Bearer "+token)
	wS := httptest.NewRecorder()
	router.ServeHTTP(wS, reqS)
	if wS.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /suspects/1/dossier, got %d", wS.Code)
	}

	// 2. Evidence list & Chain of Custody view
	reqE, _ := http.NewRequest("GET", "/api/v1/evidence/1/chain", nil)
	reqE.Header.Set("Authorization", "Bearer "+token)
	wE := httptest.NewRecorder()
	router.ServeHTTP(wE, reqE)
	if wE.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /evidence/1/chain, got %d", wE.Code)
	}
}

// ----------------------------------------------------------------------------
// Test 4: Analytics & Pipeline Views
// ----------------------------------------------------------------------------

func TestAnalytics_DashboardAndPipeline(t *testing.T) {
	router, _ := setupTestServer(t)
	token := getAdminToken(t, router)

	reqO, _ := http.NewRequest("GET", "/api/v1/analytics/overview", nil)
	reqO.Header.Set("Authorization", "Bearer "+token)
	wO := httptest.NewRecorder()
	router.ServeHTTP(wO, reqO)
	if wO.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /analytics/overview, got %d", wO.Code)
	}

	reqP, _ := http.NewRequest("GET", "/api/v1/analytics/pipeline", nil)
	reqP.Header.Set("Authorization", "Bearer "+token)
	wP := httptest.NewRecorder()
	router.ServeHTTP(wP, reqP)
	if wP.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /analytics/pipeline, got %d", wP.Code)
	}
	fmt.Println("All 4 integration test suites passed successfully!")
}
