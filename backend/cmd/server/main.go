// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Server Entrypoint]
// File: backend/cmd/server/main.go
// Purpose: Master server entry point for the ORCUS Police Investigation Management System.
//
// MODULE OWNERSHIP & CREDITS:
//   - Module 1 (Organization & Access Control): Md. Arafat Hossain Faisal (241400060)
//   - Module 2 (Investigation Intake & Cases): A.K. Md. Shakil Hossain (241400043)
//   - Module 3 (Participants, Location & Evidence): Ayshee Islam Liza (241400045)
// ============================================================================

package main

import (
	"log"

	"orcus-backend/internal/config"
	"orcus-backend/internal/database"
	"orcus-backend/internal/handler"
	"orcus-backend/internal/repository"
	"orcus-backend/internal/service"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("====================================================================")
	log.Println(" ORCUS - Police Investigation & Case Tracking System Backend")
	log.Println(" DBMS Laboratory Project - Summer 2026")
	log.Println(" Authors: Faisal (241400060), Shakil (241400043), Liza (241400045)")
	log.Println("====================================================================")

	// 1. Load Configuration
	cfg := config.LoadConfig()
	gin.SetMode(cfg.GinMode)

	// 2. Connect to MySQL Database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer db.Close()

	// 3. Initialize Repositories
	authRepo := repository.NewAuthRepository(db.DB)
	orgRepo := repository.NewOrganizationRepository(db.DB)
	intakeRepo := repository.NewIntakeRepository(db.DB)
	caseRepo := repository.NewCaseRepository(db.DB)
	partRepo := repository.NewParticipantRepository(db.DB)
	evidRepo := repository.NewEvidenceRepository(db.DB)
	analytRepo := repository.NewAnalyticsRepository(db.DB)

	// 4. Initialize Services
	authService := service.NewAuthService(authRepo, cfg.JWTSecret)
	orgService := service.NewOrganizationService(orgRepo)
	intakeService := service.NewIntakeService(intakeRepo)
	caseService := service.NewCaseService(caseRepo, partRepo, evidRepo)
	partService := service.NewParticipantService(partRepo)
	evidService := service.NewEvidenceService(evidRepo)
	analytService := service.NewAnalyticsService(analytRepo)

	// 5. Initialize Handlers
	authHandler := handler.NewAuthHandler(authService)
	orgHandler := handler.NewOrganizationHandler(orgService)
	intakeHandler := handler.NewIntakeHandler(intakeService)
	caseHandler := handler.NewCaseHandler(caseService)
	partHandler := handler.NewParticipantHandler(partService)
	locHandler := handler.NewLocationHandler(partService)
	evidHandler := handler.NewEvidenceHandler(evidService)
	analytHandler := handler.NewAnalyticsHandler(analytService)

	// 6. Setup Master Router
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

	log.Printf("ORCUS API Server listening on http://localhost:%s/api/v1", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Fatal: Server failed to start: %v", err)
	}
}
