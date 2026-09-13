package main

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func generateSecurePassword() string {
	b := make([]byte, 18)
	if _, err := rand.Read(b); err != nil {
		log.Fatalf("Failed to generate secure random bytes: %v", err)
	}
	return base64.URLEncoding.EncodeToString(b) + "!A1"
}

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/orcus_db?charset=utf8mb4&parseTime=True"
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	users := []string{
		"admin_faisal",
		"det_shakil",
		"forensic_liza",
		"insp_tariq",
		"si_nusrat",
		"det_mahmud",
		"cyber_kamrul",
		"intel_farhana",
		"system_auditor",
		"complainant_rahim",
	}

	credsFile := filepath.Join(".", ".env.seed_credentials")
	credsData := make(map[string]string)

	// Check if local credentials file exists
	if data, err := os.ReadFile(credsFile); err == nil {
		lines := strings.Split(string(data), "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				credsData[parts[0]] = parts[1]
			}
		}
	}

	var outputLines []string
	outputLines = append(outputLines, "# Local Development Seed Credentials (DO NOT COMMIT)")

	for _, username := range users {
		envKey := strings.ToUpper(username) + "_PASSWORD"
		pwd := os.Getenv(envKey)
		if pwd == "" {
			pwd = credsData[envKey]
		}
		if pwd == "" {
			pwd = generateSecurePassword()
		}
		credsData[envKey] = pwd
		outputLines = append(outputLines, fmt.Sprintf("%s=%s", envKey, pwd))

		hash, err := bcrypt.GenerateFromPassword([]byte(pwd), 10)
		if err != nil {
			log.Fatalf("Failed to hash password for %s: %v", username, err)
		}

		_, err = db.Exec("UPDATE `user` SET password_hash = ? WHERE username = ?", string(hash), username)
		if err != nil {
			log.Fatalf("Failed to update user %s: %v", username, err)
		}
	}

	if err := os.WriteFile(credsFile, []byte(strings.Join(outputLines, "\n")+"\n"), 0600); err != nil {
		log.Fatalf("Failed to write seed credentials file: %v", err)
	}

	fmt.Println("Database account credentials successfully rotated and updated with genuine bcrypt hashes.")
	fmt.Println("Credentials safely recorded to uncommitted local configuration.")
}
