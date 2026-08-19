package shakil_backend

import (
	"encoding/json"
	"net/http"
)

type AuthorizeFunc func(r *http.Request, permission string) error

type Module struct {
	repo      *Repository
	authorize AuthorizeFunc
}

func NewModule(db DBTX, authorize AuthorizeFunc) *Module {
	return &Module{repo: NewRepository(db), authorize: authorize}
}

func (m *Module) authorized(w http.ResponseWriter, r *http.Request, permission string) bool {
	if m.authorize == nil {
		return true
	}
	if err := m.authorize(r, permission); err != nil {
		writeError(w, err)
		return false
	}
	return true
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"success": true,
		"data": data,
	})
}

func (m *Module) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/complainants", m.handleComplainants)
	mux.HandleFunc("/api/v1/gds", m.handleGDs)
	mux.HandleFunc("/api/v1/firs", m.handleFIRs)
	mux.HandleFunc("/api/v1/legal-sections", m.handleLegalSections)
	mux.HandleFunc("/api/v1/cases", m.handleCases)
	mux.HandleFunc("/api/v1/cases/", m.handleCaseRoutes)
	return mux
}
