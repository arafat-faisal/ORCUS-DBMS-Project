"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { CaseOverview } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Package,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function RegisterEvidenceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();

  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceType, setEvidenceType] = useState("Physical");
  const [storageLocation, setStorageLocation] = useState("Station Evidence Locker A-1");
  const [selectedCaseId, setSelectedCaseId] = useState<number | undefined>(
    searchParams.get("case_id") ? Number(searchParams.get("case_id")) : undefined
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await api.searchCases();
        if (res.success && res.data) {
          setCases(res.data);
          if (!selectedCaseId && res.data.length > 0) {
            setSelectedCaseId(res.data[0].case_id);
          }
        }
      } catch (e) {
        console.error("Failed to load cases", e);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [selectedCaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedCaseId) {
      setErrorMsg("Evidence title and associated investigation case are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.createEvidence({
        case_id: selectedCaseId,
        title: title.trim(),
        description: description.trim() || undefined,
        evidence_type: evidenceType,
        storage_location: storageLocation.trim() || undefined,
      });

      if (res.success && res.data) {
        router.push(`/evidence/${res.data.evidence_id}`);
      } else {
        setErrorMsg(res.error || "Failed to register evidence item.");
      }
    } catch {
      setErrorMsg("Network error while connecting to ORCUS API.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <PageHeader
        title={locale === "bn" ? "আলামত নিবন্ধন ফরম" : "Register Forensic Evidence"}
        description={
          locale === "bn"
            ? "তদন্ত সংশ্লিষ্ট জব্দকৃত বস্তুগত, ডিজিটাল বা দলিলপত্রাদি সিস্টেমে নথিভুক্ত করুন।"
            : "Formally register seized evidentiary items and establish the initial chain of custody."
        }
        breadcrumbs={[
          { label: "ORCUS", href: "/dashboard" },
          { label: "Evidence", href: "/evidence" },
          { label: "New Evidence" },
        ]}
      />

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Related Investigation Case <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedCaseId || ""}
              onChange={(e) => setSelectedCaseId(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  Case #{c.case_id}: {c.case_title} ({c.crime_category || "General"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Evidence Title / Description of Seized Property <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Recovered Samsung Galaxy mobile device with damaged SIM card"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Evidence Classification Type
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="Physical">Physical / Weapon / Contraband</option>
                <option value="Digital">Digital / Electronic / Phone / Drive</option>
                <option value="Documentary">Documentary / Bank Record / Deed</option>
                <option value="Biological">Biological / Forensic Fluid</option>
                <option value="Narcotics">Narcotics / Controlled Substance</option>
                <option value="Weapon">Firearm / Ammunition / Blade</option>
                <option value="Other">Other Miscellaneous Item</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Designated Storage Location / Locker
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Station Evidence Room - Shelf B-2"
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1.5">
              Seizure Particulars & Chain of Custody Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Seizure list details, witness signatures, condition upon recovery..."
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 leading-relaxed"
            />
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs flex items-center gap-2 mt-4">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Evidence storage is preserved as an informational database record with immutable chronological custody logs.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              href="/evidence"
              className="inline-flex items-center gap-1 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-semibold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? "Registering..." : "Register Evidence Item"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RegisterEvidencePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading form...</div>}>
        <RegisterEvidenceContent />
      </Suspense>
    </AppShell>
  );
}
