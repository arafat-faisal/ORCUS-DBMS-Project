package main

import (
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

func main() {
	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "")
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "orcus_db")
	port := getEnv("PORT", "8080")
	jwtSecret := getEnv("JWT_SECRET", "orcus-faisal-module-secret-key-2026")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	log.Printf("Connecting to MySQL database: %s at %s:%s...", dbName, dbHost, dbPort)
	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("Database connection error: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Database ping error: %v", err)
	}
	log.Println("Database connection established successfully.")

	repo := NewRepository(db)
	service := NewService(repo, jwtSecret)
	handler := NewHandler(service)

	router := handler.SetupRouter(jwtSecret)

	log.Printf("ORCUS Organization & Access Control Module server running at http://localhost:%s/api/v1", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
