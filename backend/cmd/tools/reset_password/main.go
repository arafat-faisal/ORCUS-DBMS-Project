package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	username := flag.String("user", "admin_faisal", "Username of the account to reset")
	newPassword := flag.String("password", "OrcusAdmin#2026", "New plaintext password")
	flag.Parse()

	if *username == "" || *newPassword == "" {
		fmt.Println("Usage: go run ./cmd/tools/reset_password/main.go -user <username> -password <new_password>")
		os.Exit(1)
	}

	dsn := "root:@tcp(127.0.0.1:3306)/orcus_db?charset=utf8mb4&parseTime=True"
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("❌ Database connection failed: %v", err)
	}
	defer db.Close()

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(*newPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("❌ Bcrypt generation failed: %v", err)
	}

	query := `
		UPDATE user 
		SET password_hash = ?, 
		    failed_login_attempts = 0, 
		    is_active = 1 
		WHERE username = ?`

	res, err := db.Exec(query, string(hashBytes), *username)
	if err != nil {
		log.Fatalf("❌ SQL update error: %v", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		log.Fatalf("❌ Rows affected check failed: %v", err)
	}

	if rows == 0 {
		fmt.Printf("⚠️ User '%s' was not found or the password was already identical.\n", *username)
	} else {
		fmt.Printf("✅ Password for '%s' was successfully reset and account unlocked!\n", *username)
		fmt.Printf("🔑 New Password: %s\n", *newPassword)
	}
}
