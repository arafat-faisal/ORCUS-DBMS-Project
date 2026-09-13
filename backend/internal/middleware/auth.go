// ============================================================================
// File: backend/internal/middleware/auth.go
// Purpose: JWT authentication middleware extracting tokens from HTTP-only cookies or Bearer headers.
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
	ContextUserID    = "user_id"
	ContextUsername  = "username"
	ContextRoles     = "roles"
	ContextBranchID  = "branch_id"
	ContextRequestID = "request_id"
	AuthCookieName   = "orcus_auth_token"
)

// JWTAuthMiddleware verifies tokens from HTTP-only cookie or Bearer Authorization header
func JWTAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		// 1. Try to read from HTTP-only cookie first (Primary secure browser storage)
		if cookieVal, err := c.Cookie(AuthCookieName); err == nil && cookieVal != "" {
			tokenStr = cookieVal
		}

		// 2. Fallback to Authorization Bearer header (For API clients and automated tests)
		if tokenStr == "" {
			authHeader := c.GetHeader("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
					tokenStr = strings.TrimSpace(parts[1])
				}
			}
		}

		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, models.StandardResponse{
				Success: false,
				Error:   "Authentication required. No valid session cookie or Authorization header found.",
			})
			c.Abort()
			return
		}

		// 3. Parse and validate HMAC-SHA256 JWT
		token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing algorithm: %v", token.Header["alg"])
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.StandardResponse{
				Success: false,
				Error:   "Invalid or expired authentication session. Please sign in again.",
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
