package main

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	ContextUserID   = "user_id"
	ContextUsername = "username"
	ContextRoles    = "roles"
)

// JWTAuthMiddleware verifies Bearer tokens and injects user claims into Gin context
func JWTAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, StandardResponse{
				Success: false,
				Error:   "Authorization header is required",
			})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && strings.ToLower(parts[0]) == "bearer") {
			c.JSON(http.StatusUnauthorized, StandardResponse{
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
			c.JSON(http.StatusUnauthorized, StandardResponse{
				Success: false,
				Error:   "Invalid or expired authorization token",
			})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, StandardResponse{
				Success: false,
				Error:   "Invalid token claims",
			})
			c.Abort()
			return
		}

		// Extract claims
		if uid, ok := claims["user_id"].(float64); ok {
			c.Set(ContextUserID, uint(uid))
		}
		if uname, ok := claims["username"].(string); ok {
			c.Set(ContextUsername, uname)
		}

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

// RequireRoles verifies if the authenticated user has at least one of the specified roles
func RequireRoles(requiredRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		val, exists := c.Get(ContextRoles)
		if !exists {
			c.JSON(http.StatusForbidden, StandardResponse{
				Success: false,
				Error:   "No role claims found in request context",
			})
			c.Abort()
			return
		}

		userRoles, ok := val.([]string)
		if !ok {
			c.JSON(http.StatusForbidden, StandardResponse{
				Success: false,
				Error:   "Invalid roles format in request context",
			})
			c.Abort()
			return
		}

		// Check if user has Administrator role (super role) or any matching required role
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
			c.JSON(http.StatusForbidden, StandardResponse{
				Success: false,
				Error:   fmt.Sprintf("Access denied. Required role(s): %s", strings.Join(requiredRoles, " or ")),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CORSMiddleware enables CORS for frontend integration
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// LoggerMiddleware formats request logs
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		c.Next()
		duration := time.Since(startTime)
		status := c.Writer.Status()
		fmt.Printf("[%s] %s %s %d (%v)\n", time.Now().Format("2006-01-02 15:04:05"), c.Request.Method, c.Request.URL.Path, status, duration)
	}
}
