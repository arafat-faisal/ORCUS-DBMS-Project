// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Integration Layer]
// File: backend/internal/handler/router.go
// Purpose: Master routing registration linking all three module controllers to Gin.
//
// MODULE BREAKDOWN & OWNERSHIP:
// 1. Organization & Auth (/auth, /branches, /officers, /roles)
//    - Raw Work Owner: Md. Arafat Hossain Faisal (241400060)
// 2. Investigation Intake & Cases (/complainants, /gds, /firs, /legal-sections, /cases)
//    - Raw Work Owner: A.K. Md. Shakil Hossain (241400043)
// 3. Participants, Location & Evidence (/suspects, /victims, /witnesses, /locations, /evidence)
//    - Raw Work Owner: Ayshee Islam Liza (241400045)
// ============================================================================

package handler

import (
	"orcus-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

type RouterParams struct {
	JWTSecret      string
	AuthHandler    *AuthHandler
	OrgHandler     *OrganizationHandler
	IntakeHandler  *IntakeHandler
	CaseHandler    *CaseHandler
	PartHandler    *ParticipantHandler
	LocHandler     *LocationHandler
	EvidHandler    *EvidenceHandler
	AnalytHandler  *AnalyticsHandler
}

func SetupMasterRouter(p *RouterParams) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), middleware.LoggerMiddleware(), middleware.CORSMiddleware())

	api := r.Group("/api/v1")
	{
		// ====================================================================
		// Public Endpoints
		// ====================================================================
		api.POST("/auth/login", p.AuthHandler.Login)

		// ====================================================================
		// Protected Endpoints (Require valid JWT)
		// ====================================================================
		protected := api.Group("")
		protected.Use(middleware.JWTAuthMiddleware(p.JWTSecret))
		{
			// ----------------------------------------------------------------
			// Module 1: Organization & Access Control (Faisal)
			// ----------------------------------------------------------------
			protected.GET("/auth/me", p.AuthHandler.GetMe)
			protected.POST("/auth/register", middleware.RequireRoles("Administrator"), p.AuthHandler.RegisterUser)
			protected.GET("/roles", p.AuthHandler.ListRoles)

			protected.GET("/branches", p.OrgHandler.ListBranches)
			protected.GET("/branches/:id", p.OrgHandler.GetBranch)
			protected.POST("/branches", middleware.RequireRoles("Administrator"), p.OrgHandler.CreateBranch)

			protected.GET("/officers", p.OrgHandler.ListOfficers)
			protected.GET("/officers/caseload", p.OrgHandler.GetOfficerCaseload)
			protected.GET("/officers/:id", p.OrgHandler.GetOfficer)
			protected.POST("/officers", middleware.RequireRoles("Administrator"), p.OrgHandler.CreateOfficer)

			// ----------------------------------------------------------------
			// Module 2: Investigation Intake & Cases (Shakil)
			// ----------------------------------------------------------------
			protected.GET("/complainants", p.IntakeHandler.ListComplainants)
			protected.GET("/complainants/:id", p.IntakeHandler.GetComplainant)
			protected.POST("/complainants", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.IntakeHandler.CreateComplainant)

			protected.GET("/gds", p.IntakeHandler.ListGDs)
			protected.GET("/gds/:id", p.IntakeHandler.GetGD)
			protected.POST("/gds", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.IntakeHandler.CreateGD)

			protected.GET("/firs", p.IntakeHandler.ListFIRs)
			protected.GET("/firs/:id", p.IntakeHandler.GetFIR)
			protected.POST("/firs", middleware.RequireRoles("Lead Investigator", "Administrator"), p.IntakeHandler.CreateFIR)
			protected.GET("/legal-sections", p.IntakeHandler.ListLegalSections)

			protected.GET("/cases", p.CaseHandler.SearchCases)
			protected.GET("/cases/:id", p.CaseHandler.GetCaseDossier)
			protected.POST("/cases", middleware.RequireRoles("Lead Investigator", "Administrator"), p.CaseHandler.OpenCase)
			protected.PUT("/cases/:id/status", middleware.RequireRoles("Lead Investigator", "Administrator"), p.CaseHandler.UpdateCaseStatus)
			protected.GET("/cases/:id/history", p.CaseHandler.GetCaseHistory)

			// ----------------------------------------------------------------
			// Module 3: Participants, Location & Evidence (Liza)
			// ----------------------------------------------------------------
			protected.GET("/suspects", p.PartHandler.ListSuspects)
			protected.GET("/suspects/:id", p.PartHandler.GetSuspect)
			protected.GET("/suspects/:id/dossier", p.PartHandler.GetSuspectDossier)
			protected.POST("/suspects", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.PartHandler.CreateSuspect)

			protected.GET("/victims", p.PartHandler.ListVictims)
			protected.POST("/victims", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.PartHandler.CreateVictim)

			protected.GET("/witnesses", p.PartHandler.ListWitnesses)
			protected.POST("/witnesses", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.PartHandler.CreateWitness)

			// Case-Participant Linking
			protected.POST("/cases/:id/suspects", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.PartHandler.LinkSuspectToCase)
			protected.POST("/cases/:id/victims", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.PartHandler.LinkVictimToCase)
			protected.POST("/cases/:id/witnesses", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.PartHandler.LinkWitnessToCase)
			protected.POST("/cases/:id/locations", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.LocHandler.LinkLocationToCase)

			// Locations
			protected.GET("/locations", p.LocHandler.ListLocations)
			protected.POST("/locations", middleware.RequireRoles("Field Detective", "Lead Investigator", "Administrator"), p.LocHandler.CreateLocation)

			// Evidence & Chain of Custody
			protected.GET("/evidence", p.EvidHandler.ListEvidence)
			protected.GET("/evidence/:id", p.EvidHandler.GetEvidence)
			protected.POST("/evidence", middleware.RequireRoles("Forensic Specialist", "Lead Investigator", "Administrator"), p.EvidHandler.CreateEvidence)
			protected.PUT("/evidence/:id/status", middleware.RequireRoles("Forensic Specialist", "Lead Investigator", "Administrator"), p.EvidHandler.UpdateEvidenceStatus)
			protected.GET("/evidence/:id/chain", p.EvidHandler.GetEvidenceChainOfCustody)

			// ----------------------------------------------------------------
			// Analytics & Views (Unified Dashboard)
			// ----------------------------------------------------------------
			protected.GET("/analytics/overview", p.AnalytHandler.GetDashboardOverview)
			protected.GET("/analytics/pipeline", p.AnalytHandler.GetCasePipeline)
		}
	}

	return r
}
