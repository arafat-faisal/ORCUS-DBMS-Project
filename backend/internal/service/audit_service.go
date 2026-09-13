package service

import (
	"context"
	"encoding/json"
	"log"
	"math"
	"regexp"
	"strings"

	"orcus-backend/internal/models"
	"orcus-backend/internal/repository"
)

type AuditService struct {
	repo *repository.AuditRepository
}

func NewAuditService(repo *repository.AuditRepository) *AuditService {
	return &AuditService{repo: repo}
}

// Log records an audit event with sanitization
func (s *AuditService) Log(ctx context.Context, entry models.AuditLog) {
	if entry.BeforeSummary != nil {
		sanitized := SanitizeSummary(*entry.BeforeSummary)
		entry.BeforeSummary = &sanitized
	}
	if entry.AfterSummary != nil {
		sanitized := SanitizeSummary(*entry.AfterSummary)
		entry.AfterSummary = &sanitized
	}

	if err := s.repo.Create(ctx, &entry); err != nil {
		log.Printf("[AUDIT ERROR] Failed to record audit log: %v", err)
	}
}

// GetLogs returns filtered, paginated audit logs
func (s *AuditService) GetLogs(ctx context.Context, f models.AuditFilter) ([]models.AuditLog, *models.PaginationInfo, error) {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 || f.PageSize > 100 {
		f.PageSize = 20
	}

	logs, total, err := s.repo.List(ctx, f)
	if err != nil {
		return nil, nil, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(f.PageSize)))
	pagination := &models.PaginationInfo{
		Page:       f.Page,
		PageSize:   f.PageSize,
		Total:      total,
		TotalPages: totalPages,
	}

	return logs, pagination, nil
}

var sensitiveKeys = []string{
	"password", "password_hash", "token", "secret", "jwt",
	"authorization", "nid", "national_id",
}

// SanitizeSummary removes sensitive tokens and fields from audit summaries
func SanitizeSummary(input string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return ""
	}

	// If valid JSON, sanitize key-values
	var rawMap map[string]interface{}
	if err := json.Unmarshal([]byte(trimmed), &rawMap); err == nil {
		maskMap(rawMap)
		if bytes, err := json.Marshal(rawMap); err == nil {
			return string(bytes)
		}
	}

	// Text fallback: mask password/token occurrences
	re := regexp.MustCompile(`(?i)(password|token|secret)\s*[:=]\s*["']?([^"'\s,]+)["']?`)
	return re.ReplaceAllString(trimmed, `$1="[MASKED]"`)
}

func maskMap(m map[string]interface{}) {
	for k, v := range m {
		lowerKey := strings.ToLower(k)
		isSensitive := false
		for _, s := range sensitiveKeys {
			if strings.Contains(lowerKey, s) {
				isSensitive = true
				break
			}
		}

		if isSensitive {
			m[k] = "[MASKED]"
			continue
		}

		if nested, ok := v.(map[string]interface{}); ok {
			maskMap(nested)
		}
	}
}
