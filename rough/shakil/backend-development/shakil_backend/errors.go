package shakil_backend

import (
	"errors"
	"net/http"
)

var (
	ErrNotFound = errors.New("resource not found")
	ErrConflict = errors.New("resource conflict")
)

type APIError struct {
	Code       string
	Message    string
	StatusCode int
}

func (e *APIError) Error() string { return e.Message }

func newAPIError(code, message string, status int) *APIError {
	return &APIError{Code: code, Message: message, StatusCode: status}
}

func writeError(w http.ResponseWriter, err error) {
	status := http.StatusInternalServerError
	code := "INTERNAL_ERROR"
	message := "internal server error"

	var apiErr *APIError
	if errors.As(err, &apiErr) {
		status = apiErr.StatusCode
		code = apiErr.Code
		message = apiErr.Message
	}

	writeJSON(w, status, map[string]any{
		"success": false,
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}
