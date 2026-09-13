// ============================================================================
// File: backend/internal/config/config.go
// Purpose: Loads and validates environment variables for ORCUS investigation system.
// ============================================================================

package config

import (
	"crypto/rand"
	"encoding/base64"
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DBUser             string
	DBPassword         string
	DBHost             string
	DBPort             string
	DBName             string
	JWTSecret          string
	JWTExpiresIn       string
	GinMode            string
	CORSAllowedOrigins []string
	CookieSecure       bool
	CookieSameSite     string
}

func LoadConfig() *Config {
	// Attempt to load .env file if present
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Info: .env file not found, defaulting to system environment variables")
	}

	ginMode := getEnv("GIN_MODE", "debug")
	jwtSecret := os.Getenv("JWT_SECRET")

	// Strict security validation for production mode
	if ginMode == "release" {
		if jwtSecret == "" || len(jwtSecret) < 32 {
			log.Fatalf("FATAL SECURITY ERROR: JWT_SECRET must be set and contain at least 32 characters in release mode.")
		}
	} else if jwtSecret == "" {
		// Generate an ephemeral random key for development if none provided
		log.Println("WARNING: JWT_SECRET not found in environment. Generating ephemeral 256-bit development key.")
		b := make([]byte, 32)
		if _, err := rand.Read(b); err != nil {
			log.Fatalf("Failed to generate secure random key: %v", err)
		}
		jwtSecret = base64.StdEncoding.EncodeToString(b)
	}

	corsRaw := getEnv("CORS_ALLOWED_ORIGINS", "*")
	var origins []string
	if corsRaw == "*" {
		origins = []string{"*"}
	} else {
		for _, o := range strings.Split(corsRaw, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	}

	cookieSecure := getEnv("COOKIE_SECURE", "false") == "true"
	cookieSameSite := getEnv("COOKIE_SAME_SITE", "Lax")

	return &Config{
		Port:               getEnv("PORT", "5050"),
		DBUser:             getEnv("DB_USER", "root"),
		DBPassword:         getEnv("DB_PASSWORD", ""),
		DBHost:             getEnv("DB_HOST", "127.0.0.1"),
		DBPort:             getEnv("DB_PORT", "3306"),
		DBName:             getEnv("DB_NAME", "orcus_db"),
		JWTSecret:          jwtSecret,
		JWTExpiresIn:       getEnv("JWT_EXPIRES_IN", "24h"),
		GinMode:            ginMode,
		CORSAllowedOrigins: origins,
		CookieSecure:       cookieSecure,
		CookieSameSite:     cookieSameSite,
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
