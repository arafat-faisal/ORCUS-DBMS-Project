"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Evidence, EvidenceChainLog } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, ErrorState } from "@/components/ui/FeedbackStates";
import { PrintHeader } from "@/components/ui/PrintHeader";
import {
  Package,
  Printer,
  Clock,
  Building,
  User,
  MapPin,
  FolderLock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function EvidenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const evidenceId = parseInt(resolvedParams.id, 10);
  const router = useRouter();
  const { locale, formatDateTime } = useLocale();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [chain, setChain] = useState<EvidenceChainLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Custody transfer form state
  const [targetStatus, setTargetStatus] = useState("Stored in Vault");
  const [newLocation, setNewLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Delete evidence state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvidence, setDeletingEvidence] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteEvidence = async () => {
    setDeletingEvidence(true);
    setDeleteError(null);
    try {
      const res = await api.deleteEvidence(evidenceId);
      if (res.success) {
        router.push("/evidence");
      } else {
        setDeleteError(res.error || "Failed to delete evidence item.");
      }
    } catch {
      setDeleteError("Network error while deleting evidence item.");
    } finally {
      setDeletingEvidence(false);
    }
  };

  const loadEvidenceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [evRes, chainRes] = await Promise.all([
        api.getEvidence(evidenceId),
        api.getEvidenceChainOfCustody(evidenceId),
      ]);

      if (evRes.success && evRes.data) {
        setEvidence(evRes.data);
        setNewLocation(evRes.data.storage_location || "Station Evidence Room");
      } else {
        setError(evRes.error || "Failed to retrieve evidence record");
      }

      if (chainRes.success && chainRes.data) {
        setChain(chainRes.data);
      }
    } catch {
      setError("Network error while communicating with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidenceData();
  }, [evidenceId]);

  const handleUpdateCustody = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    setFeedback(null);
    try {
      const res = await api.updateEvidenceStatus(evidenceId, {
        status: targetStatus,
        storage_location: newLocation.trim() || undefined,
        remarks: remarks.trim() || `Custody state updated to ${targetStatus}`,
      });

      if (res.success && res.data) {
        setEvidence(res.data);
        setRemarks("");
        setFeedback("Evidence custody transfer recorded successfully.");
        const chainRes = await api.getEvidenceChainOfCustody(evidenceId);
        if (chainRes.success && chainRes.data) setChain(chainRes.data);
      } else {
        setFeedback(res.error || "Failed to log custody transfer.");
      }
    } catch {
      setFeedback("Network error while updating custody state.");
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
          title="Evidence Property Seizure & Chain-of-Custody Record"
          referenceNo={evidence ? `EV-${evidence.evidence_id}` : `EV-${evidenceId}`}
        />

        {loading ? (
          <LoadingState message="Loading evidence chain of custody..." />
        ) : error || !evidence ? (
          <ErrorState message={error || "Evidence record not found"} onRetry={loadEvidenceData} />
        ) : (
          <>
            {/* Header */}
            <div className="no-print">
              <PageHeader
                title={`Evidence Item: EV-${evidence.evidence_id}`}
                description={`${evidence.title}`}
                breadcrumbs={[
                  { label: "ORCUS", href: "/dashboard" },
                  { label: "Evidence", href: "/evidence" },
                  { label: `EV-${evidence.evidence_id}` },
                ]}
                action={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "প্রিন্ট" : "Print Custody Trail"}</span>
                    </button>
                    <Link
                      href={`/cases/${evidence.case_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                    >
                      <FolderLock className="w-3.5 h-3.5" />
                      <span>View Linked Case #{evidence.case_id}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setDeleteError(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
                      title="Permanently delete this evidence item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "আলামত মুছুন" : "Delete Evidence"}</span>
                    </button>
                  </div>
                }
              />
            </div>

            {/* Main Record Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <StatusBadge status={evidence.status} />
                  <span className="text-xs text-slate-500 font-mono">
                    Seized: {formatDateTime(evidence.collected_at)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  Type: <strong className="text-slate-800">{evidence.evidence_type}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Evidence Nomenclature</span>
                  <span className="font-semibold text-slate-900 text-sm">{evidence.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Storage Location / Locker</span>
                  <span className="font-medium text-slate-800">
                    {evidence.storage_location || "Station Evidence Room"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Linked Investigation</span>
                  <Link
                    href={`/cases/${evidence.case_id}`}
                    className="font-mono font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    <span>Case #{evidence.case_id}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {evidence.description && (
                <div>
                  <span className="text-slate-500 block text-[11px] mb-1">Seizure Particulars</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs leading-relaxed">
                    {evidence.description}
                  </div>
                </div>
              )}
            </div>

            {/* Custody Movement & Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left 2 Cols: Vertical Chain-of-Custody Timeline */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Vertical Chain-of-Custody Timeline
                  </h3>

                  {chain.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      Initial recovery entry recorded. No subsequent movements logged.
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                      {chain.map((c, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={c.logged_status} />
                              <span className="font-semibold text-slate-900">
                                {c.storage_location || "Evidence Locker"}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatDateTime(c.changed_at)}
                            </span>
                          </div>

                          {c.remarks && (
                            <p className="text-slate-700 mt-1.5 bg-slate-50 p-2.5 rounded border border-slate-100 leading-relaxed">
                              {c.remarks}
                            </p>
                          )}

                          <div className="text-[11px] text-slate-500 mt-1">
                            Custodian: <strong>{c.updated_by_officer || c.updated_by_username || "Authorized Evidence Officer"}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col: Transfer Form Action Panel */}
              <div className="space-y-4 no-print">
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                    Log Custody Transfer
                  </h3>

                  {feedback && (
                    <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>{feedback}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateCustody} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        New Custody Status
                      </label>
                      <select
                        value={targetStatus}
                        onChange={(e) => setTargetStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      >
                        <option value="Stored in Vault">Stored in Vault</option>
                        <option value="In Lab Analysis">In Lab Analysis (CID / FSL)</option>
                        <option value="Presented in Court">Presented in Court (Munsif / Magistrate)</option>
                        <option value="Archived">Archived</option>
                        <option value="Disposed">Disposed / Judicial Order</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Destination / Vault Locker
                      </label>
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="e.g. CID Forensic Lab, Malibagh"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Transfer Remarks / Memo No.
                      </label>
                      <textarea
                        rows={3}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Dispatched for ballistic examination per IO requisition"
                        className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      {updating ? "Recording..." : "Record Transfer"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          title="Delete Evidence Item"
          itemType="Evidence Item"
          itemName={evidence ? `EV-${evidence.evidence_id}: ${evidence.title}` : `EV-${evidenceId}`}
          warningDetails="Permanently deletes this forensic/documentary evidence item along with all historical chain-of-custody transfer logs and victim linkages."
          isDeleting={deletingEvidence}
          error={deleteError}
          onConfirm={handleDeleteEvidence}
          onClose={() => setShowDeleteModal(false)}
        />
      </div>
    </AppShell>
  );
}
