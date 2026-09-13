"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  LogIn,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Scale,
  FolderLock,
  Package,
} from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";

export default function PublicHomePage() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const res = await api.getMe();
      if (res.success && res.data) {
        setIsAuthenticated(true);
      }
    }
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* 1. Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-700 text-white rounded flex items-center justify-center font-bold text-sm">
              OR
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                ORCUS
              </span>
              <span className="text-[11px] text-slate-500 block leading-none">
                Academic DBMS Demonstration
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold transition-colors"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Officer Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* 2. Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Database Management System Demonstration Project</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Organized Crime Understanding System
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            An academic investigation and evidentiary database system modeling the lifecycle of complaints, station diaries, formal FIRs, investigative dossiers, and tamper-evident evidence chains in Bangladesh.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/public/complaints/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Submit Citizen Complaint</span>
            </Link>
            <Link
              href="/public/complaints/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Track Existing Complaint</span>
            </Link>
          </div>
        </div>

        {/* 3. How the System Works */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-lg font-bold text-slate-900">How the Information System Works</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              The end-to-end administrative and judicial lifecycle of investigation records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-semibold text-xs text-slate-900 pt-1">Submit Complaint</h3>
              <p className="text-[11px] text-slate-600 leading-normal">
                Citizen submits incident details online and receives an immutable tracking code.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-semibold text-xs text-slate-900 pt-1">Officer Review</h3>
              <p className="text-[11px] text-slate-600 leading-normal">
                Duty Officer assesses jurisdiction, factual validity, and initial priority.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-semibold text-xs text-slate-900 pt-1">GD or FIR Decision</h3>
              <p className="text-[11px] text-slate-600 leading-normal">
                Non-cognizable logged into General Diary; cognizable crimes submitted for FIR registration review.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="font-semibold text-xs text-slate-900 pt-1">Case Investigation</h3>
              <p className="text-[11px] text-slate-600 leading-normal">
                Lead IO links suspects, witnesses, and secures physical/digital evidence in vault.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                5
              </span>
              <h3 className="font-semibold text-xs text-slate-900 pt-1">Status Tracking</h3>
              <p className="text-[11px] text-slate-600 leading-normal">
                Complainants track milestone updates without exposing sensitive police notes.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Academic Prototype Notice */}
        <div className="p-5 bg-blue-50/60 border border-blue-200 rounded-lg text-xs text-blue-950 space-y-1">
          <p className="font-bold">Academic DBMS Project Notice</p>
          <p className="text-blue-900">
            ORCUS is developed as an academic Database Management System (DBMS) project. It is not an official system of Bangladesh Police or the Ministry of Home Affairs, does not connect to governmental databases, and uses fictional demonstration data only.
          </p>
        </div>
      </main>

      {/* 5. Emergency Notice Footer */}
      <footer className="bg-slate-900 text-slate-300 py-6 px-4 border-t border-slate-800 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <PhoneCall className="w-4 h-4 shrink-0" />
            <span>Emergency Notice: For immediate police or medical assistance in Bangladesh, call 999.</span>
          </div>
          <div className="text-slate-400 text-center md:text-right">
            <span>ORCUS does not dispatch emergency services. Academic DBMS Prototype.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
