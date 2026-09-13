"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { FIR, FIRStatusHistory, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  Shield,
  ArrowLeft,
  Clock,
  Building,
  User,
  MapPin,
  Scale,
  History,
  FolderLock,
  Printer,
  ChevronRight,
  AlertTriangle,
  FileCheck,
} from "lucide-react";

export default function FIRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const firId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { t, formatDateTime } = useLocale();

  const [fir, setFir] = useState<FIR | null>(null);
  const [history, setHistory] = useState<FIRStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("Investigation Pending");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchFIRDetails() {
      setLoading(true);
      setError(null);

      const [firRes, histRes] = await Promise.all([
        api.getFIR(firId),
        api.getFIRHistory(firId),
      ]);

      if (firRes.success && firRes.data) {
        setFir(firRes.data);
      } else {
        setError(firRes.error || "Failed to load FIR details");
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }

      setLoading(false);
    }
    fetchFIRDetails();
  }, [firId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    const res = await api.updateFIRStatus(firId, {
      status: targetStatus,
      decision: `Workflow status updated to ${targetStatus}`,
      reason: decisionNotes || undefined,
    });

    if (res.success && res.data) {
      setFir(res.data);
      const histRes = await api.getFIRHistory(firId);
      if (histRes.success && histRes.data) setHistory(histRes.data);
      setShowStatusModal(false);
      setDecisionNotes("");
    } else {
      alert(res.error || "Failed to update status");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-medium">Loading Formal FIR Dossier...</span>
        </div>
      </PortalLayout>
    );
  }

  if (error || !fir) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto p-8 text-center bg-slate-900/50 rounded-xl border border-rose-900/50">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-200">FIR Record Not Found</h2>
          <p className="text-sm text-slate-400 mt-1">{error || "The requested FIR could not be found."}</p>
          <Link
            href="/fir"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to FIR Registry</span>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const isOfficerInCharge =
    user?.roles?.includes("Officer-in-Charge") ||
    user?.roles?.includes("Supervising Officer") ||
    user?.roles?.includes("Investigating Officer");

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/fir" className="hover:text-rose-400 transition-colors">
            FIR Registry
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-mono">{fir.fir_number}</span>
        </div>

        {/* Dossier Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>FIRST INFORMATION REPORT &bull; CR.P.C. SEC 154</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-slate-100">{fir.fir_number}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/80 text-rose-400 border border-rose-800/80">
                {fir.current_status || "Registered"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official FIR</span>
            </button>

            {isOfficerInCharge && (
              <>
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-800/50 rounded-lg text-xs font-medium transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Update Status</span>
                </button>

                {fir.current_status !== "Case Opened" && (
                  <button
                    onClick={() => {
                      router.push(`/cases?action=new&fir_id=${fir.fir_id}`);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-rose-950/40"
                  >
                    <FolderLock className="w-4 h-4" />
                    <span>Open Case Dossier</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Formal FIR Certificate Sheet */}
        <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl">
          {/* Statutory Header */}
          <div className="text-center border-b border-slate-800 pb-6">
            <h2 className="text-base font-bold uppercase tracking-widest text-slate-200">
              FIRST INFORMATION REPORT
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              (Under Section 154, Code of Criminal Procedure)
            </p>
            <div className="flex items-center justify-center gap-6 mt-3 text-xs font-mono text-slate-400">
              <span>PS / Unit: <strong className="text-slate-200">{fir.branch_name || "Central Division"}</strong></span>
              <span>&bull;</span>
              <span>Offense Category: <strong className="text-rose-400">{fir.crime_category}</strong></span>
              <span>&bull;</span>
              <span>FIR No: <strong className="text-cyan-400">{fir.fir_number}</strong></span>
            </div>
          </div>

          {/* Core Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-xs font-mono text-slate-500 uppercase block mb-1">Informant / Complainant Details</span>
                <p className="font-semibold text-slate-200 text-sm">{fir.complainant_name || "State Witness / Police Complainant"}</p>
                {fir.complainant_phone && (
                  <p className="text-xs font-mono text-slate-400 mt-1">Phone: {fir.complainant_phone}</p>
                )}
              </div>

              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-xs font-mono text-slate-500 uppercase block mb-1">Place of Occurrence & Jurisdiction</span>
                <div className="flex items-start gap-2 mt-1 text-sm text-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{fir.place_of_occurrence || "Territorial jurisdiction of station limits"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-xs font-mono text-slate-500 uppercase block mb-1">Date & Time of Recording</span>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-200">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{formatDateTime(fir.filed_date)}</span>
                </div>
                {fir.incident_date && (
                  <p className="text-xs text-slate-400 mt-1">
                    Occurred On: {formatDateTime(fir.incident_date)} {fir.incident_time ? `(${fir.incident_time})` : ""}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-xs font-mono text-slate-500 uppercase block mb-1">Origin Reference</span>
                {fir.gd_number ? (
                  <p className="text-sm font-mono text-cyan-400">Originated from General Diary: {fir.gd_number}</p>
                ) : (
                  <p className="text-sm text-slate-400">Direct Cognizable Complaint Registration</p>
                )}
              </div>
            </div>
          </div>

          {/* Legal Penal Sections */}
          <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400 tracking-wider">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Applicable Penal Code & Statutory Sections</span>
            </div>

            {fir.legal_sections && fir.legal_sections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fir.legal_sections.map((sec) => (
                  <div key={sec.section_id} className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="font-mono font-bold text-amber-400 text-sm block">{sec.section_code}</span>
                    <p className="font-medium text-xs text-slate-200 mt-0.5">{sec.section_title}</p>
                    {sec.description && <p className="text-[11px] text-slate-400 mt-1">{sec.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific statutory sections attached to this record.</p>
            )}
          </div>
        </div>

        {/* Workflow Status Timeline History */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider font-mono text-slate-300">
            <History className="w-4 h-4 text-rose-400" />
            <span>FIR Status Timeline & Judicial Audit Log ({history.length})</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Initial registration recorded.</p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {history.map((h) => (
                <div key={h.history_id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-slate-950" />
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-mono">
                      <span className="font-semibold text-rose-300">{h.new_status}</span>
                      <span>{formatDateTime(h.created_at)}</span>
                    </div>
                    <p className="text-slate-300 font-medium">{h.decision}</p>
                    {h.reason && <p className="text-slate-400 italic">Remarks: {h.reason}</p>}
                    <div className="text-[11px] text-slate-500 mt-1">
                      Action By: <span className="text-slate-400">{h.acting_username || `Officer #${h.acting_user_id}`}</span>
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
              <h3 className="text-lg font-bold text-slate-100">Update FIR Status</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Target Status</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Investigation Pending">Investigation Pending</option>
                    <option value="Case Opened">Case Opened</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Judicial / Station Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Enter details of assignment or judicial progression..."
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
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
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {updating ? "Updating..." : "Update FIR Status"}
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
