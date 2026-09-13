"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { GD, GDStatusHistory, LegalSection, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  FileSpreadsheet,
  ArrowLeft,
  Clock,
  Building,
  User,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Send,
  History,
  CheckCircle2,
  FileText,
  Printer,
  ChevronRight,
} from "lucide-react";

export default function GDDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gdId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { t, formatDateTime } = useLocale();

  const [gd, setGd] = useState<GD | null>(null);
  const [history, setHistory] = useState<GDStatusHistory[]>([]);
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("Assigned for Inquiry");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Escalate to FIR modal
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [crimeCategory, setCrimeCategory] = useState("Theft");
  const [selectedSections, setSelectedSections] = useState<number[]>([]);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    async function fetchGDDetails() {
      setLoading(true);
      setError(null);

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

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }

      if (secRes.success && secRes.data) {
        setSections(secRes.data);
      }

      setLoading(false);
    }
    fetchGDDetails();
  }, [gdId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    const res = await api.updateGDStatus(gdId, {
      status: targetStatus,
      decision: `Status transition to ${targetStatus}`,
      reason: decisionNotes || undefined,
    });

    if (res.success && res.data) {
      setGd(res.data);
      const histRes = await api.getGDHistory(gdId);
      if (histRes.success && histRes.data) setHistory(histRes.data);
      setShowStatusModal(false);
      setDecisionNotes("");
    } else {
      alert(res.error || "Failed to update status");
    }
    setUpdating(false);
  };

  const handleEscalateToFIR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crimeCategory) return;

    setEscalating(true);
    const res = await api.linkGDToFIR(gdId, {
      crime_category: crimeCategory,
      filed_date: new Date().toISOString(),
      section_ids: selectedSections,
    });

    if (res.success && res.data) {
      alert(`GD successfully escalated! FIR Created: ${res.data.fir_number}`);
      router.push(`/fir/${res.data.fir_id}`);
    } else {
      alert(res.error || "Failed to escalate GD to FIR");
    }
    setEscalating(false);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-medium">Loading GD Dossier...</span>
        </div>
      </PortalLayout>
    );
  }

  if (error || !gd) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto p-8 text-center bg-slate-900/50 rounded-xl border border-rose-900/50">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-200">General Diary Record Not Found</h2>
          <p className="text-sm text-slate-400 mt-1">{error || "The requested GD could not be retrieved."}</p>
          <Link
            href="/gd"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to GD Register</span>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isOfficerInCharge = user?.roles?.includes("Officer-in-Charge") || user?.roles?.includes("Supervising Officer") || user?.roles?.includes("Duty Officer");

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/gd" className="hover:text-cyan-400 transition-colors">
            General Diary
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-mono">{gd.gd_number}</span>
        </div>

        {/* Dossier Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>STATION GENERAL DIARY &bull; OFFICIAL RECORD</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-slate-100">{gd.gd_number}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-950/80 text-cyan-400 border border-cyan-800/80">
                {gd.current_status || "Approved"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Acknowledgment</span>
            </button>

            {isOfficerInCharge && gd.current_status !== "Closed" && (
              <>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-cyan-950/40"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Workflow Status</span>
                </button>

                {gd.current_status !== "Linked to FIR" && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-purple-950/40"
                  >
                    <Send className="w-4 h-4" />
                    <span>Escalate to FIR</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Core Metadata Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800/80 pb-2">
              Incident & Complainant Particulars
            </h2>

            <div>
              <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Subject / Nature of Entry</span>
              <p className="text-base font-medium text-slate-100 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                {gd.subject}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Incident Place / Jurisdiction</span>
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{gd.incident_place || "Unspecified Station Limits"}</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <span className="text-xs text-slate-500 uppercase font-mono block mb-1">Date & Time of Entry</span>
                <div className="flex items-center gap-2 text-sm text-slate-200">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{formatDateTime(gd.gd_date)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-xs text-slate-500 uppercase font-mono block mb-2">Complainant Information</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400">Name:</span>
                  <p className="font-medium text-slate-200">{gd.complainant_name || "State / Officer Initiated"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Contact Number:</span>
                  <p className="font-mono text-slate-200">{gd.complainant_phone || "Not Recorded"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Status & Station Info */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                Station & Legal Status
              </h3>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500">Police Station / Unit</span>
                  <div className="flex items-center gap-2 font-medium text-slate-200 mt-0.5">
                    <Building className="w-4 h-4 text-cyan-400" />
                    <span>{gd.branch_name || "Central Command"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500">Current Status</span>
                  <p className="font-medium text-cyan-400 mt-0.5">{gd.current_status || "Approved"}</p>
                </div>

                {gd.approved_at && (
                  <div>
                    <span className="text-xs text-slate-500">Approval Date</span>
                    <p className="text-xs text-slate-300 mt-0.5">{formatDateTime(gd.approved_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Official Academic Disclaimer */}
            <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 text-xs text-slate-500 space-y-1 font-mono">
              <p className="text-slate-400 font-semibold uppercase">Fictional Academic Record</p>
              <p>Generated by ORCUS Prototype for DBMS evaluation. Validated under station ledger protocols.</p>
            </div>
          </div>
        </div>

        {/* Workflow Status Timeline History */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider font-mono text-slate-300">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Audit & Workflow Status History ({history.length})</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No historical status transitions recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {history.map((h) => (
                <div key={h.history_id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-950" />
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-mono">
                      <span className="font-semibold text-cyan-300">{h.new_status}</span>
                      <span>{formatDateTime(h.created_at)}</span>
                    </div>
                    <p className="text-slate-300 font-medium">{h.decision}</p>
                    {h.reason && <p className="text-slate-400 italic">Notes: {h.reason}</p>}
                    <div className="text-[11px] text-slate-500 mt-1">
                      Action Officer: <span className="text-slate-400">{h.acting_username || `Officer #${h.acting_user_id}`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status Transition Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100">Update GD Workflow Status</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Target Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Assigned for Inquiry">Assigned for Inquiry</option>
                    <option value="Inquiry in Progress">Inquiry in Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Remarks / Action Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Enter station remarks or inquiry details..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Commit Status"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Escalate to FIR Modal */}
        {showEscalateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Escalate General Diary to Formal FIR</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cognizable elements established during GD inquiry. A new First Information Report will be registered and linked.
                </p>
              </div>

              <form onSubmit={handleEscalateToFIR} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Crime Category</label>
                  <select
                    value={crimeCategory}
                    onChange={(e) => setCrimeCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Theft">Theft</option>
                    <option value="Robbery">Robbery</option>
                    <option value="Extortion">Extortion</option>
                    <option value="Cybercrime / Fraud">Cybercrime / Fraud</option>
                    <option value="Narcotics">Narcotics</option>
                    <option value="Assault / Grievous Hurt">Assault / Grievous Hurt</option>
                    <option value="Homicide / Murder">Homicide / Murder</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Applicable Penal Code / Legal Sections</label>
                  <div className="max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1 text-xs">
                    {sections.map((s) => (
                      <label key={s.section_id} className="flex items-center gap-2 p-1.5 hover:bg-slate-900 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(s.section_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSections([...selectedSections, s.section_id]);
                            } else {
                              setSelectedSections(selectedSections.filter((id) => id !== s.section_id));
                            }
                          }}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="font-mono text-cyan-400">{s.section_code}</span>
                        <span className="text-slate-300">- {s.section_title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={escalating}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {escalating ? "Registering FIR..." : "Register & Link FIR"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
