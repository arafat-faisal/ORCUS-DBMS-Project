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
	"strings"
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
	auditRepo := repository.NewAuditRepository(db.DB)
	geoRepo := repository.NewGeographyRepository(db.DB)
	complaintRepo := repository.NewComplaintRepository(db.DB)

	// Initialize Services
	seqService := service.NewSequenceService(db.DB)
	authService := service.NewAuthService(authRepo, cfg.JWTSecret)
	orgService := service.NewOrganizationService(orgRepo)
	intakeService := service.NewIntakeService(intakeRepo, seqService)
	caseService := service.NewCaseService(caseRepo, partRepo, evidRepo)
	partService := service.NewParticipantService(partRepo)
	evidService := service.NewEvidenceService(evidRepo)
	analytService := service.NewAnalyticsService(analytRepo)
	auditService := service.NewAuditService(auditRepo)
	geoService := service.NewGeographyService(geoRepo)
	complaintService := service.NewComplaintService(complaintRepo, intakeRepo, seqService, auditService)

	// Initialize Handlers
	authHandler := handler.NewAuthHandler(authService, auditService, false)
	orgHandler := handler.NewOrganizationHandler(orgService)
	intakeHandler := handler.NewIntakeHandler(intakeService, complaintService)
	caseHandler := handler.NewCaseHandler(caseService)
	partHandler := handler.NewParticipantHandler(partService)
	locHandler := handler.NewLocationHandler(partService)
	evidHandler := handler.NewEvidenceHandler(evidService)
	analytHandler := handler.NewAnalyticsHandler(analytService)
	auditHandler := handler.NewAuditHandler(auditService)
	geoHandler := handler.NewGeographyHandler(geoService)
	complaintHandler := handler.NewComplaintHandler(complaintService, auditService)

	router := handler.SetupMasterRouter(&handler.RouterParams{
		JWTSecret:        cfg.JWTSecret,
		AllowedOrigins:   []string{"http://localhost:7700", "http://localhost:3000"},
		AuthHandler:      authHandler,
		OrgHandler:       orgHandler,
		IntakeHandler:    intakeHandler,
		CaseHandler:      caseHandler,
		PartHandler:      partHandler,
		LocHandler:       locHandler,
		EvidHandler:      evidHandler,
		AnalytHandler:    analytHandler,
		AuditHandler:     auditHandler,
		GeoHandler:       geoHandler,
		ComplaintHandler: complaintHandler,
	})

	return router, cfg.JWTSecret
}

func getAdminToken(t *testing.T, router *gin.Engine) string {
	return getUserToken(t, router, "admin_faisal", "Faisal@Admin2026!")
}

func getUserToken(t *testing.T, router *gin.Engine, username, password string) string {
	loginPayload, _ := json.Marshal(models.LoginRequest{
		Username: username,
		Password: password,
	})
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginPayload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Login failed for user %s with status %d: %s", username, w.Code, w.Body.String())
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
	// Intake operations require Duty Officer or Investigating Officer (Separation of duties)
	dutyOfficerToken := getUserToken(t, router, "si_nusrat", "Nusrat@Duty2026!")

	// 1. Create Complainant as Duty Officer
	compPayload, _ := json.Marshal(models.CreateComplainantRequest{
		Name: "Test Complainant Integration",
		Contacts: []models.ComplainantContactDTO{
			{ContactType: "phone", ContactValue: "01799999999", IsPrimary: true},
		},
	})
	reqC, _ := http.NewRequest("POST", "/api/v1/complainants", bytes.NewBuffer(compPayload))
	reqC.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	reqC.Header.Set("Content-Type", "application/json")
	wC := httptest.NewRecorder()
	router.ServeHTTP(wC, reqC)
	if wC.Code != http.StatusCreated {
		t.Fatalf("Failed to create complainant: %d - %s", wC.Code, wC.Body.String())
	}

	// 2. Search Cases
	reqS, _ := http.NewRequest("GET", "/api/v1/cases?status=Open", nil)
	reqS.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	wS := httptest.NewRecorder()
	router.ServeHTTP(wS, reqS)
	if wS.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /cases search, got %d", wS.Code)
	}

	// 3. Case Dossier
	reqD, _ := http.NewRequest("GET", "/api/v1/cases/1", nil)
	reqD.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
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

// ----------------------------------------------------------------------------
// Test 5: Security Remediation Suite (Phase 1 Acceptance Tests)
// ----------------------------------------------------------------------------

func TestSecurity_BackdoorRejectedAndCookies(t *testing.T) {
	router, _ := setupTestServer(t)

	// 1. Verify old universal passwords are rejected (No backdoor)
	for _, badPwd := range []string{"password123", "admin123", "secret", "wrongpass"} {
		badPayload, _ := json.Marshal(models.LoginRequest{
			Username: "admin_faisal",
			Password: badPwd,
		})
		req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(badPayload))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Fatalf("SECURITY VIOLATION: Universal/bad password '%s' was NOT rejected! Got code %d", badPwd, w.Code)
		}
	}

	// 2. Verify authentic credentials succeed and set HttpOnly cookie
	loginPayload, _ := json.Marshal(models.LoginRequest{
		Username: "admin_faisal",
		Password: "Faisal@Admin2026!",
	})
	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginPayload))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected authentic login to succeed with 200, got %d: %s", w.Code, w.Body.String())
	}

	cookies := w.Result().Cookies()
	var authCookie *http.Cookie
	for _, ck := range cookies {
		if ck.Name == "orcus_auth_token" {
			authCookie = ck
			break
		}
	}

	if authCookie == nil {
		t.Fatal("SECURITY DEFECT: Expected HttpOnly cookie 'orcus_auth_token' was not set upon login!")
	}
	if !authCookie.HttpOnly {
		t.Fatal("SECURITY DEFECT: Authentication cookie 'orcus_auth_token' is not marked HttpOnly!")
	}

	// 3. Verify session authentication via HttpOnly cookie (without Authorization header)
	reqMe, _ := http.NewRequest("GET", "/api/v1/auth/me", nil)
	reqMe.AddCookie(authCookie)
	wMe := httptest.NewRecorder()
	router.ServeHTTP(wMe, reqMe)

	if wMe.Code != http.StatusOK {
		t.Fatalf("Expected cookie-authenticated request to return 200, got %d: %s", wMe.Code, wMe.Body.String())
	}

	// 4. Verify anonymous access to protected route returns 401
	reqAnon, _ := http.NewRequest("GET", "/api/v1/auth/me", nil)
	wAnon := httptest.NewRecorder()
	router.ServeHTTP(wAnon, reqAnon)

	if wAnon.Code != http.StatusUnauthorized {
		t.Fatalf("Expected anonymous request to return 401, got %d", wAnon.Code)
	}

	// 5. Verify Logout clears the authentication cookie
	reqLogout, _ := http.NewRequest("POST", "/api/v1/auth/logout", nil)
	reqLogout.AddCookie(authCookie)
	wLogout := httptest.NewRecorder()
	router.ServeHTTP(wLogout, reqLogout)

	if wLogout.Code != http.StatusOK {
		t.Fatalf("Expected logout to return 200, got %d", wLogout.Code)
	}

	logoutCookies := wLogout.Result().Cookies()
	var clearedCookie *http.Cookie
	for _, ck := range logoutCookies {
		if ck.Name == "orcus_auth_token" {
			clearedCookie = ck
			break
		}
	}
	if clearedCookie == nil || clearedCookie.MaxAge >= 0 {
		t.Fatal("SECURITY DEFECT: Logout did not expire the authentication cookie!")
	}

	// 6. Verify CORS rejection of untrusted origin
	reqCors, _ := http.NewRequest("OPTIONS", "/api/v1/auth/login", nil)
	reqCors.Header.Set("Origin", "http://evil-unauthorized-domain.com")
	reqCors.Header.Set("Access-Control-Request-Method", "POST")
	wCors := httptest.NewRecorder()
	router.ServeHTTP(wCors, reqCors)

	if wCors.Code != http.StatusForbidden {
		t.Fatalf("SECURITY DEFECT: Untrusted CORS origin was not rejected! Got status %d", wCors.Code)
	}

	// 7. Verify RBAC rejection returns 403
	// Log in as Field Detective si_nusrat
	loginDet, _ := json.Marshal(models.LoginRequest{
		Username: "si_nusrat",
		Password: "Nusrat@Duty2026!",
	})
	reqDetLogin, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginDet))
	reqDetLogin.Header.Set("Content-Type", "application/json")
	wDetLogin := httptest.NewRecorder()
	router.ServeHTTP(wDetLogin, reqDetLogin)

	if wDetLogin.Code != http.StatusOK {
		t.Fatalf("Failed to login as si_nusrat: %d", wDetLogin.Code)
	}

	var detResp struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	_ = json.Unmarshal(wDetLogin.Body.Bytes(), &detResp)

	// Field Detective attempts to create branch (Requires Administrator)
	branchPayload, _ := json.Marshal(map[string]string{
		"branch_name": "Unauthorized Station",
		"district":    "Dhaka",
	})
	reqBranch, _ := http.NewRequest("POST", "/api/v1/branches", bytes.NewBuffer(branchPayload))
	reqBranch.Header.Set("Authorization", "Bearer "+detResp.Data.Token)
	reqBranch.Header.Set("Content-Type", "application/json")
	wBranch := httptest.NewRecorder()
	router.ServeHTTP(wBranch, reqBranch)

	if wBranch.Code != http.StatusForbidden {
		t.Fatalf("SECURITY DEFECT: Field Detective creating branch expected 403 Forbidden, got %d", wBranch.Code)
	}

	fmt.Println("Phase 1 Security Remediation Suite passed with 100% compliance!")
}

func TestAuditLogging_Verification(t *testing.T) {
	router, _ := setupTestServer(t)

	// 1. Log in as admin_faisal to trigger audit log creation
	loginBody, _ := json.Marshal(models.LoginRequest{
		Username: "admin_faisal",
		Password: "Faisal@Admin2026!",
	})
	reqLogin, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	reqLogin.Header.Set("Content-Type", "application/json")
	wLogin := httptest.NewRecorder()
	router.ServeHTTP(wLogin, reqLogin)

	if wLogin.Code != http.StatusOK {
		t.Fatalf("Admin login failed with status %d", wLogin.Code)
	}

	cookie := wLogin.Header().Get("Set-Cookie")

	// 2. Attempt failed login to verify failure audit record
	badLogin, _ := json.Marshal(models.LoginRequest{
		Username: "admin_faisal",
		Password: "IncorrectPassword999!",
	})
	reqBad, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(badLogin))
	reqBad.Header.Set("Content-Type", "application/json")
	wBad := httptest.NewRecorder()
	router.ServeHTTP(wBad, reqBad)

	if wBad.Code != http.StatusUnauthorized {
		t.Fatalf("Expected 401 on bad password, got %d", wBad.Code)
	}

	// 3. Admin requests /api/v1/admin/audit-logs
	reqAudit, _ := http.NewRequest("GET", "/api/v1/admin/audit-logs?event_type=AUTH", nil)
	reqAudit.Header.Set("Cookie", cookie)
	wAudit := httptest.NewRecorder()
	router.ServeHTTP(wAudit, reqAudit)

	if wAudit.Code != http.StatusOK {
		t.Fatalf("Admin failed to retrieve audit logs: got status %d, body: %s", wAudit.Code, wAudit.Body.String())
	}

	var auditResp struct {
		Success    bool              `json:"success"`
		Data       []models.AuditLog `json:"data"`
		Pagination *models.PaginationInfo `json:"pagination"`
	}
	if err := json.Unmarshal(wAudit.Body.Bytes(), &auditResp); err != nil {
		t.Fatalf("Failed to parse audit log response: %v", err)
	}

	if !auditResp.Success || len(auditResp.Data) == 0 {
		t.Fatalf("Expected at least 1 audit log entry, found 0")
	}

	// Verify entries contain required fields and no secrets
	for _, entry := range auditResp.Data {
		if entry.Action == "" || entry.Route == "" || entry.HTTPMethod == "" {
			t.Errorf("Audit log entry missing required fields: %+v", entry)
		}
		if entry.BeforeSummary != nil && strings.Contains(*entry.BeforeSummary, "Faisal@Admin2026!") {
			t.Errorf("SECURITY DEFECT: Sensitive password found in before_summary: %s", *entry.BeforeSummary)
		}
		if entry.AfterSummary != nil && strings.Contains(*entry.AfterSummary, "Faisal@Admin2026!") {
			t.Errorf("SECURITY DEFECT: Sensitive password found in after_summary: %s", *entry.AfterSummary)
		}
	}

	// 4. Verify negative authorization: non-admin (si_nusrat) gets 403 Forbidden
	detLoginBody, _ := json.Marshal(models.LoginRequest{
		Username: "si_nusrat",
		Password: "Nusrat@Duty2026!",
	})
	reqDetLogin, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(detLoginBody))
	reqDetLogin.Header.Set("Content-Type", "application/json")
	wDetLogin := httptest.NewRecorder()
	router.ServeHTTP(wDetLogin, reqDetLogin)
	detCookie := wDetLogin.Header().Get("Set-Cookie")

	reqDetAudit, _ := http.NewRequest("GET", "/api/v1/admin/audit-logs", nil)
	reqDetAudit.Header.Set("Cookie", detCookie)
	wDetAudit := httptest.NewRecorder()
	router.ServeHTTP(wDetAudit, reqDetAudit)

	if wDetAudit.Code != http.StatusForbidden {
		t.Fatalf("SECURITY DEFECT: Non-admin accessed audit logs! Expected 403, got %d", wDetAudit.Code)
	}

	// 5. Verify anonymous request receives 401 Unauthorized
	reqAnonAudit, _ := http.NewRequest("GET", "/api/v1/admin/audit-logs", nil)
	wAnonAudit := httptest.NewRecorder()
	router.ServeHTTP(wAnonAudit, reqAnonAudit)

	if wAnonAudit.Code != http.StatusUnauthorized {
		t.Fatalf("SECURITY DEFECT: Anonymous request accessed audit logs! Expected 401, got %d", wAnonAudit.Code)
	}

	fmt.Println("Phase 3 System-Wide Audit Log Suite passed with 100% compliance!")
}

// ----------------------------------------------------------------------------
// Test 6: Phase 4 User Roles and Authorization (Separation of Duties Suite)
// ----------------------------------------------------------------------------

func TestRoleAuthorization_SeparationOfDuties(t *testing.T) {
	router, _ := setupTestServer(t)

	// Fetch tokens for all key actors
	adminToken := getUserToken(t, router, "admin_faisal", "Faisal@Admin2026!")
	dutyOfficerToken := getUserToken(t, router, "si_nusrat", "Nusrat@Duty2026!")
	investigatorToken := getUserToken(t, router, "det_shakil", "Shakil@Invest2026!")
	evidenceOfficerToken := getUserToken(t, router, "forensic_liza", "Liza@Forensic2026!")
	oicToken := getUserToken(t, router, "insp_tariq", "Tariq@Invest2026!")
	auditorToken := getUserToken(t, router, "system_auditor", "Auditor@Audit2026!")
	publicToken := getUserToken(t, router, "complainant_rahim", "Rahim@Public2026!")

	// 1. Separation of Duties: Administrator CANNOT alter investigation facts (create complainant)
	compPayload, _ := json.Marshal(models.CreateComplainantRequest{
		Name: "Admin Unauthorized Complainant",
		Contacts: []models.ComplainantContactDTO{
			{ContactType: "phone", ContactValue: "01711111111", IsPrimary: true},
		},
	})
	reqAdminComp, _ := http.NewRequest("POST", "/api/v1/complainants", bytes.NewBuffer(compPayload))
	reqAdminComp.Header.Set("Authorization", "Bearer "+adminToken)
	reqAdminComp.Header.Set("Content-Type", "application/json")
	wAdminComp := httptest.NewRecorder()
	router.ServeHTTP(wAdminComp, reqAdminComp)
	if wAdminComp.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: Administrator was allowed to create complainant! Expected 403, got %d", wAdminComp.Code)
	}

	// 2. Public Complainant CANNOT access internal operational endpoints (/branches, /cases)
	reqPubBranches, _ := http.NewRequest("GET", "/api/v1/branches", nil)
	reqPubBranches.Header.Set("Authorization", "Bearer "+publicToken)
	wPubBranches := httptest.NewRecorder()
	router.ServeHTTP(wPubBranches, reqPubBranches)
	if wPubBranches.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: Public Complainant accessed internal /branches! Expected 403, got %d", wPubBranches.Code)
	}

	reqPubCases, _ := http.NewRequest("GET", "/api/v1/cases", nil)
	reqPubCases.Header.Set("Authorization", "Bearer "+publicToken)
	wPubCases := httptest.NewRecorder()
	router.ServeHTTP(wPubCases, reqPubCases)
	if wPubCases.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: Public Complainant accessed internal /cases! Expected 403, got %d", wPubCases.Code)
	}

	// 3. Duty Officer CANNOT create branches (Requires Administrator)
	branchPayload, _ := json.Marshal(map[string]string{
		"branch_name": "Unauthorized Duty Branch",
		"district":    "Dhaka",
	})
	reqDutyBranch, _ := http.NewRequest("POST", "/api/v1/branches", bytes.NewBuffer(branchPayload))
	reqDutyBranch.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	reqDutyBranch.Header.Set("Content-Type", "application/json")
	wDutyBranch := httptest.NewRecorder()
	router.ServeHTTP(wDutyBranch, reqDutyBranch)
	if wDutyBranch.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: Duty Officer was allowed to create branch! Expected 403, got %d", wDutyBranch.Code)
	}

	// 4. Evidence Officer CANNOT open a case (Requires Officer-in-Charge)
	casePayload, _ := json.Marshal(map[string]interface{}{
		"case_title": "Unauthorized Case By Evidence Officer",
	})
	reqEvidCase, _ := http.NewRequest("POST", "/api/v1/cases", bytes.NewBuffer(casePayload))
	reqEvidCase.Header.Set("Authorization", "Bearer "+evidenceOfficerToken)
	reqEvidCase.Header.Set("Content-Type", "application/json")
	wEvidCase := httptest.NewRecorder()
	router.ServeHTTP(wEvidCase, reqEvidCase)
	if wEvidCase.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: Evidence Officer was allowed to open case! Expected 403, got %d", wEvidCase.Code)
	}

	// 5. System Auditor CANNOT create or mutate operational records
	reqAuditCase, _ := http.NewRequest("POST", "/api/v1/cases", bytes.NewBuffer(casePayload))
	reqAuditCase.Header.Set("Authorization", "Bearer "+auditorToken)
	reqAuditCase.Header.Set("Content-Type", "application/json")
	wAuditCase := httptest.NewRecorder()
	router.ServeHTTP(wAuditCase, reqAuditCase)
	if wAuditCase.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: System Auditor was allowed to open case! Expected 403, got %d", wAuditCase.Code)
	}

	// 6. Investigating Officer CANNOT approve FIR registration (Requires Officer-in-Charge)
	firPayload, _ := json.Marshal(map[string]interface{}{
		"gd_id": 1,
	})
	reqInvestFIR, _ := http.NewRequest("POST", "/api/v1/firs", bytes.NewBuffer(firPayload))
	reqInvestFIR.Header.Set("Authorization", "Bearer "+investigatorToken)
	reqInvestFIR.Header.Set("Content-Type", "application/json")
	wInvestFIR := httptest.NewRecorder()
	router.ServeHTTP(wInvestFIR, reqInvestFIR)
	if wInvestFIR.Code != http.StatusForbidden {
		t.Fatalf("SECURITY VIOLATION: Investigating Officer was allowed to approve FIR! Expected 403, got %d", wInvestFIR.Code)
	}

	// 7. Verify Authorized Roles succeed on their designated operations
	// Duty Officer creates complainant -> 201 Created
	reqDutyComp, _ := http.NewRequest("POST", "/api/v1/complainants", bytes.NewBuffer(compPayload))
	reqDutyComp.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	reqDutyComp.Header.Set("Content-Type", "application/json")
	wDutyComp := httptest.NewRecorder()
	router.ServeHTTP(wDutyComp, reqDutyComp)
	if wDutyComp.Code != http.StatusCreated {
		t.Fatalf("Expected Duty Officer to create complainant (201), got %d: %s", wDutyComp.Code, wDutyComp.Body.String())
	}

	_ = oicToken // Reserved for case approval tests in Phase 8/9

	fmt.Println("Phase 4 Role Authorization & Separation of Duties Suite passed with 100% compliance!")
}

// ----------------------------------------------------------------------------
// Test 7: Phase 5 Bangladesh Geography and Localization
// ----------------------------------------------------------------------------

func TestBangladeshGeographyAndLocalization(t *testing.T) {
	router, _ := setupTestServer(t)

	// 1. Verify Divisions endpoint returns all 8 official Bangladesh divisions
	reqDiv, _ := http.NewRequest("GET", "/api/v1/geo/divisions", nil)
	wDiv := httptest.NewRecorder()
	router.ServeHTTP(wDiv, reqDiv)

	if wDiv.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /geo/divisions, got %d: %s", wDiv.Code, wDiv.Body.String())
	}

	var divResp struct {
		Success bool                 `json:"success"`
		Data    []models.GeoDivision `json:"data"`
	}
	if err := json.Unmarshal(wDiv.Body.Bytes(), &divResp); err != nil {
		t.Fatalf("Failed to parse divisions response: %v", err)
	}

	if len(divResp.Data) != 8 {
		t.Fatalf("Expected exactly 8 Bangladesh divisions, got %d", len(divResp.Data))
	}

	// Verify English and Bangla names
	dhakaFound := false
	for _, d := range divResp.Data {
		if d.NameEn == "Dhaka" && d.NameBn == "ঢাকা" && d.Code == "DHK" {
			dhakaFound = true
			break
		}
	}
	if !dhakaFound {
		t.Fatal("Expected division 'Dhaka' ('ঢাকা') with code 'DHK' not found")
	}

	// 2. Verify Districts endpoint filtered by division_id=1 (Dhaka division)
	reqDist, _ := http.NewRequest("GET", "/api/v1/geo/districts?division_id=1", nil)
	wDist := httptest.NewRecorder()
	router.ServeHTTP(wDist, reqDist)

	if wDist.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /geo/districts, got %d", wDist.Code)
	}

	var distResp struct {
		Success bool                 `json:"success"`
		Data    []models.GeoDistrict `json:"data"`
	}
	_ = json.Unmarshal(wDist.Body.Bytes(), &distResp)
	if len(distResp.Data) == 0 {
		t.Fatal("Expected districts for Dhaka division, got 0")
	}

	// 3. Verify Thanas endpoint filtered by district_id=1 (Dhaka district)
	reqThana, _ := http.NewRequest("GET", "/api/v1/geo/thanas?district_id=1", nil)
	wThana := httptest.NewRecorder()
	router.ServeHTTP(wThana, reqThana)

	if wThana.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /geo/thanas, got %d", wThana.Code)
	}

	var thanaResp struct {
		Success bool               `json:"success"`
		Data    []models.GeoThana  `json:"data"`
	}
	_ = json.Unmarshal(wThana.Body.Bytes(), &thanaResp)
	if len(thanaResp.Data) == 0 {
		t.Fatal("Expected thanas for Dhaka district, got 0")
	}

	// 4. Verify Upazilas endpoint filtered by district_id=1 (Dhaka district)
	reqUpz, _ := http.NewRequest("GET", "/api/v1/geo/upazilas?district_id=1", nil)
	wUpz := httptest.NewRecorder()
	router.ServeHTTP(wUpz, reqUpz)

	if wUpz.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /geo/upazilas, got %d", wUpz.Code)
	}

	var upzResp struct {
		Success bool                `json:"success"`
		Data    []models.GeoUpazila `json:"data"`
	}
	_ = json.Unmarshal(wUpz.Body.Bytes(), &upzResp)
	if len(upzResp.Data) == 0 {
		t.Fatal("Expected upazilas for Dhaka district, got 0")
	}

	// 5. Test Bangladesh mobile validation and normalization
	testCases := []struct {
		input    string
		expected string
		valid    bool
	}{
		{"01712345678", "+8801712345678", true},
		{"+8801812345678", "+8801812345678", true},
		{"8801912345678", "+8801912345678", true},
		{"01300000000", "+8801300000000", true},
		{"01400000000", "+8801400000000", true},
		{"01500000000", "+8801500000000", true},
		{"01600000000", "+8801600000000", true},
		{"01200000000", "", false},  // invalid operator prefix (012)
		{"12345678", "", false},     // too short
		{"0171234567899", "", false}, // too long
	}

	for _, tc := range testCases {
		norm, err := service.NormalizeBDMobile(tc.input)
		if tc.valid {
			if err != nil {
				t.Errorf("Expected valid mobile for '%s', got error: %v", tc.input, err)
			}
			if norm != tc.expected {
				t.Errorf("Normalized mobile mismatch for '%s': expected '%s', got '%s'", tc.input, tc.expected, norm)
			}
			readable := service.FormatBDMobileReadable(norm)
			if !strings.HasPrefix(readable, "+880 1") {
				t.Errorf("Expected readable format prefix '+880 1...', got '%s'", readable)
			}
		} else {
			if err == nil {
				t.Errorf("Expected validation failure for invalid mobile '%s', but it passed with: %s", tc.input, norm)
			}
		}
	}

	// 6. Test Identity Document Masking
	maskedNID := service.MaskIdentityDocument("NID", "19941234567890123")
	if !strings.HasSuffix(maskedNID, "0123") || !strings.Contains(maskedNID, "••••") {
		t.Errorf("Identity document masking failed: %s", maskedNID)
	}

	fmt.Println("Phase 5 Bangladesh Geography & Localization Backend Suite passed with 100% compliance!")
}

// ----------------------------------------------------------------------------
// Test 8: Phase 6 & Phase 7 Complaint Workflow and Atomic Identifier Generation
// ----------------------------------------------------------------------------

func TestComplaintWorkflowAndIdentifiers(t *testing.T) {
	router, _ := setupTestServer(t)

	// 1. Concurrency-Safe Identifier Generation (Phase 7)
	// Test concurrent sequence generation across 10 goroutines
	numGoroutines := 10
	results := make(chan string, numGoroutines)
	errorsChan := make(chan error, numGoroutines)

	cfg := &config.Config{
		DBUser:       "root",
		DBPassword:   "",
		DBHost:       "127.0.0.1",
		DBPort:       "3306",
		DBName:       "orcus_db",
		JWTSecret:    "test-secret",
		JWTExpiresIn: "24h",
	}
	db, err := database.Connect(cfg)
	if err != nil {
		t.Fatalf("Database connection failed: %v", err)
	}
	seqService := service.NewSequenceService(db.DB)

	for i := 0; i < numGoroutines; i++ {
		go func() {
			code, err := seqService.GenerateComplaintTrackingCode(nil, "DHK")
			if err != nil {
				errorsChan <- err
				return
			}
			results <- code
		}()
	}

	generatedCodes := make(map[string]bool)
	for i := 0; i < numGoroutines; i++ {
		select {
		case err := <-errorsChan:
			t.Fatalf("Concurrent sequence generation failed: %v", err)
		case code := <-results:
			if generatedCodes[code] {
				t.Fatalf("RACE CONDITION DETECTED: Duplicate tracking code '%s' was generated!", code)
			}
			generatedCodes[code] = true
			if !strings.HasPrefix(code, "CMP-DHK-2026-") {
				t.Errorf("Unexpected tracking code format: %s", code)
			}
		}
	}

	// 2. Public Complaint Submission (Phase 6)
	pubPayload, _ := json.Marshal(models.PublicSubmitComplaintRequest{
		ComplainantName:   "Kamal Hossain Fictional",
		ContactPhone:      "01719876543",
		Title:             "Illegal Cyber Extortion Syndicate Report",
		Description:       "Organized group demanding extortion payments via mobile banking threats.",
		IncidentDate:      "2026-09-10",
		ReceivingBranchID: 1,
	})
	reqPubSubmit, _ := http.NewRequest("POST", "/api/v1/public/complaints", bytes.NewBuffer(pubPayload))
	reqPubSubmit.Header.Set("Content-Type", "application/json")
	wPubSubmit := httptest.NewRecorder()
	router.ServeHTTP(wPubSubmit, reqPubSubmit)

	if wPubSubmit.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created on /public/complaints, got %d: %s", wPubSubmit.Code, wPubSubmit.Body.String())
	}

	var pubResp struct {
		Success bool `json:"success"`
		Data    struct {
			TrackingCode string `json:"tracking_code"`
			Status       string `json:"current_status"`
		} `json:"data"`
	}
	_ = json.Unmarshal(wPubSubmit.Body.Bytes(), &pubResp)
	trackingCode := pubResp.Data.TrackingCode
	if trackingCode == "" {
		t.Fatal("Expected generated tracking code in public submission response, got empty")
	}

	// 3. Public Complaint Tracking (Phase 6)
	// Legitimate tracking query
	reqTrack, _ := http.NewRequest("GET", fmt.Sprintf("/api/v1/public/complaints/track?tracking_code=%s&phone=01719876543", trackingCode), nil)
	wTrack := httptest.NewRecorder()
	router.ServeHTTP(wTrack, reqTrack)

	if wTrack.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on tracking, got %d: %s", wTrack.Code, wTrack.Body.String())
	}

	var trackResp struct {
		Success bool                       `json:"success"`
		Data    models.PublicTrackResponse `json:"data"`
	}
	_ = json.Unmarshal(wTrack.Body.Bytes(), &trackResp)
	if trackResp.Data.TrackingCode != trackingCode {
		t.Errorf("Tracking code mismatch: expected %s, got %s", trackingCode, trackResp.Data.TrackingCode)
	}
	if trackResp.Data.CurrentStatus != "Submitted" {
		t.Errorf("Expected initial status 'Submitted', got %s", trackResp.Data.CurrentStatus)
	}

	// Tracking with invalid phone verification factor -> rejected
	reqBadTrack, _ := http.NewRequest("GET", fmt.Sprintf("/api/v1/public/complaints/track?tracking_code=%s&phone=01999999999", trackingCode), nil)
	wBadTrack := httptest.NewRecorder()
	router.ServeHTTP(wBadTrack, reqBadTrack)
	if wBadTrack.Code != http.StatusNotFound {
		t.Fatalf("Expected 404 on mismatched phone verification, got %d", wBadTrack.Code)
	}

	// 4. Officer Intake & Assessment Workflow (Phase 6)
	dutyOfficerToken := getUserToken(t, router, "si_nusrat", "Nusrat@Duty2026!")

	// Query complaint by tracking code to get complaint_id
	reqList, _ := http.NewRequest("GET", fmt.Sprintf("/api/v1/complaints?search=%s", trackingCode), nil)
	reqList.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	wList := httptest.NewRecorder()
	router.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("Failed to retrieve complaint list as duty officer: %d", wList.Code)
	}

	var listResp struct {
		Success bool               `json:"success"`
		Data    []models.Complaint `json:"data"`
	}
	_ = json.Unmarshal(wList.Body.Bytes(), &listResp)
	if len(listResp.Data) == 0 {
		t.Fatalf("Expected complaint with tracking code %s, found none", trackingCode)
	}
	complaintID := listResp.Data[0].ComplaintID

	// Duty Officer assesses complaint to 'Under Review'
	assessPayload, _ := json.Marshal(models.AssessComplaintRequest{
		NewStatus:           "Under Review",
		Decision:            "Preliminary Desk Review",
		Reason:              "Allegations verify potential cognizable digital extortion syndicate.",
		PublicStatusMessage: "Complaint accepted for preliminary investigative assessment.",
	})
	reqAssess, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/complaints/%d/assess", complaintID), bytes.NewBuffer(assessPayload))
	reqAssess.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	reqAssess.Header.Set("Content-Type", "application/json")
	wAssess := httptest.NewRecorder()
	router.ServeHTTP(wAssess, reqAssess)

	if wAssess.Code != http.StatusOK {
		t.Fatalf("Failed to assess complaint: status %d: %s", wAssess.Code, wAssess.Body.String())
	}

	// Duty Officer advances assessment to 'Verified'
	verifyPayload, _ := json.Marshal(models.AssessComplaintRequest{
		NewStatus:           "Verified",
		Decision:            "Jurisdiction & Cognizability Confirmed",
		Reason:              "Recommended for First Information Report (FIR) registration.",
		PublicStatusMessage: "Complaint verified. Transmitted to Officer-in-Charge for formal FIR approval.",
	})
	reqVerify, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/complaints/%d/assess", complaintID), bytes.NewBuffer(verifyPayload))
	reqVerify.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	reqVerify.Header.Set("Content-Type", "application/json")
	wVerify := httptest.NewRecorder()
	router.ServeHTTP(wVerify, reqVerify)

	if wVerify.Code != http.StatusOK {
		t.Fatalf("Failed to verify complaint: status %d: %s", wVerify.Code, wVerify.Body.String())
	}

	// Verify status history contains transition records
	reqHistory, _ := http.NewRequest("GET", fmt.Sprintf("/api/v1/complaints/%d/history", complaintID), nil)
	reqHistory.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	wHistory := httptest.NewRecorder()
	router.ServeHTTP(wHistory, reqHistory)

	var historyResp struct {
		Success bool                            `json:"success"`
		Data    []models.ComplaintStatusHistory `json:"data"`
	}
	_ = json.Unmarshal(wHistory.Body.Bytes(), &historyResp)
	if len(historyResp.Data) < 3 {
		t.Errorf("Expected at least 3 status history entries (Submitted -> Under Review -> Verified), got %d", len(historyResp.Data))
	}

	// 5. Test Invalid Transition State Machine Rejection (409 Conflict)
	// Attempt illegal jump from Verified directly to Closed without formal resolution
	badAssess, _ := json.Marshal(models.AssessComplaintRequest{
		NewStatus: "Submitted", // Cannot revert backward from Verified to Submitted
		Decision:  "Illegal Rollback",
		Reason:    "Should be rejected by state machine",
	})
	reqBadAssess, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/complaints/%d/assess", complaintID), bytes.NewBuffer(badAssess))
	reqBadAssess.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	reqBadAssess.Header.Set("Content-Type", "application/json")
	wBadAssess := httptest.NewRecorder()
	router.ServeHTTP(wBadAssess, reqBadAssess)

	if wBadAssess.Code != http.StatusConflict {
		t.Fatalf("Expected 409 Conflict on invalid status transition, got %d", wBadAssess.Code)
	}

	fmt.Println("Phase 6 & Phase 7 Complaint Workflow and Sequence Generator Suite passed with 100% compliance!")
}

func TestGDFIRWorkflowAndConversions(t *testing.T) {
	router, _ := setupTestServer(t)

	oicToken := getUserToken(t, router, "insp_tariq", "Tariq@Invest2026!")
	dutyOfficerToken := getUserToken(t, router, "si_nusrat", "Nusrat@Duty2026!")
	publicToken := getUserToken(t, router, "complainant_rahim", "Rahim@Public2026!")

	// 1. Submit and verify a fresh complaint for GD conversion
	complaintReq, _ := json.Marshal(map[string]interface{}{
		"complainant_name":   "Jamal Hossain Fictional",
		"contact_phone":      "01719876543",
		"title":              "Lost Official Identification Document and Wallet",
		"description":        "Lost wallet containing university ID and national documents near Motijheel circle.",
		"incident_date":      "2026-08-10",
		"receiving_branch_id": 1,
	})
	reqPub, _ := http.NewRequest("POST", "/api/v1/public/complaints", bytes.NewBuffer(complaintReq))
	reqPub.Header.Set("Content-Type", "application/json")
	wPub := httptest.NewRecorder()
	router.ServeHTTP(wPub, reqPub)
	if wPub.Code != http.StatusCreated {
		t.Fatalf("Failed to submit public complaint: %d - %s", wPub.Code, wPub.Body.String())
	}
	var pubResp struct {
		Data struct {
			TrackingCode string `json:"tracking_code"`
		} `json:"data"`
	}
	_ = json.Unmarshal(wPub.Body.Bytes(), &pubResp)

	// Fetch complaint ID
	reqList, _ := http.NewRequest("GET", "/api/v1/complaints?search="+pubResp.Data.TrackingCode, nil)
	reqList.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	wList := httptest.NewRecorder()
	router.ServeHTTP(wList, reqList)
	var listResp struct {
		Data []models.Complaint `json:"data"`
	}
	_ = json.Unmarshal(wList.Body.Bytes(), &listResp)
	if len(listResp.Data) == 0 {
		t.Fatalf("Could not locate created complaint by tracking code %s", pubResp.Data.TrackingCode)
	}
	complaintID := listResp.Data[0].ComplaintID

	// 2. Convert Complaint to GD via OIC
	convertGDReq, _ := json.Marshal(models.ConvertComplaintToGDRequest{
		Subject:       "Lost Official Identification and Wallet at Motijheel",
		IncidentPlace: "Motijheel Commercial Area, Dhaka",
	})
	reqConvGD, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/complaints/%d/convert-gd", complaintID), bytes.NewBuffer(convertGDReq))
	reqConvGD.Header.Set("Authorization", "Bearer "+oicToken)
	reqConvGD.Header.Set("Content-Type", "application/json")
	wConvGD := httptest.NewRecorder()
	router.ServeHTTP(wConvGD, reqConvGD)

	if wConvGD.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created on ConvertComplaintToGD, got %d: %s", wConvGD.Code, wConvGD.Body.String())
	}

	var gdResp struct {
		Data models.GD `json:"data"`
	}
	_ = json.Unmarshal(wConvGD.Body.Bytes(), &gdResp)
	gdID := gdResp.Data.GDID

	if !strings.HasPrefix(gdResp.Data.GDNumber, "GD-") {
		t.Errorf("Expected GD number starting with GD-, got: %s", gdResp.Data.GDNumber)
	}
	if gdResp.Data.CurrentStatus != "Approved" {
		t.Errorf("Expected GD status Approved, got: %s", gdResp.Data.CurrentStatus)
	}

	// Verify GD Status History exists
	reqGDHist, _ := http.NewRequest("GET", fmt.Sprintf("/api/v1/gds/%d/history", gdID), nil)
	reqGDHist.Header.Set("Authorization", "Bearer "+dutyOfficerToken)
	wGDHist := httptest.NewRecorder()
	router.ServeHTTP(wGDHist, reqGDHist)
	if wGDHist.Code != http.StatusOK {
		t.Fatalf("Failed to fetch GD status history: %d", wGDHist.Code)
	}

	// 3. Link GD to FIR (Escalation)
	linkReq, _ := json.Marshal(models.LinkGDToFIRRequest{
		CrimeCategory:     "Organized Identity Theft",
		PlaceOfOccurrence: "Motijheel, Dhaka",
		SectionIDs:        []uint{1},
	})
	reqLink, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/gds/%d/link-fir", gdID), bytes.NewBuffer(linkReq))
	reqLink.Header.Set("Authorization", "Bearer "+oicToken)
	reqLink.Header.Set("Content-Type", "application/json")
	wLink := httptest.NewRecorder()
	router.ServeHTTP(wLink, reqLink)

	if wLink.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created on LinkGDToFIR, got %d: %s", wLink.Code, wLink.Body.String())
	}

	var firResp struct {
		Data models.FIR `json:"data"`
	}
	_ = json.Unmarshal(wLink.Body.Bytes(), &firResp)
	firID := firResp.Data.FIRID

	if !strings.HasPrefix(firResp.Data.FIRNumber, "FIR-") {
		t.Errorf("Expected FIR number starting with FIR-, got: %s", firResp.Data.FIRNumber)
	}
	if firResp.Data.SourceType != "From GD" {
		t.Errorf("Expected SourceType 'From GD', got: %s", firResp.Data.SourceType)
	}

	// 4. Test FIR State Machine Transition (Allowed vs Rejected)
	updateFIRReq, _ := json.Marshal(models.UpdateFIRStatusRequest{
		NewStatus: "Investigation Pending",
		Decision:  "FIR Registered and Scheduled for Investigation Assignment",
		Reason:    "Prima facie case established under penal section.",
	})
	reqUpFIR, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/firs/%d/status", firID), bytes.NewBuffer(updateFIRReq))
	reqUpFIR.Header.Set("Authorization", "Bearer "+oicToken)
	reqUpFIR.Header.Set("Content-Type", "application/json")
	wUpFIR := httptest.NewRecorder()
	router.ServeHTTP(wUpFIR, reqUpFIR)

	if wUpFIR.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK updating FIR status, got %d: %s", wUpFIR.Code, wUpFIR.Body.String())
	}

	// Attempt illegal jump from 'Investigation Pending' to 'Archived' (illegal jump -> 409 Conflict)
	illegalFIRReq, _ := json.Marshal(models.UpdateFIRStatusRequest{
		NewStatus: "Archived",
		Decision:  "Premature Archival",
		Reason:    "Should be rejected by state machine.",
	})
	reqIllegal, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/firs/%d/status", firID), bytes.NewBuffer(illegalFIRReq))
	reqIllegal.Header.Set("Authorization", "Bearer "+oicToken)
	reqIllegal.Header.Set("Content-Type", "application/json")
	wIllegal := httptest.NewRecorder()
	router.ServeHTTP(wIllegal, reqIllegal)

	if wIllegal.Code != http.StatusConflict {
		t.Fatalf("Expected 409 Conflict on illegal FIR status jump, got %d", wIllegal.Code)
	}

	// 5. Negative Authorization Test: Public Complainant cannot convert complaints to FIR
	reqUnauth, _ := http.NewRequest("POST", fmt.Sprintf("/api/v1/complaints/%d/convert-fir", complaintID), nil)
	reqUnauth.Header.Set("Authorization", "Bearer "+publicToken)
	wUnauth := httptest.NewRecorder()
	router.ServeHTTP(wUnauth, reqUnauth)

	if wUnauth.Code != http.StatusForbidden {
		t.Fatalf("Expected 403 Forbidden for Public Complainant attempting FIR conversion, got %d", wUnauth.Code)
	}

	fmt.Println("Phase 8 GD & FIR Workflows, Immutability & State Machine Suite passed with 100% compliance!")
}



