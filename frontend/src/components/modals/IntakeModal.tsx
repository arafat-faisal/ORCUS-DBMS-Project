"use client";

import React, { useState } from "react";
import { X, FilePlus, UserCheck, Scale, Check } from "lucide-react";
import { LegalSection, Complainant, GD } from "@/lib/types";

interface IntakeModalProps {
  complainants: Complainant[];
  gds: GD[];
  legalSections: LegalSection[];
  onClose: () => void;
  onCreateComplainant: (name: string, phone: string, email: string) => Promise<void>;
  onCreateGD: (gdNumber: string, date: string, subject: string, complainantId: number) => Promise<void>;
  onCreateFIR: (firNumber: string, category: string, date: string, gdId?: number, sectionIds?: number[]) => Promise<void>;
}

export const IntakeModal: React.FC<IntakeModalProps> = ({
  complainants,
  gds,
  legalSections,
  onClose,
  onCreateComplainant,
  onCreateGD,
  onCreateFIR,
}) => {
  const [activeStep, setActiveStep] = useState<"complainant" | "gd" | "fir">("fir");

  // Complainant state
  const [cName, setCName] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cEmail, setCEmail] = useState("");

  // GD state
  const [gdNumber, setGdNumber] = useState("GD-2026-DH-1001");
  const [gdDate, setGdDate] = useState("2026-09-13");
  const [gdSubject, setGdSubject] = useState("");
  const [gdComplainantId, setGdComplainantId] = useState<number>(complainants[0]?.complainant_id || 1);

  // FIR state
  const [firNumber, setFirNumber] = useState("FIR-2026-DH-1001");
  const [firCategory, setFirCategory] = useState("Armed Robbery");
  const [firDate] = useState("2026-09-13");
  const [firGdId, setFirGdId] = useState<number | undefined>(undefined);
  const [selectedSections, setSelectedSections] = useState<number[]>([]);

  const [loading, setLoading] = useState(false);

  const toggleSection = (id: number) => {
    if (selectedSections.includes(id)) {
      setSelectedSections(selectedSections.filter((s) => s !== id));
    } else {
      setSelectedSections([...selectedSections, id]);
    }
  };

  const handleComplainantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateComplainant(cName, cPhone, cEmail);
      setActiveStep("gd");
    } finally {
      setLoading(false);
    }
  };

  const handleGDSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateGD(gdNumber, gdDate, gdSubject, gdComplainantId);
      setActiveStep("fir");
    } finally {
      setLoading(false);
    }
  };

  const handleFIRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateFIR(firNumber, firCategory, firDate, firGdId, selectedSections);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#11131a] border border-neutral-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <FilePlus className="w-5 h-5 text-cyan-400" />
            <h3 className="font-tactical text-base font-bold text-white tracking-wide">
              INCIDENT INTAKE TERMINAL
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Selector */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <button
            type="button"
            onClick={() => setActiveStep("complainant")}
            className={`py-2 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 ${
              activeStep === "complainant"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800"
            }`}
          >
            <span>1. Complainant</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep("gd")}
            className={`py-2 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 ${
              activeStep === "gd"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800"
            }`}
          >
            <span>2. General Diary</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStep("fir")}
            className={`py-2 px-3 rounded-xl text-xs font-mono transition flex items-center justify-center gap-1.5 ${
              activeStep === "fir"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800"
            }`}
          >
            <span>3. File FIR</span>
          </button>
        </div>

        {/* Form Steps */}
        {activeStep === "complainant" && (
          <form onSubmit={handleComplainantSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Complainant Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rafiqul Islam"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Primary Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+8801711000111"
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Official Email</label>
                <input
                  type="email"
                  placeholder="complainant@example.com"
                  value={cEmail}
                  onChange={(e) => setCEmail(e.target.value)}
                  className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition"
              >
                {loading ? "SAVING..." : "REGISTER &amp; PROCEED TO GD"}
              </button>
            </div>
          </form>
        )}

        {activeStep === "gd" && (
          <form onSubmit={handleGDSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">GD Registration No</label>
                <input
                  type="text"
                  required
                  value={gdNumber}
                  onChange={(e) => setGdNumber(e.target.value)}
                  className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Incident Date</label>
                <input
                  type="date"
                  required
                  value={gdDate}
                  onChange={(e) => setGdDate(e.target.value)}
                  className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Complainant</label>
              <select
                value={gdComplainantId}
                onChange={(e) => setGdComplainantId(Number(e.target.value))}
                className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {complainants.map((c) => (
                  <option key={c.complainant_id} value={c.complainant_id}>
                    {c.name} (ID: #{c.complainant_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Subject &amp; Allegation</label>
              <textarea
                required
                rows={3}
                placeholder="Describe reported incident..."
                value={gdSubject}
                onChange={(e) => setGdSubject(e.target.value)}
                className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition"
              >
                {loading ? "RECORDING..." : "RECORD GD &amp; PROCEED TO FIR"}
              </button>
            </div>
          </form>
        )}

        {activeStep === "fir" && (
          <form onSubmit={handleFIRSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">FIR Official No</label>
                <input
                  type="text"
                  required
                  value={firNumber}
                  onChange={(e) => setFirNumber(e.target.value)}
                  className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Crime Category</label>
                <select
                  value={firCategory}
                  onChange={(e) => setFirCategory(e.target.value)}
                  className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Armed Robbery">Armed Robbery</option>
                  <option value="Homicide">Homicide</option>
                  <option value="Narcotics Smuggling">Narcotics Smuggling</option>
                  <option value="Cyber Intrusion &amp; Fraud">Cyber Intrusion &amp; Fraud</option>
                  <option value="Kidnapping &amp; Extortion">Kidnapping &amp; Extortion</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">Source General Diary (Optional)</label>
              <select
                value={firGdId || ""}
                onChange={(e) => setFirGdId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="">Direct Filing (No Prior GD)</option>
                {gds.map((g) => (
                  <option key={g.gd_id} value={g.gd_id}>
                    {g.gd_number} - {g.subject.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Legal Sections Selector */}
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase mb-1.5">
                Statutory Penal Code Sections ({selectedSections.length} selected)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-[#161822] rounded-xl border border-neutral-800">
                {legalSections.map((sec) => {
                  const isSelected = selectedSections.includes(sec.section_id);
                  return (
                    <div
                      key={sec.section_id}
                      onClick={() => toggleSection(sec.section_id)}
                      className={`p-2 rounded-lg text-xs font-mono cursor-pointer border flex items-center justify-between transition ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <span className="truncate">{sec.section_code}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition"
              >
                {loading ? "FILING..." : "SUBMIT FIRST INFORMATION REPORT (FIR)"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
