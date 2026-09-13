"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { FIR, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  Scale,
  Search,
  Eye,
  PlusCircle,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function FIRListPage() {
  const { locale, formatDateTime } = useLocale();

  const [firs, setFirs] = useState<FIR[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Delete FIR state
  const [deleteModalFIR, setDeleteModalFIR] = useState<FIR | null>(null);
  const [deletingFIR, setDeletingFIR] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteFIR = async () => {
    if (!deleteModalFIR) return;
    setDeletingFIR(true);
    setDeleteError(null);
    try {
      const res = await api.deleteFIR(deleteModalFIR.fir_id);
      if (res.success) {
        setFirs((prev) => prev.filter((f) => f.fir_id !== deleteModalFIR.fir_id));
        setDeleteModalFIR(null);
      } else {
        setDeleteError(res.error || "Failed to delete FIR record.");
      }
    } catch {
      setDeleteError("Network error while deleting FIR record.");
    } finally {
      setDeletingFIR(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [firRes, branchRes] = await Promise.all([
        api.listFIRs(),
        api.listBranches(),
      ]);

      if (firRes.success && firRes.data) {
        setFirs(firRes.data);
      } else {
        setError(firRes.error || "Failed to load First Information Reports.");
      }
      if (branchRes.success && branchRes.data) {
        setBranches(branchRes.data);
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

  const filteredFIRs = firs.filter((fir) => {
    const matchesSearch =
      !searchTerm ||
      (fir.fir_number && fir.fir_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fir.crime_category && fir.crime_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fir.complainant_name && fir.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === "ALL" || fir.crime_category === categoryFilter;
    const matchesBranch = !branchFilter || fir.branch_id === branchFilter;
    return matchesSearch && matchesCategory && matchesBranch;
  });

  const paginatedFIRs = filteredFIRs.slice((page - 1) * pageSize, page * pageSize);

  const categories = Array.from(new Set(firs.map((f) => f.crime_category).filter(Boolean)));

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "প্রথম তথ্য বিবরণী (First Information Report - FIR)" : "First Information Reports (FIR)"}
          description={
            locale === "bn"
              ? "একাডেমিক প্রোটোটাইপ — কাল্পনিক প্রদর্শনীর উদ্দেশ্যে সংরক্ষিত এজাহার রেজিস্ট্রি।"
              : "Academic prototype registry of demonstrative criminal complaints and FIR records (fictional demonstration)."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "ইনটেক" : "Intake" },
            { label: "First Information Report (FIR)" },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/fir/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "নতুন এজাহার নথিভুক্ত করুন" : "Register New FIR"}</span>
              </Link>
              <Link
                href="/complaints"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold transition"
              >
                <span>{locale === "bn" ? "অভিযোগ তালিকা" : "From Complaint"}</span>
              </Link>
            </div>
          }
        />

        {/* Filters */}
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
                    ? "এজাহার নম্বর, অপরাধের ধরন বা বাদীর নাম খুঁজুন..."
                    : "Search by FIR number, category, or informant..."
                }
                className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="ALL">{locale === "bn" ? "সকল অপরাধ ক্যাটাগরি" : "All Crime Categories"}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={branchFilter || ""}
              onChange={(e) => {
                setBranchFilter(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">{locale === "bn" ? "সকল থানা/শাখা" : "All Branches"}</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name} ({b.district})
                </option>
              ))}
            </select>

            {(searchTerm || categoryFilter !== "ALL" || branchFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("ALL");
                  setBranchFilter(undefined);
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
          <LoadingState message={locale === "bn" ? "এজাহার তালিকা লোড হচ্ছে..." : "Loading FIR records..."} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredFIRs.length === 0 ? (
          <EmptyState
            title={locale === "bn" ? "কোনো এজাহার পাওয়া যায়নি" : "No First Information Reports found"}
            description={
              locale === "bn"
                ? "নতুন নিবন্ধিত এজাহার এখানে প্রদর্শিত হবে।"
                : "Registered FIR records will appear here."
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">FIR Number</th>
                    <th className="py-3 px-4">Crime Category</th>
                    <th className="py-3 px-4">Informant</th>
                    <th className="py-3 px-4">Filed Date</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Related GD</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedFIRs.map((fir) => (
                    <tr key={fir.fir_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-800">
                        {fir.fir_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {fir.crime_category}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {fir.complainant_name || "State / Police Informant"}
                        </div>
                        {fir.complainant_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {fir.complainant_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(fir.filed_date)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {fir.branch_name || "Headquarters"}
                      </td>
                      <td className="py-3 px-4">
                        {fir.gd_number ? (
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {fir.gd_number}
                          </span>
                        ) : (
                          <span className="text-slate-400">Direct FIR</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={fir.current_status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/fir/${fir.fir_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === "bn" ? "বিস্তারিত" : "Details"}</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteModalFIR(fir);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 rounded bg-rose-50/60 transition"
                            title="Delete First Information Report"
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
                Showing {paginatedFIRs.length} of {filteredFIRs.length} entries (Page {page})
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
                  disabled={page * pageSize >= filteredFIRs.length}
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
          isOpen={!!deleteModalFIR}
          title="Delete First Information Report (FIR)"
          itemType="FIR Record"
          itemName={deleteModalFIR ? `${deleteModalFIR.fir_number}: ${deleteModalFIR.crime_category}` : ""}
          warningDetails="Permanently removes this FIR, unlinks related investigation cases, and removes all linked legal penal code sections and status histories."
          isDeleting={deletingFIR}
          error={deleteError}
          onConfirm={handleDeleteFIR}
          onClose={() => setDeleteModalFIR(null)}
        />
      </div>
    </AppShell>
  );
}
