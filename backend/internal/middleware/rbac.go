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

	"orcus-backend/internal/auth"
	"orcus-backend/internal/models"

	"github.com/gin-gonic/gin"
)

// RequireRoles checks if the authenticated user has at least one of the specified roles
func RequireRoles(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(ContextRoles)
		if !exists {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: No user roles present in session context",
			})
			c.Abort()
			return
		}

		userRoles, ok := val.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: Invalid roles format in session context",
			})
			c.Abort()
			return
		}

		if !auth.HasAnyRole(userRoles, requiredRoles...) {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   fmt.Sprintf("Access denied. Required role(s): %s", strings.Join(requiredRoles, ", ")),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission checks if the authenticated user possesses the specified atomic permission
func RequirePermission(requiredPerm auth.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(ContextRoles)
		if !exists {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: No user authorization context present",
			})
			c.Abort()
			return
		}

		userRoles, ok := val.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: Invalid authorization format",
			})
			c.Abort()
			return
		}

		if !auth.HasPermission(userRoles, requiredPerm) {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   fmt.Sprintf("Access denied: Insufficient privilege for action '%s'", requiredPerm),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission checks if user possesses at least one of the listed permissions
func RequireAnyPermission(requiredPerms ...auth.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(ContextRoles)
		if !exists {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: No authorization context",
			})
			c.Abort()
			return
		}

		userRoles, ok := val.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: Invalid roles format",
			})
			c.Abort()
			return
		}

		hasPerm := false
		for _, p := range requiredPerms {
			if auth.HasPermission(userRoles, p) {
				hasPerm = true
				break
			}
		}

		if !hasPerm {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access denied: Missing required authorization privilege",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireNotRoles blocks any user possessing any of the forbidden roles
func RequireNotRoles(forbiddenRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(ContextRoles)
		if !exists {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: No authorization context",
			})
			c.Abort()
			return
		}

		userRoles, ok := val.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, models.StandardResponse{
				Success: false,
				Error:   "Access forbidden: Invalid roles format",
			})
			c.Abort()
			return
		}

		for _, ur := range userRoles {
			for _, fr := range forbiddenRoles {
				if ur == fr {
					c.JSON(http.StatusForbidden, models.StandardResponse{
						Success: false,
						Error:   "Access denied: This portal is restricted to authorized department personnel only",
					})
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}
