"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { GD, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  FileSpreadsheet,
  Search,
  Eye,
  PlusCircle,
  FileText,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function GDListPage() {
  const { locale, formatDateTime } = useLocale();

  const [gds, setGds] = useState<GD[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Delete GD state
  const [deleteModalGD, setDeleteModalGD] = useState<GD | null>(null);
  const [deletingGD, setDeletingGD] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteGD = async () => {
    if (!deleteModalGD) return;
    setDeletingGD(true);
    setDeleteError(null);
    try {
      const res = await api.deleteGD(deleteModalGD.gd_id);
      if (res.success) {
        setGds((prev) => prev.filter((g) => g.gd_id !== deleteModalGD.gd_id));
        setDeleteModalGD(null);
      } else {
        setDeleteError(res.error || "Failed to delete General Diary record.");
      }
    } catch {
      setDeleteError("Network error while deleting General Diary record.");
    } finally {
      setDeletingGD(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gdRes, branchRes] = await Promise.all([
        api.listGDs(),
        api.listBranches(),
      ]);

      if (gdRes.success && gdRes.data) {
        setGds(gdRes.data);
      } else {
        setError(gdRes.error || "Failed to load General Diary records.");
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

  const filteredGDs = gds.filter((gd) => {
    const matchesSearch =
      !searchTerm ||
      (gd.gd_number && gd.gd_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gd.subject && gd.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gd.complainant_name && gd.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || gd.current_status === statusFilter;
    const matchesBranch = !branchFilter || gd.branch_id === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const paginatedGDs = filteredGDs.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "সাধারণ ডায়েরি (General Diary)" : "General Diary (GD)"}
          description={
            locale === "bn"
              ? "পুলিশ স্টেশনে দায়েরকৃত সকল সাধারণ ডায়েরি (জিডি) এবং অনামলযোগ্য ঘটনার প্রাতিষ্ঠানিক রেজিস্ট্রি।"
              : "Official register of non-cognizable incidents, lost property notices, and station diary entries."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "ইনটেক" : "Intake" },
            { label: "General Diary (GD)" },
          ]}
          action={
            <Link
              href="/gd/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "নতুন জিডি গ্রহণ" : "Record New GD"}</span>
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
                    ? "জিডি নম্বর, বিষয় বা অভিযোগকারীর নাম খুঁজুন..."
                    : "Search by GD number, subject, or complainant..."
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
              <option value="Draft">Draft</option>
              <option value="Submitted for Approval">Submitted for Approval</option>
              <option value="Approved">Approved</option>
              <option value="Assigned for Inquiry">Assigned for Inquiry</option>
              <option value="Inquiry in Progress">Inquiry in Progress</option>
              <option value="Linked to FIR">Linked to FIR</option>
              <option value="Disposed">Disposed</option>
              <option value="Closed">Closed</option>
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

            {(searchTerm || statusFilter !== "ALL" || branchFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("ALL");
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
          <LoadingState message={locale === "bn" ? "জিডি রেজিস্ট্রি লোড হচ্ছে..." : "Loading General Diary records..."} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredGDs.length === 0 ? (
          <EmptyState
            title={locale === "bn" ? "কোনো সাধারণ ডায়েরি পাওয়া যায়নি" : "No General Diary entries found"}
            description={
              locale === "bn"
                ? "নতুন জিডি এন্ট্রি দাখিল করা হলে তা এখানে প্রদর্শিত হবে।"
                : "New General Diary entries will appear here once registered by duty officers."
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">GD Number</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Complainant</th>
                    <th className="py-3 px-4">Registration Date</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Inquiry Officer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {paginatedGDs.map((gd) => (
                    <tr key={gd.gd_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-800">
                        {gd.gd_number}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {gd.subject}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {gd.complainant_name || "Direct Informant"}
                        </div>
                        {gd.complainant_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {gd.complainant_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(gd.gd_date)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {gd.branch_name || "Headquarters"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {gd.approved_by_user_id ? `Officer #${gd.approved_by_user_id}` : "Unassigned"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={gd.current_status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/gd/${gd.gd_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === "bn" ? "বিস্তারিত" : "Details"}</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteModalGD(gd);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 rounded bg-rose-50/60 transition"
                            title="Delete General Diary entry"
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
                Showing {paginatedGDs.length} of {filteredGDs.length} entries (Page {page})
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
                  disabled={page * pageSize >= filteredGDs.length}
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
          isOpen={!!deleteModalGD}
          title="Delete General Diary Entry"
          itemType="General Diary Record"
          itemName={deleteModalGD ? `${deleteModalGD.gd_number}: ${deleteModalGD.subject}` : ""}
          warningDetails="Permanently removes this General Diary entry, removes its status history, and unlinks it from any escalated FIR."
          isDeleting={deletingGD}
          error={deleteError}
          onConfirm={handleDeleteGD}
          onClose={() => setDeleteModalGD(null)}
        />
      </div>
    </AppShell>
  );
}
