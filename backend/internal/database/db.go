// ============================================================================
// [ORIGIN: Md. Arafat Hossain Faisal (241400060) - Module 1: Organization & Access Control]
// File: backend/internal/database/db.go
// Purpose: MySQL connection pool setup and atomic transaction runner.
//
// [INTEGRATION NOTE]: Enhanced with WithTransaction helper to support Shakil's
// atomic Case Status transitions and Liza's atomic Evidence Chain of Custody transitions.
// ============================================================================

package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"orcus-backend/internal/config"

	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
)

type DB struct {
	*sqlx.DB
}

func Connect(cfg *config.Config) (*DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
	)

	db, err := sqlx.Connect("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MySQL database (%s): %w", cfg.DBName, err)
	}

	// Performance tuning: connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	log.Printf("Connected successfully to MySQL database [%s] at %s:%s", cfg.DBName, cfg.DBHost, cfg.DBPort)
	return &DB{db}, nil
}

// WithTransaction executes an atomic multi-table operation within a transaction,
// automatically executing COMMIT on success or ROLLBACK on error/panic.
func (db *DB) WithTransaction(ctx context.Context, fn func(tx *sqlx.Tx) error) error {
	tx, err := db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start database transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(); rbErr != nil {
			return fmt.Errorf("transaction error: %v (rollback failed: %w)", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}
