// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/middleware/rbac.go
// Purpose: Variadic Role-Based Access Control (RBAC) middleware verifying authorized roles.
//
// [INTEGRATION NOTE]: Used across all 3 modules to protect endpoints according to
// user roles (Administrator, Lead Investigator, Field Detective, Forensic Specialist, System Auditor).
// ============================================================================

package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"orcus-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// RequireRoles checks if the authenticated user has at least one of the required roles
func RequireRoles(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(ContextRoles)
		if !exists {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: No user roles present in context",
			})
			c.Abort()
			return
		}

		userRoles, ok := val.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: Invalid roles format in context",
			})
			c.Abort()
			return
		}

		// Administrator role automatically satisfies all permission checks
		hasAccess := false
		for _, uRole := range userRoles {
			if uRole == "Administrator" {
				hasAccess = true
				break
			}
			for _, reqRole := range requiredRoles {
				if uRole == reqRole {
					hasAccess = true
					break
				}
			}
			if hasAccess {
				break
			}
		}

		if !hasAccess {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   fmt.Sprintf("Access denied. Authorized role(s): %s", strings.Join(requiredRoles, " or ")),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
