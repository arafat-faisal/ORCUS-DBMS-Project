"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Complaint, ComplaintStatusHistory, ComplaintTransferHistory } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackStates";
import { PrintHeader } from "@/components/ui/PrintHeader";
import {
  FileText,
  User,
  MapPin,
  Scale,
  Calendar,
  Clock,
  Printer,
  FileCheck2,
  FileSpreadsheet,
  ArrowRight,
  Send,
  History,
  AlertCircle,
  Building,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function ComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { locale, formatDateTime } = useLocale();

  const id = Number(params?.id);

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [transfers, setTransfers] = useState<ComplaintTransferHistory[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "assessment" | "related" | "history">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Delete complaint state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingComplaint, setDeletingComplaint] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteComplaint = async () => {
    setDeletingComplaint(true);
    setDeleteError(null);
    try {
      const res = await api.deleteComplaint(id);
      if (res.success) {
        router.push("/complaints");
      } else {
        setDeleteError(res.error || "Failed to delete complaint record.");
      }
    } catch {
      setDeleteError("Network error while deleting complaint record.");
    } finally {
      setDeletingComplaint(false);
    }
  };

  // Assessment quick form state
  const [decision, setDecision] = useState("Under Review");
  const [assessmentNotes, setAssessmentNotes] = useState("");
  const [assessing, setAssessing] = useState(false);
  const [assessmentFeedback, setAssessmentFeedback] = useState<string | null>(null);

  const fetchComplaintDetails = async () => {
    if (!id || isNaN(id)) return;
    setLoading(true);
    setError(null);
    try {
      const [compRes, histRes, transRes] = await Promise.all([
        api.getComplaint(id),
        api.getComplaintHistory(id),
        api.getComplaintTransfers(id),
      ]);

      if (compRes.success && compRes.data) {
        setComplaint(compRes.data);
      } else {
        setError(compRes.error || "Complaint record not found.");
      }
      if (histRes.success && histRes.data) setHistory(histRes.data);
      if (transRes.success && transRes.data) setTransfers(transRes.data);
    } catch {
      setError("Failed to fetch complaint details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentNotes.trim()) {
      setAssessmentFeedback("Please provide assessment remarks / justification.");
      return;
    }

    setAssessing(true);
    setAssessmentFeedback(null);
    try {
      const res = await api.assessComplaint(id, {
        new_status: decision,
        decision: decision,
        reason: assessmentNotes.trim(),
        public_status_message: `Complaint assessed: ${decision}`,
        internal_notes: assessmentNotes.trim(),
      });

      if (res.success && res.data) {
        setComplaint(res.data);
        setAssessmentNotes("");
        setAssessmentFeedback("Assessment updated successfully.");
        // Refresh history
        const histRes = await api.getComplaintHistory(id);
        if (histRes.success && histRes.data) setHistory(histRes.data);
      } else {
        setAssessmentFeedback(res.error || "Failed to update assessment.");
      }
    } catch {
      setAssessmentFeedback("Network error while submitting assessment.");
    } finally {
      setAssessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PrintHeader
          title="Citizen Complaint Intake Record"
          referenceNo={complaint?.tracking_code || `CMP-${id}`}
        />

        {loading ? (
          <LoadingState message={locale === "bn" ? "অভিযোগ রেকর্ড লোড হচ্ছে..." : "Loading complaint record..."} />
        ) : error || !complaint ? (
          <ErrorState message={error || "Complaint not found"} onRetry={fetchComplaintDetails} />
        ) : (
          <>
            {/* Standard Header */}
            <div className="no-print">
              <PageHeader
                title={`${complaint.tracking_code}`}
                description={`${complaint.title}`}
                breadcrumbs={[
                  { label: "ORCUS", href: "/dashboard" },
                  { label: locale === "bn" ? "অভিযোগ" : "Complaints", href: "/complaints" },
                  { label: complaint.tracking_code },
                ]}
                action={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "প্রিন্ট" : "Print Record"}</span>
                    </button>
                    <Link
                      href={`/gd/new`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "জিডি রূপান্তর / তৈরি" : "Create / Convert GD"}</span>
                    </Link>
                    <Link
                      href={`/fir/new`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "এজাহার (FIR) রূপান্তর" : "Create / Convert FIR"}</span>
                    </Link>
                    <Link
                      href={`/complaints/${id}/assessment`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "মূল্যায়ন" : "Formal Assessment"}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
                      title="Permanently delete this complaint record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "অভিযোগ মুছুন" : "Delete"}</span>
                    </button>
                  </div>
                }
              />
            </div>

            {/* Status & Summary Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={complaint.current_status} />
                <span className="text-xs text-slate-500">
                  Submitted on {formatDateTime(complaint.submitted_at || complaint.incident_date)}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs font-medium text-slate-700">
                  Branch: {complaint.branch_name || "Headquarters"}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Category: <strong className="text-slate-800">{complaint.category_name || "General"}</strong>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 no-print flex gap-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "overview"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("assessment")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "assessment"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Assessment & Conversion
              </button>
              <button
                onClick={() => setActiveTab("related")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "related"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Related Records (GD / FIR / Case)
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  activeTab === "history"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                History ({history.length})
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Incident Summary Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Incident Particulars
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Title</span>
                      <span className="font-semibold text-slate-900">{complaint.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Date & Time</span>
                      <span className="font-medium text-slate-800">
                        {complaint.incident_date}{" "}
                        {complaint.incident_time ? `at ${complaint.incident_time}` : ""}
                        {complaint.approximate_time ? " (Approximate)" : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Urgency</span>
                      <span className="font-semibold text-amber-700">{complaint.urgency}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1">Narrative Description</span>
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 leading-relaxed text-xs whitespace-pre-line">
                      {complaint.description}
                    </div>
                  </div>
                </div>

                {/* Complainant Card */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Complainant Coordinates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Complainant Name</span>
                      <span className="font-semibold text-slate-900">
                        {complaint.complainant_name || "Citizen Informant"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Contact Mobile</span>
                      <span className="font-mono text-slate-800">
                        {complaint.complainant_phone || "Not recorded"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Intake Channel</span>
                      <span className="text-slate-700">{complaint.submission_channel || "Walk-in"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ASSESSMENT */}
            {activeTab === "assessment" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Official Assessment & Workflow Transition
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assess whether the complaint constitutes a non-cognizable incident (GD) or warrants submission for FIR registration review.
                  </p>
                </div>

                {assessmentFeedback && (
                  <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>{assessmentFeedback}</span>
                  </div>
                )}

                <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Assessment Status Decision
                      </label>
                      <select
                        value={decision}
                        onChange={(e) => setDecision(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="Under Review">Under Review</option>
                        <option value="Verified">Verified - Merits Action</option>
                        <option value="Correction Required">Correction Required</option>
                        <option value="Rejected">Rejected / Insufficient Basis</option>
                        <option value="Resolved">Resolved Direct</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Current Status
                      </label>
                      <div className="py-2">
                        <StatusBadge status={complaint.current_status} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assessment Justification / Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={assessmentNotes}
                      onChange={(e) => setAssessmentNotes(e.target.value)}
                      placeholder="Enter legal rationale, inquiry officer notes, or directions for converting to GD or FIR..."
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Link
                      href={`/complaints/${id}/assessment`}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <span>Open Full Assessment & Legal Section Mapping</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="submit"
                      disabled={assessing}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50"
                    >
                      {assessing ? "Saving..." : "Save Assessment"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: RELATED RECORDS */}
            {activeTab === "related" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Database Links to Downstream Records
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* General Diary Link */}
                  <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50">
                    <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>General Diary (GD)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                      Non-cognizable station entry or initial lost property log.
                    </p>
                    <Link
                      href={`/gd`}
                      className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      <span>View GD Registry</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* FIR Link */}
                  <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50">
                    <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      <span>First Information Report (FIR)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                      Formal criminal intake registration and inquiry record.
                    </p>
                    <Link
                      href={`/fir`}
                      className="inline-flex items-center gap-1 text-indigo-700 hover:text-indigo-900 font-semibold"
                    >
                      <span>View FIR Registry</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Case Link */}
                  <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50">
                    <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-emerald-600" />
                      <span>Investigation Case</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-3 leading-snug">
                      Formal investigatory dossier with assigned lead officer.
                    </p>
                    <Link
                      href={`/cases`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-semibold"
                    >
                      <span>View Case Dossiers</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: HISTORY */}
            {activeTab === "history" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Chronological Status History
                </h3>
                {history.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No status transitions logged yet.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {history.map((h, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <StatusBadge status={h.new_status} />
                          <span className="text-slate-500 text-[11px]">
                            {formatDateTime(h.created_at)}
                          </span>
                        </div>
                        {h.reason && (
                          <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {h.reason}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Acting Officer: {h.acting_username || "System Officer"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          title="Delete Citizen Complaint"
          itemType="Complaint Record"
          itemName={complaint ? `${complaint.tracking_code}: ${complaint.title}` : `CMP-${id}`}
          warningDetails="Permanently deletes this complaint intake record and cleans up status and transfer logs. Unlinks associated GD and FIR linkages if any exist."
          isDeleting={deletingComplaint}
          error={deleteError}
          onConfirm={handleDeleteComplaint}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </AppShell>
  );
}
