"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  Building,
} from "lucide-react";
import { api } from "@/lib/api";
import { ComplaintCategory, AgencyBranch } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { EmergencyDisclaimer } from "@/components/common/EmergencyDisclaimer";

const DEFAULT_CATEGORIES: ComplaintCategory[] = [
  { category_id: 1, name_en: "Armed Robbery / Dacoity", name_bn: "সশস্ত্র ডাকাতি / রাহাজানি", description: "Cognizable offence", is_cognizable: true, created_at: "" },
  { category_id: 2, name_en: "Cyber Harassment & Financial Fraud", name_bn: "সাইবার হয়রানি ও আর্থিক জালিয়াতি", description: "Digital fraud", is_cognizable: true, created_at: "" },
  { category_id: 3, name_en: "Extortion & Organized Syndicate", name_bn: "চাঁদাবাজি ও সংগঠিত অপরাধ চক্র", description: "Systematic extortion", is_cognizable: true, created_at: "" },
  { category_id: 4, name_en: "Narcotics & Smuggling", name_bn: "মাদকদ্রব্য ও চোরাচালান", description: "Illegal contraband", is_cognizable: true, created_at: "" },
  { category_id: 5, name_en: "Property & Document Theft", name_bn: "সম্পত্তি ও গুরুত্বপূর্ণ দলিল চুরি", description: "Theft of property", is_cognizable: true, created_at: "" },
  { category_id: 6, name_en: "Missing Person / Lost Article", name_bn: "নিখোঁজ ব্যক্তি / হারানো সাধারণ ডায়েরি", description: "Non-cognizable reporting", is_cognizable: false, created_at: "" },
  { category_id: 7, name_en: "Public Dispute & Threat", name_bn: "পারিবারিক বা স্থানীয় বিরোধ ও হুমকি", description: "Civil dispute", is_cognizable: false, created_at: "" },
];

const DEFAULT_BRANCHES: AgencyBranch[] = [
  { branch_id: 1, branch_name: "Central Headquarters", district: "Dhaka" },
  { branch_id: 2, branch_name: "Port Zone Regional Office", district: "Chattogram" },
  { branch_id: 3, branch_name: "Northeast Division Station", district: "Sylhet" },
  { branch_id: 4, branch_name: "Northern Regional Branch", district: "Rajshahi" },
  { branch_id: 5, branch_name: "Southwest Maritime Wing", district: "Khulna" },
];

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
  const [categoryId, setCategoryId] = useState<number | undefined>(1);
  const [branchId, setBranchId] = useState<number | undefined>(1);

  // Reference Data (initialized with canonical defaults so options are immediately selectable)
  const [categories, setCategories] = useState<ComplaintCategory[]>(DEFAULT_CATEGORIES);
  const [branches, setBranches] = useState<AgencyBranch[]>(DEFAULT_BRANCHES);
  const [loadingRefs, setLoadingRefs] = useState(false);

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
          api.listPublicBranches(),
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
    if (!branchId) {
      setErrorMessage(
        locale === "bn"
          ? "দায়িত্বপ্রাপ্ত থানা/শাখা নির্বাচন করুন।"
          : "Please select the receiving police branch."
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
                {locale === "bn" ? "নাগরিক অভিযোগ দাখিল" : "Public Complaint Intake"}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/public/complaints/track"
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
            >
              {locale === "bn" ? "অভিযোগ ট্র্যাক করুন" : "Track Existing Complaint"}
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <EmergencyDisclaimer />

        {submittedData ? (
          /* Submission Acknowledgment Card */
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {locale === "bn"
                    ? "অভিযোগ সফলভাবে গৃহীত হয়েছে"
                    : "Complaint Successfully Registered"}
                </h2>
                <p className="text-xs text-slate-500">
                  {locale === "bn"
                    ? "আপনার অভিযোগটি প্রাথমিক পর্যালোচনার জন্য তালিকাভুক্ত হয়েছে।"
                    : "Your complaint is registered and queued for duty officer intake review."}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block mb-1">
                    {locale === "bn" ? "ট্র্যাকিং রেফারেন্স কোড" : "Official Tracking Reference"}
                  </span>
                  <div className="text-2xl sm:text-3xl font-mono font-bold text-blue-800 tracking-wider">
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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>{copied ? (locale === "bn" ? "কপি হয়েছে!" : "Copied!") : (locale === "bn" ? "কোড কপি করুন" : "Copy Code")}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "মূল পাতায় ফিরুন" : "Back to Home"}</span>
              </Link>
              <Link
                href={`/public/complaints/track?code=${submittedData.tracking_code}&phone=${contactPhone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <span>{locale === "bn" ? "স্ট্যাটাস দেখুন" : "Track Online"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* Complaint Intake Form */
          <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {locale === "bn" ? "প্রাথমিক নাগরিক অভিযোগ ফরম" : "Citizen Incident Report Intake"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {locale === "bn"
                  ? "অনলাইনে অভিযোগ দাখিল করুন। ডিউটি অফিসার অভিযোগটি পর্যালোচনা করে উপযুক্ত আইনি সিদ্ধান্ত গ্রহণ করবেন।"
                  : "Submit an online complaint for review. A duty officer will assess jurisdiction and initiate inquiry or legal proceedings."}
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {locale === "bn" ? "অভিযোগকারীর পুরো নাম" : "Complainant Full Name"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={complainantName}
                    onChange={(e) => setComplainantName(e.target.value)}
                    placeholder="e.g. Md. Tariqul Islam"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {locale === "bn" ? "মোবাইল নম্বর" : "Mobile Contact Number"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === "bn" ? "অভিযোগের সংক্ষিপ্ত শিরোনাম" : "Incident Title"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Armed robbery and extortion at local business warehouse"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {locale === "bn" ? "অভিযোগের ক্যাটাগরি" : "Incident Category"}
                  </label>
                  <select
                    value={categoryId || ""}
                    onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">{locale === "bn" ? "ক্যাটাগরি নির্বাচন করুন" : "Select Category"}</option>
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {locale === "bn" ? c.name_bn : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {locale === "bn" ? "দায়িত্বপ্রাপ্ত থানা/শাখা" : "Receiving Police Branch"}
                  </label>
                  <select
                    value={branchId || ""}
                    onChange={(e) => setBranchId(e.target.value ? Number(e.target.value) : undefined)}
                    disabled={loadingRefs}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                  >
                    <option value="">
                      {loadingRefs
                        ? "Loading branches..."
                        : branches.length === 0
                          ? "No branches available"
                          : "Select receiving branch"}
                    </option>
                    {branches.map((b) => (
                      <option key={b.branch_id} value={b.branch_id}>
                        {b.branch_name} ({b.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {locale === "bn" ? "ঘটনার তারিখ" : "Date of Incident"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {locale === "bn" ? "ঘটনার আনুমানিক সময়" : "Time of Incident"}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={incidentTime}
                      onChange={(e) => setIncidentTime(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={approximateTime}
                        onChange={(e) => setApproximateTime(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Approximate</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {locale === "bn" ? "ঘটনার বিস্তারিত বিবরণ" : "Detailed Incident Narrative"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an objective description of the incident, place, witnesses, and persons involved..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{locale === "bn" ? "ফিরে যান" : "Back"}</span>
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? (
                    <span>{locale === "bn" ? "জমা হচ্ছে..." : "Submitting..."}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "অভিযোগ দাখিল করুন" : "Submit Complaint"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 px-4 py-3 text-center text-xs text-slate-500">
        <span>
          Academic database prototype demonstration &bull; Fictional information only
        </span>
      </footer>
    </div>
  );
}
