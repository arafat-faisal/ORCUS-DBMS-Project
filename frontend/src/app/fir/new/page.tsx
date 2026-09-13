"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { AgencyBranch, Complainant, LegalSection, GD } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Scale,
  ArrowLeft,
  Save,
  AlertCircle,
  Building,
  User,
  FileSpreadsheet,
} from "lucide-react";

export default function NewFIRPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [complainants, setComplainants] = useState<Complainant[]>([]);
  const [legalSections, setLegalSections] = useState<LegalSection[]>([]);
  const [gds, setGds] = useState<GD[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [crimeCategory, setCrimeCategory] = useState("Theft / Burglary");
  const [placeOfOccurrence, setPlaceOfOccurrence] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentTime, setIncidentTime] = useState("");
  const [filedDate, setFiledDate] = useState(new Date().toISOString().split("T")[0]);
  const [branchId, setBranchId] = useState<number>(1);
  const [complainantId, setComplainantId] = useState<number | undefined>();
  const [selectedGDId, setSelectedGDId] = useState<number | undefined>();
  const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);

  // Complainant inline creation
  const [showNewComplainant, setShowNewComplainant] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, cRes, secRes, gdRes] = await Promise.all([
          api.listBranches(),
          api.listComplainants(),
          api.listLegalSections(),
          api.listGDs(),
        ]);
        if (bRes.success && bRes.data) {
          setBranches(bRes.data);
          if (bRes.data.length > 0) setBranchId(bRes.data[0].branch_id);
        }
        if (cRes.success && cRes.data) {
          setComplainants(cRes.data);
          if (cRes.data.length > 0) setComplainantId(cRes.data[0].complainant_id);
        }
        if (secRes.success && secRes.data) {
          setLegalSections(secRes.data);
          if (secRes.data.length > 0) setSelectedSectionIds([secRes.data[0].section_id]);
        }
        if (gdRes.success && gdRes.data) {
          setGds(gdRes.data);
        }
      } catch {
        setErrorMessage("Failed to load reference metadata.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleSection = (id: number) => {
    setSelectedSectionIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    let finalComplainantId = complainantId;

    if (showNewComplainant) {
      if (!newName.trim() || !newPhone.trim()) {
        setErrorMessage("Please enter complainant name and phone number.");
        return;
      }
      try {
        const createCRes = await api.createComplainant({
          name: newName.trim(),
          contacts: [
            {
              contact_type: "phone",
              contact_value: newPhone.trim(),
              is_primary: true,
            },
          ],
        });
        if (createCRes.success && createCRes.data) {
          finalComplainantId = createCRes.data.complainant_id;
        } else {
          setErrorMessage(createCRes.error || "Failed to register complainant.");
          return;
        }
      } catch {
        setErrorMessage("Failed to register complainant.");
        return;
      }
    }

    if (!finalComplainantId) {
      setErrorMessage("Please select or specify a complainant.");
      return;
    }

    if (!crimeCategory.trim()) {
      setErrorMessage("Crime Category is required.");
      return;
    }

    if (selectedSectionIds.length === 0) {
      setErrorMessage("Please select at least one Penal Code / Legal Section.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createFIR({
        crime_category: crimeCategory.trim(),
        filed_date: filedDate,
        incident_date: incidentDate || undefined,
        incident_time: incidentTime || undefined,
        place_of_occurrence: placeOfOccurrence.trim() || undefined,
        gd_id: selectedGDId || undefined,
        section_ids: selectedSectionIds,
      });

      if (res.success && res.data) {
        router.push(`/fir/${res.data.fir_id}`);
      } else {
        setErrorMessage(res.error || "Failed to register First Information Report.");
      }
    } catch {
      setErrorMessage("Network error while recording FIR.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <PageHeader
          title={locale === "bn" ? "নতুন প্রথম তথ্য বিবরণী (এজাহার) নথিভুক্তি" : "Register First Information Report (FIR)"}
          description={
            locale === "bn"
              ? "আমলযোগ্য অপরাধের বিবরণ, ধারা সংযোজন এবং প্রাতিষ্ঠানিক এজাহার নথিভুক্তি।"
              : "Register formal criminal intake, assign penal sections, and authorize official FIR registration."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "FIR Registry", href: "/fir" },
            { label: "New FIR" },
          ]}
        />

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jurisdiction Police Station <span className="text-red-500">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(Number(e.target.value))}
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Crime Classification / Offense Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={crimeCategory}
                  onChange={(e) => setCrimeCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="Theft / Burglary">Theft / Burglary</option>
                  <option value="Robbery / Extortion">Robbery / Extortion</option>
                  <option value="Physical Assault / Grievous Hurt">Physical Assault / Grievous Hurt</option>
                  <option value="Financial Fraud / Embezzlement">Financial Fraud / Embezzlement</option>
                  <option value="Cybercrime / Identity Theft">Cybercrime / Identity Theft</option>
                  <option value="Narcotics & Controlled Substances">Narcotics & Controlled Substances</option>
                  <option value="Homicide / Unnatural Death">Homicide / Unnatural Death</option>
                  <option value="Public Disturbance / Rioting">Public Disturbance / Rioting</option>
                </select>
              </div>
            </div>

            {/* Complainant Selection */}
            <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Complainant / First Informant
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewComplainant(!showNewComplainant)}
                  className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
                >
                  {showNewComplainant ? "Choose Existing Complainant" : "+ Add New Complainant"}
                </button>
              </div>

              {showNewComplainant ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Complainant Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Shahidul Alam"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 01819000000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Select Existing Complainant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={complainantId || ""}
                    onChange={(e) => setComplainantId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {complainants.map((c) => {
                      const phone = c.contacts?.find((cnt) => cnt.contact_type === "phone")?.contact_value;
                      return (
                        <option key={c.complainant_id} value={c.complainant_id}>
                          {c.name} {phone ? `(${phone})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Optional Source GD Link */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Link to Originating General Diary (Optional)
              </label>
              <select
                value={selectedGDId || ""}
                onChange={(e) => setSelectedGDId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Direct Entry (No Prior GD)</option>
                {gds.map((gd) => (
                  <option key={gd.gd_id} value={gd.gd_id}>
                    {gd.gd_number} — {gd.subject} ({gd.complainant_name || "Complainant"})
                  </option>
                ))}
              </select>
            </div>

            {/* Date & Time Particulars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Registration Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={filedDate}
                  onChange={(e) => setFiledDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Incident Date
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Incident Time
                </label>
                <input
                  type="time"
                  value={incidentTime}
                  onChange={(e) => setIncidentTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Place of Occurrence
              </label>
              <input
                type="text"
                placeholder="e.g. House 42, Road 7, Dhanmondi, Dhaka"
                value={placeOfOccurrence}
                onChange={(e) => setPlaceOfOccurrence(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            {/* Applicable Penal Code Sections */}
            <div>
              <label className="block font-semibold text-slate-700 mb-2">
                Applicable Penal Code / Legal Sections <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 border border-slate-200 rounded-md p-3 max-h-48 overflow-y-auto bg-slate-50">
                {legalSections.map((sec) => (
                  <label
                    key={sec.section_id}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer border text-[11px] transition ${
                      selectedSectionIds.includes(sec.section_id)
                        ? "bg-blue-50/80 border-blue-400 text-blue-900 font-semibold"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSectionIds.includes(sec.section_id)}
                      onChange={() => toggleSection(sec.section_id)}
                      className="mt-0.5 rounded text-blue-600"
                    />
                    <div>
                      <div className="font-mono text-xs">{sec.section_code}</div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {sec.section_title}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href="/fir"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to FIR Registry</span>
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? "Registering FIR..." : "Register & Issue FIR"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
