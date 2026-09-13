"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Building2,
  Phone,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import { PublicTrackResponse } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { EmergencyDisclaimer } from "@/components/common/EmergencyDisclaimer";
import { StatusBadge } from "@/components/ui/StatusBadge";

function TrackContent() {
  const searchParams = useSearchParams();
  const { locale, formatDateTime } = useLocale();

  const [trackingCode, setTrackingCode] = useState(searchParams.get("code") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PublicTrackResponse | null>(null);

  const handleSearch = React.useCallback(async (code: string, phoneNumber: string) => {
    setError("");
    setResult(null);

    if (!code.trim()) {
      setError(
        locale === "bn"
          ? "ট্র্যাকিং কোড প্রদান করা আবশ্যক।"
          : "Tracking reference code is required."
      );
      return;
    }
    if (!phoneNumber.trim()) {
      setError(
        locale === "bn"
          ? "দাখিলকৃত মোবাইল নম্বর প্রদান করুন।"
          : "Registered mobile phone number is required for verification."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.trackPublicComplaint(code.trim(), phoneNumber.trim());
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(
          res.error ||
            (locale === "bn"
              ? "কোনো অভিযোগ পাওয়া যায়নি। কোড ও মোবাইল নম্বর পুনরায় যাচাই করুন।"
              : "No matching record found. Please verify your tracking code and mobile phone number.")
        );
      }
    } catch {
      setError("Network error communicating with ORCUS tracker.");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    const codeParam = searchParams.get("code");
    const phoneParam = searchParams.get("phone");
    if (codeParam && phoneParam) {
      handleSearch(codeParam, phoneParam);
    }
  }, [searchParams, handleSearch]);

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(trackingCode, phone);
  };

  return (
    <div className="space-y-6">
      {/* Search Input Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {locale === "bn" ? "নাগরিক অভিযোগ ট্র্যাকিং পোর্টাল" : "Track Complaint Status"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "bn"
              ? "দাখিলকৃত অভিযোগের ট্র্যাকিং কোড এবং নিবন্ধিত ফোন নম্বর প্রদান করে বর্তমান পর্যালোচনা অগ্রগতি জানুন।"
              : "Enter your official tracking code and the registered mobile number to check review progress."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={onFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === "bn" ? "ট্র্যাকিং কোড (Tracking Code)" : "Tracking Reference Code"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="e.g. CMP-DHK-2026-XXXXXX"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {locale === "bn" ? "দাখিলকৃত মোবাইল নম্বর" : "Registered Contact Phone"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md font-semibold text-xs text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 transition flex items-center justify-center gap-2 shadow-xs"
          >
            {loading ? (
              <span>{locale === "bn" ? "খোঁজা হচ্ছে..." : "Checking Records..."}</span>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "স্ট্যাটাস দেখুন" : "Track Status"}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-blue-800">
                {result.tracking_code}
              </span>
              <StatusBadge status={result.current_status} />
            </div>
            <span className="text-xs text-slate-500">
              Submitted: {formatDateTime(result.submission_date)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Receiving Police Branch</span>
              <span className="font-semibold text-slate-900">{result.receiving_branch}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Last Updated</span>
              <span className="text-slate-800">{formatDateTime(result.last_updated)}</span>
            </div>
          </div>

          {result.public_status_message && (
            <div>
              <span className="text-slate-500 block text-[11px] mb-1">Official Status Notice</span>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-800 text-xs leading-relaxed">
                {result.public_status_message}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PublicComplaintTrackPage() {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              OR
            </div>
            <div>
              <span className="font-bold tracking-tight text-slate-900 block leading-tight">ORCUS</span>
              <span className="text-[11px] text-slate-500 block leading-none">
                {locale === "bn" ? "নাগরিক অভিযোগ ট্র্যাকিং" : "Complaint Status Tracking"}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/public/complaints/new"
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
            >
              {locale === "bn" ? "নতুন অভিযোগ দাখিল" : "Submit Complaint"}
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <EmergencyDisclaimer />
        <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading tracker...</div>}>
          <TrackContent />
        </Suspense>
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
        <span>
          Academic database prototype demonstration &bull; Fictional information only
        </span>
      </footer>
    </div>
  );
}
