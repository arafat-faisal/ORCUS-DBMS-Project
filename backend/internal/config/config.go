// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/config/config.go
// Purpose: Loads environment variables for server port, MySQL DSN, and JWT secrets.
//
// [INTEGRATION NOTE]: Adapted from Faisal's rough/faisal/backend-development/
// configuration loader to serve all unified modules (Auth, Intake, Participants, Evidence).
// ============================================================================

package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port         string
	DBUser       string
	DBPassword   string
	DBHost       string
	DBPort       string
	DBName       string
	JWTSecret    string
	JWTExpiresIn string
	GinMode      string
}

func LoadConfig() *Config {
	// Attempt to load .env file if present
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Info: .env file not found, defaulting to system environment variables")
	}

	return &Config{
		Port:         getEnv("PORT", "8080"),
		DBUser:       getEnv("DB_USER", "root"),
		DBPassword:   getEnv("DB_PASSWORD", ""),
		DBHost:       getEnv("DB_HOST", "127.0.0.1"),
		DBPort:       getEnv("DB_PORT", "3306"),
		DBName:       getEnv("DB_NAME", "orcus_db"),
		JWTSecret:    getEnv("JWT_SECRET", "orcus-unified-secret-key-summer-2026-faisal-shakil-liza"),
		JWTExpiresIn: getEnv("JWT_EXPIRES_IN", "24h"),
		GinMode:      getEnv("GIN_MODE", "release"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
