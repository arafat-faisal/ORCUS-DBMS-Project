// ============================================================================
// File: backend/internal/middleware/cors.go
// Purpose: Secure Cross-Origin Resource Sharing (CORS) with explicit origin allowlist.
// ============================================================================

package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware restricts cross-origin requests to explicit approved frontend domains
func CORSMiddleware(allowedOrigins []string) gin.HandlerFunc {
	originMap := make(map[string]bool)
	for _, o := range allowedOrigins {
		originMap[strings.TrimSpace(strings.ToLower(o))] = true
	}

	return func(c *gin.Context) {
		reqOrigin := c.GetHeader("Origin")
		normalizedOrigin := strings.TrimSpace(strings.ToLower(reqOrigin))

		// If Origin header is present, check against allowlist
		if reqOrigin != "" {
			if originMap[normalizedOrigin] {
				c.Writer.Header().Set("Access-Control-Allow-Origin", reqOrigin)
				c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
				c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
				c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
				c.Writer.Header().Set("Vary", "Origin")
			} else if c.Request.Method == "OPTIONS" {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
