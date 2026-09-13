"use client";

import React, { useState } from "react";
import {
  X,
  Shield,
  User,
  Users,
  MapPin,
  Package,
  History,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Printer,
} from "lucide-react";
import { CaseDossier } from "@/lib/types";

interface CaseDossierModalProps {
  dossier: CaseDossier | null;
  onClose: () => void;
  onUpdateStatus: (newStatus: string, remarks: string) => Promise<void>;
}

export const CaseDossierModal: React.FC<CaseDossierModalProps> = ({
  dossier,
  onClose,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "suspects" | "victims" | "witnesses" | "locations" | "evidence" | "history"
  >("overview");
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("Under Investigation");
  const [statusRemarks, setStatusRemarks] = useState("");

  if (!dossier) return null;

  const { case: c, status_history, suspects, victims, witnesses, locations, evidence_items } = dossier;

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusRemarks.trim()) return;
    setUpdating(true);
    try {
      await onUpdateStatus(newStatus, statusRemarks);
      setStatusRemarks("");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#11131a] border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono-code text-xs font-bold text-cyan-400">
                  CASE #{c.case_id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {c.case_status}
                </span>
              </div>
              <h2 className="font-tactical text-lg font-bold text-white mt-0.5">
                {c.case_title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Print Dossier Report"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 border-b border-neutral-800/80 text-xs font-mono">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "suspects", label: `Suspects (${suspects.length})` },
              { id: "victims", label: `Victims (${victims.length})` },
              { id: "witnesses", label: `Witnesses (${witnesses.length})` },
              { id: "locations", label: `Crime Scenes (${locations.length})` },
              { id: "evidence", label: `Evidence (${evidence_items.length})` },
              { id: "history", label: `Timeline (${status_history.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* 1. OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="tactical-card-secondary p-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Crime Category</span>
                  <span className="text-xs font-semibold text-white">{c.crime_category || "General Felony"}</span>
                </div>
                <div className="tactical-card-secondary p-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Source FIR No</span>
                  <span className="text-xs font-mono text-cyan-300">{c.fir_number || "Direct Intake"}</span>
                </div>
                <div className="tactical-card-secondary p-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">General Diary (GD)</span>
                  <span className="text-xs font-mono text-neutral-300">{c.gd_number || "None"}</span>
                </div>
                <div className="tactical-card-secondary p-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Lead Detective</span>
                  <span className="text-xs font-semibold text-white">{c.lead_officer_name || "Unassigned"}</span>
                </div>
                <div className="tactical-card-secondary p-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Officer Badge</span>
                  <span className="text-xs font-mono text-amber-400">{c.lead_officer_badge || "N/A"}</span>
                </div>
                <div className="tactical-card-secondary p-3">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase block">Branch District</span>
                  <span className="text-xs font-semibold text-neutral-200">{c.branch_name} ({c.district})</span>
                </div>
              </div>

              {/* Status Update Form */}
              <form onSubmit={handleStatusSubmit} className="tactical-card p-4 mt-4">
                <h4 className="text-xs font-tactical font-bold text-white uppercase tracking-wider mb-2">
                  Update Investigation Lifecycle Status
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Open">Open</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Closed">Closed</option>
                    <option value="Reopened">Reopened</option>
                    <option value="Archived">Archived</option>
                  </select>

                  <input
                    type="text"
                    required
                    placeholder="Enter transition remarks / justification..."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                    className="sm:col-span-2 bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updating}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-cyan-500 text-black text-xs font-semibold tracking-wider hover:bg-cyan-400 transition"
                >
                  {updating ? "COMMITTING AUDIT LOG..." : "UPDATE &amp; LOG AUDIT ENTRY"}
                </button>
              </form>
            </div>
          )}

          {/* 2. SUSPECTS */}
          {activeTab === "suspects" && (
            <div className="space-y-3">
              {suspects.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 text-center py-6">No suspects linked to this case yet.</p>
              ) : (
                suspects.map((s) => (
                  <div key={s.suspect_id} className="tactical-card-secondary p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-tactical font-semibold text-sm text-white">
                          {s.first_name} {s.last_name}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            s.suspicion_level === "High"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : s.suspicion_level === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}
                        >
                          {s.suspicion_level} Suspicion
                        </span>
                      </div>
                      <p className="font-mono-code text-xs text-neutral-400 mt-1">
                        Role: {s.role_in_crime || "Suspected Co-conspirator"}
                      </p>
                      {s.identification_sign && (
                        <p className="font-mono-code text-[11px] text-neutral-500 mt-0.5">
                          ID Mark: {s.identification_sign}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-mono text-neutral-400">{s.status}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 3. VICTIMS */}
          {activeTab === "victims" && (
            <div className="space-y-3">
              {victims.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 text-center py-6">No victims registered for this case.</p>
              ) : (
                victims.map((v) => (
                  <div key={v.victim_id} className="tactical-card-secondary p-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-tactical font-semibold text-sm text-white">{v.name}</h4>
                      <p className="font-mono-code text-xs text-neutral-400 mt-1">Impact: {v.impact_type || "Victim"}</p>
                      {v.phone && <p className="font-mono-code text-[11px] text-neutral-500">Contact: {v.phone}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${v.is_deceased ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                      {v.is_deceased ? "Deceased" : "Surviving"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 4. WITNESSES */}
          {activeTab === "witnesses" && (
            <div className="space-y-3">
              {witnesses.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 text-center py-6">No witnesses recorded for this case.</p>
              ) : (
                witnesses.map((w) => (
                  <div key={w.witness_id} className="tactical-card-secondary p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-tactical font-semibold text-sm text-white">{w.name}</h4>
                      <div className="flex items-center gap-2">
                        {w.is_protected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            🛡️ Protected
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-300">
                          {w.reliability}
                        </span>
                      </div>
                    </div>
                    {w.testimony_summary && (
                      <p className="font-mono-code text-xs text-neutral-400 mt-2 bg-black/40 p-2 rounded-lg border border-neutral-800">
                        &quot;{w.testimony_summary}&quot;
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. LOCATIONS */}
          {activeTab === "locations" && (
            <div className="space-y-3">
              {locations.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 text-center py-6">No crime scenes mapped.</p>
              ) : (
                locations.map((l) => (
                  <div key={l.location_id} className="tactical-card-secondary p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <h4 className="font-tactical font-semibold text-sm text-white">{l.address}</h4>
                      </div>
                      <p className="font-mono-code text-xs text-neutral-400 mt-1">
                        {l.area}, {l.city} {l.gps_coordinates ? `(${l.gps_coordinates})` : ""}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {l.location_role}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 6. EVIDENCE */}
          {activeTab === "evidence" && (
            <div className="space-y-3">
              {evidence_items.length === 0 ? (
                <p className="text-xs font-mono text-neutral-500 text-center py-6">No evidence items registered.</p>
              ) : (
                evidence_items.map((e) => (
                  <div key={e.evidence_id} className="tactical-card-secondary p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-cyan-400" />
                        <h4 className="font-tactical font-semibold text-sm text-white">{e.title}</h4>
                      </div>
                      <p className="font-mono-code text-xs text-neutral-400 mt-1">
                        Type: {e.evidence_type} &bull; Storage: {e.storage_location || "Vault A"}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {e.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 7. TIMELINE / HISTORY */}
          {activeTab === "history" && (
            <div className="space-y-3 relative pl-6 border-l-2 border-neutral-800 ml-2">
              {status_history.map((h) => (
                <div key={h.history_id} className="relative pb-4">
                  <span className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#11131a]" />
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs font-bold text-white">{h.status}</span>
                    <span className="text-[10px] font-mono text-neutral-500">{new Date(h.changed_at).toLocaleString()}</span>
                  </div>
                  {h.remarks && (
                    <p className="font-mono-code text-xs text-neutral-400 mt-1 bg-neutral-900/60 p-2 rounded-lg border border-neutral-800">
                      {h.remarks}
                    </p>
                  )}
                  {h.changed_by && (
                    <span className="text-[10px] font-mono text-cyan-400 block mt-1">
                      Logged by: {h.changed_by}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
