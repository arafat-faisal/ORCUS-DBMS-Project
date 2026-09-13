"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  DashboardOverview,
  CaseOverview,
  Complaint,
  FIR,
  GD,
  Evidence,
} from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WorkflowStepper } from "@/components/ui/WorkflowStepper";
import { LoadingState } from "@/components/ui/FeedbackStates";
import {
  FileText,
  FileSpreadsheet,
  Scale,
  FolderLock,
  Package,
  Clock,
  ArrowRight,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function DashboardPage() {
  const { locale, formatDateTime } = useLocale();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [gds, setGds] = useState<GD[]>([]);
  const [firs, setFirs] = useState<FIR[]>([]);
  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      try {
        const [ovRes, compRes, gdRes, firRes, caseRes, evRes] = await Promise.all([
          api.getDashboardOverview(),
          api.listComplaints({ page_size: 10 }),
          api.listGDs(),
          api.listFIRs(),
          api.searchCases(),
          api.listEvidence(),
        ]);

        if (ovRes.success && ovRes.data) setOverview(ovRes.data);
        if (compRes.success && compRes.data) setComplaints(compRes.data);
        if (gdRes.success && gdRes.data) setGds(gdRes.data);
        if (firRes.success && firRes.data) setFirs(firRes.data);
        if (caseRes.success && caseRes.data) setCases(caseRes.data);
        if (evRes.success && evRes.data) setEvidenceList(evRes.data);
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Compute summary values from real database responses
  const pendingComplaintsCount = complaints.filter(
    (c) => c.current_status === "Submitted" || c.current_status === "Under Review"
  ).length;

  const registeredGDsCount = gds.length;
  const registeredFIRsCount = firs.length;
  const activeCasesCount =
    overview?.active_cases_count ??
    cases.filter((c) => c.case_status === "Open" || c.case_status === "Under Investigation").length;
  const evidenceCount = overview?.evidence_count ?? evidenceList.length;
  const casesAwaitingReviewCount = cases.filter(
    (c) => c.case_status === "Pending Review"
  ).length;

  // Compute status breakdown for real cases
  const caseStatusCounts = cases.reduce((acc, c) => {
    const status = c.case_status || c.status || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const casesNeedingAttention = cases.filter(
    (c) => c.case_status === "Pending Review" || c.case_status === "Reopened"
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}
          description={
            locale === "bn"
              ? "অভিযোগ গ্রহণ, তদন্ত ব্যবস্থাপনা, দায়িত্ব বণ্টন এবং আলামত সংরক্ষণের সার্বিক চিত্র।"
              : "Overview of complaint intake, investigations, assignments, and evidence."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "ড্যাশবোর্ড" : "Dashboard" },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Link
                href="/complaints/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "নতুন অভিযোগ" : "Intake Complaint"}</span>
              </Link>
            </div>
          }
        />

        {loading ? (
          <LoadingState message={locale === "bn" ? "তথ্য লোড হচ্ছে..." : "Loading system dashboard metrics..."} />
        ) : (
          <>
            {/* Section 1: Six Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* 1. Pending Complaints */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {locale === "bn" ? "অপেক্ষমাণ অভিযোগ" : "Pending Complaints"}
                  </span>
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {complaints.length > 0 ? pendingComplaintsCount : "Not available"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "পর্যালোচনাধীন রয়েছে" : "Awaiting initial assessment"}
                </div>
              </div>

              {/* 2. Registered GDs */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {locale === "bn" ? "নিবন্ধিত জিডি" : "Registered GDs"}
                  </span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {gds.length > 0 ? registeredGDsCount : "Not available"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "সাধারণ ডায়েরি এন্ট্রি" : "General Diary entries"}
                </div>
              </div>

              {/* 3. Registered FIRs */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {locale === "bn" ? "দায়েরকৃত এজাহার (FIR)" : "Registered FIRs"}
                  </span>
                  <Scale className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {firs.length > 0 ? registeredFIRsCount : "Not available"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "নিবন্ধিত এজাহারসমূহ" : "Registered FIR records"}
                </div>
              </div>

              {/* 4. Active Cases */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {locale === "bn" ? "সক্রিয় মামলা" : "Active Cases"}
                  </span>
                  <FolderLock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {cases.length > 0 || overview ? activeCasesCount : "Not available"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "চলমান তদন্ত কার্যক্রম" : "Under active investigation"}
                </div>
              </div>

              {/* 5. Evidence Items */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {locale === "bn" ? "সংরক্ষিত আলামত" : "Evidence Items"}
                  </span>
                  <Package className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {evidenceList.length > 0 || overview ? evidenceCount : "Not available"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "ভল্ট ও ল্যাবে রক্ষিত" : "Secured in chain of custody"}
                </div>
              </div>

              {/* 6. Cases Awaiting Review */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    {locale === "bn" ? "রিভিউ অপেক্ষমাণ" : "Cases Awaiting Review"}
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {cases.length > 0 ? casesAwaitingReviewCount : "Not available"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "তত্ত্বাবধায়কের মূল্যায়ন" : "Supervisory review required"}
                </div>
              </div>
            </div>

            {/* Section 2: Workflow Summary & Cases by Status */}
            <div className="space-y-4">
              <WorkflowStepper />

              {/* Cases by Status Breakdown */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      {locale === "bn" ? "মামলার তদন্ত স্থিতি বণ্টন" : "Investigation Cases by Status"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {locale === "bn"
                        ? "ডেটাবেসে সংরক্ষিত প্রকৃত মামলার বর্তমান অবস্থা (রিয়েল-টাইম তথ্য)"
                        : "Current breakdown of registered cases from database records"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    Total: {cases.length} cases
                  </span>
                </div>

                {cases.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No cases registered in the database yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
                    {Object.entries(caseStatusCounts).map(([status, count]) => {
                      const percentage = Math.round((count / cases.length) * 100);
                      return (
                        <div key={status} className="border border-slate-200 rounded-md p-3 bg-slate-50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-700 truncate">{status}</span>
                            <span className="text-xs font-bold text-slate-900">{count}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 text-right">{percentage}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Recent Complaints & Recent Cases */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Complaints */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {locale === "bn" ? "সাম্প্রতিক অভিযোগসমূহ" : "Recent Complaints"}
                    </h3>
                  </div>
                  <Link
                    href="/complaints"
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>{locale === "bn" ? "সকল অভিযোগ" : "View All"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {complaints.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    {locale === "bn" ? "কোনো অভিযোগ পাওয়া যায়নি।" : "No recent complaints recorded."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {complaints.slice(0, 5).map((comp) => (
                      <div key={comp.complaint_id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-800">
                              {comp.tracking_code}
                            </span>
                            <StatusBadge status={comp.current_status} />
                          </div>
                          <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
                            {comp.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {comp.complainant_name || "Citizen Complainant"} &bull;{" "}
                            {formatDateTime(comp.submitted_at || comp.incident_date)}
                          </div>
                        </div>
                        <Link
                          href={`/complaints/${comp.complaint_id}`}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition shrink-0"
                        >
                          {locale === "bn" ? "দেখুন" : "Details"}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Cases */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FolderLock className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {locale === "bn" ? "সাম্প্রতিক তদন্ত মামলা" : "Recent Investigation Cases"}
                    </h3>
                  </div>
                  <Link
                    href="/cases"
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>{locale === "bn" ? "সকল মামলা" : "View All"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {cases.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    {locale === "bn" ? "কোনো মামলা পাওয়া যায়নি।" : "No investigation cases registered."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {cases.slice(0, 5).map((c) => (
                      <div key={c.case_id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {c.fir_number ? `Case #${c.case_id} (${c.fir_number})` : `Case #${c.case_id}`}
                            </span>
                            <StatusBadge status={c.case_status || c.status || "Open"} />
                          </div>
                          <div className="text-xs font-medium text-slate-800 truncate mt-0.5">
                            {c.case_title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {c.crime_category || "General Investigation"} &bull;{" "}
                            {c.lead_officer_name || "Lead Officer Pending"} &bull;{" "}
                            {formatDateTime(c.opened_date)}
                          </div>
                        </div>
                        <Link
                          href={`/cases/${c.case_id}`}
                          className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded bg-slate-50 transition shrink-0"
                        >
                          {locale === "bn" ? "ডসিয়ার" : "Dossier"}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Cases Requiring Attention & Recent Evidence Records */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cases Requiring Attention */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {locale === "bn" ? "মনোযোগ আবশ্যক এমন মামলা" : "Cases Requiring Supervisory Attention"}
                    </h3>
                  </div>
                </div>

                {casesNeedingAttention.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                    {locale === "bn"
                      ? "কোনো মামলা বর্তমানে বিশেষ পর্যালোচনার অপেক্ষায় নেই।"
                      : "No cases currently flagged for urgent supervisory review."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {casesNeedingAttention.map((c) => (
                      <div key={c.case_id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900">{c.case_title}</div>
                          <div className="text-[11px] text-slate-500">
                            Status: <span className="font-semibold text-amber-700">{c.case_status}</span> &bull; Lead: {c.lead_officer_name || "Unassigned"}
                          </div>
                        </div>
                        <Link
                          href={`/cases/${c.case_id}`}
                          className="px-2 py-1 text-xs text-blue-700 hover:text-blue-800 font-semibold"
                        >
                          Review &rarr;
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Evidence Records */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">
                      {locale === "bn" ? "সাম্প্রতিক সংগৃহীত আলামত" : "Recent Evidence Records"}
                    </h3>
                  </div>
                  <Link
                    href="/evidence"
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
                  >
                    <span>{locale === "bn" ? "সকল আলামত" : "View All"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                {evidenceList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    {locale === "bn" ? "কোনো আলামত রেকর্ড পাওয়া যায়নি।" : "No evidence items recorded in database."}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {evidenceList.slice(0, 5).map((ev) => (
                      <div key={ev.evidence_id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              EV-{ev.evidence_id}
                            </span>
                            <span className="text-xs font-medium text-slate-800 truncate">
                              {ev.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Type: {ev.evidence_type} &bull; Location: {ev.storage_location || "Station Evidence Locker"}
                          </div>
                        </div>
                        <StatusBadge status={ev.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
