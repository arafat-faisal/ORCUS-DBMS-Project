"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { CaseOverview, Officer, FIR, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  FolderLock,
  Search,
  Filter,
  Plus,
  Clock,
  ArrowRight,
  Shield,
  Users,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

function CasesListContent() {
  const searchParams = useSearchParams();
  const { t, formatDateTime } = useLocale();

  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [firs, setFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [crimeCategoryFilter, setCrimeCategoryFilter] = useState("ALL");

  // New Case Modal
  const [showNewModal, setShowNewModal] = useState(searchParams.get("action") === "new");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [selectedFirId, setSelectedFirId] = useState(searchParams.get("fir_id") || "");
  const [selectedOfficerId, setSelectedOfficerId] = useState("");
  const [creating, setCreating] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [casesRes, offRes, firRes] = await Promise.all([
        api.searchCases(),
        api.listOfficers(),
        api.listFIRs(),
      ]);

      if (casesRes.success && casesRes.data) {
        setCases(casesRes.data);
      }
      if (offRes.success && offRes.data) {
        setOfficers(offRes.data);
      }
      if (firRes.success && firRes.data) {
        setFirs(firRes.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      (c.case_title && c.case_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.fir_number && c.fir_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.lead_officer_name && c.lead_officer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || c.case_status === statusFilter;
    const matchesCat = crimeCategoryFilter === "ALL" || c.crime_category === crimeCategoryFilter;
    return matchesSearch && matchesStatus && matchesCat;
  });

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle) return;

    setCreating(true);
    const res = await api.openCase({
      case_title: newCaseTitle,
      opened_date: new Date().toISOString(),
      fir_id: selectedFirId ? parseInt(selectedFirId, 10) : undefined,
      lead_officer_id: selectedOfficerId ? parseInt(selectedOfficerId, 10) : undefined,
    });

    if (res.success && res.data) {
      setCases([res.data, ...cases]);
      setShowNewModal(false);
      setNewCaseTitle("");
      setSelectedFirId("");
      setSelectedOfficerId("");
    } else {
      alert(res.error || "Failed to open case");
    }
    setCreating(false);
  };

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
      case "Archived":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-slate-900 text-slate-300 border-slate-800";
    }
  };

  const canManageCases =
    user?.roles?.includes("Administrator") ||
    user?.roles?.includes("Officer-in-Charge") ||
    user?.roles?.includes("Supervising Officer") ||
    user?.roles?.includes("Investigating Officer");

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <FolderLock className="w-4 h-4" />
              <span>Active Criminal Inquiries &bull; Case Ledger</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Investigation Cases & Dossiers
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cross-linked multi-officer investigative dossiers, participant linkages, and evidentiary tracking.
            </p>
          </div>

          {canManageCases && (
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Open New Investigation Case</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case title, FIR number, lead officer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={crimeCategoryFilter}
              onChange={(e) => setCrimeCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">All Categories</option>
              <option value="Theft">Theft</option>
              <option value="Robbery">Robbery</option>
              <option value="Extortion">Extortion</option>
              <option value="Fraud">Fraud</option>
              <option value="Assault">Assault</option>
              <option value="Homicide">Homicide</option>
              <option value="Narcotics">Narcotics</option>
              <option value="Cybercrime">Cybercrime</option>
            </select>
          </div>
        </div>

        {/* Case Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-sm">Loading investigation cases...</span>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No active cases match your filters.</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Case Title & Origin</th>
                    <th className="py-3 px-4">Opened Date</th>
                    <th className="py-3 px-4">Lead Officer</th>
                    <th className="py-3 px-4">Entity Counts</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCases.map((c) => (
                    <tr key={c.case_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/cases/${c.case_id}`} className="font-semibold text-slate-100 hover:text-cyan-400 transition-colors">
                          {c.case_title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 font-mono">
                          {c.fir_number && (
                            <span className="text-rose-400 font-medium">FIR: {c.fir_number}</span>
                          )}
                          {c.crime_category && (
                            <span className="text-slate-500">&bull; {c.crime_category}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateTime(c.opened_date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">
                          {c.lead_officer_name || "Unassigned"}
                        </div>
                        {c.lead_officer_badge && (
                          <div className="text-xs font-mono text-slate-500">
                            Badge #{c.lead_officer_badge} {c.lead_officer_rank ? `(${c.lead_officer_rank})` : ""}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        <div className="flex items-center gap-3 font-mono">
                          <span title="Suspects" className="flex items-center gap-1 text-slate-300">
                            <Users className="w-3.5 h-3.5 text-rose-400" />
                            {c.suspect_count || 0}
                          </span>
                          <span title="Evidence items" className="flex items-center gap-1 text-slate-300">
                            <Package className="w-3.5 h-3.5 text-amber-400" />
                            {c.evidence_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            c.case_status
                          )}`}
                        >
                          {c.case_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/cases/${c.case_id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>Open Dossier</span>
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

        {/* Modal: Open New Case */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-100">Initiate Formal Investigation Case</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bind cognizable FIRs and appoint a Lead Investigating Officer to manage this dossier.
                </p>
              </div>

              <form onSubmit={handleCreateCase} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Case Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Armed Heist Investigation - Motijheel Branch"
                    value={newCaseTitle}
                    onChange={(e) => setNewCaseTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Originating FIR (Optional)</label>
                  <select
                    value={selectedFirId}
                    onChange={(e) => setSelectedFirId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- No Direct FIR Attached --</option>
                    {firs.map((f) => (
                      <option key={f.fir_id} value={f.fir_id}>
                        {f.fir_number} - {f.crime_category} ({f.complainant_name || "State"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Lead Investigating Officer</label>
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">-- Assign Later --</option>
                    {officers.map((o) => (
                      <option key={o.officer_id} value={o.officer_id}>
                        {o.first_name} {o.last_name} ({o.rank} - Badge #{o.badge_no})
                      </option>
                    ))}
                  </select>
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
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                  >
                    {creating ? "Opening Case..." : "Open Case Dossier"}
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

export default function CasesListPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading cases...</div>}>
      <CasesListContent />
    </Suspense>
  );
}
