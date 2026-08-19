package shakil_backend

import (
	"net/http"
	"strings"
)

type complainantRequest struct {
	Name     string    `json:"name"`
	Contacts []Contact `json:"contacts"`
}

type gdRequest struct {
	GDNumber      string  `json:"gd_number"`
	GDDate        string  `json:"gd_date"`
	Subject       string  `json:"subject"`
	ComplainantID *uint64 `json:"complainant_id,omitempty"`
}

type firRequest struct {
	FIRNumber     string   `json:"fir_number"`
	CrimeCategory string   `json:"crime_category"`
	FiledDate     string   `json:"filed_date"`
	GDID          *uint64  `json:"gd_id,omitempty"`
	SectionIDs    []uint64 `json:"section_ids"`
}

type caseRequest struct {
	CaseTitle    string  `json:"case_title"`
	Status       string  `json:"status"`
	OpenedDate   string  `json:"opened_date"`
	AssignedDate *string `json:"assigned_date,omitempty"`
	FIRID        *uint64 `json:"fir_id,omitempty"`
}

type statusRequest struct {
	Status  string `json:"status"`
	Remarks string `json:"remarks"`
}

func (m *Module) handleComplainants(w http.ResponseWriter, r *http.Request) {
	if !m.authorized(w, r, "complainants") { return }

	switch r.Method {
	case http.MethodGet:
		page, limit, err := parsePage(r)
		if err != nil { writeError(w, err); return }
		data, err := m.repo.ListComplainants(r.Context(), r.URL.Query().Get("search"), page, limit)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, data)

	case http.MethodPost:
		var req complainantRequest
		if err := decodeJSON(r, &req); err != nil { writeError(w, err); return }
		if err := required(req.Name, "name"); err != nil { writeError(w, err); return }
		for _, c := range req.Contacts {
			if err := required(c.ContactType, "contact_type"); err != nil { writeError(w, err); return }
			if err := required(c.ContactValue, "contact_value"); err != nil { writeError(w, err); return }
		}
		data, err := m.repo.CreateComplainant(r.Context(), strings.TrimSpace(req.Name), req.Contacts)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusCreated, data)

	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, newAPIError("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
	}
}

func (m *Module) handleGDs(w http.ResponseWriter, r *http.Request) {
	if !m.authorized(w, r, "gds") { return }

	switch r.Method {
	case http.MethodGet:
		page, limit, err := parsePage(r)
		if err != nil { writeError(w, err); return }
		filters := map[string]string{}
		for _, k := range []string{"gd_number", "complainant_id", "date_from", "date_to", "search"} {
			filters[k] = r.URL.Query().Get(k)
		}
		data, err := m.repo.ListGD(r.Context(), filters, page, limit)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, data)

	case http.MethodPost:
		var req gdRequest
		if err := decodeJSON(r, &req); err != nil { writeError(w, err); return }
		if err := required(req.GDNumber, "gd_number"); err != nil { writeError(w, err); return }
		if err := date(req.GDDate, "gd_date"); err != nil { writeError(w, err); return }
		if err := required(req.Subject, "subject"); err != nil { writeError(w, err); return }
		data, err := m.repo.CreateGD(r.Context(), GD{
			GDNumber: req.GDNumber, GDDate: req.GDDate,
			Subject: req.Subject, ComplainantID: req.ComplainantID,
		})
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusCreated, data)

	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, newAPIError("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
	}
}

func (m *Module) handleLegalSections(w http.ResponseWriter, r *http.Request) {
	if !m.authorized(w, r, "legal-sections") { return }
	if r.Method != http.MethodGet {
		w.Header().Set("Allow", "GET")
		writeError(w, newAPIError("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
		return
	}
	data, err := m.repo.ListLegalSections(r.Context(), r.URL.Query().Get("search"), r.URL.Query().Get("section_code"))
	if err != nil { writeError(w, err); return }
	writeJSON(w, http.StatusOK, data)
}

func (m *Module) handleFIRs(w http.ResponseWriter, r *http.Request) {
	if !m.authorized(w, r, "firs") { return }

	switch r.Method {
	case http.MethodGet:
		page, limit, err := parsePage(r)
		if err != nil { writeError(w, err); return }
		filters := map[string]string{}
		for _, k := range []string{"fir_number", "crime_category", "gd_id", "section_code", "date_from", "date_to"} {
			filters[k] = r.URL.Query().Get(k)
		}
		data, err := m.repo.ListFIR(r.Context(), filters, page, limit)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, data)

	case http.MethodPost:
		var req firRequest
		if err := decodeJSON(r, &req); err != nil { writeError(w, err); return }
		if err := required(req.FIRNumber, "fir_number"); err != nil { writeError(w, err); return }
		if err := required(req.CrimeCategory, "crime_category"); err != nil { writeError(w, err); return }
		if err := date(req.FiledDate, "filed_date"); err != nil { writeError(w, err); return }
		data, err := m.repo.CreateFIR(r.Context(), FIR{
			FIRNumber: req.FIRNumber, CrimeCategory: req.CrimeCategory,
			FiledDate: req.FiledDate, GDID: req.GDID,
		}, req.SectionIDs)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusCreated, data)

	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, newAPIError("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
	}
}

func (m *Module) handleCases(w http.ResponseWriter, r *http.Request) {
	if !m.authorized(w, r, "cases") { return }

	switch r.Method {
	case http.MethodGet:
		page, limit, err := parsePage(r)
		if err != nil { writeError(w, err); return }
		filters := map[string]string{}
		for _, k := range []string{
			"case_id", "status", "fir_id", "gd_number", "fir_number",
			"complainant_id", "crime_category", "opened_from", "opened_to", "search",
		} {
			filters[k] = r.URL.Query().Get(k)
		}
		data, err := m.repo.SearchCases(r.Context(), filters, page, limit)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, data)

	case http.MethodPost:
		var req caseRequest
		if err := decodeJSON(r, &req); err != nil { writeError(w, err); return }
		if err := required(req.CaseTitle, "case_title"); err != nil { writeError(w, err); return }
		if err := required(req.Status, "status"); err != nil { writeError(w, err); return }
		if err := date(req.OpenedDate, "opened_date"); err != nil { writeError(w, err); return }
		if req.AssignedDate != nil {
			if err := optionalDate(*req.AssignedDate, "assigned_date"); err != nil { writeError(w, err); return }
		}
		data, err := m.repo.CreateCase(r.Context(), Case{
			CaseTitle: req.CaseTitle, Status: req.Status,
			OpenedDate: req.OpenedDate, AssignedDate: req.AssignedDate, FIRID: req.FIRID,
		})
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusCreated, data)

	default:
		w.Header().Set("Allow", "GET, POST")
		writeError(w, newAPIError("METHOD_NOT_ALLOWED", "method not allowed", http.StatusMethodNotAllowed))
	}
}

func (m *Module) handleCaseRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/cases/"), "/")
	parts := strings.Split(path, "/")
	if len(parts) == 0 || parts[0] == "" {
		writeError(w, newAPIError("NOT_FOUND", "route not found", http.StatusNotFound))
		return
	}

	id, err := parseID(parts[0])
	if err != nil { writeError(w, err); return }

	switch {
	case len(parts) == 1 && r.Method == http.MethodGet:
		data, err := m.repo.GetCaseDossier(r.Context(), id)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, data)

	case len(parts) == 2 && parts[1] == "status" && r.Method == http.MethodPut:
		var req statusRequest
		if err := decodeJSON(r, &req); err != nil { writeError(w, err); return }
		if err := required(req.Status, "status"); err != nil { writeError(w, err); return }
		data, err := m.repo.TransitionCaseStatus(r.Context(), id, req.Status, req.Remarks)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, map[string]any{"case_id": data.CaseID, "status": data.Status})

	case len(parts) == 2 && parts[1] == "history" && r.Method == http.MethodGet:
		data, err := m.repo.GetCaseHistory(r.Context(), id)
		if err != nil { writeError(w, err); return }
		writeJSON(w, http.StatusOK, data)

	default:
		writeError(w, newAPIError("NOT_FOUND", "route not found", http.StatusNotFound))
	}
}
