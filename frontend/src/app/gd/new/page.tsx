"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { AgencyBranch, Complainant } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FileSpreadsheet,
  ArrowLeft,
  Save,
  AlertCircle,
  Building,
  User,
} from "lucide-react";

export default function NewGDPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [complainants, setComplainants] = useState<Complainant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Form State
  const [subject, setSubject] = useState("");
  const [incidentPlace, setIncidentPlace] = useState("");
  const [gdDate, setGdDate] = useState(new Date().toISOString().split("T")[0]);
  const [branchId, setBranchId] = useState<number>(1);
  const [complainantId, setComplainantId] = useState<number | undefined>();

  // Quick complainant inline entry if needed
  const [showNewComplainant, setShowNewComplainant] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [bRes, cRes] = await Promise.all([
          api.listBranches(),
          api.listComplainants(),
        ]);
        if (bRes.success && bRes.data) {
          setBranches(bRes.data);
          if (bRes.data.length > 0) setBranchId(bRes.data[0].branch_id);
        }
        if (cRes.success && cRes.data) {
          setComplainants(cRes.data);
          if (cRes.data.length > 0) setComplainantId(cRes.data[0].complainant_id);
        }
      } catch {
        setErrorMessage("Failed to load reference data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    let finalComplainantId = complainantId;

    if (showNewComplainant) {
      if (!newName.trim() || !newPhone.trim()) {
        setErrorMessage("Please enter both complainant name and phone number.");
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
      setErrorMessage("Please select or add a complainant.");
      return;
    }

    if (!subject.trim()) {
      setErrorMessage("Subject is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createGD({
        subject: subject.trim(),
        incident_place: incidentPlace.trim() || undefined,
        gd_date: gdDate,
        branch_id: branchId,
        complainant_id: finalComplainantId,
      });

      if (res.success && res.data) {
        router.push(`/gd/${res.data.gd_id}`);
      } else {
        setErrorMessage(res.error || "Failed to record General Diary entry.");
      }
    } catch {
      setErrorMessage("Network error while recording General Diary.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <PageHeader
          title={locale === "bn" ? "নতুন সাধারণ ডায়েরি (জিডি) এন্ট্রি" : "Record General Diary (GD) Entry"}
          description={
            locale === "bn"
              ? "অনামলযোগ্য ঘটনা, নিখোঁজ বিজ্ঞপ্তি বা স্টেশনের সাধারণ ডায়েরি রেকর্ড অন্তর্ভুক্তি।"
              : "Register a non-cognizable incident, lost property notice, or station general diary entry."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "General Diary", href: "/gd" },
            { label: "New Entry" },
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
                  Police Station Branch <span className="text-red-500">*</span>
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
                  Entry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={gdDate}
                  onChange={(e) => setGdDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Complainant Selection */}
            <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Complainant / Reporter Particulars
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
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Md. Rafiqul Islam"
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
                      placeholder="e.g. 01711000000"
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Subject / Matter of Incident <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Loss of National ID card and educational certificates"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Place of Occurrence / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Near Farmgate Footover Bridge, Tejgaon"
                value={incidentPlace}
                onChange={(e) => setIncidentPlace(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Link
                href="/gd"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to GD Registry</span>
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{submitting ? "Recording GD..." : "Record & Register GD"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
