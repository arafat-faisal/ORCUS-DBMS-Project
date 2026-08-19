package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

func setupTestApp(t *testing.T) (*Handler, string) {
	dsn := "root:@tcp(127.0.0.1:3306)/orcus_db?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		t.Skipf("Skipping test; local MySQL connection failed: %v", err)
	}

	jwtSecret := "test-secret-key-123"
	repo := NewRepository(db)
	service := NewService(repo, jwtSecret)
	handler := NewHandler(service)

	return handler, jwtSecret
}

func TestAuthLoginAndGetMe(t *testing.T) {
	handler, jwtSecret := setupTestApp(t)
	router := handler.SetupRouter(jwtSecret)

	// Step 1: Test Login
	loginBody := LoginRequest{
		Username: "admin_faisal",
		Password: "password123",
	}
	bodyBytes, _ := json.Marshal(loginBody)

	req, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on login, got %d. Body: %s", w.Code, w.Body.String())
	}

	var loginResp struct {
		Success bool `json:"success"`
		Data    struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("Failed to parse login response: %v", err)
	}

	if loginResp.Data.Token == "" {
		t.Fatalf("Expected non-empty JWT token in login response")
	}

	token := loginResp.Data.Token

	// Step 2: Test GetMe with JWT
	reqMe, _ := http.NewRequest("GET", "/api/v1/auth/me", nil)
	reqMe.Header.Set("Authorization", "Bearer "+token)
	wMe := httptest.NewRecorder()
	router.ServeHTTP(wMe, reqMe)

	if wMe.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on /auth/me, got %d. Body: %s", wMe.Code, wMe.Body.String())
	}
}

func TestListBranchesAndOfficers(t *testing.T) {
	handler, jwtSecret := setupTestApp(t)
	router := handler.SetupRouter(jwtSecret)

	// Obtain token
	loginBody, _ := json.Marshal(LoginRequest{Username: "admin_faisal", Password: "password123"})
	reqLog, _ := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(loginBody))
	reqLog.Header.Set("Content-Type", "application/json")
	wLog := httptest.NewRecorder()
	router.ServeHTTP(wLog, reqLog)

	var loginResp struct {
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	_ = json.Unmarshal(wLog.Body.Bytes(), &loginResp)
	token := loginResp.Data.Token

	// Test Branches
	reqBranch, _ := http.NewRequest("GET", "/api/v1/branches", nil)
	reqBranch.Header.Set("Authorization", "Bearer "+token)
	wBranch := httptest.NewRecorder()
	router.ServeHTTP(wBranch, reqBranch)

	if wBranch.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /branches, got %d", wBranch.Code)
	}

	// Test Officers
	reqOfficer, _ := http.NewRequest("GET", "/api/v1/officers", nil)
	reqOfficer.Header.Set("Authorization", "Bearer "+token)
	wOfficer := httptest.NewRecorder()
	router.ServeHTTP(wOfficer, reqOfficer)

	if wOfficer.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /officers, got %d", wOfficer.Code)
	}

	// Test Caseload View
	reqCaseload, _ := http.NewRequest("GET", "/api/v1/officers/caseload", nil)
	reqCaseload.Header.Set("Authorization", "Bearer "+token)
	wCaseload := httptest.NewRecorder()
	router.ServeHTTP(wCaseload, reqCaseload)

	if wCaseload.Code != http.StatusOK {
		t.Fatalf("Expected 200 on /officers/caseload, got %d", wCaseload.Code)
	}
}
