package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

type MigrationRecord struct {
	Version     string
	Description string
	AppliedAt   time.Time
}

func main() {
	cmd := flag.String("cmd", "up", "Command to run: 'up', 'down', or 'status'")
	migrationsDir := flag.String("dir", "", "Path to migrations directory")
	dbNameFlag := flag.String("db", "", "Target database name override")
	flag.Parse()

	_ = godotenv.Load()
	_ = godotenv.Load("../../.env")
	_ = godotenv.Load("../.env")

	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "")
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "orcus_db")

	if *dbNameFlag != "" {
		dbName = *dbNameFlag
	}

	dir := *migrationsDir
	if dir == "" {
		// Look in common relative directories
		candidates := []string{
			"database/migrations",
			"../database/migrations",
			"../../database/migrations",
			"../../../database/migrations",
		}
		for _, c := range candidates {
			if info, err := os.Stat(c); err == nil && info.IsDir() {
				dir = c
				break
			}
		}
	}

	if dir == "" {
		log.Fatalf("Could not locate migrations directory. Please pass -dir flag.")
	}

	absDir, _ := filepath.Abs(dir)
	fmt.Printf("[MIGRATION ENGINE] Target Database: %s@%s:%s/%s\n", dbUser, dbHost, dbPort, dbName)
	fmt.Printf("[MIGRATION ENGINE] Migrations Path: %s\n", absDir)

	// Connect to MySQL
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&multiStatements=true",
		dbUser, dbPass, dbHost, dbPort, dbName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	// Ensure schema_migrations table exists
	ensureMigrationTable(db)

	switch *cmd {
	case "up":
		runUp(db, absDir)
	case "down":
		runDown(db, absDir)
	case "status":
		runStatus(db, absDir)
	default:
		log.Fatalf("Unknown command: %s. Use 'up', 'down', or 'status'.", *cmd)
	}
}

func ensureMigrationTable(db *sql.DB) {
	query := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(50) NOT NULL PRIMARY KEY,
		description VARCHAR(255) NOT NULL,
		applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
	) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`

	if _, err := db.Exec(query); err != nil {
		log.Fatalf("Failed to initialize schema_migrations table: %v", err)
	}
}

func getAppliedMigrations(db *sql.DB) (map[string]time.Time, error) {
	rows, err := db.Query("SELECT version, applied_at FROM schema_migrations ORDER BY version ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]time.Time)
	for rows.Next() {
		var version string
		var appliedAt time.Time
		if err := rows.Scan(&version, &appliedAt); err != nil {
			return nil, err
		}
		applied[version] = appliedAt
	}
	return applied, nil
}

func runUp(db *sql.DB, dir string) {
	files, err := filepath.Glob(filepath.Join(dir, "*.up.sql"))
	if err != nil {
		log.Fatalf("Failed to scan migration files: %v", err)
	}

	sort.Strings(files)

	applied, err := getAppliedMigrations(db)
	if err != nil {
		log.Fatalf("Failed to read applied migrations: %v", err)
	}

	count := 0
	for _, file := range files {
		base := filepath.Base(file)
		version := strings.TrimSuffix(base, ".up.sql")

		if _, exists := applied[version]; exists {
			continue // already applied
		}

		fmt.Printf("Applying migration: %s ... ", base)
		content, err := os.ReadFile(file)
		if err != nil {
			log.Fatalf("Failed to read file %s: %v", file, err)
		}

		// Execute migration SQL
		if _, err := db.Exec(string(content)); err != nil {
			fmt.Printf("FAILED!\n")
			log.Fatalf("Migration %s failed: %v", base, err)
		}

		// Record in schema_migrations
		desc := strings.ReplaceAll(version, "_", " ")
		_, err = db.Exec("INSERT INTO schema_migrations (version, description) VALUES (?, ?)", version, desc)
		if err != nil {
			log.Fatalf("Failed to record migration %s: %v", version, err)
		}

		fmt.Printf("SUCCESS!\n")
		count++
	}

	if count == 0 {
		fmt.Println("[MIGRATION ENGINE] Database is already up to date. Zero migrations pending.")
	} else {
		fmt.Printf("[MIGRATION ENGINE] Successfully applied %d migration(s).\n", count)
	}
}

func runDown(db *sql.DB, dir string) {
	applied, err := getAppliedMigrations(db)
	if err != nil {
		log.Fatalf("Failed to read applied migrations: %v", err)
	}

	if len(applied) == 0 {
		fmt.Println("[MIGRATION ENGINE] No applied migrations to rollback.")
		return
	}

	// Find the latest applied version
	var versions []string
	for v := range applied {
		versions = append(versions, v)
	}
	sort.Strings(versions)
	latest := versions[len(versions)-1]

	downFile := filepath.Join(dir, latest+".down.sql")
	if _, err := os.Stat(downFile); os.IsNotExist(err) {
		log.Fatalf("Down migration file not found: %s", downFile)
	}

	fmt.Printf("Rolling back migration: %s.down.sql ... ", latest)
	content, err := os.ReadFile(downFile)
	if err != nil {
		log.Fatalf("Failed to read %s: %v", downFile, err)
	}

	if _, err := db.Exec(string(content)); err != nil {
		fmt.Printf("FAILED!\n")
		log.Fatalf("Rollback %s failed: %v", latest, err)
	}

	if _, err := db.Exec("DELETE FROM schema_migrations WHERE version = ?", latest); err != nil {
		log.Fatalf("Failed to remove record for %s: %v", latest, err)
	}

	fmt.Printf("SUCCESS!\n")
	fmt.Printf("[MIGRATION ENGINE] Successfully rolled back migration %s.\n", latest)
}

func runStatus(db *sql.DB, dir string) {
	upFiles, _ := filepath.Glob(filepath.Join(dir, "*.up.sql"))
	sort.Strings(upFiles)

	applied, err := getAppliedMigrations(db)
	if err != nil {
		log.Fatalf("Failed to query migrations: %v", err)
	}

	fmt.Println("\n================================================================================")
	fmt.Printf("%-35s | %-12s | %-20s\n", "MIGRATION VERSION", "STATUS", "APPLIED AT")
	fmt.Println("================================================================================")

	for _, file := range upFiles {
		base := filepath.Base(file)
		version := strings.TrimSuffix(base, ".up.sql")

		if appliedAt, ok := applied[version]; ok {
			fmt.Printf("%-35s | %-12s | %-20s\n", version, "APPLIED", appliedAt.Format("2006-01-02 15:04:05"))
		} else {
			fmt.Printf("%-35s | %-12s | %-20s\n", version, "PENDING", "-")
		}
	}
	fmt.Println("================================================================================")
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
