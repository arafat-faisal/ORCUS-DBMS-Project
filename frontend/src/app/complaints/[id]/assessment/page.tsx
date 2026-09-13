"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Complaint, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Send,
  Building,
} from "lucide-react";

export default function ComplaintAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const { locale } = useLocale();

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

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <PageHeader
          title={locale === "bn" ? "আইনি মূল্যায়ন ও অগ্রগতি" : "Official Complaint Assessment"}
          description={
            locale === "bn"
              ? "ডিউটি অফিসার কর্তৃক অভিযোগের আইনগত বৈশিষ্ট্য যাচাই এবং সিদ্ধান্ত লিপিবদ্ধকরণ।"
              : "Review jurisdiction, substantiate legal allegations, and authorize conversion to General Diary or FIR."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Complaints", href: "/complaints" },
            { label: complaint?.tracking_code || `CMP-${id}`, href: `/complaints/${id}` },
            { label: "Assessment" },
          ]}
        />

        {loading ? (
          <LoadingState message="Loading complaint assessment workspace..." />
        ) : errorMessage && !complaint ? (
          <ErrorState message={errorMessage} onRetry={() => window.location.reload()} />
        ) : complaint && (
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header info */}
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-blue-800">
                  {complaint.tracking_code}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">{complaint.title}</h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Complainant: <strong>{complaint.complainant_name || "Direct Informant"}</strong> &bull; Branch: {complaint.branch_name}
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge status={complaint.current_status} />
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Progression Status <span className="text-red-500">*</span>
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
                        setPublicStatusMessage("Complaint resolved via station inquiry.");
                      } else if (e.target.value === "Rejected") {
                        setDecision("Petition Groundless / Civil Dispute");
                        setPublicStatusMessage("Complaint closed after inquiry. No further inquiry warranted.");
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified - Merits Action</option>
                    <option value="Converted to GD">Convert to General Diary (GD)</option>
                    <option value="Converted to FIR">Submit for FIR Registration Review</option>
                    <option value="Transferred">Transfer to Another Station</option>
                    <option value="Correction Required">Correction Required</option>
                    <option value="Resolved">Resolved Direct</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Decision Summary <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                    placeholder="e.g. Non-cognizable incident - Approved for GD"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {newStatus === "Transferred" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Station Branch (Jurisdictional Transfer) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={transferBranchId || ""}
                    onChange={(e) => setTransferBranchId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Select Destination Police Station</option>
                    {branches
                      .filter((b) => b.branch_id !== complaint.receiving_branch_id)
                      .map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.branch_name} ({b.district})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Legal Justification / Official Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the legal rationale under Penal Code or Police Regulations (PRB)..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Citizen-Facing Status Notice (Visible on Public Tracker)
                </label>
                <input
                  type="text"
                  value={publicStatusMessage}
                  onChange={(e) => setPublicStatusMessage(e.target.value)}
                  placeholder="e.g. Your complaint has been reviewed and forwarded for GD registration."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link
                  href={`/complaints/${id}`}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Complaint</span>
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? "Submitting Assessment..." : "Commit Assessment"}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
