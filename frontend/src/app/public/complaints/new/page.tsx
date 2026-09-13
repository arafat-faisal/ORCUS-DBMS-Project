"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { ComplaintCategory, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { EmergencyDisclaimer } from "@/components/common/EmergencyDisclaimer";

export default function PublicComplaintNewPage() {
  const { locale } = useLocale();

  // Form State
  const [complainantName, setComplainantName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [approximateTime, setApproximateTime] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<number | undefined>();

  // Reference Data
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  // Status & Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedData, setSubmittedData] = useState<{
    tracking_code: string;
    submitted_at: string;
    current_status: string;
    branch_name: string;
    acknowledgment: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, branchRes] = await Promise.all([
          api.getComplaintCategories(),
          api.listBranches(),
        ]);
        if (catRes.success && catRes.data) setCategories(catRes.data);
        if (branchRes.success && branchRes.data) {
          setBranches(branchRes.data);
          if (branchRes.data.length > 0) setBranchId(branchRes.data[0].branch_id);
        }
      } catch (e) {
        console.error("Failed to load reference data", e);
      } finally {
        setLoadingRefs(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!complainantName.trim()) {
      setErrorMessage(
        locale === "bn" ? "অভিযোগকারীর নাম দেওয়া আবশ্যক।" : "Complainant name is required."
      );
      return;
    }
    if (!contactPhone.trim()) {
      setErrorMessage(
        locale === "bn" ? "যোগাযোগের ফোন নম্বর আবশ্যক।" : "Contact phone number is required."
      );
      return;
    }
    if (!title.trim() || !description.trim()) {
      setErrorMessage(
        locale === "bn"
          ? "ঘটনার শিরোনাম ও বিবরণ বিস্তারিত দিন।"
          : "Complaint title and detailed description are required."
      );
      return;
    }
    if (!incidentDate) {
      setErrorMessage(
        locale === "bn" ? "ঘটনার তারিখ উল্লেখ করুন।" : "Incident date must be provided."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitPublicComplaint({
        complainant_name: complainantName.trim(),
        contact_phone: contactPhone.trim(),
        title: title.trim(),
        description: description.trim(),
        incident_date: incidentDate,
        incident_time: incidentTime || undefined,
        approximate_time: approximateTime,
        complaint_category_id: categoryId,
        receiving_branch_id: branchId,
      });

      if (res.success && res.data) {
        setSubmittedData(res.data);
      } else {
        setErrorMessage(
          res.error ||
            (locale === "bn"
              ? "অভিযোগ গ্রহণ করা সম্ভব হয়নি। অনুগ্রহ করে তথ্য পরীক্ষা করুন।"
              : "Failed to submit complaint. Please check your inputs.")
        );
      }
    } catch {
      setErrorMessage("Network error connecting to ORCUS server.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyTrackingCode = () => {
    if (submittedData?.tracking_code) {
      navigator.clipboard.writeText(submittedData.tracking_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
                {locale === "bn" ? "নাগরিক অভিযোগ পোর্টাল" : "Citizen Complaint Portal"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/public/complaints/track"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline-offset-4 hover:underline"
            >
              {locale === "bn" ? "পূর্ববর্তী অভিযোগ ট্র্যাক করুন" : "Track Existing Complaint"}
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <EmergencyDisclaimer />

        {submittedData ? (
          /* Submission Acknowledgment Card */
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-6 sm:p-8 shadow-xl shadow-emerald-950/20">
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold text-white">
                  {locale === "bn"
                    ? "অভিযোগ সফলভাবে গৃহীত হয়েছে"
                    : "Complaint Successfully Submitted"}
                </h2>
                <p className="text-xs text-slate-400">
                  {locale === "bn"
                    ? "আপনার অভিযোগটি প্রাথমিক পর্যালোচনার জন্য তালিকাভুক্ত হয়েছে।"
                    : "Your complaint is registered and queued for duty officer intake review."}
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-5 my-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    {locale === "bn" ? "ট্র্যাকিং রেফারেন্স কোড" : "Official Tracking Code"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                    {submittedData.tracking_code}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {locale === "bn"
                      ? "ভবিষ্যতে স্ট্যাটাস জানতে এবং থানায় যোগাযোগের জন্য এই কোডটি সংরক্ষণ করুন।"
                      : "Preserve this code to track status updates or provide supplementary information."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyTrackingCode}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                >
                  <Copy className="w-4 h-4 text-emerald-400" />
                  <span>{copied ? (locale === "bn" ? "কপি হয়েছে!" : "Copied!") : (locale === "bn" ? "কোড কপি করুন" : "Copy Code")}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">{locale === "bn" ? "প্রাপক থানা/শাখা:" : "Receiving Branch:"}</span>
                  <span className="font-semibold text-slate-200">{submittedData.branch_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">{locale === "bn" ? "দাখিলের সময়:" : "Submission Timestamp:"}</span>
                  <span className="font-semibold text-slate-200">{new Date(submittedData.submitted_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">{locale === "bn" ? "বর্তমান অবস্থা:" : "Current Status:"}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {submittedData.current_status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">{locale === "bn" ? "দাখিলকৃত যোগাযোগ নম্বর:" : "Registered Contact:"}</span>
                  <span className="font-semibold text-slate-200 font-mono">{contactPhone}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href={`/public/complaints/track?code=${encodeURIComponent(
                  submittedData.tracking_code
                )}&phone=${encodeURIComponent(contactPhone)}`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-sm"
              >
                <span>{locale === "bn" ? "অনলাইনে অগ্রগতি ট্র্যাক করুন" : "Track Status Online"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedData(null);
                  setTitle("");
                  setDescription("");
                  setComplainantName("");
                  setContactPhone("");
                  setIncidentDate("");
                }}
                className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
              >
                {locale === "bn" ? "নতুন অভিযোগ দাখিল করুন" : "Submit Another Complaint"}
              </button>
            </div>
          </div>
        ) : (
          /* Intake Form */
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-lg">
            <div className="border-b border-slate-800 pb-5 mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <FileText className="w-6 h-6 text-emerald-500" />
                <span>
                  {locale === "bn"
                    ? "অনলাইন অভিযোগ দাখিল ফরম"
                    : "Citizen Incident & Complaint Intake Form"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {locale === "bn"
                  ? "নিচের তথ্যগুলো যথাযথভাবে পূরণ করে দাখিল করুন। ডিউটি অফিসার অভিযোগ পর্যালোচনা করবেন।"
                  : "Please complete the required details below. A designated Duty Officer will review your submission."}
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">
                    {locale === "bn" ? "ত্রুটি সংশোধন করুন:" : "Validation Error:"}
                  </span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Citizen Contact */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                  {locale === "bn" ? "১. অভিযোগকারীর পরিচয় ও যোগাযোগ" : "1. Complainant Details"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "পূর্ণ নাম *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      placeholder={locale === "bn" ? "যেমন: কাজী রহিম আহমেদ" : "e.g., Kazi Rahim Ahmed"}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "মোবাইল নম্বর (বাংলাদেশ) *" : "Mobile Number (Bangladesh) *"}
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {locale === "bn"
                        ? "ট্র্যাকিং ও ভেরিফিকেশনের জন্য ব্যবহৃত হবে (যেমন: 01712345678)"
                        : "Used for tracking authentication (e.g. 01712345678 or +8801712345678)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Incident Classification & Location */}
              <div className="pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                  {locale === "bn" ? "২. অভিযোগের ধরন ও দায়িত্বপ্রাপ্ত থানা" : "2. Category & Receiving Station"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "অভিযোগের ক্যাটাগরি" : "Incident Category"}
                    </label>
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
                    >
                      <option value="">{locale === "bn" ? "-- ক্যাটাগরি নির্বাচন করুন --" : "-- Select Category --"}</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {locale === "bn" ? c.name_bn || c.name_en : c.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "দায়িত্বপ্রাপ্ত থানা / ইউনিট *" : "Receiving Police Station / Unit *"}
                    </label>
                    <select
                      required
                      value={branchId || ""}
                      onChange={(e) => setBranchId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
                    >
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {locale === "bn" && b.branch_name_bn ? b.branch_name_bn : b.branch_name} ({b.branch_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Incident Details */}
              <div className="pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                  {locale === "bn" ? "৩. ঘটনার বিবরণ ও সময়" : "3. Incident Chronology & Narrative"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "অভিযোগের সংক্ষিপ্ত শিরোনাম *" : "Brief Incident Title *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={locale === "bn" ? "যেমন: ধানমন্ডি এলাকায় মানিব্যাগ ও মোবাইল ছিনতাই" : "e.g., Unlawful extortion attempt at local retail shop"}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {locale === "bn" ? "ঘটনার তারিখ *" : "Incident Date *"}
                      </label>
                      <input
                        type="date"
                        required
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {locale === "bn" ? "ঘটনার সময় (ঐচ্ছিক)" : "Incident Time (Optional)"}
                      </label>
                      <input
                        type="time"
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={approximateTime}
                          onChange={(e) => setApproximateTime(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-0"
                        />
                        <span>{locale === "bn" ? "আনুমানিক সময়" : "Approximate Time"}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "ঘটনার বিস্তারিত বিবরণ *" : "Comprehensive Incident Narrative *"}
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={
                        locale === "bn"
                          ? "কী ঘটেছে, কোথায় ঘটেছে, প্রত্যক্ষদর্শী বা সন্দেহভাজন কেউ থাকলে বিস্তারিত উল্লেখ করুন..."
                          : "State the facts sequentially: what happened, exact location/landmark, suspect characteristics or vehicle details if any..."
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Legal / Prototype Declaration */}
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <HelpCircle className="w-4 h-4 text-emerald-400" />
                  <span>{locale === "bn" ? "আইনি ও গোপনীয়তা বিজ্ঞপ্তি" : "Declaration & Prototype Notice"}</span>
                </div>
                <p>
                  {locale === "bn"
                    ? "এই ব্যবস্থাটি কেবলমাত্র একাডেমিক প্রোটোটাইপ প্রদর্শনের উদ্দেশ্যে ব্যবহৃত হচ্ছে। কোনো সংবেদনশীল সরকারি গোপনীয় তথ্য বা আসল পরিচয়পত্র প্রবেশ করাবেন না।"
                    : "This system is strictly for academic research demonstration. Fictional prototype test records are maintained. Do not submit sensitive real-world confidential data."}
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Link
                  href="/public/complaints/track"
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  {locale === "bn" ? "বাতিল করুন" : "Cancel"}
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-white font-medium text-sm transition shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{locale === "bn" ? "প্রক্রিয়াধীন..." : "Submitting..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{locale === "bn" ? "অভিযোগ দাখিল করুন" : "Submit Complaint"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
