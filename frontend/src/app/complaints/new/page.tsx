"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  ComplaintCategory,
  AgencyBranch,
  GeoDivision,
  GeoDistrict,
  GeoUpazila,
  GeoThana,
} from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  FileText,
  MapPin,
  Check,
} from "lucide-react";

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

const DEFAULT_DIVISIONS: GeoDivision[] = [
  { division_id: 1, name_en: "Dhaka", name_bn: "ঢাকা", code: "DHK" },
  { division_id: 2, name_en: "Chattogram", name_bn: "চট্টগ্রাম", code: "CTG" },
  { division_id: 3, name_en: "Rajshahi", name_bn: "রাজশাহী", code: "RAJ" },
  { division_id: 4, name_en: "Khulna", name_bn: "খুলনা", code: "KHL" },
  { division_id: 5, name_en: "Barishal", name_bn: "বরিশাল", code: "BAR" },
  { division_id: 6, name_en: "Sylhet", name_bn: "সিলেট", code: "SYL" },
  { division_id: 7, name_en: "Rangpur", name_bn: "রংপুর", code: "RNG" },
  { division_id: 8, name_en: "Mymensingh", name_bn: "ময়মনসিংহ", code: "MYM" },
];

export default function NewComplaintPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // References
  const [categories, setCategories] = useState<ComplaintCategory[]>(DEFAULT_CATEGORIES);
  const [branches, setBranches] = useState<AgencyBranch[]>(DEFAULT_BRANCHES);
  const [divisions, setDivisions] = useState<GeoDivision[]>(DEFAULT_DIVISIONS);
  const [districts, setDistricts] = useState<GeoDistrict[]>([]);
  const [upazilas, setUpazilas] = useState<GeoUpazila[]>([]);
  const [thanas, setThanas] = useState<GeoThana[]>([]);

  // Step 1: Complainant
  const [complainantNameEn, setComplainantNameEn] = useState("");
  const [complainantNameBn, setComplainantNameBn] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [idDocType, setIdDocType] = useState("National ID");
  const [idDocNumber, setIdDocNumber] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("bn");

  // Step 2: Incident
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(1);
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().split("T")[0]);
  const [incidentTime, setIncidentTime] = useState("");
  const [approximateTime, setApproximateTime] = useState(false);
  const [urgency, setUrgency] = useState("Medium");
  const [receivingBranchId, setReceivingBranchId] = useState<number | undefined>(1);

  // Step 3: Location
  const [selectedDivisionId, setSelectedDivisionId] = useState<number | undefined>(1);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | undefined>();
  const [selectedUpazilaId, setSelectedUpazilaId] = useState<number | undefined>();
  const [selectedThanaId, setSelectedThanaId] = useState<number | undefined>();
  const [unionWard, setUnionWard] = useState("");
  const [areaVillage, setAreaVillage] = useState("");
  const [road, setRoad] = useState("");
  const [houseHolding, setHouseHolding] = useState("");
  const [landmark, setLandmark] = useState("");

  // Load Initial Metadata
  useEffect(() => {
    async function loadRefs() {
      try {
        const [catRes, branchRes, divRes] = await Promise.all([
          api.getComplaintCategories().catch(() => ({ success: false, data: null })),
          api.listBranches().catch(() => api.listPublicBranches()),
          api.getGeoDivisions().catch(() => ({ success: false, data: null })),
        ]);
        if (catRes?.success && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data);
          setCategoryId(catRes.data[0].category_id);
        }
        if (branchRes?.success && branchRes.data && branchRes.data.length > 0) {
          setBranches(branchRes.data);
          setReceivingBranchId(branchRes.data[0].branch_id);
        }
        if (divRes?.success && divRes.data && divRes.data.length > 0) {
          setDivisions(divRes.data);
          setSelectedDivisionId(divRes.data[0].division_id);
        }
      } catch (e) {
        console.error("Failed to load reference data", e);
      }
    }
    loadRefs();
  }, []);

  // Cascading Geography
  useEffect(() => {
    if (selectedDivisionId) {
      api.getGeoDistricts(selectedDivisionId).then((res) => {
        if (res.success && res.data) setDistricts(res.data);
      });
    } else {
      setDistricts([]);
      setSelectedDistrictId(undefined);
    }
  }, [selectedDivisionId]);

  useEffect(() => {
    if (selectedDistrictId) {
      Promise.all([
        api.getGeoUpazilas(selectedDistrictId),
        api.getGeoThanas(selectedDistrictId),
      ]).then(([upRes, thRes]) => {
        if (upRes.success && upRes.data) setUpazilas(upRes.data);
        if (thRes.success && thRes.data) setThanas(thRes.data);
      });
    } else {
      setUpazilas([]);
      setThanas([]);
      setSelectedUpazilaId(undefined);
      setSelectedThanaId(undefined);
    }
  }, [selectedDistrictId]);

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (!complainantNameEn.trim() && !complainantNameBn.trim()) {
        setErrorMsg(
          locale === "bn"
            ? "অভিযোগকারীর নাম (ইংরেজি অথবা বাংলায়) দেওয়া আবশ্যক।"
            : "Complainant name is required."
        );
        return false;
      }
      if (!mobile.trim()) {
        setErrorMsg(
          locale === "bn"
            ? "যোগাযোগের মোবাইল নম্বর দেওয়া আবশ্যক।"
            : "Contact mobile number is required."
        );
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!title.trim()) {
        setErrorMsg(
          locale === "bn" ? "অভিযোগের শিরোনাম আবশ্যক।" : "Complaint title is required."
        );
        return false;
      }
      if (!description.trim()) {
        setErrorMsg(
          locale === "bn" ? "ঘটনার বিস্তারিত বিবরণ আবশ্যক।" : "Incident description is required."
        );
        return false;
      }
      if (!incidentDate) {
        setErrorMsg(
          locale === "bn" ? "ঘটনার তারিখ আবশ্যক।" : "Incident date is required."
        );
        return false;
      }
      if (!receivingBranchId) {
        setErrorMsg(
          locale === "bn" ? "গ্রহণকারী থানা/শাখা আবশ্যক।" : "Receiving branch is required."
        );
        return false;
      }
      return true;
    }

    if (step === 3) {
      // Step 3 location is optional or semi-structured
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev));
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3 | 4) : prev));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Create or ensure complainant participant
      const compRes = await api.createComplainant({
        name: complainantNameEn.trim() || complainantNameBn.trim(),
        contacts: [
          {
            contact_type: "phone",
            contact_value: mobile.trim(),
            is_primary: true,
          },
          ...(email.trim()
            ? [
                {
                  contact_type: "email" as const,
                  contact_value: email.trim(),
                  is_primary: false,
                },
              ]
            : []),
        ],
      });

      if (!compRes.success || !compRes.data) {
        setErrorMsg(compRes.error || "Failed to register complainant record.");
        setSubmitting(false);
        return;
      }

      const complainantId = compRes.data.complainant_id;

      // 2. Submit officer complaint to backend (backend generates tracking_code)
      const fullAddressParts = [
        houseHolding ? `Holding: ${houseHolding}` : null,
        road ? `Road: ${road}` : null,
        areaVillage ? `Village/Area: ${areaVillage}` : null,
        landmark ? `Landmark: ${landmark}` : null,
      ].filter(Boolean).join(", ");

      const res = await api.createOfficerComplaint({
        complainant_id: complainantId,
        title: title.trim(),
        description: `${description.trim()}${fullAddressParts ? `\n\nIncident Location: ${fullAddressParts}` : ""}`,
        incident_date: incidentDate,
        incident_time: incidentTime || undefined,
        approximate_time: approximateTime,
        complaint_category_id: categoryId,
        urgency,
        receiving_branch_id: receivingBranchId!,
        submission_channel: "Walk-in",
        confidentiality_level: "Internal",
      });

      if (res.success && res.data) {
        router.push(`/complaints/${res.data.complaint_id}`);
      } else {
        setErrorMsg(res.error || "Failed to submit complaint.");
        setSubmitting(false);
      }
    } catch {
      setErrorMsg("Network communication error with ORCUS API.");
      setSubmitting(false);
    }
  };

  const stepsList = [
    { num: 1, title: "1. Complainant", subtitle: "Personal & contact info" },
    { num: 2, title: "2. Incident", subtitle: "Date, category & details" },
    { num: 3, title: "3. Location", subtitle: "Administrative & site info" },
    { num: 4, title: "4. Review & Submit", subtitle: "Verification & intake" },
  ];

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <PageHeader
          title={locale === "bn" ? "নতুন অভিযোগ গ্রহণ ফরম" : "Complaint Intake Form"}
          description={
            locale === "bn"
              ? "সরাসরি নাগরিক বা কর্মকর্তার মাধ্যমে প্রাথমিক অভিযোগ গ্রহণের প্রাতিষ্ঠানিক ধাপ।"
              : "Register walk-in or official complaint records through a structured multi-step intake workflow."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "অভিযোগ" : "Complaints", href: "/complaints" },
            { label: locale === "bn" ? "নতুন অভিযোগ" : "New Intake" },
          ]}
        />

        {/* Multi-step progress indicators */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stepsList.map((step) => {
              const isDone = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div
                  key={step.num}
                  className={`p-3 rounded-md border text-xs flex items-center gap-2.5 ${
                    isCurrent
                      ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                      : isDone
                      ? "border-emerald-200 bg-emerald-50/40 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold shrink-0 text-xs ${
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : isDone
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{step.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{step.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Step Content Container */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          {/* STEP 1: COMPLAINANT */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {locale === "bn" ? "অভিযোগকারীর তথ্যাদি" : "Step 1: Complainant Details"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record identity and contact coordinates for acknowledgment and verification.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={complainantNameEn}
                    onChange={(e) => setComplainantNameEn(e.target.value)}
                    placeholder="e.g. Md. Rafiqul Islam"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    অভিযোগকারীর নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={complainantNameBn}
                    onChange={(e) => setComplainantNameBn(e.target.value)}
                    placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Identity Document Type
                  </label>
                  <select
                    value={idDocType}
                    onChange={(e) => setIdDocType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="National ID">National ID (NID)</option>
                    <option value="Smart Card">Smart NID Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Birth Certificate">Birth Registration Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Masked Document Number
                  </label>
                  <input
                    type="text"
                    value={idDocNumber}
                    onChange={(e) => setIdDocNumber(e.target.value)}
                    placeholder="e.g. 199XXXXXXXXXX"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Present Address
                  </label>
                  <textarea
                    rows={2}
                    value={presentAddress}
                    onChange={(e) => setPresentAddress(e.target.value)}
                    placeholder="House, Road, Area, Thana, District"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: INCIDENT */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {locale === "bn" ? "ঘটনার বিবরণ" : "Step 2: Incident Particulars"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify crime category, occurrence timeline, and factual summary.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Complaint Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Armed robbery and extortion at local business warehouse"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Crime Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name_en} ({c.name_bn})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Receiving Police Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={receivingBranchId}
                      onChange={(e) => setReceivingBranchId(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      {branches.map((b) => (
                        <option key={b.branch_id} value={b.branch_id}>
                          {b.branch_name} ({b.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Incident Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Incident Time
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

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Urgency Assessment
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Narrative / Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a coherent narrative of what transpired, suspects observed, and losses incurred..."
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {locale === "bn" ? "ঘটনাস্থলের অবস্থান" : "Step 3: Location of Occurrence"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select administrative jurisdiction and physical landmark in Bangladesh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Division
                  </label>
                  <select
                    value={selectedDivisionId || ""}
                    onChange={(e) => setSelectedDivisionId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">Select Division</option>
                    {divisions.map((d) => (
                      <option key={d.division_id} value={d.division_id}>
                        {d.name_en} ({d.name_bn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District
                  </label>
                  <select
                    value={selectedDistrictId || ""}
                    disabled={!selectedDivisionId}
                    onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                  >
                    <option value="">Select District</option>
                    {districts.map((d) => (
                      <option key={d.district_id} value={d.district_id}>
                        {d.name_en} ({d.name_bn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thana / Police Station
                  </label>
                  <select
                    value={selectedThanaId || ""}
                    disabled={!selectedDistrictId}
                    onChange={(e) => setSelectedThanaId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
                  >
                    <option value="">Select Thana</option>
                    {thanas.map((th) => (
                      <option key={th.thana_id} value={th.thana_id}>
                        {th.name_en} ({th.name_bn})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Union / Ward
                  </label>
                  <input
                    type="text"
                    value={unionWard}
                    onChange={(e) => setUnionWard(e.target.value)}
                    placeholder="e.g. Ward No. 14"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Mahalla / Village
                  </label>
                  <input
                    type="text"
                    value={areaVillage}
                    onChange={(e) => setAreaVillage(e.target.value)}
                    placeholder="e.g. Dhanmondi R/A"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Road / Street
                  </label>
                  <input
                    type="text"
                    value={road}
                    onChange={(e) => setRoad(e.target.value)}
                    placeholder="e.g. Road #27"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    House / Holding No.
                  </label>
                  <input
                    type="text"
                    value={houseHolding}
                    onChange={(e) => setHouseHolding(e.target.value)}
                    placeholder="e.g. Plot #45, Apt 3B"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite to Central Mosque"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & SUBMIT */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  {locale === "bn" ? "সারসংক্ষেপ ও চূড়ান্ত দাখিল" : "Step 4: Review and Official Intake"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm all details. The database will generate an immutable tracking code upon submission.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Summary Box 1: Complainant */}
                <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50">
                  <div className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-700" />
                    <span>Complainant Information</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Name:</span>
                      <span className="font-semibold text-slate-900">
                        {complainantNameEn || complainantNameBn || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Mobile:</span>
                      <span className="font-semibold text-slate-900 font-mono">{mobile}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Document Type:</span>
                      <span>{idDocType || "Not specified"}</span>
                    </div>
                  </div>
                </div>

                {/* Summary Box 2: Incident */}
                <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50">
                  <div className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-700" />
                    <span>Incident Summary</span>
                  </div>
                  <div className="space-y-2 text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Title:</span>
                      <span className="font-semibold text-slate-900">{title}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Date & Time:</span>
                        <span>
                          {incidentDate} {incidentTime ? `at ${incidentTime}` : ""}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Urgency:</span>
                        <span className="font-semibold text-amber-700">{urgency}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Receiving Branch:</span>
                        <span>
                          {branches.find((b) => b.branch_id === receivingBranchId)?.branch_name ||
                            "Assigned Branch"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Narrative:</span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line bg-white p-2.5 rounded border border-slate-200 mt-1">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic DBMS Notice */}
                <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    No GD or FIR number is generated on the frontend. The backend database will assign a formal reference code upon assessment.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "পূর্ববর্তী" : "Back"}</span>
              </button>
            ) : (
              <Link
                href="/complaints"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{locale === "bn" ? "বাতিল" : "Cancel"}</span>
              </Link>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <span>{locale === "bn" ? "পরবর্তী ধাপ" : "Continue"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-semibold shadow-xs transition disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{locale === "bn" ? "জমা হচ্ছে..." : "Recording Complaint..."}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{locale === "bn" ? "অভিযোগ দাখিল করুন" : "Submit Complaint"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
