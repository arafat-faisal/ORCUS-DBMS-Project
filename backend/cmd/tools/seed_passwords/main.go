package main

import (
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dsn := "root:@tcp(127.0.0.1:3306)/orcus_db?charset=utf8mb4&parseTime=True"
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Distinct known demonstration passwords for seed accounts
	passwords := map[string]string{
		"admin_faisal":   "Faisal@Admin2026!",
		"det_shakil":     "Shakil@Invest2026!",
		"forensic_liza":  "Liza@Forensic2026!",
		"insp_tariq":     "Tariq@Invest2026!",
		"si_nusrat":      "Nusrat@Duty2026!",
		"det_mahmud":     "Mahmud@Invest2026!",
		"cyber_kamrul":   "Kamrul@Cyber2026!",
		"intel_farhana":  "Farhana@Intel2026!",
		"system_auditor": "Auditor@Audit2026!",
	}

	fmt.Println("Generating authentic bcrypt hashes and updating orcus_db.user...")

	for username, plainPwd := range passwords {
		hash, err := bcrypt.GenerateFromPassword([]byte(plainPwd), 10)
		if err != nil {
			log.Fatalf("Failed to hash password for %s: %v", username, err)
		}

		_, err = db.Exec("UPDATE `user` SET password_hash = ? WHERE username = ?", string(hash), username)
		if err != nil {
			log.Fatalf("Failed to update user %s: %v", username, err)
		}
		fmt.Printf("Updated %-15s -> Hash: %s... (Password: %s)\n", username, string(hash)[:20], plainPwd)
	}

	fmt.Println("All seed account passwords securely updated with genuine bcrypt hashes.")
}
