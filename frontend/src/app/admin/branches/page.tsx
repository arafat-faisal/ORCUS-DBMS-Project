"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { AgencyBranch, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  Building2,
  Search,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function AdminBranchesPage() {
  const { locale } = useLocale();

  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(api.getUserProfile());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Create branch drawer
  const [showAdd, setShowAdd] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [creating, setCreating] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const loadBranches = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listBranches();
      if (res.success && res.data) {
        setBranches(res.data);
      } else {
        setError(res.error || "Failed to load police branch records.");
      }
    } catch {
      setError("Network error while connecting to ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) {
      setActionFeedback("Branch name is required.");
      return;
    }

    setCreating(true);
    setActionFeedback(null);
    try {
      const res = await api.createBranch({
        branch_name: branchName.trim(),
        district: district.trim() || "Dhaka",
      });

      if (res.success && res.data) {
        setActionFeedback("Police station branch added to institutional registry.");
        setShowAdd(false);
        setBranchName("");
        loadBranches();
      } else {
        setActionFeedback(res.error || "Failed to register branch.");
      }
    } catch {
      setActionFeedback("Network error while creating branch.");
    } finally {
      setCreating(false);
    }
  };

  const isAuthorized = currentUser?.roles?.includes("Administrator");

  const filteredBranches = branches.filter(
    (b) =>
      !searchTerm ||
      b.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "থানা ও আঞ্চলিক শাখা রেজিস্ট্রি" : "Agency Branches & Stations"}
          description={
            locale === "bn"
              ? "পুলিশ স্টেশন এবং আঞ্চলিক তদন্ত শাখার ভৌগোলিক অধিক্ষেত্র ও প্রশাসনিক রেজিস্ট্রি।"
              : "Official register of operational police station branches, territorial divisions, and districts."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Administration" },
            { label: "Branches" },
          ]}
          action={
            isAuthorized ? (
              <button
                onClick={() => setShowAdd(!showAdd)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAdd ? "Close Form" : "Add Station Branch"}</span>
              </button>
            ) : undefined
          }
        />

        {/* Add Branch Drawer */}
        {showAdd && isAuthorized && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Register New Police Station Branch
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            {actionFeedback && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{actionFeedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch Name (e.g. Dhanmondi Police Station) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Dhanmondi Model Thana"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Dhaka"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs transition disabled:opacity-50"
                >
                  {creating ? "Adding..." : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search branches by station name or district..."
              className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* State Render */}
        {loading ? (
          <LoadingState message="Loading station branches..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadBranches} />
        ) : filteredBranches.length === 0 ? (
          <EmptyState title="No branches found" description="No branches match your search." />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Branch Code</th>
                  <th className="py-3 px-4">Branch Name (English)</th>
                  <th className="py-3 px-4">Branch Name (বাংলা)</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Branch Type</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredBranches.map((b) => (
                  <tr key={b.branch_id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {b.branch_code || `BR-${b.branch_id.toString().padStart(3, "0")}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {b.branch_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {b.branch_name_bn || b.branch_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{b.district}</td>
                    <td className="py-3 px-4 text-slate-500">
                      Operational Thana
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                        Active Station
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
