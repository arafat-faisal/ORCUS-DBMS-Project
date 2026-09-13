"use client";

import React from "react";

export type StatusType =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "assigned"
  | "inquiry"
  | "investigating"
  | "registered"
  | "resolved"
  | "closed"
  | "rejected"
  | "archived";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const norm = (status || "").toLowerCase().replace(/[_\s-]+/g, "_");

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-300"; // Neutral default

  // Information (Blue)
  if (
    [
      "open",
      "submitted",
      "assigned",
      "assigned_for_inquiry",
      "investigation_pending",
      "under_investigation",
    ].includes(norm)
  ) {
    colorClasses = "bg-blue-50 text-blue-700 border-blue-200";
  }
  // Warning (Amber)
  else if (
    [
      "pending_review",
      "under_review",
      "submitted_for_approval",
      "submitted_for_verification",
      "inquiry_in_progress",
      "awaiting_information",
    ].includes(norm)
  ) {
    colorClasses = "bg-amber-50 text-amber-800 border-amber-200";
  }
  // Success (Green)
  else if (
    [
      "approved",
      "verified",
      "registered",
      "case_opened",
      "resolved",
      "closed",
      "stored_in_vault",
    ].includes(norm)
  ) {
    colorClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  // Purple / Escalated
  else if (["linked_to_fir", "court_exhibit", "presented_in_court"].includes(norm)) {
    colorClasses = "bg-purple-50 text-purple-700 border-purple-200";
  }
  // Error (Red / Rose)
  else if (["rejected", "suspended", "disposed"].includes(norm)) {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClasses} ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}
