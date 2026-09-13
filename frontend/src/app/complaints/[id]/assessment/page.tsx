"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Share2,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { Complaint, AgencyBranch } from "@/lib/types";

export default function ComplaintAssessmentPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params?.id);

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Assessment Form Fields
  const [newStatus, setNewStatus] = useState("Under Review");
  const [decision, setDecision] = useState("Preliminary Intake Review");
  const [reason, setReason] = useState("");
  const [publicStatusMessage, setPublicStatusMessage] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [transferBranchId, setTransferBranchId] = useState<number | undefined>();

  useEffect(() => {
    async function load() {
      if (!id || isNaN(id)) return;
      try {
        const [compRes, branchRes] = await Promise.all([
          api.getComplaint(id),
          api.listBranches(),
        ]);
        if (compRes.success && compRes.data) {
          setComplaint(compRes.data);
          // Pre-populate recommended values
          if (compRes.data.current_status === "Submitted") {
            setNewStatus("Under Review");
            setDecision("Intake Assessment Initiated");
            setPublicStatusMessage("Your complaint is under preliminary review by the duty officer.");
          } else if (compRes.data.current_status === "Under Review") {
            setNewStatus("Verified");
            setDecision("Allegation Verified & Classified");
            setPublicStatusMessage("Complaint verified. Awaiting official registration approval.");
          }
        } else {
          setErrorMessage("Failed to load complaint details.");
        }
        if (branchRes.success && branchRes.data) {
          setBranches(branchRes.data);
        }
      } catch {
        setErrorMessage("Network error.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!decision.trim()) {
      setErrorMessage("Decision summary is required.");
      return;
    }
    if (!reason.trim()) {
      setErrorMessage("Formal justification/reason is required for all state transitions.");
      return;
    }

    setSubmitting(true);
    try {
      // If transferring
      if (newStatus === "Transferred") {
        if (!transferBranchId) {
          setErrorMessage("Target destination branch is required for jurisdictional transfer.");
          setSubmitting(false);
          return;
        }
        const transRes = await api.transferComplaint(id, transferBranchId, reason.trim());
        if (!transRes.success) {
          setErrorMessage(transRes.error || "Failed to transfer complaint.");
          setSubmitting(false);
          return;
        }
      }

      // Normal Assessment
      const res = await api.assessComplaint(id, {
        new_status: newStatus,
        decision: decision.trim(),
        reason: reason.trim(),
        public_status_message: publicStatusMessage.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
      });

      if (res.success) {
        router.push(`/complaints/${id}`);
      } else {
        setErrorMessage(res.error || "Failed to record complaint assessment.");
      }
    } catch {
      setErrorMessage("Network error executing assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="py-24 text-center text-slate-400">Loading Assessment Interface...</div>
      </PortalLayout>
    );
  }

  if (!complaint) {
    return (
      <PortalLayout>
        <div className="py-12 text-center text-red-400">{errorMessage || "Record not found"}</div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href={`/complaints/${id}`} className="hover:text-emerald-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Complaint {complaint.tracking_code}</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200">Assessment & Disposition</span>
        </div>

        {/* Assessment Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Official Intake Assessment
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                Current: {complaint.current_status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              Evaluate Complaint: {complaint.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Tracking Reference: <span className="text-emerald-400 font-mono">{complaint.tracking_code}</span> &bull; {complaint.branch_name}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                New Progression Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => {
                  setNewStatus(e.target.value);
                  if (e.target.value === "Converted to GD") {
                    setDecision("Non-Cognizable Incident - Register GD");
                    setPublicStatusMessage("Approved for GD registration at the station.");
                  } else if (e.target.value === "Converted to FIR") {
                    setDecision("Cognizable Offense Established - Register FIR");
                    setPublicStatusMessage("Cognizable offense substantiated. Forwarded for FIR registration.");
                  } else if (e.target.value === "Correction Required") {
                    setDecision("Supplementary Details Required from Citizen");
                    setPublicStatusMessage("Please contact the station or update your submission with the requested details.");
                  } else if (e.target.value === "Resolved") {
                    setDecision("Matter Settled / General Service Rendered");
                    setPublicStatusMessage("Complaint resolved via local consultation/service.");
                  } else if (e.target.value === "Rejected") {
                    setDecision("Petition Groundless / Civil Dispute");
                    setPublicStatusMessage("Complaint closed after inquiry. No police cognizance warranted.");
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 font-medium focus:outline-none"
              >
                <option value="Under Review">Under Review</option>
                <option value="Correction Required">Correction Required</option>
                <option value="Verified">Verified</option>
                <option value="Converted to GD">Converted to GD</option>
                <option value="Converted to FIR">Converted to FIR</option>
                <option value="Transferred">Transferred (Jurisdictional)</option>
                <option value="Resolved">Resolved (General Service)</option>
                <option value="Rejected">Rejected</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* If Transferred, select destination branch */}
            {newStatus === "Transferred" && (
              <div className="bg-purple-950/30 border border-purple-800/60 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                  <Share2 className="w-4 h-4" />
                  <span>Select Destination Police Branch *</span>
                </div>
                <select
                  required
                  value={transferBranchId || ""}
                  onChange={(e) => setTransferBranchId(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
                >
                  <option value="">-- Choose Target Branch --</option>
                  {branches
                    .filter((b) => b.branch_id !== complaint.receiving_branch_id)
                    .map((b) => (
                      <option key={b.branch_id} value={b.branch_id}>
                        {b.branch_name} ({b.branch_code}) - {b.district}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Official Decision Title *
              </label>
              <input
                type="text"
                required
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                placeholder="e.g. Cognizable Offense Established - Register FIR"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Formal Justification / Reason *
              </label>
              <textarea
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the legal justification, evidentiary findings, or jurisdictional rationale for this transition..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1.5">
                Public Tracking Status Message (Visible to Citizen)
              </label>
              <input
                type="text"
                value={publicStatusMessage}
                onChange={(e) => setPublicStatusMessage(e.target.value)}
                placeholder="Public-safe guidance text displayed when citizen queries tracking code..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                Confidential Internal Police Notes
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Additional confidential notes for supervising officers..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link
                href={`/complaints/${id}`}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium text-xs sm:text-sm transition shadow-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Action...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Record Official Disposition</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
