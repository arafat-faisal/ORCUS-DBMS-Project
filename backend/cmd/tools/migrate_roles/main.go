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

	fmt.Println("Migrating user_role mappings to standard 8-role architecture...")

	// Clear existing user_role mappings
	_, err = db.Exec("DELETE FROM user_role")
	if err != nil {
		log.Fatalf("Failed to clear user_role: %v", err)
	}

	// Standard User -> Role ID mappings
	// 1: Administrator, 7: Duty Officer, 8: Officer-in-Charge, 9: Investigating Officer,
	// 10: Evidence Officer, 11: Supervising Officer, 5: System Auditor, 13: Public Complainant
	roleMappings := []struct {
		UserID int
		RoleID int
	}{
		{1, 1},  // admin_faisal -> Administrator
		{2, 9},  // det_shakil -> Investigating Officer
		{3, 10}, // forensic_liza -> Evidence Officer
		{4, 8},  // insp_tariq -> Officer-in-Charge
		{5, 7},  // si_nusrat -> Duty Officer
		{6, 9},  // det_mahmud -> Investigating Officer
		{7, 9},  // cyber_kamrul -> Investigating Officer
		{7, 10}, // cyber_kamrul -> Evidence Officer
		{8, 11}, // intel_farhana -> Supervising Officer
		{9, 5},  // system_auditor -> System Auditor
	}

	for _, m := range roleMappings {
		_, err := db.Exec("INSERT INTO user_role (user_id, role_id) VALUES (?, ?)", m.UserID, m.RoleID)
		if err != nil {
			log.Fatalf("Failed to insert mapping user %d -> role %d: %v", m.UserID, m.RoleID, err)
		}
	}

	// Check if complainant_rahim exists, if not create
	var count int
	err = db.Get(&count, "SELECT COUNT(*) FROM `user` WHERE username = 'complainant_rahim'")
	if err != nil {
		log.Fatalf("Failed to check complainant user: %v", err)
	}

	if count == 0 {
		hash, err := bcrypt.GenerateFromPassword([]byte("Rahim@Public2026!"), 10)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		res, err := db.Exec("INSERT INTO `user` (username, password_hash, is_active) VALUES (?, ?, 1)", "complainant_rahim", string(hash))
		if err != nil {
			log.Fatalf("Failed to insert complainant_rahim: %v", err)
		}
		newUserID, _ := res.LastInsertId()
		_, err = db.Exec("INSERT INTO user_role (user_id, role_id) VALUES (?, 13)", newUserID)
		if err != nil {
			log.Fatalf("Failed to assign role to complainant_rahim: %v", err)
		}
		fmt.Printf("Created public demo user complainant_rahim (ID %d) with role Public Complainant (13)\n", newUserID)
	} else {
		// Ensure user 10 has role 13
		var uid int
		_ = db.Get(&uid, "SELECT user_id FROM `user` WHERE username = 'complainant_rahim'")
		_, _ = db.Exec("INSERT IGNORE INTO user_role (user_id, role_id) VALUES (?, 13)", uid)
	}

	fmt.Println("User roles successfully migrated to standard 8-role architecture!")
}
