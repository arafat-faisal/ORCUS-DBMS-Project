"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { Suspect, Victim, Witness, CaseOverview, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  Users,
  Search,
  Filter,
  Plus,
  Shield,
  AlertTriangle,
  FileText,
  Phone,
  FolderLock,
  Eye,
  CheckCircle2,
  HeartCrack,
} from "lucide-react";

export default function ParticipantsPage() {
  const { t } = useLocale();

  const [activeTab, setActiveTab] = useState<"suspects" | "victims" | "witnesses">("suspects");
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [victims, setVictims] = useState<Victim[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [showSuspectModal, setShowSuspectModal] = useState(false);
  const [showVictimModal, setShowVictimModal] = useState(false);
  const [showWitnessModal, setShowWitnessModal] = useState(false);

  // Form states
  const [sFirstName, setSFirstName] = useState("");
  const [sLastName, setSLastName] = useState("");
  const [sAge, setSAge] = useState("");
  const [sSuspicion, setSSuspicion] = useState("Medium");
  const [sSign, setSSign] = useState("");

  const [vName, setVName] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vNotes, setVNotes] = useState("");

  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");
  const [wReliability, setWReliability] = useState("High");
  const [wProtected, setWProtected] = useState(false);
  const [wStatement, setWStatement] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadParticipants() {
      setLoading(true);
      const [sRes, vRes, wRes, cRes] = await Promise.all([
        api.listSuspects(),
        api.listVictims(),
        api.listWitnesses(),
        api.searchCases(),
      ]);

      if (sRes.success && sRes.data) setSuspects(sRes.data);
      if (vRes.success && vRes.data) setVictims(vRes.data);
      if (wRes.success && wRes.data) setWitnesses(wRes.data);
      if (cRes.success && cRes.data) setCases(cRes.data);
      setLoading(false);
    }
    loadParticipants();
  }, []);

  const handleCreateSuspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sFirstName || !sLastName) return;

    setSubmitting(true);
    const res = await api.createSuspect({
      first_name: sFirstName,
      last_name: sLastName,
      age: sAge ? parseInt(sAge, 10) : undefined,
      suspicion_level: sSuspicion,
      identification_sign: sSign || undefined,
    });

    if (res.success && res.data) {
      setSuspects([res.data, ...suspects]);
      setShowSuspectModal(false);
      setSFirstName("");
      setSLastName("");
      setSAge("");
      setSSign("");
    } else {
      alert(res.error || "Failed to register suspect");
    }
    setSubmitting(false);
  };

  const handleCreateVictim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName) return;

    setSubmitting(true);
    const res = await api.createVictim({
      name: vName,
      phone: vPhone || undefined,
      condition_notes: vNotes || undefined,
    });

    if (res.success && res.data) {
      setVictims([res.data, ...victims]);
      setShowVictimModal(false);
      setVName("");
      setVPhone("");
      setVNotes("");
    } else {
      alert(res.error || "Failed to record victim profile");
    }
    setSubmitting(false);
  };

  const handleCreateWitness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wName) return;

    setSubmitting(true);
    const res = await api.createWitness({
      name: wName,
      phone: wPhone || undefined,
      reliability: wReliability,
      is_protected: wProtected,
      statement_summary: wStatement || undefined,
    });

    if (res.success && res.data) {
      setWitnesses([res.data, ...witnesses]);
      setShowWitnessModal(false);
      setWName("");
      setWPhone("");
      setWStatement("");
    } else {
      alert(res.error || "Failed to record witness statement");
    }
    setSubmitting(false);
  };

  const filteredSuspects = suspects.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.identification_sign && s.identification_sign.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredVictims = victims.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phone && v.phone.includes(searchTerm))
  );

  const filteredWitnesses = witnesses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.statement_summary && w.statement_summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <Users className="w-4 h-4" />
              <span>Identity Registry &bull; Criminal & Witness Profiles</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Case Participants Registry
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Protected identity tracking for suspects, victims, informants, and sworn witnesses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === "suspects" && (
              <button
                onClick={() => setShowSuspectModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Register Suspect</span>
              </button>
            )}
            {activeTab === "victims" && (
              <button
                onClick={() => setShowVictimModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-cyan-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Record Victim</span>
              </button>
            )}
            {activeTab === "witnesses" && (
              <button
                onClick={() => setShowWitnessModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Record Witness</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 md:border-b-0 pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab("suspects")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "suspects"
                  ? "bg-rose-950/70 text-rose-300 border border-rose-800/80"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Suspects ({suspects.length})
            </button>
            <button
              onClick={() => setActiveTab("victims")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "victims"
                  ? "bg-cyan-950/70 text-cyan-300 border border-cyan-800/80"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Victims ({victims.length})
            </button>
            <button
              onClick={() => setActiveTab("witnesses")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "witnesses"
                  ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/80"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Witnesses ({witnesses.length})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Content Tab: Suspects */}
        {activeTab === "suspects" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuspects.map((s) => (
              <div
                key={s.suspect_id}
                className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                      s.suspicion_level === "High"
                        ? "bg-rose-950/80 text-rose-400 border-rose-800/60"
                        : s.suspicion_level === "Medium"
                        ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {s.suspicion_level} Suspicion
                  </span>
                  <span className="text-xs font-mono text-slate-500">ID #{s.suspect_id}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {s.first_name} {s.last_name}
                  </h3>
                  {s.age && <p className="text-xs text-slate-400 mt-0.5">Approximate Age: {s.age} years</p>}
                </div>

                {s.identification_sign && (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                    Marks: {s.identification_sign}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Status: <strong className="text-slate-300">{s.status || "Identified"}</strong></span>
                  <span className="font-mono text-cyan-400">NID: Verified</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Tab: Victims */}
        {activeTab === "victims" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVictims.map((v) => (
              <div
                key={v.victim_id}
                className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                    <HeartCrack className="w-3.5 h-3.5" />
                    <span>Victim Record</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">ID #{v.victim_id}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">{v.name}</h3>
                  {v.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{v.phone}</span>
                    </div>
                  )}
                </div>

                {v.condition_notes && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                    {v.condition_notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content Tab: Witnesses */}
        {activeTab === "witnesses" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWitnesses.map((w) => (
              <div
                key={w.witness_id}
                className="bg-slate-900/50 rounded-xl border border-slate-800 p-5 space-y-3 hover:border-slate-700 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    Reliability: {w.reliability}
                  </span>
                  {w.is_protected && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
                      Protected Witness
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-100">{w.name}</h3>
                  {w.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{w.phone}</span>
                    </div>
                  )}
                </div>

                {w.statement_summary && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded border border-slate-800/80 line-clamp-3">
                    &ldquo;{w.statement_summary}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: New Suspect */}
        {showSuspectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100">Register Suspect Profile</h3>
              <form onSubmit={handleCreateSuspect} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={sFirstName}
                      onChange={(e) => setSFirstName(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={sLastName}
                      onChange={(e) => setSLastName(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Age (Years)</label>
                    <input
                      type="number"
                      value={sAge}
                      onChange={(e) => setSAge(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Suspicion Level</label>
                    <select
                      value={sSuspicion}
                      onChange={(e) => setSSuspicion(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Distinguishing Marks / Physical Features</label>
                  <input
                    type="text"
                    placeholder="e.g. Scar on left cheek, 5ft 9in"
                    value={sSign}
                    onChange={(e) => setSSign(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSuspectModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium"
                  >
                    {submitting ? "Saving..." : "Register"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Victim */}
        {showVictimModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100">Record Victim Profile</h3>
              <form onSubmit={handleCreateVictim} className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={vName}
                    onChange={(e) => setVName(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+8801XXXXXXXXX"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Condition / Medical Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Impact notes, injuries, assistance provided..."
                    value={vNotes}
                    onChange={(e) => setVNotes(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowVictimModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium"
                  >
                    {submitting ? "Saving..." : "Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: New Witness */}
        {showWitnessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-100">Record Witness Statement</h3>
              <form onSubmit={handleCreateWitness} className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Witness Full Name *</label>
                  <input
                    type="text"
                    required
                    value={wName}
                    onChange={(e) => setWName(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+8801XXXXXXXXX"
                      value={wPhone}
                      onChange={(e) => setWPhone(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-400 block mb-1">Reliability Rating</label>
                    <select
                      value={wReliability}
                      onChange={(e) => setWReliability(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="wProtect"
                    checked={wProtected}
                    onChange={(e) => setWProtected(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="wProtect" className="text-xs text-slate-300 cursor-pointer">
                    Enable Witness Protection Protocol
                  </label>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">Sworn Statement Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Eye-witness account, observations, timeline notes..."
                    value={wStatement}
                    onChange={(e) => setWStatement(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWitnessModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium"
                  >
                    {submitting ? "Saving..." : "Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
