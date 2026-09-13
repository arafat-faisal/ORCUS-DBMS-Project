"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Suspect, Victim, Witness, Complainant } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  Users,
  Search,
  PlusCircle,
  User,
  ShieldCheck,
  Eye,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function ParticipantsPage() {
  const { locale } = useLocale();

  const [activeTab, setActiveTab] = useState<"suspects" | "victims" | "witnesses" | "complainants">("suspects");
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [complainants, setComplainants] = useState<Complainant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Inline registration panel
  const [showRegisterPanel, setShowRegisterPanel] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regDetail, setRegDetail] = useState("");
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regFeedback, setRegFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sRes, vRes, wRes, compRes] = await Promise.all([
        api.listSuspects(),
        api.listVictims(),
        api.listWitnesses(),
        api.listComplainants(),
      ]);

      if (sRes.success && sRes.data) setSuspects(sRes.data);
      if (vRes.success && vRes.data) setVictims(vRes.data);
      if (wRes.success && wRes.data) setWitnesses(wRes.data);
      if (compRes.success && compRes.data) setComplainants(compRes.data);
    } catch {
      setError("Network error while loading participants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegFeedback("Participant name is required.");
      return;
    }

    setRegSubmitting(true);
    setRegFeedback(null);
    try {
      if (activeTab === "suspects") {
        const parts = regName.trim().split(" ");
        const first = parts[0];
        const last = parts.slice(1).join(" ") || "Unknown";
        const res = await api.createSuspect({
          first_name: first,
          last_name: last,
          suspicion_level: "Medium",
          identification_sign: regDetail || undefined,
        });
        if (res.success && res.data) {
          setSuspects([res.data, ...suspects]);
          setRegFeedback("Suspect recorded in neutral database registry.");
          setShowRegisterPanel(false);
          setRegName("");
          setRegDetail("");
        }
      } else if (activeTab === "victims") {
        const res = await api.createVictim({
          name: regName.trim(),
          phone: regPhone.trim() || undefined,
          condition_notes: regDetail || undefined,
        });
        if (res.success && res.data) {
          setVictims([res.data, ...victims]);
          setRegFeedback("Victim record created.");
          setShowRegisterPanel(false);
          setRegName("");
          setRegPhone("");
          setRegDetail("");
        }
      } else if (activeTab === "witnesses") {
        const res = await api.createWitness({
          name: regName.trim(),
          phone: regPhone.trim() || undefined,
          reliability: "High",
          statement_summary: regDetail || undefined,
        });
        if (res.success && res.data) {
          setWitnesses([res.data, ...witnesses]);
          setRegFeedback("Witness record registered.");
          setShowRegisterPanel(false);
          setRegName("");
          setRegPhone("");
          setRegDetail("");
        }
      } else if (activeTab === "complainants") {
        const res = await api.createComplainant({
          name: regName.trim(),
          contacts: regPhone.trim()
            ? [{ contact_type: "phone", contact_value: regPhone.trim(), is_primary: true }]
            : [],
        });
        if (res.success && res.data) {
          setComplainants([res.data, ...complainants]);
          setRegFeedback("Complainant record created.");
          setShowRegisterPanel(false);
          setRegName("");
          setRegPhone("");
        }
      }
    } catch {
      setRegFeedback("Failed to submit participant record.");
    } finally {
      setRegSubmitting(false);
    }
  };

  const filteredSuspects = suspects.filter(
    (s) =>
      !searchTerm ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.identification_sign && s.identification_sign.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredVictims = victims.filter(
    (v) =>
      !searchTerm ||
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phone && v.phone.includes(searchTerm))
  );

  const filteredWitnesses = witnesses.filter(
    (w) =>
      !searchTerm ||
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.phone && w.phone.includes(searchTerm))
  );

  const filteredComplainants = complainants.filter(
    (c) => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        <PageHeader
          title={locale === "bn" ? "মামলার পক্ষ ও সংশ্লিষ্ট ব্যক্তিবর্গ" : "Participants"}
          description={
            locale === "bn"
              ? "তদন্ত সংশ্লিষ্ট সন্দেহভাজন, ভিকটিম, প্রত্যক্ষদর্শী এবং অভিযোগকারীদের নিরপেক্ষ রেজিস্ট্রি।"
              : "Neutral case participants directory covering suspects, victims, witnesses, and complainants."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: locale === "bn" ? "তদন্ত" : "Investigation" },
            { label: "Participants" },
          ]}
          action={
            <button
              onClick={() => setShowRegisterPanel(!showRegisterPanel)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register New {activeTab.slice(0, -1)}</span>
            </button>
          }
        />

        {/* Quick Tabs */}
        <div className="border-b border-slate-200 flex gap-6 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab("suspects");
              setShowRegisterPanel(false);
            }}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === "suspects"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Suspects ({suspects.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("victims");
              setShowRegisterPanel(false);
            }}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === "victims"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Victims ({victims.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("witnesses");
              setShowRegisterPanel(false);
            }}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === "witnesses"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Witnesses ({witnesses.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("complainants");
              setShowRegisterPanel(false);
            }}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === "complainants"
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Complainants ({complainants.length})
          </button>
        </div>

        {/* Inline Register Panel */}
        {showRegisterPanel && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Register New {activeTab.slice(0, -1)}
              </h3>
              <button
                onClick={() => setShowRegisterPanel(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            {regFeedback && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{regFeedback}</span>
              </div>
            )}

            <form onSubmit={handleRegisterParticipant} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Anisur Rahman"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Identification / Particulars / Notes
                </label>
                <input
                  type="text"
                  value={regDetail}
                  onChange={(e) => setRegDetail(e.target.value)}
                  placeholder="e.g. Distinct scar on left forearm, alias 'Liton'..."
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="text-right pt-2">
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs transition disabled:opacity-50"
                >
                  {regSubmitting ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter / Search Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTab} by name or contact...`}
              className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* State Display */}
        {loading ? (
          <LoadingState message="Loading participants registry..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            {/* TAB: SUSPECTS */}
            {activeTab === "suspects" && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Alias / Identification</th>
                    <th className="py-3 px-4">Investigative Status</th>
                    <th className="py-3 px-4">Suspicion Level</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredSuspects.map((s) => (
                    <tr key={s.suspect_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{s.first_name} {s.last_name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {s.identification_sign || "None recorded"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {s.status || "Under Investigation"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s.suspicion_level === "High"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s.suspicion_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-slate-400 text-xs">Record Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB: VICTIMS */}
            {activeTab === "victims" && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Victim Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Protection / Condition Notes</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredVictims.map((v) => (
                    <tr key={v.victim_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{v.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {v.phone || "Protected Contact"}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {v.condition_notes || "Under judicial protection"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          {v.is_deceased ? "Deceased" : "Protected Witness"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-slate-400 text-xs">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB: WITNESSES */}
            {activeTab === "witnesses" && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Witness Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Reliability Index</th>
                    <th className="py-3 px-4">Protection Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredWitnesses.map((w) => (
                    <tr key={w.witness_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{w.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {w.phone || "Protected"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {w.reliability || "Standard"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                          {w.is_protected ? "Judicial Witness Protection" : "Public Deponent"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-slate-400 text-xs">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* TAB: COMPLAINANTS */}
            {activeTab === "complainants" && (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Complainant Name</th>
                    <th className="py-3 px-4">Contact Coordinates</th>
                    <th className="py-3 px-4">Primary Channel</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredComplainants.map((c) => (
                    <tr key={c.complainant_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{c.name}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {c.contacts?.[0]?.contact_value || "Walk-in Contact"}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        Citizen Informant
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/complaints"
                          className="text-blue-700 hover:text-blue-900 font-semibold"
                        >
                          View Complaints
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
