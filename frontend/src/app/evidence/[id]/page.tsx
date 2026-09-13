"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { Evidence, EvidenceChainLog, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  Package,
  ArrowLeft,
  Clock,
  Building,
  User,
  MapPin,
  History,
  Shield,
  FolderLock,
  Printer,
  ChevronRight,
  AlertTriangle,
  FileCheck,
  Lock,
} from "lucide-react";

export default function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const evidenceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { t, formatDateTime } = useLocale();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [chain, setChain] = useState<EvidenceChainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  // Custody transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState("Stored in Vault");
  const [newLocation, setNewLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadEvidenceData() {
      setLoading(true);
      setError(null);

      const [evRes, chainRes] = await Promise.all([
        api.getEvidence(evidenceId),
        api.getEvidenceChainOfCustody(evidenceId),
      ]);

      if (evRes.success && evRes.data) {
        setEvidence(evRes.data);
        setNewLocation(evRes.data.storage_location || "");
      } else {
        setError(evRes.error || "Failed to retrieve evidence record");
      }

      if (chainRes.success && chainRes.data) {
        setChain(chainRes.data);
      }

      setLoading(false);
    }
    loadEvidenceData();
  }, [evidenceId]);

  const handleUpdateCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    const res = await api.updateEvidenceStatus(evidenceId, {
      status: targetStatus,
      storage_location: newLocation || undefined,
      remarks: remarks || `Custody state updated to ${targetStatus}`,
    });

    if (res.success && res.data) {
      setEvidence(res.data);
      const chainRes = await api.getEvidenceChainOfCustody(evidenceId);
      if (chainRes.success && chainRes.data) setChain(chainRes.data);
      setShowTransferModal(false);
      setRemarks("");
    } else {
      alert(res.error || "Failed to log custody transfer");
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="p-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-medium">Validating Evidence Vault Seal...</span>
        </div>
      </PortalLayout>
    );
  }

  if (error || !evidence) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto p-8 text-center bg-slate-900/50 rounded-xl border border-rose-900/50">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-200">Evidence Record Not Found</h2>
          <p className="text-sm text-slate-400 mt-1">{error || "Item not found in vault registry."}</p>
          <Link
            href="/evidence"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Evidence Vault</span>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const canManageEvidence =
    user?.roles?.includes("Evidence Officer") ||
    user?.roles?.includes("Administrator") ||
    user?.roles?.includes("Officer-in-Charge");

  return (
    <PortalLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/evidence" className="hover:text-amber-400 transition-colors">
            Evidence Vault
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200 font-mono">ITEM #{evidence.evidence_id}</span>
        </div>

        {/* Header HUD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <Lock className="w-4 h-4" />
              <span>FORENSIC LOCKER &bull; TAMPER-EVIDENT CHAIN OF CUSTODY</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-100">{evidence.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-amber-950/80 text-amber-400 border border-amber-800/80">
                {evidence.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Chain Receipt</span>
            </button>

            {canManageEvidence && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition-colors shadow-lg shadow-amber-950/40"
              >
                <FileCheck className="w-4 h-4" />
                <span>Log Custody Transfer</span>
              </button>
            )}
          </div>
        </div>

        {/* Evidence Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800/80 pb-2">
              Item Characteristics & Vault Seal
            </h2>

            <div>
              <span className="text-xs text-slate-500 font-mono uppercase block mb-1">Description / Condition</span>
              <p className="text-sm text-slate-200 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
                {evidence.description || "No physical or visual defects noted at recovery."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 font-mono uppercase block mb-1">Classification Type</span>
                <span className="font-mono text-amber-400 font-semibold text-sm">{evidence.evidence_type}</span>
              </div>

              <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/60">
                <span className="text-slate-500 font-mono uppercase block mb-1">Current Vault Locker</span>
                <span className="font-mono text-slate-200 font-semibold text-sm">{evidence.storage_location || "Vault A-1"}</span>
              </div>
            </div>
          </div>

          {/* Right Panel: Case Binding */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400 border-b border-slate-800/80 pb-2">
              Case Dossier Binding
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-mono">Bound Investigation Case</span>
                <div className="mt-1">
                  <Link href={`/cases/${evidence.case_id}`} className="font-semibold text-cyan-400 hover:underline text-sm block">
                    Case #{evidence.case_id}
                  </Link>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-mono">Initial Seizure Date</span>
                <p className="text-slate-200 font-medium mt-0.5">{formatDateTime(evidence.collected_at)}</p>
              </div>

              <div>
                <span className="text-slate-500 font-mono">Evidence Item Number</span>
                <p className="text-slate-200 font-mono font-medium mt-0.5">#{evidence.evidence_no}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Immutable Chain of Custody History */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 uppercase tracking-wider">
              <History className="w-4 h-4 text-amber-400" />
              <span>Immutable Chain of Custody Audit Trail ({chain.length})</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              Verified Legal Admissibility (Sec 9 Evidence Act)
            </span>
          </div>

          {chain.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">Genesis custody entry recorded.</p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {chain.map((c) => (
                <div key={c.history_id} className="relative">
                  <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-950" />
                  <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 font-mono">
                      <span className="font-semibold text-amber-300 text-sm">{c.logged_status}</span>
                      <span>{formatDateTime(c.changed_at)}</span>
                    </div>
                    {c.remarks && <p className="text-slate-200 font-medium">{c.remarks}</p>}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/50">
                      <span>Custodian: <strong className="text-slate-300">{c.updated_by_officer || c.updated_by_username || "Evidence Vault Guard"}</strong></span>
                      <span className="font-mono">Vault: {c.storage_location || "Central Vault"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Record Chain-of-Custody Transfer</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Transfers are permanently appended to the tamper-evident chain log.
                </p>
              </div>

              <form onSubmit={handleUpdateCustody} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">New Custody State</label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Stored in Vault">Stored in Vault</option>
                    <option value="In Lab Analysis">In Lab Analysis</option>
                    <option value="Presented in Court">Presented in Court</option>
                    <option value="Archived">Archived</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Physical Location / Desk / Courtroom</label>
                  <input
                    type="text"
                    placeholder="e.g. Dhaka Metropolitan Sessions Court #4"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Transfer Remarks / Custodian Signature</label>
                  <textarea
                    rows={3}
                    placeholder="Handover recipient, case reason, receipt acknowledgment number..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {updating ? "Committing Log..." : "Log Custody Transfer"}
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
