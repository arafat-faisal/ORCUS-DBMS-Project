"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { FIR, FIRStatusHistory } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackStates";
import { PrintHeader } from "@/components/ui/PrintHeader";
import {
  Scale,
  Printer,
  FolderLock,
  Building,
  User,
  Calendar,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function FIRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const firId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { locale, formatDateTime } = useLocale();

  const [fir, setFir] = useState<FIR | null>(null);
  const [history, setHistory] = useState<FIRStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update panel
  const [targetStatus, setTargetStatus] = useState("Under Investigation");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  const fetchFIRDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const [firRes, histRes] = await Promise.all([
        api.getFIR(firId),
        api.getFIRHistory(firId),
      ]);

      if (firRes.success && firRes.data) {
        setFir(firRes.data);
      } else {
        setError(firRes.error || "Failed to load First Information Report");
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
    } catch {
      setError("Network error while communicating with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFIRDetails();
  }, [firId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    setStatusFeedback(null);
    try {
      const res = await api.updateFIRStatus(firId, {
        status: targetStatus,
        decision: `Workflow status updated to ${targetStatus}`,
        reason: decisionNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setFir(res.data);
        setDecisionNotes("");
        setStatusFeedback("FIR status transition recorded.");
        const histRes = await api.getFIRHistory(firId);
        if (histRes.success && histRes.data) setHistory(histRes.data);
      } else {
        setStatusFeedback(res.error || "Failed to update status.");
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

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PrintHeader
          title="Official First Information Report (FIR) - Form No. 27"
          referenceNo={fir?.fir_number || `FIR-${firId}`}
        />

        {loading ? (
          <LoadingState message={locale === "bn" ? "এজাহার বিবরণ লোড হচ্ছে..." : "Loading FIR details..."} />
        ) : error || !fir ? (
          <ErrorState message={error || "First Information Report not found"} onRetry={fetchFIRDetails} />
        ) : (
          <>
            {/* Header */}
            <div className="no-print">
              <PageHeader
                title={`First Information Report: ${fir.fir_number}`}
                description={`Under Section 154 Code of Criminal Procedure &bull; Category: ${fir.crime_category}`}
                breadcrumbs={[
                  { label: "ORCUS", href: "/dashboard" },
                  { label: "First Information Report (FIR)", href: "/fir" },
                  { label: fir.fir_number },
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
                      href={`/cases/new?fir_id=${fir.fir_id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "তদন্ত মামলা খুলুন" : "Open Investigation Case"}</span>
                    </Link>
                  </div>
                }
              />
            </div>

            {/* Main Record Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={fir.current_status} />
                      <span className="text-xs text-slate-500 font-mono">
                        Filed: {formatDateTime(fir.filed_date)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Branch: <strong className="text-slate-800">{fir.branch_name || "Headquarters"}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Offense Category</span>
                      <span className="text-sm font-bold text-slate-900">{fir.crime_category}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Informant / Complainant</span>
                      <span className="font-semibold text-slate-900">{fir.complainant_name || "State Informant"}</span>
                      {fir.complainant_phone && (
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {fir.complainant_phone}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Place of Occurrence</span>
                      <span className="text-slate-800">{fir.place_of_occurrence || "Jurisdiction of Thana"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Date & Time of Occurrence</span>
                      <span className="text-slate-800">
                        {fir.incident_date || "Recorded upon inquiry"}{" "}
                        {fir.incident_time ? `at ${fir.incident_time}` : ""}
                      </span>
                    </div>
                  </div>

                  {/* Legal Sections */}
                  <div>
                    <span className="text-slate-500 block text-[11px] mb-1.5">Applicable Legal Sections</span>
                    {fir.legal_sections && fir.legal_sections.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {fir.legal_sections.map((sec) => (
                          <span
                            key={sec.section_id}
                            className="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-800"
                          >
                            <strong>{sec.section_code}</strong>: {sec.section_title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Penal Code sections logged in case file</span>
                    )}
                  </div>

                  {/* Link to Source Records */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500">Source General Diary: </span>
                      {fir.gd_number ? (
                        <span className="font-mono font-bold text-blue-700">{fir.gd_number}</span>
                      ) : (
                        <span className="text-slate-500 italic">Direct Formal Lodging</span>
                      )}
                    </div>
                    {fir.source_complaint_id && (
                      <Link
                        href={`/complaints/${fir.source_complaint_id}`}
                        className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
                      >
                        <span>Original Complaint #{fir.source_complaint_id}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Workflow Status Action Panel */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 no-print">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Update First Information Report Status
                  </h3>

                  {statusFeedback && (
                    <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>{statusFeedback}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          <option value="Case Opened">Case Opened</option>
                          <option value="Charge Sheet Submitted">Charge Sheet Submitted (পুলিশ প্রতিবেদন)</option>
                          <option value="Final Report Submitted">Final Report Submitted (চূড়ান্ত প্রতিবেদন)</option>
                          <option value="Stayed by Court">Stayed by Court</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Remarks / Reason
                        </label>
                        <input
                          type="text"
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                          placeholder="e.g. Investigation officer assigned; witnesses summoned"
                          className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        />
                      </div>
                    </div>

                    <div className="text-right pt-1">
                      <button
                        type="submit"
                        disabled={updating}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{updating ? "Saving..." : "Save Status Transition"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Status History */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Legal Progression History
                  </h3>

                  {history.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No status transitions recorded yet.
                    </div>
                  ) : (
                    <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                      {history.map((h, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <StatusBadge status={h.new_status} />
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {formatDateTime(h.created_at)}
                          </div>
                          {h.reason && (
                            <p className="text-slate-700 mt-1 bg-slate-50 p-2 rounded border border-slate-100">
                              {h.reason}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Officer: {h.acting_username || "System Officer"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
