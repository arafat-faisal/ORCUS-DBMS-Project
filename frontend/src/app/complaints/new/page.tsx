"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Send,
  AlertCircle,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { ComplaintCategory, AgencyBranch, Complainant } from "@/lib/types";
import { useLocale } from "@/lib/locale";

export default function OfficerNewComplaintPage() {
  const router = useRouter();
  const { locale } = useLocale();

  // Mode: Existing complainant vs New complainant
  const [complainantMode, setComplainantMode] = useState<"existing" | "new">("new");
  const [complainants, setComplainants] = useState<Complainant[]>([]);
  const [selectedComplainantId, setSelectedComplainantId] = useState<number | undefined>();

  // New Complainant Form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Complaint Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState("");
  const [approximateTime, setApproximateTime] = useState(false);
  const [submissionChannel, setSubmissionChannel] = useState("Walk-in");
  const [urgency, setUrgency] = useState("Medium");
  const [confidentialityLevel, setConfidentialityLevel] = useState("Internal");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [branchId, setBranchId] = useState<number | undefined>();
  const [internalNotes, setInternalNotes] = useState("");

  // References
  const [categories, setCategories] = useState<ComplaintCategory[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadRefs() {
      try {
        const [compRes, catRes, branchRes] = await Promise.all([
          api.listComplainants(),
          api.getComplaintCategories(),
          api.listBranches(),
        ]);
        if (compRes.success && compRes.data) setComplainants(compRes.data);
        if (catRes.success && catRes.data) setCategories(catRes.data);
        if (branchRes.success && branchRes.data) {
          setBranches(branchRes.data);
          if (branchRes.data.length > 0) setBranchId(branchRes.data[0].branch_id);
        }
      } catch (err) {
        console.error("Failed to load reference datasets", err);
      } finally {
        setLoadingRefs(false);
      }
    }
    loadRefs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!title.trim() || !description.trim()) {
      setErrorMessage(locale === "bn" ? "শিরোনাম ও বিবরণ আবশ্যক।" : "Title and incident description are required.");
      return;
    }
    if (!incidentDate) {
      setErrorMessage(locale === "bn" ? "ঘটনার তারিখ দিন।" : "Incident date is required.");
      return;
    }
    if (!branchId) {
      setErrorMessage(locale === "bn" ? "দায়িত্বপ্রাপ্ত থানা নির্বাচন করুন।" : "Receiving police branch is required.");
      return;
    }

    setSubmitting(true);
    try {
      let finalComplainantId = selectedComplainantId;

      // Create new complainant if in new mode
      if (complainantMode === "new") {
        if (!newName.trim()) {
          setErrorMessage(locale === "bn" ? "অভিযোগকারীর নাম আবশ্যক।" : "Complainant name is required.");
          setSubmitting(false);
          return;
        }

        const createCompRes = await api.createComplainant({
          name: newName.trim(),
          contacts: newPhone.trim()
            ? [{ contact_type: "Phone", contact_value: newPhone.trim(), is_primary: true }]
            : [],
        });

        if (!createCompRes.success || !createCompRes.data) {
          setErrorMessage(createCompRes.error || "Failed to register complainant record.");
          setSubmitting(false);
          return;
        }
        finalComplainantId = createCompRes.data.complainant_id;
      }

      if (!finalComplainantId) {
        setErrorMessage(locale === "bn" ? "অভিযোগকারী নির্ধারণ করুন।" : "Complainant ID could not be determined.");
        setSubmitting(false);
        return;
      }

      const res = await api.createOfficerComplaint({
        complainant_id: finalComplainantId,
        submission_channel: submissionChannel,
        title: title.trim(),
        description: description.trim(),
        incident_date: incidentDate,
        incident_time: incidentTime || undefined,
        approximate_time: approximateTime,
        complaint_category_id: categoryId,
        urgency,
        receiving_branch_id: branchId,
        confidentiality_level: confidentialityLevel,
        internal_notes: internalNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        router.push(`/complaints/${res.data.complaint_id}`);
      } else {
        setErrorMessage(res.error || "Failed to register officer complaint.");
      }
    } catch {
      setErrorMessage("Network communication error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/complaints" className="hover:text-emerald-400 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{locale === "bn" ? "অভিযোগ তালিকা" : "Complaints Registry"}</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200">{locale === "bn" ? "নতুন অভিযোগ নথিভুক্তকরণ" : "Officer Intake"}</span>
        </div>

        {/* Title Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-emerald-500" />
              <span>
                {locale === "bn"
                  ? "থানা/শাখা পর্যায়ে অভিযোগ নথিভুক্তকরণ"
                  : "Internal Officer Complaint Intake Form"}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {locale === "bn"
                ? "ডিউটি অফিসার বা দায়িত্বপ্রাপ্ত কর্মকর্তা কর্তৃক সরাসরি অভিযোগ গ্রহণের আনুষ্ঠানিক ফরম।"
                : "Authorized duty officer portal for walk-in, telephonic, or official written complaints."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">
                  {locale === "bn" ? "ত্রুটি:" : "Validation Error:"}
                </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Complainant Selection / Entry */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {locale === "bn" ? "১. অভিযোগকারীর তথ্য" : "1. Complainant Identification"}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setComplainantMode("new")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                      complainantMode === "new"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {locale === "bn" ? "নতুন ব্যক্তি" : "Create New"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComplainantMode("existing")}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                      complainantMode === "existing"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {locale === "bn" ? "পূর্ববর্তী রেকর্ড" : "Existing"}
                  </button>
                </div>
              </div>

              {complainantMode === "new" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "অভিযোগকারীর পূর্ণ নাম *" : "Full Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Mohammad Shafiqul Islam"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "মোবাইল নম্বর" : "Contact Phone Number"}
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950/40 p-4 rounded-lg border border-slate-800/80">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {locale === "bn" ? "অভিযোগকারী নির্বাচন করুন *" : "Select Complainant *"}
                  </label>
                  <select
                    value={selectedComplainantId || ""}
                    onChange={(e) => setSelectedComplainantId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="">-- Choose Existing Record --</option>
                    {complainants.map((c) => (
                      <option key={c.complainant_id} value={c.complainant_id}>
                        {c.name} (ID: #{c.complainant_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Intake Metadata */}
            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                {locale === "bn" ? "২. গ্রহণ মাধ্যম ও প্রশাসনিক তথ্য" : "2. Intake Channel & Administration"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {locale === "bn" ? "গ্রহণ মাধ্যম" : "Submission Channel"}
                  </label>
                  <select
                    value={submissionChannel}
                    onChange={(e) => setSubmissionChannel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Walk-in">Walk-in</option>
                    <option value="Officer entry">Officer entry</option>
                    <option value="Phone">Phone</option>
                    <option value="Written application">Written application</option>
                    <option value="Referral">Referral</option>
                    <option value="Public online">Public online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {locale === "bn" ? "জরুরিতা" : "Urgency Level"}
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {locale === "bn" ? "গোপনীয়তার মাত্রা" : "Confidentiality"}
                  </label>
                  <select
                    value={confidentialityLevel}
                    onChange={(e) => setConfidentialityLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="Public">Public</option>
                    <option value="Internal">Internal</option>
                    <option value="Confidential">Confidential</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {locale === "bn" ? "দায়িত্বপ্রাপ্ত থানা / ইউনিট *" : "Receiving Branch *"}
                  </label>
                  <select
                    required
                    value={branchId || ""}
                    onChange={(e) => setBranchId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.branch_id} value={b.branch_id}>
                        {b.branch_name} ({b.branch_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Incident Classification & Timing */}
            <div className="pt-4 border-t border-slate-800/80">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                {locale === "bn" ? "৩. ঘটনার বিবরণ ও সময়সূচি" : "3. Incident Details & Chronology"}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "অভিযোগের সংক্ষিপ্ত বিষয় / শিরোনাম *" : "Complaint Subject / Title *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Unauthorized trespass and extortion intimidation"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "অপরাধের ক্যাটাগরি" : "Crime Category"}
                    </label>
                    <select
                      value={categoryId || ""}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    >
                      <option value="">-- General / Uncategorized --</option>
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name_en} {c.is_cognizable ? "(Cognizable)" : "(Non-Cognizable)"}
                        </option>
                      ))}
                    </select>
                  </div>
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
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {locale === "bn" ? "ঘটনার সময়" : "Incident Time"}
                    </label>
                    <input
                      type="time"
                      value={incidentTime}
                      onChange={(e) => setIncidentTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center pt-5">
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
                    {locale === "bn" ? "ঘটনার পূর্ণ বিবরণ *" : "Incident Narrative Description *"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide full narrative of the alleged incident..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {locale === "bn" ? "ডিউটি অফিসারের প্রাথমিক অভ্যন্তরীণ নোট (গোপনীয়)" : "Duty Officer Internal Intake Notes (Confidential)"}
                  </label>
                  <textarea
                    rows={2}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Notes on complainant demeanor, urgency assessment, preliminary jurisdictional check..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <Link
                href="/complaints"
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 transition"
              >
                {locale === "bn" ? "বাতিল" : "Cancel"}
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium text-xs sm:text-sm transition shadow-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{locale === "bn" ? "নথিভুক্ত হচ্ছে..." : "Registering..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{locale === "bn" ? "অভিযোগ নথিভুক্ত করুন" : "Register Complaint"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </PortalLayout>
  );
}
