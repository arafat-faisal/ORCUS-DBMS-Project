"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Search,
  Building2,
  Phone,
  Calendar,
  AlertCircle,
  Info,
} from "lucide-react";
import { api } from "@/lib/api";
import { PublicTrackResponse } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { EmergencyDisclaimer } from "@/components/common/EmergencyDisclaimer";

function TrackContent() {
  const searchParams = useSearchParams();
  const { locale } = useLocale();

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
          ? "ট্র্যাকিং কোড প্রদান করা আবশ্যক (যেমন: CMP-DHK-2026-XXXXXX)।"
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
              : "No matching record found. Verify your tracking code and mobile phone number.")
        );
      }
    } catch {
      setError("Network error communicating with ORCUS tracker.");
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // If both query params are provided, auto-track asynchronously
  useEffect(() => {
    const codeParam = searchParams.get("code");
    const phoneParam = searchParams.get("phone");
    if (codeParam && phoneParam) {
      let active = true;
      (async () => {
        try {
          const res = await api.trackPublicComplaint(codeParam.trim(), phoneParam.trim());
          if (active) {
            if (res.success && res.data) {
              setResult(res.data);
            } else {
              setError(
                res.error ||
                  (locale === "bn"
                    ? "কোনো অভিযোগ পাওয়া যায়নি।"
                    : "No matching record found.")
              );
            }
          }
        } catch {
          if (active) {
            setError("Network error communicating with ORCUS tracker.");
          }
        }
      })();
      return () => {
        active = false;
      };
    }
  }, [searchParams, locale]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "Under Review":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "Correction Required":
        return "bg-orange-950/80 text-orange-300 border-orange-800";
      case "Converted to GD":
      case "Converted to FIR":
      case "Resolved":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      case "Rejected":
      case "Closed":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white">ORCUS</span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                {locale === "bn" ? "অভিযোগ ট্র্যাকিং সার্ভিস" : "Citizen Tracking Portal"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/public/complaints/new"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline"
            >
              {locale === "bn" ? "নতুন অভিযোগ দাখিল" : "File New Complaint"}
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <EmergencyDisclaimer />

        {/* Tracking Query Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-lg mb-8">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Search className="w-6 h-6 text-emerald-500" />
              <span>
                {locale === "bn" ? "অভিযোগের অগ্রগতি অনুসন্ধান" : "Track Complaint Progression"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {locale === "bn"
                ? "আপনার প্রাপ্ত ট্র্যাকিং নম্বর এবং দাখিলকালীন মোবাইল নম্বর প্রদান করুন।"
                : "Enter your official tracking code and registered phone number to view safe status updates."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(trackingCode, phone);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {locale === "bn" ? "ট্র্যাকিং কোড *" : "Tracking Code *"}
              </label>
              <input
                type="text"
                required
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="CMP-DHK-2026-000001"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {locale === "bn" ? "দাখিলকৃত মোবাইল নম্বর *" : "Registered Mobile Phone *"}
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-white font-medium text-sm transition shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{locale === "bn" ? "অনুসন্ধান চলছে..." : "Checking Records..."}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{locale === "bn" ? "অগ্রগতি দেখুন" : "Track Progression"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tracking Details Display */}
        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">
                  {locale === "bn" ? "রেফারেন্স নম্বর" : "Reference Code"}
                </span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
                  {result.tracking_code}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{locale === "bn" ? "বর্তমান অবস্থা:" : "Current Status:"}</span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                    result.current_status
                  )}`}
                >
                  {result.current_status}
                </span>
              </div>
            </div>

            {/* Public Status Message Callout */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-5 my-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    {locale === "bn" ? "থানা/শাখার অফিসিয়াল বার্তা" : "Official Station Response"}
                  </h4>
                  <p className="text-sm text-slate-200 leading-relaxed font-medium">
                    {result.public_status_message ||
                      (locale === "bn"
                        ? "আপনার অভিযোগটি সংশ্লিষ্ট থানার ডিউটি অফিসারের প্রাথমিক পর্যালোচনায় রয়েছে।"
                        : "Your complaint is currently undergoing preliminary intake assessment.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Progression Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold">{locale === "bn" ? "দায়িত্বপ্রাপ্ত থানা / ইউনিট" : "Receiving Police Unit"}</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">{result.receiving_branch}</div>
                {result.contact_phone && (
                  <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{result.contact_phone}</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold">{locale === "bn" ? "দাখিলের তারিখ ও সময়" : "Submission Timestamp"}</span>
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {new Date(result.submission_date).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {locale === "bn" ? "সর্বশেষ হালনাগাদ:" : "Last Updated:"}{" "}
                  {new Date(result.last_updated).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Confidentiality notice */}
            <div className="mt-8 pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                {locale === "bn"
                  ? "গোপনীয়তার স্বার্থে অভ্যন্তরীণ তদন্ত নোট ও কর্মকর্তাদের বিস্তারিত তথ্য উন্মুক্ত নয়।"
                  : "Internal investigative notes, suspect assessments, and officer rosters are protected."}
              </span>
              <Link
                href="/public/complaints/new"
                className="text-emerald-400 hover:text-emerald-300 font-medium"
              >
                {locale === "bn" ? "নতুন অভিযোগ দাখিল" : "File Another"}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function PublicComplaintTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-sm">
          Loading Complaint Tracking Service...
        </div>
      }
    >
      <TrackContent />
    </Suspense>
  );
}
