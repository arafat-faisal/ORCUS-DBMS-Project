package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/orcus_db?charset=utf8mb4&parseTime=True&multiStatements=true"
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Locate fresh_seed.sql
	candidates := []string{
		filepath.Join("..", "database", "fresh_seed.sql"),
		filepath.Join("database", "fresh_seed.sql"),
		filepath.Join("..", "..", "database", "fresh_seed.sql"),
		filepath.Join("..", "..", "..", "database", "fresh_seed.sql"),
	}
	var seedPath string
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			seedPath = c
			break
		}
	}
	if seedPath == "" {
		log.Fatalf("fresh_seed.sql not found in candidate paths")
	}
	content, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("Failed to read fresh_seed.sql at %s: %v", seedPath, err)
	}

	fmt.Println("Applying fresh_seed.sql to orcus_db...")
	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatalf("Failed to execute fresh_seed.sql: %v", err)
	}
	fmt.Println("Successfully applied schema truncate and fresh data insertions!")

	// Now sync password hashes for all users
	credsFile := filepath.Join("backend", ".env.seed_credentials")
	if _, err := os.Stat(credsFile); os.IsNotExist(err) {
		credsFile = ".env.seed_credentials"
	}

	credsData := make(map[string]string)
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

	defaultCreds := map[string]string{
		"admin_faisal":      "OrcusAdmin#2026",
		"det_shakil":        "OrcusShakil#2026",
		"forensic_liza":     "OrcusLiza#2026",
		"insp_tariq":        "OrcusTariq#2026",
		"si_nusrat":         "OrcusNusrat#2026",
		"det_mahmud":        "OrcusMahmud#2026",
		"cyber_kamrul":      "OrcusKamrul#2026",
		"intel_farhana":     "OrcusFarhana#2026",
		"system_auditor":    "OrcusAudit#2026",
		"complainant_rahim": "OrcusCitizen#2026",
	}

	fmt.Println("Updating password hashes...")
	for username, defPwd := range defaultCreds {
		envKey := strings.ToUpper(username) + "_PASSWORD"
		pwd := credsData[envKey]
		if pwd == "" {
			pwd = defPwd
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(pwd), 10)
		if err != nil {
			log.Fatalf("Failed to hash password for %s: %v", username, err)
		}

		_, err = db.Exec("UPDATE `user` SET password_hash = ? WHERE username = ?", string(hash), username)
		if err != nil {
			log.Fatalf("Failed to update user %s: %v", username, err)
		}
		fmt.Printf("✓ User %s password synced\n", username)
	}

	// Verify counts
	type TableCount struct {
		Table string
		Count int
	}
	tables := []string{
		"agency_branch", "officer", "user", "user_role", "complainant", "complaint",
		"gd", "fir", "case", "suspect", "victim", "witness", "evidence", "evidence_status_history",
		"investigation_activity", "audit_log",
	}
	fmt.Println("\n--- Database Verification Summary ---")
	for _, t := range tables {
		var cnt int
		err := db.Get(&cnt, fmt.Sprintf("SELECT COUNT(*) FROM `%s`", t))
		if err != nil {
			fmt.Printf("Error counting %s: %v\n", t, err)
		} else {
			fmt.Printf("Table %-24s : %d records\n", t, cnt)
		}
	}
	fmt.Println("Database is completely refreshed and ready for evaluation!")
}
