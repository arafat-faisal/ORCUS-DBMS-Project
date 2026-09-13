"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { CaseOverview, Officer, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  FolderLock,
  Search,
  Eye,
  PlusCircle,
  Users,
  Package,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function CasesListPage() {
  const { locale, formatDateTime } = useLocale();

  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [officerFilter, setOfficerFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Delete Case State
  const [deleteModalCase, setDeleteModalCase] = useState<CaseOverview | null>(null);
  const [deletingCase, setDeletingCase] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteCase = async () => {
    if (!deleteModalCase) return;
    setDeletingCase(true);
    setDeleteError(null);
    try {
      const res = await api.deleteCase(deleteModalCase.case_id);
      if (res.success) {
        setCases((prev) => prev.filter((c) => c.case_id !== deleteModalCase.case_id));
        setDeleteModalCase(null);
      } else {
        setDeleteError(res.error || "Failed to delete case dossier.");
      }
    } catch {
      setDeleteError("Network error while deleting case dossier.");
    } finally {
      setDeletingCase(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [casesRes, offRes, branchRes] = await Promise.all([
        api.searchCases(),
        api.listOfficers(),
        api.listBranches(),
      ]);

      if (casesRes.success && casesRes.data) {
        setCases(casesRes.data);
      } else {
        setError(casesRes.error || "Failed to load investigation cases.");
      }
      if (offRes.success && offRes.data) setOfficers(offRes.data);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
    } catch {
      setError("Network error while communicating with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      (c.case_title && c.case_title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.fir_number && c.fir_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.lead_officer_name && c.lead_officer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || (c.case_status || c.status) === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || c.crime_category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const paginatedCases = filteredCases.slice((page - 1) * pageSize, page * pageSize);
  const categories = Array.from(new Set(cases.map((c) => c.crime_category).filter(Boolean)));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "তদন্ত মামলা রেজিস্ট্রি (Cases)" : "Investigation Cases"}
          description={
            locale === "bn"
              ? "সংগঠিত অপরাধ বিশ্লেষণ ও তদন্ত ব্যবস্থাপনা ব্যবস্থার সক্রিয় এবং নিষ্পত্তিকৃত মামলাসমূহ।"
              : "View and manage formal investigation dossiers, officer assignments, and evidentiary records."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "তদন্ত" : "Investigation" },
            { label: "Cases" },
          ]}
          action={
            <Link
              href="/cases/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "নতুন মামলা খুলুন" : "Open New Case"}</span>
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
                    ? "মামলার শিরোনাম, এজাহার নম্বর বা তদন্ত কর্মকর্তার নাম খুঁজুন..."
                    : "Search by case title, FIR number, or investigator..."
                }
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">{locale === "bn" ? "সকল স্থিতি (Status)" : "All Statuses"}</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
              <option value="Archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">{locale === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {(searchTerm || statusFilter !== "ALL" || categoryFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
                  setCategoryFilter("ALL");
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
          <LoadingState message={locale === "bn" ? "মামলা রেজিস্ট্রি লোড হচ্ছে..." : "Loading investigation cases..."} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredCases.length === 0 ? (
          <EmptyState
            title={locale === "bn" ? "কোনো মামলা পাওয়া যায়নি" : "No investigation cases found"}
            description={
              locale === "bn"
                ? "নতুন মামলা নথিভুক্ত করা হলে তা এখানে তালিকাভুক্ত হবে।"
                : "New investigation dossiers opened from FIRs will appear here."
            }
            action={
              <Link
                href="/cases/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "নতুন মামলা খুলুন" : "Open New Case"}</span>
              </Link>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Case</th>
                    <th className="py-2.5 px-3">Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Investigator</th>
                    <th className="py-2.5 px-3">Branch</th>
                    <th className="py-2.5 px-3">Opened</th>
                    <th className="py-2.5 px-3 text-center">Links</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedCases.map((c) => (
                    <tr key={c.case_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        CASE-{c.case_id}
                        {c.fir_number && (
                          <span className="block text-[10px] text-indigo-600 font-medium">
                            {c.fir_number}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate" title={c.case_title}>
                        {c.case_title}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {c.crime_category || "General Offense"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {c.lead_officer_name || "Unassigned"}
                        </div>
                        {c.lead_officer_rank && (
                          <div className="text-[10px] text-slate-500">
                            {c.lead_officer_rank}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {c.branch_name || "Headquarters"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap text-[11px]">
                        {formatDateTime(c.opened_date)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2 text-[11px]">
                          <span title="Suspects" className="flex items-center gap-0.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            {c.suspect_count || 0}
                          </span>
                          <span title="Evidence" className="flex items-center gap-0.5">
                            <Package className="w-3 h-3 text-slate-400" />
                            {c.evidence_count || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={c.case_status || c.status || "Open"} />
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/cases/${c.case_id}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === "bn" ? "ডসিয়ার" : "Dossier"}</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteModalCase(c);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 rounded bg-rose-50/60 transition"
                            title="Delete case dossier"
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
                Showing {paginatedCases.length} of {filteredCases.length} cases (Page {page})
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
                  disabled={page * pageSize >= filteredCases.length}
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
          isOpen={!!deleteModalCase}
          title="Delete Investigation Case"
          itemType="Case Dossier"
          itemName={deleteModalCase ? `CASE-${deleteModalCase.case_id}: ${deleteModalCase.case_title}` : ""}
          warningDetails="This operation will permanently remove the case, unlinking related FIR/GD records and cascading the deletion of associated evidence items, participant linkages (suspects, victims, witnesses), and assignment histories."
          isDeleting={deletingCase}
          error={deleteError}
          onConfirm={handleDeleteCase}
          onClose={() => setDeleteModalCase(null)}
        />
      </div>
    </AppShell>
  );
}
