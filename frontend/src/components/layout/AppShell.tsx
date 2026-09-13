"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Scale,
  FolderLock,
  Users,
  Package,
  Search,
  FileBarChart,
  UserCheck,
  Shield,
  Building2,
  History,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  PhoneCall,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        router.replace("/login");
      }
      setLoading(false);
    }
    verifyAuth();
  }, [router]);

  const handleLogout = async () => {
    await api.logout();
    router.replace("/login");
  };

  const isAdminOrAuditor = user?.roles?.some((r) =>
    ["Administrator", "System Auditor"].includes(r)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if ((pathname === "/admin" || pathname.startsWith("/admin/")) && !isAdminOrAuditor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Access Denied (403)</h3>
          <p className="text-xs text-slate-500">
            Your assigned role does not possess administrative privileges to inspect or modify system configuration.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const navGroups = [
    {
      group: "MAIN",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "INTAKE",
      items: [
        { href: "/complaints", label: "Complaints", icon: FileText },
        { href: "/gd", label: "General Diaries", icon: FileSpreadsheet },
        { href: "/fir", label: "FIRs", icon: Scale },
      ],
    },
    {
      group: "INVESTIGATION",
      items: [
        { href: "/cases", label: "Cases", icon: FolderLock },
        { href: "/participants", label: "Participants", icon: Users },
        { href: "/evidence", label: "Evidence", icon: Package },
      ],
    },
    {
      group: "TOOLS",
      items: [
        { href: "/search", label: "Search", icon: Search },
        { href: "/reports", label: "Reports", icon: FileBarChart },
      ],
    },
  ];

  const adminGroup = {
    group: "ADMINISTRATION",
    items: [
      { href: "/admin", label: "Admin Hub", icon: Shield },
      { href: "/admin/users", label: "Users", icon: UserCheck },
      { href: "/admin/roles", label: "Roles", icon: Shield },
      { href: "/admin/branches", label: "Branches", icon: Building2 },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: History },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Session Security...</span>
        </div>
      </div>
    );
  }

  const renderNavGroup = (grp: { group: string; items: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] }) => (
    <div key={grp.group} className="mb-5">
      <div className="text-[11px] font-semibold text-slate-400 tracking-wider px-3 mb-1.5 uppercase">
        {grp.group}
      </div>
      <div className="space-y-0.5">
        {grp.items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-800 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-700" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30 sticky top-0 no-print">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900">ORCUS</span>
            <span className="text-[10px] text-slate-500 block leading-none">Academic DBMS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Left Sidebar / Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col justify-between z-40 transition-transform duration-200 ease-in-out md:translate-x-0 no-print ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-200">
            <Link href="/dashboard" className="block">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-700 text-white rounded flex items-center justify-center font-bold text-xs">
                  OR
                </div>
                <div>
                  <h1 className="font-bold text-sm text-slate-900 leading-tight">ORCUS</h1>
                  <p className="text-[11px] text-slate-500 leading-none">Case & Evidence System</p>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">Academic DBMS Prototype</p>
            </Link>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navGroups.map(renderNavGroup)}
            {isAdminOrAuditor && renderNavGroup(adminGroup)}
          </nav>
        </div>

        {/* Sidebar Footer: User Details & Logout */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <div className="p-2 bg-white rounded-md border border-slate-200 mb-2">
            <div className="text-xs font-semibold text-slate-900 truncate">
              {user?.officer_name || user?.username}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {user?.roles?.[0] || "Officer"} &bull; {user?.branch_name || "Headquarters"}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-1">
            <Link href="/profile" className="hover:text-blue-600 transition-colors flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              className="hover:text-rose-600 transition-colors flex items-center gap-1 text-slate-500"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/30 z-30 md:hidden no-print"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-6 py-2.5 items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Academic Case &amp; Evidence Management
            </span>
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
              <PhoneCall className="w-3 h-3 text-amber-600" />
              <span>Emergency 999</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelector />

            {/* User Profile & Sign Out Bar in Header */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition group text-left"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center">
                  {(user?.username || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 leading-tight">
                    {user?.officer_name || user?.username}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-none">
                    <span className="text-blue-600 font-medium">{user?.roles?.[0] || "Officer"}</span>
                    {user?.badge_no && <span className="text-slate-400"> &bull; {user.badge_no}</span>}
                  </div>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                title="Sign Out of Session"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-8 pt-4 border-t border-slate-200 text-center text-[11px] text-slate-500 no-print">
            <p>ORCUS — Academic DBMS Prototype &bull; Fictional Demonstration Data Only</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Legal references and workflows are presented for academic demonstration only and do not constitute legal advice or an official procedure.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
