"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { FIR, Officer } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FolderLock,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function NewCaseFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();

  const [firs, setFirs] = useState<FIR[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [caseTitle, setCaseTitle] = useState("");
  const [firId, setFirId] = useState<number | undefined>(
    searchParams.get("fir_id") ? Number(searchParams.get("fir_id")) : undefined
  );
  const [leadOfficerId, setLeadOfficerId] = useState<number | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetadata() {
      try {
        const [firRes, offRes] = await Promise.all([
          api.listFIRs(),
          api.listOfficers(),
        ]);
        if (firRes.success && firRes.data) {
          setFirs(firRes.data);
          // If firId was in query param, auto-populate title if empty
          const targetFir = firRes.data.find((f) => f.fir_id === firId);
          if (targetFir && !caseTitle) {
            setCaseTitle(`Investigation into ${targetFir.crime_category} (${targetFir.fir_number})`);
          }
        }
        if (offRes.success && offRes.data) {
          setOfficers(offRes.data);
          if (offRes.data.length > 0) setLeadOfficerId(offRes.data[0].officer_id);
        }
      } catch (err) {
        console.error("Failed to load case creation metadata", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetadata();
  }, [firId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseTitle.trim()) {
      setErrorMsg("Case title is required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.openCase({
        case_title: caseTitle.trim(),
        opened_date: new Date().toISOString().split("T")[0],
        fir_id: firId,
        lead_officer_id: leadOfficerId,
      });

      if (res.success && res.data) {
        router.push(`/cases/${res.data.case_id}`);
      } else {
        setErrorMsg(res.error || "Failed to open new investigation case.");
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
        title={locale === "bn" ? "নতুন তদন্ত মামলা নথিভুক্তকরণ" : "Open Investigation Case"}
        description={
          locale === "bn"
            ? "এজাহার (FIR) বা বিভাগীয় নির্দেশনার ভিত্তিতে নতুন তদন্ত ডসিয়ার নথিভুক্ত করুন।"
            : "Register a formal investigative case file, assign a lead investigator, and initiate forensic workflows."
        }
        breadcrumbs={[
          { label: "ORCUS", href: "/dashboard" },
          { label: "Cases", href: "/cases" },
          { label: "New Case" },
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
              Case Title / Nomenclature <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              placeholder="e.g. Investigation into Organised Extortion Ring (Dhanmondi Zone)"
              className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Underlying Source FIR
              </label>
              <select
                value={firId || ""}
                onChange={(e) => setFirId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Direct Investigation (No Registered FIR)</option>
                {firs.map((f) => (
                  <option key={f.fir_id} value={f.fir_id}>
                    {f.fir_number} &bull; {f.crime_category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1.5">
                Assigned Lead Investigator (IO)
              </label>
              <select
                value={leadOfficerId || ""}
                onChange={(e) => setLeadOfficerId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Select Investigating Officer</option>
                {officers.map((off) => (
                  <option key={off.officer_id} value={off.officer_id}>
                    {off.rank} {off.first_name} {off.last_name} ({off.badge_no})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-xs flex items-center gap-2 mt-4">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Opening this case will initialize the investigation dossier, linking suspects, evidence vault lockers, and forensic logs.
            </span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Link
              href="/cases"
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
              <span>{submitting ? "Opening Case..." : "Open Investigation Case"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewCasePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading form...</div>}>
        <NewCaseFormContent />
      </Suspense>
    </AppShell>
  );
}
