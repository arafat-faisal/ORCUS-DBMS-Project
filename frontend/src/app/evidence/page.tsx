"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Evidence, CaseOverview } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  Package,
  Search,
  PlusCircle,
  Eye,
  FolderLock,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function EvidenceListPage() {
  const { locale, formatDateTime } = useLocale();

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Delete Evidence state
  const [deleteModalEvidence, setDeleteModalEvidence] = useState<Evidence | null>(null);
  const [deletingEvidence, setDeletingEvidence] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteEvidence = async () => {
    if (!deleteModalEvidence) return;
    setDeletingEvidence(true);
    setDeleteError(null);
    try {
      const res = await api.deleteEvidence(deleteModalEvidence.evidence_id);
      if (res.success) {
        setEvidenceList((prev) => prev.filter((e) => e.evidence_id !== deleteModalEvidence.evidence_id));
        setDeleteModalEvidence(null);
      } else {
        setDeleteError(res.error || "Failed to delete evidence item.");
      }
    } catch {
      setDeleteError("Network error while deleting evidence item.");
    } finally {
      setDeletingEvidence(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [evRes, casesRes] = await Promise.all([
        api.listEvidence(),
        api.searchCases(),
      ]);

      if (evRes.success && evRes.data) {
        setEvidenceList(evRes.data);
      } else {
        setError(evRes.error || "Failed to load evidence records.");
      }
      if (casesRes.success && casesRes.data) {
        setCases(casesRes.data);
      }
    } catch {
      setError("Network error while communicating with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvidence = evidenceList.filter((ev) => {
    const matchesSearch =
      !searchTerm ||
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.description && ev.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.storage_location && ev.storage_location.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === "ALL" || ev.evidence_type === typeFilter;
    const matchesStatus = statusFilter === "ALL" || ev.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const paginatedEvidence = filteredEvidence.slice((page - 1) * pageSize, page * pageSize);
  const evidenceTypes = Array.from(new Set(evidenceList.map((e) => e.evidence_type).filter(Boolean)));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "আলামত রেজিস্ট্রি (Evidence)" : "Forensic & Documentary Evidence"}
          description={
            locale === "bn"
              ? "অপরাধ তদন্তে জব্দকৃত বস্তুগত, ডিজিটাল এবং জৈবিক আলামতের হেফাজত ও অবস্থান রেজিস্ট্রি।"
              : "Register and manage physical, digital, and documentary evidence items with tamper-evident chain of custody."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "তদন্ত" : "Investigation" },
            { label: "Evidence" },
          ]}
          action={
            <Link
              href="/evidence/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "নতুন আলামত নিবন্ধন" : "Register Evidence"}</span>
            </Link>
          }
        />

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder={
                  locale === "bn"
                    ? "আলামতের বিবরণ বা স্টোরেজ লোকেশন দিয়ে খুঁজুন..."
                    : "Search by title, description, or storage locker..."
                }
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">{locale === "bn" ? "সকল ধরন (All Types)" : "All Evidence Types"}</option>
              {evidenceTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">{locale === "bn" ? "সকল স্থিতি (Status)" : "All Custody Statuses"}</option>
              <option value="Collected">Collected</option>
              <option value="Stored in Vault">Stored in Vault</option>
              <option value="In Lab Analysis">In Lab Analysis</option>
              <option value="Presented in Court">Presented in Court</option>
              <option value="Archived">Archived</option>
              <option value="Disposed">Disposed</option>
            </select>

            {(searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                  setPage(1);
                }}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* State Render */}
        {loading ? (
          <LoadingState message={locale === "bn" ? "আলামত রেজিস্ট্রি লোড হচ্ছে..." : "Loading evidence inventory..."} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredEvidence.length === 0 ? (
          <EmptyState
            title={locale === "bn" ? "কোনো আলামত পাওয়া যায়নি" : "No evidence records found"}
            description={
              locale === "bn"
                ? "নতুন আলামত জব্দ বা সংগ্রহ করা হলে তা এখানে প্রদর্শিত হবে।"
                : "Seized evidence items registered under open cases will appear here."
            }
            action={
              <Link
                href="/evidence/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "আলামত রেজিস্টার করুন" : "Register Evidence"}</span>
              </Link>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Evidence Reference</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Related Case</th>
                    <th className="py-3 px-4">Storage Location</th>
                    <th className="py-3 px-4">Collected Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedEvidence.map((ev) => (
                    <tr key={ev.evidence_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        EV-{ev.evidence_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {ev.title}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {ev.evidence_type}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/cases/${ev.case_id}`}
                          className="font-mono font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <span>Case #{ev.case_id}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {ev.storage_location || "Station Evidence Room"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(ev.collected_at)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={ev.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/evidence/${ev.evidence_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === "bn" ? "চেইন লগ" : "Chain Log"}</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteModalEvidence(ev);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 rounded bg-rose-50/60 transition"
                            title="Delete evidence record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
              <span>
                Showing {paginatedEvidence.length} of {filteredEvidence.length} items (Page {page})
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700"
                >
                  Previous
                </button>
                <button
                  disabled={page * pageSize >= filteredEvidence.length}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!deleteModalEvidence}
          title="Delete Evidence Item"
          itemType="Evidence Item"
          itemName={deleteModalEvidence ? `EV-${deleteModalEvidence.evidence_id}: ${deleteModalEvidence.title}` : ""}
          warningDetails="Permanently removes this forensic/documentary evidence item along with all historical chain-of-custody transfer logs and victim linkages."
          isDeleting={deletingEvidence}
          error={deleteError}
          onConfirm={handleDeleteEvidence}
          onClose={() => setDeleteModalEvidence(null)}
        />
      </div>
    </AppShell>
  );
}
