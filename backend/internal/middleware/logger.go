// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/middleware/logger.go
// Purpose: Request and latency logging middleware.
// ============================================================================

package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader("X-Request-ID")
		if reqID == "" {
			b := make([]byte, 12)
			_, _ = rand.Read(b)
			reqID = hex.EncodeToString(b)
		}
		c.Set(ContextRequestID, reqID)
		c.Header("X-Request-ID", reqID)

		start := time.Now()
		c.Next()
		latency := time.Since(start)
		status := c.Writer.Status()
		fmt.Printf("[%s] [%s] %-6s %-30s -> %3d (%v)\n",
			time.Now().Format("2006-01-02 15:04:05"),
			reqID[:8],
			c.Request.Method,
			c.Request.URL.Path,
			status,
			latency,
		)
	}
}
