package service

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
)

var (
	bdMobileRegex = regexp.MustCompile(`^(?:\+?880|0)?(1[3-9]\d{8})$`)
)

// NormalizeBDMobile validates and standardizes a Bangladesh mobile number into E.164 (+8801XXXXXXXXX)
func NormalizeBDMobile(raw string) (string, error) {
	cleaned := strings.TrimSpace(raw)
	// Remove spaces, hyphens, and parentheses
	cleaned = strings.ReplaceAll(cleaned, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")

	matches := bdMobileRegex.FindStringSubmatch(cleaned)
	if len(matches) < 2 {
		return "", errors.New("invalid Bangladesh mobile number. Expected format: 01XXXXXXXXX or +8801XXXXXXXXX")
	}

	nationalNumber := matches[1]
	return "+880" + nationalNumber, nil
}

// FormatBDMobileReadable converts an E.164 or raw BD mobile number to human readable form (+880 1XXX-XXXXXX)
func FormatBDMobileReadable(normalized string) string {
	norm, err := NormalizeBDMobile(normalized)
	if err != nil {
		return normalized
	}
	// norm is +8801XXXXXXXXX (14 chars)
	// prefix: +880, network: 1XXX, subscriber: XXXXXX
	if len(norm) == 14 {
		return fmt.Sprintf("+880 %s-%s", norm[4:8], norm[8:])
	}
	return norm
}

// MaskIdentityDocument masks personal identity documents (NID, BRN, Passport) for public/list views
func MaskIdentityDocument(docType string, docNumber string) string {
	trimmed := strings.TrimSpace(docNumber)
	if len(trimmed) <= 4 {
		return "••••"
	}
	visibleSuffix := trimmed[len(trimmed)-4:]
	maskedPrefix := strings.Repeat("•", len(trimmed)-4)
	if len(maskedPrefix) > 8 {
		maskedPrefix = "••••••••"
	}
	return fmt.Sprintf("%s-%s%s", docType, maskedPrefix, visibleSuffix)
}
