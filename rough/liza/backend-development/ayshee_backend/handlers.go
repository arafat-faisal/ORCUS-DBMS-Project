package main

import (
	"encoding/json"
	"net/http"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetSuspectsHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	suspects, err := h.repo.FetchSuspects(name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(suspects)
}