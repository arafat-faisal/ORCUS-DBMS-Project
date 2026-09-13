"use client";

import React, { useState } from "react";
import { Package, ShieldCheck, Lock, RefreshCw, Cpu, FileText, FlaskConical, Radio } from "lucide-react";

interface VaultLocker {
  id: string;
  code: string;
  label: string;
  category: "Weapon" | "Digital" | "Documentary" | "Biological" | "Forensic";
  status: "Stored in Vault" | "In Lab Analysis" | "Presented in Court";
  itemsCount: number;
  highlightColor: string;
}

const LOCKERS: VaultLocker[] = [
  { id: "1", code: "VAULT-W4", label: "9mm Beretta Pistol w/ Magazine", category: "Weapon", status: "Stored in Vault", itemsCount: 2, highlightColor: "#f59e0b" },
  { id: "2", code: "VAULT-D1", label: "Encrypted USB Drive & Keystroke Loggers", category: "Digital", status: "In Lab Analysis", itemsCount: 4, highlightColor: "#00e5ff" },
  { id: "3", code: "VAULT-D2", label: "Satellite Phone (Iridium 9555)", category: "Digital", status: "In Lab Analysis", itemsCount: 1, highlightColor: "#3b82f6" },
  { id: "4", code: "VAULT-A3", label: "Intaglio Currency Plates & Forged Deeds", category: "Documentary", status: "Stored in Vault", itemsCount: 6, highlightColor: "#10b981" },
  { id: "5", code: "VAULT-B1", label: "Blood Spatter DNA Slides & Lifting Cards", category: "Biological", status: "In Lab Analysis", itemsCount: 9, highlightColor: "#ef4444" },
  { id: "6", code: "VAULT-C4", label: "Voicemail Extortion Wiretap Exhibit", category: "Digital", status: "Presented in Court", itemsCount: 1, highlightColor: "#a855f7" },
];

export const EvidenceVaultLocker: React.FC = () => {
  const [selected, setSelected] = useState<VaultLocker>(LOCKERS[0]);

  return (
    <div className="tactical-card p-6 flex flex-col justify-between h-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2.5">
          <Package className="w-5 h-5 text-cyan-400" />
          <h4 className="font-tactical text-sm font-bold text-white tracking-wide">
            EVIDENCE VAULT &amp; FORENSIC LOCKERS
          </h4>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            &bull; DEFCON-2 BIOMETRIC LOCKDOWN
          </span>
        </div>

        <button className="w-7 h-7 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Capacity Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        {/* Locker Saturation */}
        <div>
          <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
            <span>VAULT LOCKER OCCUPANCY</span>
            <span className="text-amber-400 font-semibold">28 / 36 Lockers (77%)</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full w-[77%]" />
          </div>
        </div>

        {/* Chain of Custody Integrity */}
        <div>
          <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
            <span>CUSTODY AUDIT COMPLIANCE</span>
            <span className="text-emerald-400 font-semibold">100% Tamper-Verified</span>
          </div>
          <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[100%]" />
          </div>
        </div>
      </div>

      {/* Locker Compartments Grid (Screenshot 1 Layout Adapted to Police Evidence Vault) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-2">
        {LOCKERS.map((l) => {
          const isSelected = selected.id === l.id;
          return (
            <div
              key={l.id}
              onClick={() => setSelected(l)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-neutral-800/90 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                  : "bg-[#151822] border-neutral-800 hover:border-neutral-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-xs font-bold text-neutral-200">
                  {l.code}
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: l.highlightColor }}
                />
              </div>

              <p className="text-xs font-tactical text-neutral-300 mt-1 line-clamp-1 font-medium">
                {l.label}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-2">
                <span>{l.category}</span>
                <span className="text-neutral-300 font-semibold">{l.itemsCount} items</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Locker HUD */}
      {selected && (
        <div className="mt-3 p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-neutral-500 block text-[10px]">SELECTED VAULT LOCKER:</span>
            <span className="text-white font-semibold font-tactical">{selected.label} ({selected.code})</span>
          </div>
          <div className="text-right">
            <span className="text-neutral-500 block text-[10px]">STATUS:</span>
            <span
              className={`font-semibold ${
                selected.status === "Stored in Vault"
                  ? "text-emerald-400"
                  : selected.status === "In Lab Analysis"
                  ? "text-cyan-400"
                  : "text-purple-400"
              }`}
            >
              {selected.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
