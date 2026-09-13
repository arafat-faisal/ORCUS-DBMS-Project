"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { Evidence, CaseOverview, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  Package,
  Search,
  Filter,
  Plus,
  Clock,
  ArrowRight,
  ShieldAlert,
  FolderLock,
  Building,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function EvidenceListPage() {
  const { t, formatDateTime } = useLocale();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // New Evidence Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState("Physical");
  const [newLocation, setNewLocation] = useState("Central Vault - Locker A-1");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [creating, setCreating] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [evRes, casesRes] = await Promise.all([
        api.listEvidence(),
        api.searchCases(),
      ]);

      if (evRes.success && evRes.data) {
        setEvidenceList(evRes.data);
      }
      if (casesRes.success && casesRes.data) {
        setCases(casesRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesSearch =
      (ev.title && ev.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.storage_location && ev.storage_location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "ALL" || ev.evidence_type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || ev.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !selectedCaseId) {
      alert("Please enter title and select an active case");
      return;
    }

    setCreating(true);
    const res = await api.createEvidence({
      case_id: parseInt(selectedCaseId, 10),
      title: newTitle,
      description: newDescription || undefined,
      evidence_type: newType,
      storage_location: newLocation,
    });

    if (res.success && res.data) {
      setEvidenceList([res.data, ...evidenceList]);
      setShowNewModal(false);
      setNewTitle("");
      setNewDescription("");
      setSelectedCaseId("");
    } else {
      alert(res.error || "Failed to log evidence item");
    }
    setCreating(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "In Custody":
      case "Logged":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60";
      case "Sent to Forensics":
        return "bg-cyan-950/70 text-cyan-400 border-cyan-800/60";
      case "Court Exhibit":
        return "bg-purple-950/70 text-purple-400 border-purple-800/60";
      case "Returned to Owner":
      case "Disposed":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-slate-900 text-slate-300 border-slate-800";
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
              <Package className="w-4 h-4" />
              <span>Chain of Custody &bull; Forensic Evidence Locker</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Evidence Vault & Custody Ledger
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Strictly audited, tamper-evident repository for physical, digital, forensic, and ballistic evidence.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-amber-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Secure New Evidence Item</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by evidence title, description, storage vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL">All Evidence Types</option>
              <option value="Physical">Physical / Material</option>
              <option value="Digital">Digital / Electronics</option>
              <option value="Biological">Biological / Forensic</option>
              <option value="Weapon">Weapon / Ballistics</option>
              <option value="Document">Document / Paper</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="ALL">All Custody Statuses</option>
              <option value="Logged">Logged</option>
              <option value="In Custody">In Custody</option>
              <option value="Sent to Forensics">Sent to Forensics</option>
              <option value="Court Exhibit">Court Exhibit</option>
              <option value="Returned to Owner">Returned to Owner</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>
        </div>

        {/* Evidence Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
            <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-sm">Accessing evidence vault ledger...</span>
          </div>
        ) : filteredEvidence.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No evidence items match your filter criteria.</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Item # & Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Associated Case</th>
                    <th className="py-3 px-4">Storage Location</th>
                    <th className="py-3 px-4">Custody Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEvidence.map((ev) => (
                    <tr key={ev.evidence_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/evidence/${ev.evidence_id}`} className="font-semibold text-slate-100 hover:text-amber-400 transition-colors">
                          {ev.title}
                        </Link>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ev.description || "No specific notes"}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {ev.evidence_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-xs font-mono">
                        <Link href={`/cases/${ev.case_id}`} className="text-cyan-400 hover:underline">
                          Case #{ev.case_id}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                        {ev.storage_location || "Central Vault"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            ev.status
                          )}`}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/evidence/${ev.evidence_id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <span>Custody Chain</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: New Evidence */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Secure New Evidence Item</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bind this item to an active criminal case and generate an immutable chain-of-custody genesis entry.
                </p>
              </div>

              <form onSubmit={handleCreateEvidence} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Select Case Dossier *</label>
                  <select
                    required
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Choose Active Case --</option>
                    {cases.map((c) => (
                      <option key={c.case_id} value={c.case_id}>
                        Case #{c.case_id}: {c.case_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Evidence Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9mm Semi-Automatic Pistol w/ Magazine"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Category</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Physical">Physical</option>
                      <option value="Digital">Digital</option>
                      <option value="Biological">Biological</option>
                      <option value="Weapon">Weapon</option>
                      <option value="Document">Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Storage Locker</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Description / Seizure Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Serial numbers, visual characteristics, recovery condition..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {creating ? "Locking In Vault..." : "Register Item"}
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
