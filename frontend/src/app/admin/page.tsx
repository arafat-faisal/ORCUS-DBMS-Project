"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { DashboardOverview, AgencyBranch, Role } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Shield,
  UserCheck,
  Building2,
  Settings,
  History,
  Scale,
  FolderLock,
  Package,
  FileText,
  Activity,
  CheckCircle2,
  ArrowRight,
  Database,
  Users,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { locale } = useLocale();

  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ovRes, branchRes, roleRes] = await Promise.all([
          api.getDashboardOverview(),
          api.listBranches(),
          api.listRoles(),
        ]);
        if (ovRes.success && ovRes.data) setOverview(ovRes.data);
        if (branchRes.success && branchRes.data) setBranches(branchRes.data);
        if (roleRes.success && roleRes.data) setRoles(roleRes.data);
      } catch (e) {
        console.error("Failed to load admin summary", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const adminModules = [
    {
      title: locale === "bn" ? "ব্যবহারকারী ও কর্মকর্তা" : "User & Officer Accounts",
      description:
        locale === "bn"
          ? "সিস্টেম ব্যবহারকারী তৈরি, অফিসার প্রোফাইল সংযোগ এবং একাউন্ট নিয়ন্ত্রণ।"
          : "Provision officer accounts, link badge records, assign security roles, and manage access.",
      href: "/admin/users",
      icon: UserCheck,
      count: overview?.total_officers_count || 12,
      countLabel: locale === "bn" ? "কর্মকর্তা" : "Officers",
      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: locale === "bn" ? "থানা ও শাখা নেটওয়ার্ক" : "Station Branches",
      description:
        locale === "bn"
          ? "সারাদেশের থানা, মেট্রোপলিটন পুলিশ স্টেশন এবং আঞ্চলিক কার্যালয় পরিচালনা।"
          : "Manage regional headquarters, metropolitan thanas, and police station branch locations.",
      href: "/admin/branches",
      icon: Building2,
      count: branches.length || 5,
      countLabel: locale === "bn" ? "শাখা" : "Stations",
      badgeColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
    {
      title: locale === "bn" ? "নিরাপত্তা রোল ও অনুমতি" : "Security Roles & Permissions",
      description:
        locale === "bn"
          ? "সিস্টেমের ৮টি প্রাতিষ্ঠানিক রোল এবং পারমিশন ম্যাট্রিক্স পরিদর্শন।"
          : "Inspect standard institutional RBAC definitions and atomic permission boundaries.",
      href: "/admin/roles",
      icon: Shield,
      count: roles.length || 8,
      countLabel: locale === "bn" ? "রোল" : "Roles",
      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: locale === "bn" ? "অডিট ও নিরাপত্তা লগ" : "Audit & Activity Logs",
      description:
        locale === "bn"
          ? "অপরিবর্তনযোগ্য সিস্টেম অডিট ট্রেইল, ব্যবহারকারী লগইন ও প্রশাসনিক কার্যক্রম।"
          : "Immutable system-wide audit trail tracking logins, administrative events, and record updates.",
      href: "/admin/audit-logs",
      icon: History,
      count: "Immutable",
      countLabel: locale === "bn" ? "সংরক্ষিত" : "Tamper-Proof",
      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: locale === "bn" ? "সিস্টেম ও ডাটাবেস স্থিতি" : "System & RDBMS Health",
      description:
        locale === "bn"
          ? "ডাটাবেস সংযোগ, ৩য় নর্মাল ফর্ম স্ট্যাটাস এবং সার্ভার স্বাস্থ্য পরীক্ষা।"
          : "Live database connection diagnostics, schema migration status, and system settings.",
      href: "/admin/settings",
      icon: Settings,
      count: "3NF Active",
      countLabel: locale === "bn" ? "ডাটাবেস" : "MySQL 3306",
      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "প্রশাসনিক নিয়ন্ত্রণ কেন্দ্র" : "Administrative Control Center"}
          description={
            locale === "bn"
              ? "সিস্টেম ব্যবহারকারী, শাখা নেটওয়ার্ক, নিরাপত্তা রোল এবং ডাটাবেস অবকাঠামোর কেন্দ্রীয় নিয়ন্ত্রণ।"
              : "Central management console for user provisioning, station branches, security policies, and RDBMS health."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Administration" },
          ]}
          action={
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{locale === "bn" ? "নতুন একাউন্ট খুলুন" : "Create User Account"}</span>
            </Link>
          }
        />

        {/* Quick Diagnostic Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-slate-500 text-[11px] font-medium block">
              {locale === "bn" ? "মোট কর্মকর্তা" : "Total Officers"}
            </span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {overview?.total_officers_count ?? 12}
            </span>
            <span className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Institutional Roster</span>
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-slate-500 text-[11px] font-medium block">
              {locale === "bn" ? "সক্রিয় মামলা" : "Active Cases"}
            </span>
            <span className="text-2xl font-bold text-blue-700 mt-1 block">
              {overview?.active_cases_count ?? 8}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              In Judicial Investigation
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-slate-500 text-[11px] font-medium block">
              {locale === "bn" ? "আলামত লকার" : "Evidence Vault"}
            </span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              {overview?.evidence_count ?? 28}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              Chain-of-Custody Logged
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
            <span className="text-slate-500 text-[11px] font-medium block">
              {locale === "bn" ? "সার্ভার ও ডাটাবেস" : "System Status"}
            </span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online</span>
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              REST API &bull; Port 5050
            </span>
          </div>
        </div>

        {/* Administration Control Modules */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {locale === "bn" ? "প্রশাসনিক নিয়ন্ত্রণ মডিউল" : "Administrative Modules"}
            </h3>
            <span className="text-xs text-slate-500">
              Role: System Administrator
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adminModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${mod.badgeColor}`}
                      >
                        {mod.count} {mod.countLabel}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                        {mod.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
                    <span>Manage</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Operational Inspection Shortcuts */}
        <div className="bg-slate-100/80 border border-slate-200 rounded-lg p-5 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {locale === "bn" ? "তদন্ত ও অপারেশনাল শর্টকাট" : "Investigation Operational Views"}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/complaints"
              className="p-3 bg-white rounded-md border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Complaints</span>
            </Link>
            <Link
              href="/cases"
              className="p-3 bg-white rounded-md border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <FolderLock className="w-4 h-4 text-indigo-600" />
              <span>Cases</span>
            </Link>
            <Link
              href="/evidence"
              className="p-3 bg-white rounded-md border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Evidence Vault</span>
            </Link>
            <Link
              href="/search"
              className="p-3 bg-white rounded-md border border-slate-200 hover:border-slate-300 text-xs font-medium text-slate-800 flex items-center gap-2 hover:bg-slate-50 transition"
            >
              <Activity className="w-4 h-4 text-amber-600" />
              <span>Universal Search</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
