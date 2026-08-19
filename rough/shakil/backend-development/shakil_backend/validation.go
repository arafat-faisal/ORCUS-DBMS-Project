package shakil_backend

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func decodeJSON(r *http.Request, dst any) error {
	if r.Body == nil {
		return newAPIError("VALIDATION_ERROR", "request body is required", http.StatusBadRequest)
	}
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(dst); err != nil {
		return newAPIError("VALIDATION_ERROR", "invalid JSON request body", http.StatusBadRequest)
	}
	return nil
}

func parseID(value string) (uint64, error) {
	id, err := strconv.ParseUint(value, 10, 64)
	if err != nil || id == 0 {
		return 0, newAPIError("VALIDATION_ERROR", "id must be a positive integer", http.StatusBadRequest)
	}
	return id, nil
}

func parsePage(r *http.Request) (int, int, error) {
	page, limit := 1, 20

	if value := r.URL.Query().Get("page"); value != "" {
		n, err := strconv.Atoi(value)
		if err != nil || n < 1 {
			return 0, 0, newAPIError("VALIDATION_ERROR", "page must be a positive integer", http.StatusBadRequest)
		}
		page = n
	}
	if value := r.URL.Query().Get("limit"); value != "" {
		n, err := strconv.Atoi(value)
		if err != nil || n < 1 || n > 100 {
			return 0, 0, newAPIError("VALIDATION_ERROR", "limit must be between 1 and 100", http.StatusBadRequest)
		}
		limit = n
	}
	return page, limit, nil
}

func required(value, field string) error {
	if strings.TrimSpace(value) == "" {
		return newAPIError("VALIDATION_ERROR", field+" is required", http.StatusBadRequest)
	}
	return nil
}

func date(value, field string) error {
	if err := required(value, field); err != nil {
		return err
	}
	if _, err := time.Parse("2006-01-02", value); err != nil {
		return newAPIError("VALIDATION_ERROR", field+" must use YYYY-MM-DD", http.StatusBadRequest)
	}
	return nil
}

func optionalDate(value, field string) error {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return date(value, field)
}
