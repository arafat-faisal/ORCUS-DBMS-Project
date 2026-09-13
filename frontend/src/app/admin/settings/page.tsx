"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Settings,
  Database,
  ShieldCheck,
  Server,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { locale } = useLocale();

  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [dbConnected, setDbConnected] = useState<boolean>(true);
  const [testing, setTesting] = useState(false);

  const checkBackendHealth = async () => {
    setTesting(true);
    try {
      const res = await api.getMe();
      if (res.success) {
        setHealthStatus("Connected and Authenticated (HTTP 200)");
        setDbConnected(true);
      } else {
        setHealthStatus("Service Reachable (Unauthorized or Session Expired)");
      }
    } catch {
      setHealthStatus("Service Connection Failed");
      setDbConnected(false);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "সিস্টেম সেটিংস ও ডাটাবেস স্থিতি" : "System & Database Settings"}
          description={
            locale === "bn"
              ? "সার্ভার সংযোগ, ডাটাবেস স্বাস্থ্য এবং প্রাতিষ্ঠানিক কমপ্লায়েন্স কনফিগারেশন।"
              : "Administrative configuration, backend API connectivity diagnostics, and academic DBMS settings."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Administration" },
            { label: "Settings" },
          ]}
          action={
            <button
              onClick={checkBackendHealth}
              disabled={testing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              <span>Test API Link</span>
            </button>
          }
        />

        {/* Database Diagnostic Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Relational Database Management System (RDBMS) Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Database Engine</span>
              <span className="font-semibold text-slate-900">MySQL / MariaDB (Port 3306)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Schema Normalization</span>
              <span className="font-semibold text-slate-900">Third Normal Form (3NF)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Audit Retention</span>
              <span className="font-semibold text-slate-900">Append-Only Immutable Logs</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Backend Framework</span>
              <span className="font-semibold text-slate-900">Go (Gin Engine + SQLx)</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 block text-[11px]">API Port</span>
              <span className="font-semibold text-slate-900 font-mono">http://localhost:5050/api/v1</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Diagnostic Link</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {healthStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Academic Prototype Guidelines */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Academic Demonstration Governance Notice
            </h3>
          </div>
          <div className="text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              ORCUS is engineered as a university Database Management System (DBMS) demonstration for investigating crime management, chain-of-custody tracking, and legal section compliance under the Code of Criminal Procedure in Bangladesh.
            </p>
            <p>
              It is strictly non-operational and does not dispatch emergency services. Fictional datasets, simulated police branches, and sample case files are utilized throughout the evaluation interface.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
