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
	"net/http"
	"os"
	"path/filepath"

	"orcus-backend/internal/auth"
	"orcus-backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

type RouterParams struct {
	JWTSecret      string
	AllowedOrigins []string
	AuthHandler    *AuthHandler
	OrgHandler     *OrganizationHandler
	IntakeHandler  *IntakeHandler
	CaseHandler    *CaseHandler
	PartHandler    *ParticipantHandler
	LocHandler     *LocationHandler
	EvidHandler    *EvidenceHandler
	AnalytHandler  *AnalyticsHandler
	AuditHandler     *AuditHandler
	GeoHandler       *GeographyHandler
	ComplaintHandler *ComplaintHandler
}

func SetupMasterRouter(p *RouterParams) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery(), middleware.LoggerMiddleware(), middleware.CORSMiddleware(p.AllowedOrigins))

	// Locate and serve static testing frontend dashboard safely
	staticDir := "./test-frontend"
	if _, err := os.Stat(staticDir); os.IsNotExist(err) {
		if _, err := os.Stat("../test-frontend"); err == nil {
			staticDir = "../test-frontend"
		}
	}

	indexFile := filepath.Join(staticDir, "index.html")
	if _, err := os.Stat(indexFile); err == nil {
		r.StaticFile("/", indexFile)
		r.StaticFile("/index.html", indexFile)
		r.StaticFile("/styles.css", filepath.Join(staticDir, "styles.css"))
		r.StaticFile("/app.js", filepath.Join(staticDir, "app.js"))
		r.Static("/assets", filepath.Join(staticDir, "assets"))
		r.Static("/ui", staticDir)
		r.Static("/static", staticDir)
	}

	api := r.Group("/api/v1")
	{
		// ====================================================================
		// Public Endpoints
		// ====================================================================
		api.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "orcus-backend"})
		})
		api.POST("/auth/login", p.AuthHandler.Login)
		api.POST("/auth/logout", p.AuthHandler.Logout)

		// Bangladesh Geographic Hierarchy
		api.GET("/geo/divisions", p.GeoHandler.ListDivisions)
		api.GET("/geo/districts", p.GeoHandler.ListDistricts)
		api.GET("/geo/upazilas", p.GeoHandler.ListUpazilas)
		api.GET("/geo/thanas", p.GeoHandler.ListThanas)

		// Public Citizen Complaint Intake & Tracking
		api.GET("/complaint-categories", p.ComplaintHandler.GetCategories)
		api.POST("/public/complaints", p.ComplaintHandler.PublicSubmitComplaint)
		api.GET("/public/complaints/track", p.ComplaintHandler.PublicTrackComplaint)

		// ====================================================================
		// Protected Endpoints (Require valid session cookie or Bearer token)
		// ====================================================================
		protected := api.Group("")
		protected.Use(middleware.JWTAuthMiddleware(p.JWTSecret))
		{
			// Session & Access
			protected.GET("/auth/me", p.AuthHandler.GetMe)
			protected.POST("/auth/register", middleware.RequirePermission(auth.PermManageUsers), p.AuthHandler.RegisterUser)
			protected.GET("/roles", p.AuthHandler.ListRoles)
			protected.GET("/admin/audit-logs", middleware.RequirePermission(auth.PermViewAuditLogs), p.AuditHandler.ListAuditLogs)

			// Internal Operational Group (Forbidden to Public Complainants)
			ops := protected.Group("")
			ops.Use(middleware.RequireNotRoles("Public Complainant"))
			{
				ops.GET("/branches", p.OrgHandler.ListBranches)
				ops.GET("/branches/:id", p.OrgHandler.GetBranch)
				ops.POST("/branches", middleware.RequirePermission(auth.PermManageSystem), p.OrgHandler.CreateBranch)

				ops.GET("/officers", p.OrgHandler.ListOfficers)
				ops.GET("/officers/caseload", p.OrgHandler.GetOfficerCaseload)
				ops.GET("/officers/:id", p.OrgHandler.GetOfficer)
				ops.POST("/officers", middleware.RequirePermission(auth.PermManageUsers), p.OrgHandler.CreateOfficer)

				// ----------------------------------------------------------------
				// Complaints Intake & Assessment Workflow
				// ----------------------------------------------------------------
				ops.GET("/complaints", p.ComplaintHandler.ListComplaints)
				ops.POST("/complaints", middleware.RequirePermission(auth.PermIntakeComplaint), p.ComplaintHandler.CreateOfficerComplaint)
				ops.GET("/complaints/:id", p.ComplaintHandler.GetComplaint)
				ops.POST("/complaints/:id/assess", middleware.RequirePermission(auth.PermAssessComplaint), p.ComplaintHandler.AssessComplaint)
				ops.POST("/complaints/:id/transfer", middleware.RequireAnyPermission(auth.PermAssessComplaint, auth.PermApproveIntake), p.ComplaintHandler.TransferComplaint)
				ops.GET("/complaints/:id/history", p.ComplaintHandler.GetStatusHistory)
				ops.GET("/complaints/:id/transfers", p.ComplaintHandler.GetTransferHistory)

				// ----------------------------------------------------------------
				// Module 2: Investigation Intake & Cases
				// ----------------------------------------------------------------
				ops.GET("/complainants", p.IntakeHandler.ListComplainants)
				ops.GET("/complainants/:id", p.IntakeHandler.GetComplainant)
				ops.POST("/complainants", middleware.RequireAnyPermission(auth.PermIntakeComplaint, auth.PermInvestigateCase), p.IntakeHandler.CreateComplainant)

				// Complaint Conversions
				ops.POST("/complaints/:id/convert-gd", middleware.RequireAnyPermission(auth.PermIntakeComplaint, auth.PermApproveIntake), p.IntakeHandler.ConvertComplaintToGD)
				ops.POST("/complaints/:id/convert-fir", middleware.RequirePermission(auth.PermApproveIntake), p.IntakeHandler.ConvertComplaintToFIR)

				// General Diary (GD)
				ops.GET("/gds", p.IntakeHandler.ListGDs)
				ops.GET("/gds/:id", p.IntakeHandler.GetGD)
				ops.GET("/gds/:id/history", p.IntakeHandler.GetGDHistory)
				ops.POST("/gds", middleware.RequireAnyPermission(auth.PermIntakeComplaint, auth.PermInvestigateCase), p.IntakeHandler.CreateGD)
				ops.POST("/gds/:id/status", middleware.RequireAnyPermission(auth.PermApproveIntake, auth.PermSuperviseCase), p.IntakeHandler.UpdateGDStatus)
				ops.POST("/gds/:id/link-fir", middleware.RequirePermission(auth.PermApproveIntake), p.IntakeHandler.LinkGDToFIR)

				// FIR & Legal Sections
				ops.GET("/firs", p.IntakeHandler.ListFIRs)
				ops.GET("/firs/:id", p.IntakeHandler.GetFIR)
				ops.GET("/firs/:id/history", p.IntakeHandler.GetFIRHistory)
				ops.POST("/firs", middleware.RequirePermission(auth.PermApproveIntake), p.IntakeHandler.CreateFIR)
				ops.POST("/firs/:id/status", middleware.RequireAnyPermission(auth.PermApproveIntake, auth.PermSuperviseCase), p.IntakeHandler.UpdateFIRStatus)
				ops.GET("/legal-sections", p.IntakeHandler.ListLegalSections)

				ops.GET("/cases", p.CaseHandler.SearchCases)
				ops.GET("/cases/:id", p.CaseHandler.GetCaseDossier)
				ops.POST("/cases", middleware.RequirePermission(auth.PermManageCases), p.CaseHandler.OpenCase)
				ops.PUT("/cases/:id/status", middleware.RequireAnyPermission(auth.PermManageCases, auth.PermSuperviseCase), p.CaseHandler.UpdateCaseStatus)
				ops.GET("/cases/:id/history", p.CaseHandler.GetCaseHistory)

				// ----------------------------------------------------------------
				// Module 3: Participants, Location & Evidence
				// ----------------------------------------------------------------
				ops.GET("/suspects", p.PartHandler.ListSuspects)
				ops.GET("/suspects/:id", p.PartHandler.GetSuspect)
				ops.GET("/suspects/:id/dossier", p.PartHandler.GetSuspectDossier)
				ops.POST("/suspects", middleware.RequirePermission(auth.PermInvestigateCase), p.PartHandler.CreateSuspect)

				ops.GET("/victims", p.PartHandler.ListVictims)
				ops.POST("/victims", middleware.RequirePermission(auth.PermInvestigateCase), p.PartHandler.CreateVictim)

				ops.GET("/witnesses", p.PartHandler.ListWitnesses)
				ops.POST("/witnesses", middleware.RequirePermission(auth.PermInvestigateCase), p.PartHandler.CreateWitness)

				// Case-Participant Linking
				ops.POST("/cases/:id/suspects", middleware.RequirePermission(auth.PermInvestigateCase), p.PartHandler.LinkSuspectToCase)
				ops.POST("/cases/:id/victims", middleware.RequirePermission(auth.PermInvestigateCase), p.PartHandler.LinkVictimToCase)
				ops.POST("/cases/:id/witnesses", middleware.RequirePermission(auth.PermInvestigateCase), p.PartHandler.LinkWitnessToCase)
				ops.POST("/cases/:id/locations", middleware.RequirePermission(auth.PermInvestigateCase), p.LocHandler.LinkLocationToCase)

				// Locations
				ops.GET("/locations", p.LocHandler.ListLocations)
				ops.POST("/locations", middleware.RequirePermission(auth.PermInvestigateCase), p.LocHandler.CreateLocation)

				// Evidence & Chain of Custody
				ops.GET("/evidence", p.EvidHandler.ListEvidence)
				ops.GET("/evidence/:id", p.EvidHandler.GetEvidence)
				ops.POST("/evidence", middleware.RequirePermission(auth.PermManageEvidence), p.EvidHandler.CreateEvidence)
				ops.PUT("/evidence/:id/status", middleware.RequirePermission(auth.PermManageEvidence), p.EvidHandler.UpdateEvidenceStatus)
				ops.GET("/evidence/:id/chain", p.EvidHandler.GetEvidenceChainOfCustody)

				// ----------------------------------------------------------------
				// Analytics & Views (Unified Dashboard)
				// ----------------------------------------------------------------
				ops.GET("/analytics/overview", p.AnalytHandler.GetDashboardOverview)
				ops.GET("/analytics/pipeline", p.AnalytHandler.GetCasePipeline)
			}
		}
	}

	return r
}
