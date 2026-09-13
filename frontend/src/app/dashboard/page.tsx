"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import {
  DashboardOverview,
  CasePipeline,
  CaseOverview,
  Complaint,
  FIR,
  GD,
  UserProfile,
} from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  LayoutDashboard,
  FolderLock,
  FileText,
  FileSpreadsheet,
  Package,
  Shield,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Plus,
  Users,
  CheckCircle2,
  Building,
  Scale,
} from "lucide-react";

export default function DashboardPage() {
  const { t, formatDateTime } = useLocale();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [pipeline, setPipeline] = useState<CasePipeline[]>([]);
  const [recentCases, setRecentCases] = useState<CaseOverview[]>([]);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [recentFIRs, setRecentFIRs] = useState<FIR[]>([]);
  const [recentGDs, setRecentGDs] = useState<GD[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      const [ovRes, pipeRes, casesRes, compRes, firRes, gdRes] = await Promise.all([
        api.getDashboardOverview(),
        api.getCasePipeline(),
        api.searchCases(),
        api.listComplaints(),
        api.listFIRs(),
        api.listGDs(),
      ]);

      if (ovRes.success && ovRes.data) setOverview(ovRes.data);
      if (pipeRes.success && pipeRes.data) setPipeline(pipeRes.data);
      if (casesRes.success && casesRes.data) setRecentCases(casesRes.data.slice(0, 5));
      if (compRes.success && compRes.data) setRecentComplaints(compRes.data.slice(0, 5));
      if (firRes.success && firRes.data) setRecentFIRs(firRes.data.slice(0, 5));
      if (gdRes.success && gdRes.data) setRecentGDs(gdRes.data.slice(0, 5));

      setLoading(false);
    }
    loadDashboardData();
  }, []);

  return (
    <PortalLayout>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Welcome / Identity Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>ORCUS &bull; Command & Investigation Headquarters</span>
            </div>
            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
              Operational Command Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time situational awareness, case pipeline clearance metrics, and forensic evidence tracking.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Intake Complaint</span>
            </Link>
            <Link
              href="/gd"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-cyan-950/40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>General Diary</span>
            </Link>
            <Link
              href="/fir"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-rose-950/40"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>FIR Register</span>
            </Link>
            <Link
              href="/cases?action=new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-indigo-950/40"
            >
              <FolderLock className="w-3.5 h-3.5" />
              <span>Open Case</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Cases */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden group hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Active Cases</span>
              <FolderLock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {overview?.total_cases_count || recentCases.length || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-cyan-400 font-mono">
              <span>{overview?.active_cases_count || 0} Under Investigation</span>
            </div>
          </div>

          {/* Complaints Pending */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Citizen Complaints</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {recentComplaints.length}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <Link href="/complaints" className="hover:underline">
                View Intake Queue &rarr;
              </Link>
            </div>
          </div>

          {/* FIRs Registered */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden group hover:border-rose-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Registered FIRs</span>
              <Shield className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {recentFIRs.length}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-rose-400 font-mono">
              <span>CrPC Section 154 Offenses</span>
            </div>
          </div>

          {/* Evidence Vault */}
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-2 relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-mono uppercase">Evidence In Vault</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black font-mono text-slate-100">
              {overview?.evidence_count || 14}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
              <Link href="/evidence" className="hover:underline">
                Tamper-Evident Chain &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Dual Column Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent FIRs / High-Priority Incidents */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
                  Recent First Information Reports (FIR)
                </h2>
              </div>
              <Link href="/fir" className="text-xs text-rose-400 hover:underline">
                View All &rarr;
              </Link>
            </div>

            {recentFIRs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No recent FIR records.</p>
            ) : (
              <div className="space-y-3">
                {recentFIRs.map((fir) => (
                  <Link
                    key={fir.fir_id}
                    href={`/fir/${fir.fir_id}`}
                    className="block p-3.5 bg-slate-950/60 hover:bg-slate-800/40 rounded-lg border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-rose-400">{fir.fir_number}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateTime(fir.filed_date)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">{fir.crime_category}</span>
                      <span className="text-xs text-slate-400">{fir.complainant_name || "State"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Active Investigation Cases */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
                  Active Investigation Cases
                </h2>
              </div>
              <Link href="/cases" className="text-xs text-cyan-400 hover:underline">
                View Ledger &rarr;
              </Link>
            </div>

            {recentCases.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No active cases registered.</p>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <Link
                    key={c.case_id}
                    href={`/cases/${c.case_id}`}
                    className="block p-3.5 bg-slate-950/60 hover:bg-slate-800/40 rounded-lg border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200 line-clamp-1">{c.case_title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/60 shrink-0 ml-2">
                        {c.case_status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Lead: {c.lead_officer_name || "Unassigned"}</span>
                      <span className="font-mono">#{c.case_id}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Complaints Intake Feed & GD Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaints Pending Assessment */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
                  Citizen Intake & Complaints Queue
                </h2>
              </div>
              <Link href="/complaints" className="text-xs text-emerald-400 hover:underline">
                View Queue &rarr;
              </Link>
            </div>

            {recentComplaints.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No pending citizen complaints.</p>
            ) : (
              <div className="space-y-3">
                {recentComplaints.map((cmp) => (
                  <Link
                    key={cmp.complaint_id}
                    href={`/complaints/${cmp.complaint_id}`}
                    className="block p-3.5 bg-slate-950/60 hover:bg-slate-800/40 rounded-lg border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400">{cmp.tracking_code}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateTime(cmp.submitted_at)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-slate-200 line-clamp-1">{cmp.description}</span>
                      <span className="text-xs font-mono text-amber-400 shrink-0 ml-2">{cmp.current_status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* General Diary (GD) Feed */}
          <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-200">
                  Station General Diary (GD)
                </h2>
              </div>
              <Link href="/gd" className="text-xs text-cyan-400 hover:underline">
                View Register &rarr;
              </Link>
            </div>

            {recentGDs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-6 text-center">No general diary entries recorded.</p>
            ) : (
              <div className="space-y-3">
                {recentGDs.map((gd) => (
                  <Link
                    key={gd.gd_id}
                    href={`/gd/${gd.gd_id}`}
                    className="block p-3.5 bg-slate-950/60 hover:bg-slate-800/40 rounded-lg border border-slate-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400">{gd.gd_number}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatDateTime(gd.gd_date)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm text-slate-200 line-clamp-1">{gd.subject}</span>
                      <span className="text-xs text-slate-400 shrink-0 ml-2">{gd.complainant_name || "State"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
