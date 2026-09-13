"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState } from "@/components/ui/FeedbackStates";
import {
  Search,
  FileText,
  FileSpreadsheet,
  Scale,
  FolderLock,
  Package,
  Users,
  ArrowRight,
  Filter,
} from "lucide-react";

interface SearchResultItem {
  id: string | number;
  entityType: "Complaint" | "GD" | "FIR" | "Case" | "Evidence" | "Participant";
  title: string;
  referenceNo: string;
  matchedField: string;
  status: string;
  date: string;
  href: string;
}

export default function GlobalSearchPage() {
  const { locale, formatDateTime } = useLocale();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    const q = query.trim();

    try {
      const combined: SearchResultItem[] = [];

      // 1. Complaints
      if (category === "All" || category === "Complaints") {
        const compRes = await api.listComplaints({ search: q });
        if (compRes.success && compRes.data) {
          compRes.data.forEach((comp) => {
            combined.push({
              id: comp.complaint_id,
              entityType: "Complaint",
              title: comp.title,
              referenceNo: comp.tracking_code,
              matchedField: `Complainant: ${comp.complainant_name || "Citizen"} &bull; Branch: ${comp.branch_name || "Headquarters"}`,
              status: comp.current_status,
              date: comp.submitted_at || comp.incident_date,
              href: `/complaints/${comp.complaint_id}`,
            });
          });
        }
      }

      // 2. Cases
      if (category === "All" || category === "Cases") {
        const caseRes = await api.searchCases({ search: q });
        if (caseRes.success && caseRes.data) {
          caseRes.data.forEach((c) => {
            combined.push({
              id: c.case_id,
              entityType: "Case",
              title: c.case_title,
              referenceNo: c.fir_number ? `CASE-${c.case_id} (${c.fir_number})` : `CASE-${c.case_id}`,
              matchedField: `Category: ${c.crime_category || "Offense"} &bull; IO: ${c.lead_officer_name || "Unassigned"}`,
              status: c.case_status || c.status || "Open",
              date: c.opened_date,
              href: `/cases/${c.case_id}`,
            });
          });
        }
      }

      // 3. FIRs
      if (category === "All" || category === "FIRs") {
        const firRes = await api.listFIRs();
        if (firRes.success && firRes.data) {
          const matched = firRes.data.filter(
            (f) =>
              f.fir_number.toLowerCase().includes(q.toLowerCase()) ||
              f.crime_category.toLowerCase().includes(q.toLowerCase()) ||
              (f.complainant_name && f.complainant_name.toLowerCase().includes(q.toLowerCase()))
          );
          matched.forEach((fir) => {
            combined.push({
              id: fir.fir_id,
              entityType: "FIR",
              title: `FIR: ${fir.crime_category}`,
              referenceNo: fir.fir_number,
              matchedField: `Informant: ${fir.complainant_name || "State"} &bull; Branch: ${fir.branch_name || "Headquarters"}`,
              status: fir.current_status,
              date: fir.filed_date,
              href: `/fir/${fir.fir_id}`,
            });
          });
        }
      }

      // 4. GDs
      if (category === "All" || category === "GD") {
        const gdRes = await api.listGDs();
        if (gdRes.success && gdRes.data) {
          const matched = gdRes.data.filter(
            (g) =>
              g.gd_number.toLowerCase().includes(q.toLowerCase()) ||
              g.subject.toLowerCase().includes(q.toLowerCase()) ||
              (g.complainant_name && g.complainant_name.toLowerCase().includes(q.toLowerCase()))
          );
          matched.forEach((gd) => {
            combined.push({
              id: gd.gd_id,
              entityType: "GD",
              title: gd.subject,
              referenceNo: gd.gd_number,
              matchedField: `Complainant: ${gd.complainant_name || "Informant"}`,
              status: gd.current_status,
              date: gd.gd_date,
              href: `/gd/${gd.gd_id}`,
            });
          });
        }
      }

      // 5. Evidence
      if (category === "All" || category === "Evidence") {
        const evRes = await api.listEvidence();
        if (evRes.success && evRes.data) {
          const matched = evRes.data.filter(
            (ev) =>
              ev.title.toLowerCase().includes(q.toLowerCase()) ||
              (ev.description && ev.description.toLowerCase().includes(q.toLowerCase())) ||
              (ev.storage_location && ev.storage_location.toLowerCase().includes(q.toLowerCase()))
          );
          matched.forEach((ev) => {
            combined.push({
              id: ev.evidence_id,
              entityType: "Evidence",
              title: ev.title,
              referenceNo: `EV-${ev.evidence_id}`,
              matchedField: `Type: ${ev.evidence_type} &bull; Locker: ${ev.storage_location || "Station Vault"}`,
              status: ev.status,
              date: ev.collected_at,
              href: `/evidence/${ev.evidence_id}`,
            });
          });
        }
      }

      // 6. Participants
      if (category === "All" || category === "Participants") {
        const susRes = await api.listSuspects(q);
        if (susRes.success && susRes.data) {
          susRes.data.forEach((s) => {
            combined.push({
              id: s.suspect_id,
              entityType: "Participant",
              title: `${s.first_name} ${s.last_name}`,
              referenceNo: `PART-${s.suspect_id}`,
              matchedField: `Identification: ${s.identification_sign || "None noted"} &bull; Suspicion: ${s.suspicion_level}`,
              status: s.status || "Participant",
              date: new Date().toISOString(),
              href: `/participants`,
            });
          });
        }
      }

      setResults(combined);
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  const getEntityBadge = (type: string) => {
    switch (type) {
      case "Complaint":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "GD":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "FIR":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Case":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Evidence":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Participant":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "সার্বজনীন অনুসন্ধান" : "Database Search"}
          description={
            locale === "bn"
              ? "অভিযোগ, জিডি, এজাহার, মামলা, আলামত এবং সংশ্লিষ্ট ব্যক্তিদের সমন্বিত অনুসন্ধান।"
              : "Cross-entity search across complaints, general diaries, FIRs, investigation cases, evidence, and participants."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Search" },
          ]}
        />

        {/* Main Search Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    locale === "bn"
                      ? "রেফারেন্স নম্বর, শিরোনাম, নাম, বা অপরাধের বিবরণ দিয়ে খুঁজুন..."
                      : "Search by reference code, name, title, or keywords..."
                  }
                  className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="All">All Categories</option>
                <option value="Complaints">Complaints</option>
                <option value="GD">General Diaries</option>
                <option value="FIRs">FIRs</option>
                <option value="Cases">Investigation Cases</option>
                <option value="Evidence">Evidence Items</option>
                <option value="Participants">Participants</option>
              </select>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>{loading ? "Searching..." : "Search"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search Results Display */}
        {loading ? (
          <LoadingState message="Executing search query across institutional database tables..." />
        ) : searched ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Possible matching records: <strong className="text-slate-800">{results.length}</strong>
              </span>
              <span>Query: &ldquo;{query}&rdquo;</span>
            </div>

            {results.length === 0 ? (
              <EmptyState
                title="No matching records found"
                description="No records in complaints, diaries, cases, or evidence matched your query terms."
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-xs overflow-hidden">
                {results.map((r, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50/75 transition-colors flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getEntityBadge(
                            r.entityType
                          )}`}
                        >
                          {r.entityType}
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {r.referenceNo}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate">
                        {r.title}
                      </div>
                      <div
                        className="text-xs text-slate-500"
                        dangerouslySetInnerHTML={{ __html: r.matchedField }}
                      />
                    </div>

                    <Link
                      href={r.href}
                      className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 rounded bg-white text-xs font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 shrink-0 transition"
                    >
                      <span>Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
