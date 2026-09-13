"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  PlusCircle,
  Search,
  Building2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { Complaint, ComplaintCategory, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";

export default function ComplaintsListPage() {
  const { locale } = useLocale();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [branchFilter, setBranchFilter] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    let active = true;

    async function fetchComplaints() {
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

        if (active) {
          if (compRes.success && compRes.data) {
            setComplaints(compRes.data);
          } else {
            setError(compRes.error || "Failed to load complaints repository.");
          }
          if (catRes.success && catRes.data) setCategories(catRes.data);
          if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        }
      } catch {
        if (active) {
          setError("Network communication error with ORCUS API.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchComplaints();
    return () => {
      active = false;
    };
  }, [statusFilter, categoryFilter, branchFilter, page, pageSize, searchQuery]);

  const handleRefresh = async () => {
    setLoading(true);
    setError("");
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
      if (compRes.success && compRes.data) setComplaints(compRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
    } catch {
      setError("Network communication error with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    handleRefresh();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "Under Review":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "Correction Required":
        return "bg-orange-950/80 text-orange-300 border-orange-800";
      case "Verified":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
      case "Converted to GD":
      case "Converted to FIR":
      case "Resolved":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      case "Transferred":
        return "bg-purple-950/80 text-purple-300 border-purple-800";
      case "Rejected":
      case "Closed":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "Emergency":
        return "bg-red-950/80 text-red-300 border-red-800 font-bold";
      case "High":
        return "bg-orange-950/80 text-orange-300 border-orange-800";
      case "Medium":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Header with Title and Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-emerald-500" />
              <span>{locale === "bn" ? "অভিযোগ রেজিস্ট্রি ও ইনটেক" : "Complaint Intake & Assessment"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {locale === "bn"
                ? "নাগরিক দাখিলকৃত এবং কর্মকর্তা গৃহীত সকল প্রাথমিক অভিযোগের তালিকা ও মূল্যায়ন।"
                : "Operational repository of public and walk-in citizen complaints undergoing review."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{locale === "bn" ? "নতুন অভিযোগ গ্রহণ" : "Record Officer Complaint"}</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === "bn" ? "ট্র্যাকিং কোড, শিরোনাম অথবা বিবরণ দিয়ে খুঁজুন..." : "Search by tracking code, title, narrative..."}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="">{locale === "bn" ? "সকল অবস্থা (Status)" : "All Statuses"}</option>
                <option value="Submitted">Submitted</option>
                <option value="Under Review">Under Review</option>
                <option value="Correction Required">Correction Required</option>
                <option value="Verified">Verified</option>
                <option value="Converted to GD">Converted to GD</option>
                <option value="Converted to FIR">Converted to FIR</option>
                <option value="Transferred">Transferred</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter || ""}
                onChange={(e) => {
                  setCategoryFilter(e.target.value ? Number(e.target.value) : undefined);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="">{locale === "bn" ? "সকল অপরাধের ধরন" : "All Categories"}</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {locale === "bn" ? c.name_bn || c.name_en : c.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={branchFilter || ""}
                onChange={(e) => {
                  setBranchFilter(e.target.value ? Number(e.target.value) : undefined);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
              >
                <option value="">{locale === "bn" ? "সকল থানা / শাখা" : "All Branches"}</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_id}>
                    {b.branch_name} ({b.branch_code})
                  </option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Complaints Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">{locale === "bn" ? "ট্র্যাকিং কোড" : "Tracking Code"}</th>
                  <th className="py-3 px-4">{locale === "bn" ? "অভিযোগের শিরোনাম" : "Title & Incident"}</th>
                  <th className="py-3 px-4">{locale === "bn" ? "ক্যাটাগরি" : "Category"}</th>
                  <th className="py-3 px-4">{locale === "bn" ? "থানা / ইউনিট" : "Receiving Branch"}</th>
                  <th className="py-3 px-4">{locale === "bn" ? "জরুরিতা" : "Urgency"}</th>
                  <th className="py-3 px-4">{locale === "bn" ? "অবস্থা" : "Current Status"}</th>
                  <th className="py-3 px-4">{locale === "bn" ? "দাখিলের সময়" : "Submitted"}</th>
                  <th className="py-3 px-4 text-right">{locale === "bn" ? "পদক্ষেপ" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>{locale === "bn" ? "রেকর্ড লোড হচ্ছে..." : "Loading Complaint Records..."}</span>
                      </div>
                    </td>
                  </tr>
                ) : complaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <p className="text-sm font-medium">
                        {locale === "bn" ? "কোনো অভিযোগ পাওয়া যায়নি।" : "No complaints match current filters."}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {locale === "bn"
                          ? "ফিল্টার পরিবর্তন করুন অথবা নতুন অভিযোগ নথিভুক্ত করুন।"
                          : "Try adjusting your search criteria or register a new intake record."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  complaints.map((c) => (
                    <tr key={c.complaint_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        <Link
                          href={`/complaints/${c.complaint_id}`}
                          className="hover:underline underline-offset-2"
                        >
                          {c.tracking_code}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-200 truncate">{c.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {c.complainant_name || "Anonymous / Walk-in"} &bull; {c.incident_date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        {c.category_name || "General"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{c.branch_name || "HQ"}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-semibold border ${getUrgencyBadge(
                            c.urgency
                          )}`}
                        >
                          {c.urgency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                            c.current_status
                          )}`}
                        >
                          {c.current_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(c.submitted_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/complaints/${c.complaint_id}`}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                          >
                            {locale === "bn" ? "বিস্তারিত" : "View"}
                          </Link>
                          <Link
                            href={`/complaints/${c.complaint_id}/assessment`}
                            className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-xs font-medium border border-emerald-800 transition"
                          >
                            {locale === "bn" ? "মূল্যায়ন" : "Assess"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
