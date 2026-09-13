"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { CaseDossier, CaseStatusHistory, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  FolderLock,
  ArrowLeft,
  Clock,
  Building,
  User,
  MapPin,
  Scale,
  History,
  Shield,
  Users,
  Package,
  Plus,
  Printer,
  ChevronRight,
  AlertTriangle,
  FileCheck,
} from "lucide-react";

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const caseId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { t, formatDateTime } = useLocale();

  const [dossier, setDossier] = useState<CaseDossier | null>(null);
  const [history, setHistory] = useState<CaseStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  // Status Modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("Under Investigation");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchCaseData() {
      setLoading(true);
      setError(null);

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

      setLoading(false);
    }
    fetchCaseData();
  }, [caseId]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    const res = await api.updateCaseStatus(caseId, {
      status: targetStatus,
      remarks: remarks || "Status changed via Case Dossier HUD",
    });

    if (res.success && res.data) {
      const refreshed = await api.getCaseDossier(caseId);
      if (refreshed.success && refreshed.data) setDossier(refreshed.data);
      const histRes = await api.getCaseHistory(caseId);
      if (histRes.success && histRes.data) setHistory(histRes.data);
      setShowStatusModal(false);
      setRemarks("");
    } else {
      alert(res.error || "Failed to update case status");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-medium">Assembling Investigative Dossier...</span>
        </div>
      </PortalLayout>
    );
  }

  if (error || !dossier || !dossier.case) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto p-8 text-center bg-slate-900/50 rounded-xl border border-rose-900/50">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-200">Investigation Dossier Not Found</h2>
          <p className="text-sm text-slate-400 mt-1">{error || "Case record could not be retrieved."}</p>
          <Link
            href="/cases"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Case Ledger</span>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const c = dossier.case;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-cyan-950/70 text-cyan-400 border-cyan-800/60";
      case "Under Investigation":
        return "bg-blue-950/70 text-blue-400 border-blue-800/60";
      case "Pending Review":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60";
      case "Closed":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/60";
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getSuspicionBadge = (level: string) => {
    switch (level) {
      case "High":
        return "bg-rose-950/80 text-rose-400 border-rose-800/60";
      case "Medium":
        return "bg-amber-950/80 text-amber-400 border-amber-800/60";
      case "Low":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/cases" className="hover:text-cyan-400 transition-colors">
            Cases & Dossiers
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-mono">CASE #{c.case_id}</span>
        </div>

        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <FolderLock className="w-4 h-4" />
              <span>INVESTIGATIVE DOSSIER &bull; OFFICIAL LAW ENFORCEMENT PROTOTYPE</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{c.case_title}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(c.case_status)}`}>
                {c.case_status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-cyan-950/40"
            >
              <FileCheck className="w-4 h-4" />
              <span>Update Case Status</span>
            </button>
          </div>
        </div>

        {/* Top Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lead Officer Card */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Lead Investigating Officer</span>
            </div>
            {c.lead_officer_name ? (
              <div className="space-y-1">
                <p className="font-semibold text-slate-200 text-base">
                  {c.lead_officer_name}
                </p>
                <p className="text-xs text-cyan-400 font-mono">
                  {c.lead_officer_rank || "Investigating Officer"} &bull; Badge #{c.lead_officer_badge || "—"}
                </p>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.branch_name || "Central Command"}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No lead officer assigned yet.</p>
            )}
          </div>

          {/* FIR & Legal Framework */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>Originating FIR & Offense</span>
            </div>
            {c.fir_number ? (
              <div className="space-y-1.5">
                <span className="font-mono text-sm font-semibold text-rose-400">
                  {c.fir_number}
                </span>
                <p className="text-xs text-slate-300">Category: <strong className="text-slate-100">{c.crime_category || "Offense"}</strong></p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Direct Inquiry - No statutory FIR linked.</p>
            )}
          </div>

          {/* Timeline & District */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Dates & Jurisdiction</span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500">Opened On:</span>
                <p className="font-medium text-slate-200 mt-0.5">{formatDateTime(c.opened_date)}</p>
              </div>
              {c.assigned_date && (
                <div>
                  <span className="text-slate-500">Assigned To Officer:</span>
                  <p className="font-medium text-slate-200 mt-0.5">{formatDateTime(c.assigned_date)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Tab Entity Dossier Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Suspects & Persons of Interest */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider">
                <Users className="w-4 h-4 text-rose-400" />
                <span>Suspects & Persons of Interest ({dossier.suspects?.length || 0})</span>
              </div>
              <Link href="/participants" className="text-xs text-rose-400 hover:underline">
                View All
              </Link>
            </div>

            {!dossier.suspects || dossier.suspects.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No suspects linked to this case yet.</p>
            ) : (
              <div className="space-y-3">
                {dossier.suspects.map((s) => (
                  <div key={s.suspect_id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-200">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Role: {s.role_in_crime || s.role_or_impact || "Prime Suspect"}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getSuspicionBadge(s.suspicion_level)}`}>
                      {s.suspicion_level} Suspicion
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Vault Locker */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Secured Evidence Items ({(dossier.evidence_items || dossier.evidence || []).length})</span>
              </div>
              <Link href="/evidence" className="text-xs text-amber-400 hover:underline">
                Open Vault
              </Link>
            </div>

            {(!dossier.evidence_items || dossier.evidence_items.length === 0) && (!dossier.evidence || dossier.evidence.length === 0) ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No physical or digital evidence registered.</p>
            ) : (
              <div className="space-y-3">
                {(dossier.evidence_items || dossier.evidence || []).map((ev) => (
                  <div key={ev.evidence_id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-slate-200">{ev.title}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {ev.evidence_type} &bull; Locker: {ev.storage_location || "Vault 1"}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/70 text-amber-400 border border-amber-800/60">
                      {ev.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Victims & Complainants */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-3">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Victims & Affected Parties ({dossier.victims?.length || 0})</span>
            </div>

            {!dossier.victims || dossier.victims.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No victims registered for this case.</p>
            ) : (
              <div className="space-y-3">
                {dossier.victims.map((v) => (
                  <div key={v.victim_id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <p className="font-semibold text-sm text-slate-200">{v.name}</p>
                    {(v.impact_type || v.impact_description) && (
                      <p className="text-xs text-slate-400 mt-1">{v.impact_type || v.impact_description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Incident Locations */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-3">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Geospatial Incident Locations ({dossier.locations?.length || 0})</span>
            </div>

            {!dossier.locations || dossier.locations.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 text-center">No verified locations linked.</p>
            ) : (
              <div className="space-y-3">
                {dossier.locations.map((loc) => (
                  <div key={loc.location_id} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <p className="font-semibold text-sm text-slate-200">{loc.address}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {loc.area}, {loc.city} {loc.gps_coordinates ? `(${loc.gps_coordinates})` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Case Status Audit History */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider font-mono text-slate-300">
            <History className="w-4 h-4 text-cyan-400" />
            <span>Investigation Diary & Case History ({history.length})</span>
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-slate-500 italic">Initial case opening logged.</p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {history.map((h) => (
                <div key={h.history_id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-cyan-500 border-2 border-slate-950" />
                  <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-mono">
                      <span className="font-semibold text-cyan-300">{h.status}</span>
                      <span>{formatDateTime(h.changed_at)}</span>
                    </div>
                    {h.remarks && <p className="text-slate-300">{h.remarks}</p>}
                    <div className="text-[11px] text-slate-500 mt-1">
                      Recorded By: <span className="text-slate-400">{h.changed_by || `User #${h.changed_by_user_id}`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Update Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100">Update Investigation Status</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Investigation Stage</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Investigation Diary Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Enter findings, supervisor notes, or closure reasons..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
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
      </div>
    </PortalLayout>
  );
}
