// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/middleware/auth.go
// Purpose: JWT authentication middleware extracting token claims and injecting into Gin context.
// ============================================================================

package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"orcus-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserID   = "user_id"
	ContextUsername = "username"
	ContextRoles    = "roles"
)

// JWTAuthMiddleware verifies Bearer tokens and extracts user claims into Gin context
func JWTAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, models.StandardResponse{
				Success: false,
				Error:   "Authorization header is required (Format: 'Bearer <token>')",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && strings.ToLower(parts[0]) == "bearer") {
			c.JSON(http.StatusUnauthorized, models.StandardResponse{
				Success: false,
				Error:   "Invalid authorization header format. Expected 'Bearer <token>'",
			})
			c.Abort()
			return
		}

		tokenStr := parts[1]
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.StandardResponse{
				Success: false,
				Error:   "Invalid or expired authorization token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, models.StandardResponse{
				Success: false,
				Error:   "Invalid token claims structure",
			})
			c.Abort()
			return
		}

		// Inject user_id
		if uid, ok := claims["user_id"].(float64); ok {
			c.Set(ContextUserID, uint(uid))
		}
		// Inject username
		if uname, ok := claims["username"].(string); ok {
			c.Set(ContextUsername, uname)
		}

		// Inject roles slice
		var roles []string
		if rawRoles, ok := claims["roles"].([]interface{}); ok {
			for _, r := range rawRoles {
				if rStr, ok := r.(string); ok {
					roles = append(roles, rStr)
				}
			}
		}
		c.Set(ContextRoles, roles)

		c.Next()
	}
}
