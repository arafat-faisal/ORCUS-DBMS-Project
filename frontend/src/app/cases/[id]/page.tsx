"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { CaseDossier, CaseStatusHistory } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackStates";
import { PrintHeader } from "@/components/ui/PrintHeader";
import {
  FolderLock,
  Printer,
  Users,
  Package,
  MapPin,
  Calendar,
  Building,
  User,
  Scale,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
  FileText,
  Activity,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const caseId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { locale, formatDateTime } = useLocale();

  const [dossier, setDossier] = useState<CaseDossier | null>(null);
  const [history, setHistory] = useState<CaseStatusHistory[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "participants" | "officers" | "locations" | "evidence" | "activities" | "history"
  >("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition form state
  const [targetStatus, setTargetStatus] = useState("Under Investigation");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Delete Case state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingCase, setDeletingCase] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteCase = async () => {
    setDeletingCase(true);
    setDeleteError(null);
    try {
      const res = await api.deleteCase(caseId);
      if (res.success) {
        router.push("/cases");
      } else {
        setDeleteError(res.error || "Failed to delete case dossier.");
      }
    } catch {
      setDeleteError("Network error while deleting case dossier.");
    } finally {
      setDeletingCase(false);
    }
  };

  const fetchCaseData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dossierRes, histRes] = await Promise.all([
        api.getCaseDossier(caseId),
        api.getCaseHistory(caseId),
      ]);

      if (dossierRes.success && dossierRes.data) {
        setDossier(dossierRes.data);
      } else {
        setError(dossierRes.error || "Failed to load case dossier");
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } catch {
      setError("Network error while loading case dossier.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [caseId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    setStatusFeedback(null);
    try {
      const res = await api.updateCaseStatus(caseId, {
        status: targetStatus,
        remarks: remarks.trim() || `Status updated to ${targetStatus}`,
      });

      if (res.success && res.data) {
        setStatusFeedback("Case status updated successfully.");
        setRemarks("");
        // Reload dossier & history
        const [dRefreshed, hRefreshed] = await Promise.all([
          api.getCaseDossier(caseId),
          api.getCaseHistory(caseId),
        ]);
        if (dRefreshed.success && dRefreshed.data) setDossier(dRefreshed.data);
        if (hRefreshed.success && hRefreshed.data) setHistory(hRefreshed.data);
      } else {
        setStatusFeedback(res.error || "Failed to update case status.");
      }
    } catch {
      setStatusFeedback("Network error while updating status.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const caseItem = dossier?.case;
  const evidenceList = dossier?.evidence_items || dossier?.evidence || [];
  const suspectsList = dossier?.suspects || [];
  const victimsList = dossier?.victims || [];
  const witnessesList = dossier?.witnesses || [];
  const locationsList = dossier?.locations || [];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <PrintHeader
          title="Investigation Case Dossier"
          referenceNo={caseItem?.fir_number ? `CASE-${caseId} (${caseItem.fir_number})` : `CASE-${caseId}`}
        />

        {loading ? (
          <LoadingState message={locale === "bn" ? "মামলার ডসিয়ার লোড হচ্ছে..." : "Loading case dossier..."} />
        ) : error || !caseItem ? (
          <ErrorState message={error || "Case record not found"} onRetry={fetchCaseData} />
        ) : (
          <>
            {/* Header */}
            <div className="no-print">
              <PageHeader
                title={`Case #${caseId}: ${caseItem.case_title}`}
                description={`Lead: ${caseItem.lead_officer_name || "Unassigned"} &bull; Branch: ${caseItem.branch_name || "Headquarters"}`}
                breadcrumbs={[
                  { label: "ORCUS", href: "/dashboard" },
                  { label: "Cases", href: "/cases" },
                  { label: `Case #${caseId}` },
                ]}
                action={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "প্রিন্ট" : "Print Dossier"}</span>
                    </button>
                    <Link
                      href={`/evidence/new?case_id=${caseId}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "আলামত যোগ করুন" : "Register Evidence"}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
                      title="Permanently delete this case and child records"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "মামলা মুছুন" : "Delete Case"}</span>
                    </button>
                  </div>
                }
              />
            </div>

            {/* Quick Summary Pill Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={caseItem.case_status || caseItem.status || "Open"} />
                <span className="text-xs text-slate-500">
                  Opened on {formatDateTime(caseItem.opened_date)}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="text-xs text-slate-700 font-medium">
                  {caseItem.crime_category || "Criminal Investigation"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Suspects: <strong className="text-slate-800">{suspectsList.length}</strong></span>
                <span>Evidence: <strong className="text-slate-800">{evidenceList.length}</strong></span>
                <span>Locations: <strong className="text-slate-800">{locationsList.length}</strong></span>
              </div>
            </div>

            {/* 7 Clean Navigation Tabs */}
            <div className="border-b border-slate-200 no-print flex gap-6 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. Overview
              </button>
              <button
                onClick={() => setActiveTab("participants")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "participants"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                2. Participants ({suspectsList.length + victimsList.length + witnessesList.length})
              </button>
              <button
                onClick={() => setActiveTab("officers")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "officers"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                3. Officers
              </button>
              <button
                onClick={() => setActiveTab("locations")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "locations"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                4. Locations ({locationsList.length})
              </button>
              <button
                onClick={() => setActiveTab("evidence")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "evidence"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                5. Evidence ({evidenceList.length})
              </button>
              <button
                onClick={() => setActiveTab("activities")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "activities"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                6. Activities
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`pb-2.5 transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === "history"
                    ? "border-blue-700 text-blue-800"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                7. History ({history.length})
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-6">
                    {/* Case Summary Card */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                        Case Overview & Legal Foundation
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Crime Category</span>
                          <span className="font-semibold text-slate-900">
                            {caseItem.crime_category || "Organised Crime"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Source FIR</span>
                          <span className="font-mono font-bold text-indigo-700">
                            {caseItem.fir_number || "Direct Filing"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Opened Date</span>
                          <span className="text-slate-800">{formatDateTime(caseItem.opened_date)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Lead Investigator</span>
                          <span className="font-semibold text-slate-900">
                            {caseItem.lead_officer_name || "Unassigned"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Jurisdiction / Branch</span>
                          <span className="text-slate-800">{caseItem.branch_name || "Headquarters"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">District</span>
                          <span className="text-slate-800">{caseItem.district || "Dhaka"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Legal Sections Card */}
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                        Applicable Legal Sections
                      </h3>
                      {dossier.legal_sections && dossier.legal_sections.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {dossier.legal_sections.map((sec) => (
                            <div
                              key={sec.section_id}
                              className="px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800"
                            >
                              <strong className="font-mono">{sec.section_code}</strong>: {sec.section_title}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          Penal Code sections registered in primary court filing.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Status Transition Action Panel */}
                  <div className="space-y-6">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 no-print">
                      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                        Update Case Workflow Status
                      </h3>

                      {statusFeedback && (
                        <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                          <span>{statusFeedback}</span>
                        </div>
                      )}

                      <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            New Workflow Status
                          </label>
                          <select
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                          >
                            <option value="Under Investigation">Under Investigation</option>
                            <option value="Pending Review">Pending Review (Supervisory)</option>
                            <option value="Closed">Closed (Resolved)</option>
                            <option value="Reopened">Reopened</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Investigation Remarks
                          </label>
                          <textarea
                            rows={3}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter supervisory direction, reason for transition, or judicial summary..."
                            className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={updating}
                          className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
                        >
                          {updating ? "Saving..." : "Save Workflow Transition"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PARTICIPANTS */}
            {activeTab === "participants" && (
              <div className="space-y-6">
                {/* Suspects */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>Suspects Under Investigation ({suspectsList.length})</span>
                  </h3>
                  {suspectsList.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3">No suspects linked to this case file.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 text-xs">
                      {suspectsList.map((s) => (
                        <div key={s.suspect_id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-slate-900">
                              {s.first_name} {s.last_name}
                            </span>
                            <span className="text-slate-500 ml-2">
                              Role: {s.role_in_crime || s.role_or_impact || "Alleged principal"}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              s.suspicion_level === "High"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            Suspicion: {s.suspicion_level}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Victims & Witnesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Victims */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Victims ({victimsList.length})
                    </h3>
                    {victimsList.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3">No victims recorded.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {victimsList.map((v) => (
                          <div key={v.victim_id} className="py-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{v.name}</span>
                            <span className="text-slate-500">
                              {v.is_deceased ? "Deceased" : "Protected"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Witnesses */}
                  <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Witnesses ({witnessesList.length})
                    </h3>
                    {witnessesList.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3">No witnesses recorded.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 text-xs">
                        {witnessesList.map((w) => (
                          <div key={w.witness_id} className="py-2 flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{w.name}</span>
                            <span className="text-slate-500">Reliability: {w.reliability}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OFFICERS */}
            {activeTab === "officers" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Assigned Investigating Officers & Chain of Command
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                      Lead Investigating Officer (IO)
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      {caseItem.lead_officer_name || "Unassigned"}
                    </div>
                    <div className="text-slate-600">
                      Rank: {caseItem.lead_officer_rank || "Inspector / Sub-Inspector"}
                    </div>
                    <div className="text-slate-500 font-mono">
                      Badge: {caseItem.lead_officer_badge || "N/A"}
                    </div>
                  </div>

                  <div className="p-4 rounded-md border border-slate-200 bg-slate-50 space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                      Supervisory Officer (OC / ASP)
                    </div>
                    <div className="text-sm font-bold text-slate-900">Officer-in-Charge</div>
                    <div className="text-slate-600">
                      Branch: {caseItem.branch_name || "Headquarters"}
                    </div>
                    <div className="text-slate-500">Supervisory case clearance jurisdiction</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: LOCATIONS */}
            {activeTab === "locations" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Geographical Occurrence & Key Sites ({locationsList.length})
                </h3>
                {locationsList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No location points mapped to this case file.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {locationsList.map((loc) => (
                      <div key={loc.location_id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">{loc.address}</div>
                          <div className="text-slate-500">
                            {loc.area}, {loc.city}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {loc.location_role || "Incident Site"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: EVIDENCE */}
            {activeTab === "evidence" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Forensic & Documentary Evidence Items ({evidenceList.length})
                  </h3>
                  <Link
                    href={`/evidence/new?case_id=${caseId}`}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    <span>Register New Evidence</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {evidenceList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">No evidence registered in this case file yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {evidenceList.map((ev) => (
                      <div key={ev.evidence_id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">
                              EV-{ev.evidence_id}
                            </span>
                            <span className="font-semibold text-slate-900">{ev.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Type: {ev.evidence_type} &bull; Storage: {ev.storage_location || "Vault Locker"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={ev.status} />
                          <Link
                            href={`/evidence/${ev.evidence_id}`}
                            className="px-2 py-1 text-xs text-blue-700 hover:text-blue-900 border border-slate-200 rounded bg-slate-50"
                          >
                            Chain Log
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: ACTIVITIES */}
            {activeTab === "activities" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Investigative Activities & Daily Case Diary (সিডি)
                </h3>
                <div className="p-4 bg-slate-50 rounded-md border border-slate-200 text-xs space-y-2 text-slate-700">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <Activity className="w-4 h-4 text-blue-700" />
                    <span>Case Diary Log Entries</span>
                  </div>
                  <p className="leading-relaxed">
                    Under Section 172 of the Code of Criminal Procedure, day-to-day investigative actions, witness examination summaries, and search seizures are recorded chronologically in the Case Diary (CD).
                  </p>
                </div>
              </div>
            )}

            {/* TAB 7: HISTORY */}
            {activeTab === "history" && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Case Status Transition History ({history.length})
                </h3>

                {history.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No status transitions logged yet.
                  </div>
                ) : (
                  <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                    {history.map((h, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <StatusBadge status={h.status} />
                          <span className="text-slate-500 text-[11px]">
                            {formatDateTime(h.changed_at)}
                          </span>
                        </div>
                        {h.remarks && (
                          <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {h.remarks}
                          </p>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Officer: {h.changed_by || `User #${h.changed_by_user_id || "System"}`}
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
          title="Delete Investigation Case"
          itemType="Case Dossier"
          itemName={caseItem ? `CASE-${caseId}: ${caseItem.case_title}` : `CASE-${caseId}`}
          warningDetails="Permanently deletes this case dossier. This operation cascades to remove linked evidence records, participant associations (suspects, victims, witnesses), and unlinks reference from the originating FIR/GD."
          isDeleting={deletingCase}
          error={deleteError}
          onConfirm={handleDeleteCase}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </AppShell>
  );
}
