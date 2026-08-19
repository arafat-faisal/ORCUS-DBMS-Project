package main

import "time"

type Suspect struct {
	ID                 int    `json:"suspect_id"`
	Name               string `json:"name"`
	Age                int    `json:"age"`
	IdentificationSign string `json:"identification_sign"`
	SuspicionLevel     string `json:"suspicion_level"`
	Status             string `json:"status"`
}

type Evidence struct {
	EvidenceNumber     int       `json:"evidence_number"`
	Title              string    `json:"title"`
	Content            string    `json:"content"`
	Status             string    `json:"status"`
	EvidenceType       string    `json:"evidence_type"`
	CollectionDateTime time.Time `json:"collection_datetime"`
}

type EvidenceAuditLog struct {
	HistoryID      int       `json:"history_id"`
	EvidenceNumber int       `json:"evidence_number"`
	Status         string    `json:"status"`
	ChangedAt      time.Time `json:"changed_at"`
	Remarks        string    `json:"remarks"`
}