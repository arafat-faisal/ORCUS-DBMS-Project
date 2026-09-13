"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { GD, GDStatusHistory, LegalSection } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackStates";
import { PrintHeader } from "@/components/ui/PrintHeader";
import {
  FileSpreadsheet,
  Printer,
  Scale,
  Calendar,
  Building,
  User,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function GDDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gdId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { locale, formatDateTime } = useLocale();

  const [gd, setGd] = useState<GD | null>(null);
  const [history, setHistory] = useState<GDStatusHistory[]>([]);
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update panel state
  const [targetStatus, setTargetStatus] = useState("Assigned for Inquiry");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Escalate to FIR panel state
  const [showEscalate, setShowEscalate] = useState(false);
  const [crimeCategory, setCrimeCategory] = useState("Theft");
  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [escalating, setEscalating] = useState(false);
  const [escalateFeedback, setEscalateFeedback] = useState<string | null>(null);

  const fetchGDDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const [gdRes, histRes, secRes] = await Promise.all([
        api.getGD(gdId),
        api.getGDHistory(gdId),
        api.listLegalSections(),
      ]);

      if (gdRes.success && gdRes.data) {
        setGd(gdRes.data);
      } else {
        setError(gdRes.error || "Failed to load General Diary details");
      }

      if (histRes.success && histRes.data) setHistory(histRes.data);
      if (secRes.success && secRes.data) setSections(secRes.data);
    } catch {
      setError("Network error while communicating with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGDDetails();
  }, [gdId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    setStatusFeedback(null);
    try {
      const res = await api.updateGDStatus(gdId, {
        status: targetStatus,
        decision: `Status updated to ${targetStatus}`,
        reason: decisionNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setGd(res.data);
        setDecisionNotes("");
        setStatusFeedback("GD status updated successfully.");
        const histRes = await api.getGDHistory(gdId);
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

  const handleEscalateToFIR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSections.length === 0) {
      setEscalateFeedback("Please select at least one applicable legal section from the Penal Code.");
      return;
    }

    setEscalating(true);
    setEscalateFeedback(null);
    try {
      const res = await api.linkGDToFIR(gdId, {
        crime_category: crimeCategory,
        filed_date: new Date().toISOString().split("T")[0],
        section_ids: selectedSections,
      });

      if (res.success && res.data) {
        router.push(`/fir/${res.data.fir_id}`);
      } else {
        setEscalateFeedback(res.error || "Failed to escalate GD to formal FIR.");
      }
    } catch {
      setEscalateFeedback("Network error during FIR registration.");
    } finally {
      setEscalating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PrintHeader
          title="Official General Diary (GD) Register Entry"
          referenceNo={gd?.gd_number || `GD-${gdId}`}
        />

        {loading ? (
          <LoadingState message={locale === "bn" ? "জিডি বিবরণ লোড হচ্ছে..." : "Loading General Diary details..."} />
        ) : error || !gd ? (
          <ErrorState message={error || "General Diary not found"} onRetry={fetchGDDetails} />
        ) : (
          <>
            {/* Header */}
            <div className="no-print">
              <PageHeader
                title={`General Diary: ${gd.gd_number}`}
                description={`${gd.subject}`}
                breadcrumbs={[
                  { label: "ORCUS", href: "/dashboard" },
                  { label: "General Diary", href: "/gd" },
                  { label: gd.gd_number },
                ]}
                action={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "প্রিন্ট" : "Print Entry"}</span>
                    </button>
                    {gd.current_status !== "Linked to FIR" && (
                      <button
                        onClick={() => setShowEscalate(!showEscalate)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{showEscalate ? "Close FIR Conversion" : "Convert to FIR"}</span>
                      </button>
                    )}
                  </div>
                }
              />
            </div>

            {/* Escalate / Convert to FIR Panel */}
            {showEscalate && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-5 space-y-4 no-print">
                <div className="border-b border-indigo-100 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      Convert General Diary into Formal First Information Report (FIR)
                    </h3>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      Submit for FIR registration review (academic demonstration). Creates an illustrative investigation record.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEscalate(false)}
                    className="text-xs text-indigo-700 hover:text-indigo-950 font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                {escalateFeedback && (
                  <div className="p-3 rounded-md bg-white border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{escalateFeedback}</span>
                  </div>
                )}

                <form onSubmit={handleEscalateToFIR} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Crime Category
                    </label>
                    <select
                      value={crimeCategory}
                      onChange={(e) => setCrimeCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    >
                      <option value="Theft">Theft (দণ্ডবিধি ৩৭৯)</option>
                      <option value="Robbery">Robbery (দণ্ডবিধি ৩৯২)</option>
                      <option value="Extortion">Extortion (দণ্ডবিধি ৩৮৪)</option>
                      <option value="Assault">Assault / Grievous Hurt (দণ্ডবিধি ৩২৩/৩২৫)</option>
                      <option value="Fraud">Fraud & Forgery (দণ্ডবিধি ৪২০/৪৬৮)</option>
                      <option value="Narcotics">Narcotics Control Act Offense</option>
                      <option value="Homicide">Homicide (দণ্ডবিধি ৩০২)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Applicable Penal Code Sections (Select all that apply) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2.5 bg-white border border-slate-200 rounded-md">
                      {sections.map((sec) => {
                        const checked = selectedSections.includes(sec.section_id);
                        return (
                          <label
                            key={sec.section_id}
                            className={`flex items-start gap-2 p-1.5 rounded cursor-pointer transition ${
                              checked ? "bg-indigo-50 text-indigo-900 font-semibold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSections([...selectedSections, sec.section_id]);
                                } else {
                                  setSelectedSections(selectedSections.filter((s) => s !== sec.section_id));
                                }
                              }}
                              className="mt-0.5 rounded text-indigo-600"
                            />
                            <span className="leading-tight">
                              <strong>{sec.section_code}</strong>: {sec.section_title}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={escalating}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md font-semibold transition disabled:opacity-50"
                    >
                      {escalating ? "Registering FIR..." : "Confirm & Register FIR"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Main Record Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Details */}
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={gd.current_status} />
                      <span className="text-xs text-slate-500 font-mono">
                        Reg: {formatDateTime(gd.gd_date)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      Branch: <strong className="text-slate-800">{gd.branch_name || "Headquarters"}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px] mb-0.5">Subject</span>
                    <div className="text-sm font-bold text-slate-900">{gd.subject}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Complainant</span>
                      <span className="font-semibold text-slate-900">{gd.complainant_name || "Direct Informant"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Contact Mobile</span>
                      <span className="font-mono text-slate-800">{gd.complainant_phone || "Not recorded"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Incident Location</span>
                      <span className="text-slate-800">{gd.incident_place || "Station Jurisdiction"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Source Complaint</span>
                      {gd.complaint_id ? (
                        <Link
                          href={`/complaints/${gd.complaint_id}`}
                          className="text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Complaint #{gd.complaint_id}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-400">Direct Entry</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workflow Status Action Panel */}
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 no-print">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Update General Diary Status
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
                          <option value="Assigned for Inquiry">Assigned for Inquiry</option>
                          <option value="Inquiry in Progress">Inquiry in Progress</option>
                          <option value="Approved">Approved</option>
                          <option value="Disposed">Disposed / Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Inquiry Remarks / Reason
                        </label>
                        <input
                          type="text"
                          value={decisionNotes}
                          onChange={(e) => setDecisionNotes(e.target.value)}
                          placeholder="e.g. Inquiry officer deployed to verify lost documents"
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
                    Inquiry & Status History
                  </h3>

                  {history.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No status transitions recorded yet.
                    </div>
                  ) : (
                    <div className="relative pl-5 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                      {history.map((h, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
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
