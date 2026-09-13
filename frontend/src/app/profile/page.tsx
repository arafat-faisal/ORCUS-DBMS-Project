"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  User,
  Shield,
  Building,
  LogOut,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { locale } = useLocale();

  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
      setLoading(false);
    }
    loadMe();
  }, []);

  const handleLogout = async () => {
    await api.logout();
    router.replace("/login");
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "কর্মকর্তার প্রোফাইল" : "Officer Profile"}
          description={
            locale === "bn"
              ? "বর্তমান লগইনকৃত কর্মকর্তার পরিচয়, ভূমিকা এবং অধিক্ষেত্র তথ্য।"
              : "Institutional identity, active security roles, and assigned branch jurisdiction."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Profile" },
          ]}
        />

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-6">
          {/* Header Card */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-14 h-14 rounded-full bg-blue-700 text-white font-bold text-xl flex items-center justify-center">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : "OF"}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {user?.officer_name || user?.username || "Authenticated Officer"}
              </h2>
              <p className="text-xs text-slate-500">
                Official Username: <strong className="font-mono text-slate-700">{user?.username}</strong>
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {user?.roles?.map((r, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-semibold"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[11px] mb-1">Rank & Official Designation</span>
              <span className="font-semibold text-slate-900 text-sm">
                {user?.rank || "Officer of the Investigation Unit"}
              </span>
            </div>

            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[11px] mb-1">Badge Identification Number</span>
              <span className="font-mono font-bold text-blue-800 text-sm">
                {user?.badge_no || "BP-OFFICER"}
              </span>
            </div>

            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[11px] mb-1">Assigned Branch / Station</span>
              <span className="font-semibold text-slate-900 text-sm">
                {user?.branch_name || "Headquarters Investigation Unit"}
              </span>
            </div>

            <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50">
              <span className="text-slate-500 block text-[11px] mb-1">Jurisdiction District</span>
              <span className="font-semibold text-slate-900 text-sm">
                {user?.district || "Dhaka Metropolitan Area"}
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Session is secured with HTTP-only tokens.
            </span>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Portal</span>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
