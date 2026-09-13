"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Complaint, ComplaintCategory, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  FileText,
  PlusCircle,
  Search,
  RefreshCw,
  Eye,
  Filter,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function ComplaintsListPage() {
  const { locale, formatDateTime } = useLocale();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [branchFilter, setBranchFilter] = useState<number | undefined>();
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Delete Complaint state
  const [deleteModalComplaint, setDeleteModalComplaint] = useState<Complaint | null>(null);
  const [deletingComplaint, setDeletingComplaint] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteComplaint = async () => {
    if (!deleteModalComplaint) return;
    setDeletingComplaint(true);
    setDeleteError(null);
    try {
      const res = await api.deleteComplaint(deleteModalComplaint.complaint_id);
      if (res.success) {
        setComplaints((prev) => prev.filter((c) => c.complaint_id !== deleteModalComplaint.complaint_id));
        setDeleteModalComplaint(null);
      } else {
        setDeleteError(res.error || "Failed to delete complaint record.");
      }
    } catch {
      setDeleteError("Network error while deleting complaint record.");
    } finally {
      setDeletingComplaint(false);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, catRes, branchRes] = await Promise.all([
        api.listComplaints({
          status: statusFilter || undefined,
          category_id: categoryFilter,
          branch_id: branchFilter,
          search: searchQuery || undefined,
          page,
          page_size: pageSize,
        }),
        api.getComplaintCategories(),
        api.listBranches(),
      ]);

      if (compRes.success && compRes.data) {
        setComplaints(compRes.data);
      } else {
        setError(compRes.error || "Failed to load complaints repository.");
      }
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
    } catch {
      setError("Network communication error with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, categoryFilter, branchFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCategoryFilter(undefined);
    setBranchFilter(undefined);
    setPage(1);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "অভিযোগ ব্যবস্থাপনা" : "Complaints"}
          description={
            locale === "bn"
              ? "নাগরিক এবং প্রত্যক্ষদর্শীদের দাখিলকৃত সকল প্রাথমিক অভিযোগের তালিকা ও মূল্যায়ন।"
              : "Review and assess public citizen complaints and intake records registered in ORCUS."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "ইনটেক" : "Intake" },
            { label: locale === "bn" ? "অভিযোগ" : "Complaints" },
          ]}
          action={
            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "নতুন অভিযোগ গ্রহণ" : "Record New Complaint"}</span>
            </Link>
          }
        />

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "bn"
                    ? "ট্র্যাকিং কোড, শিরোনাম অথবা অভিযোগকারী দিয়ে খুঁজুন..."
                    : "Search by tracking code, title, or complainant..."
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
              <option value="">{locale === "bn" ? "সকল স্থিতি (Status)" : "All Statuses"}</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Converted to GD">Converted to GD</option>
              <option value="Converted to FIR">Converted to FIR</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={categoryFilter || ""}
              onChange={(e) => {
                setCategoryFilter(e.target.value ? Number(e.target.value) : undefined);
                setPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="">{locale === "bn" ? "সকল ক্যাটাগরি" : "All Categories"}</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {locale === "bn" ? c.name_bn : c.name_en}
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

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition shadow-xs"
              >
                {locale === "bn" ? "ফিল্টার করুন" : "Filter"}
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-xs transition"
                title="Reset Filters"
              >
                {locale === "bn" ? "রিসেট" : "Reset"}
              </button>
            </div>
          </form>
        </div>

        {/* State Display */}
        {loading ? (
          <LoadingState message={locale === "bn" ? "অভিযোগ তালিকা লোড হচ্ছে..." : "Loading complaints list..."} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchComplaints} />
        ) : complaints.length === 0 ? (
          <EmptyState
            title={locale === "bn" ? "কোনো অভিযোগ পাওয়া যায়নি" : "No complaints found"}
            description={
              locale === "bn"
                ? "নতুন দাখিলকৃত অভিযোগ এখানে প্রদর্শিত হবে।"
                : "New complaints will appear here after citizen submission or officer intake."
            }
            action={
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "নতুন অভিযোগ গ্রহণ করুন" : "Record Complaint"}</span>
              </Link>
            }
          />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tracking Code</th>
                    <th className="py-3 px-4">Complaint Title</th>
                    <th className="py-3 px-4">Complainant</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Receiving Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {complaints.map((comp) => (
                    <tr key={comp.complaint_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        {comp.tracking_code}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">
                        {comp.title}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {comp.complainant_name || "Direct Walk-in"}
                        </div>
                        {comp.complainant_phone && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {comp.complainant_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(comp.submitted_at || comp.incident_date)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {comp.category_name || "General Complaint"}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {comp.branch_name || "Headquarters"}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={comp.current_status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/complaints/${comp.complaint_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:text-blue-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{locale === "bn" ? "বিস্তারিত" : "View"}</span>
                          </Link>
                          <button
                            onClick={() => {
                              setDeleteModalComplaint(comp);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 hover:border-rose-300 rounded bg-rose-50/60 transition"
                            title="Delete complaint record"
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
              <span>Showing {complaints.length} records (Page {page})</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700"
                >
                  Previous
                </button>
                <button
                  disabled={complaints.length < pageSize}
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
          isOpen={!!deleteModalComplaint}
          title="Delete Citizen Complaint"
          itemType="Complaint Record"
          itemName={deleteModalComplaint ? `${deleteModalComplaint.tracking_code}: ${deleteModalComplaint.title}` : ""}
          warningDetails="Permanently removes this complaint intake record and cleans up status and transfer logs. Unlinks associated GD and FIR linkages if any exist."
          isDeleting={deletingComplaint}
          error={deleteError}
          onConfirm={handleDeleteComplaint}
          onClose={() => setDeleteModalComplaint(null)}
        />
      </div>
    </AppShell>
  );
}
