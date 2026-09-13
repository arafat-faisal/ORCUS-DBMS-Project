"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  FolderLock,
  Users,
  Package,
  History,
  LogOut,
  User,
  Building2,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { EmergencyDisclaimer } from "@/components/common/EmergencyDisclaimer";

interface PortalLayoutProps {
  children: React.ReactNode;
}

export function PortalLayout({ children }: PortalLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        router.replace("/login");
      }
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await api.logout();
    router.replace("/login");
  };

  const navLinks = [
    { href: "/dashboard", labelKey: "nav.dashboard", defaultEn: "Dashboard", icon: LayoutDashboard },
    { href: "/complaints", labelKey: "nav.complaints", defaultEn: "Complaints", icon: FileText },
    { href: "/gd", labelKey: "nav.gd", defaultEn: "General Diary (GD)", icon: FileSpreadsheet },
    { href: "/fir", labelKey: "nav.fir", defaultEn: "FIR Registry", icon: FileSpreadsheet },
    { href: "/cases", labelKey: "nav.cases", defaultEn: "Cases & Dossiers", icon: FolderLock },
    { href: "/participants", labelKey: "nav.participants", defaultEn: "Participants", icon: Users },
    { href: "/evidence", labelKey: "nav.evidence", defaultEn: "Evidence & Custody", icon: Package },
  ];

  // Auditor or Admin links
  const isAdminOrAuditor = user?.roles?.some((r) =>
    ["Administrator", "System Auditor"].includes(r)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Verifying Session Security...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Banner: Academic Prototype & Emergency Notice */}
      <header className="bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-semibold uppercase tracking-wider text-[10px]">
              Academic Prototype
            </span>
            <span className="hidden sm:inline">
              Investigation Management System — Fictional Bangladesh Context Only
            </span>
          </div>
          <div className="flex items-center gap-3">
            <EmergencyDisclaimer compact />
            <div className="h-4 w-px bg-slate-800" />
            <LanguageSelector />
          </div>
        </div>

        {/* Primary Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-950 group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white">ORCUS</span>
                  <span className="text-[10px] text-slate-400 font-mono border border-slate-700 rounded px-1">
                    v2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-none">
                  Organized Crime Understanding System
                </p>
              </div>
            </Link>

            {/* Quick Public Portal Shortcut */}
            <Link
              href="/public/complaints/new"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 bg-slate-800/50 hover:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700/60 transition-colors"
            >
              <span>Public Intake Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-3 text-right">
                <div className="space-y-0.5">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-slate-200">{user.username}</span>
                    <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800/60">
                      {user.roles?.[0] || "Authorized User"}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{user.branch_name || "Headquarters"}</span>
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-slate-800 hover:border-red-900/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Operational Navigation Tabs */}
        <nav className="border-t border-slate-800/80 bg-slate-900/60 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 py-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t(item.labelKey, item.defaultEn)}</span>
                </Link>
              );
            })}

            {isAdminOrAuditor && (
              <Link
                href="/admin/audit-logs"
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  pathname.startsWith("/admin/audit-logs")
                    ? "bg-emerald-600 text-white shadow-xs font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>{t("nav.audit", "System Audit Logs")}</span>
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Main Page Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ORCUS Academic Demonstration — Fictional Law-Enforcement Prototype (Bangladesh Context)
          </span>
          <span className="text-slate-600">
            Confidential Academic Research &bull; Unauthorized real-world use strictly prohibited
          </span>
        </div>
      </footer>
    </div>
  );
}
