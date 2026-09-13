"use client";

import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

interface EvidenceVaultGaugeProps {
  occupiedLockers?: number;
  totalLockers?: number;
  securityTier?: string;
  fillPercentage?: number;
  title?: string;
  itemCount?: number;
  securityLevel?: string;
}

export const EvidenceVaultGauge: React.FC<EvidenceVaultGaugeProps> = ({
  occupiedLockers = 28,
  totalLockers = 36,
  securityTier = "DEFCON-2 Biometric Vault",
  fillPercentage,
  title = "Evidence Vault Storage",
  itemCount,
  securityLevel,
}) => {
  const percentage = fillPercentage ?? Math.round((occupiedLockers / totalLockers) * 100);
  const displayItems = itemCount ?? occupiedLockers;
  const displaySec = securityLevel ?? securityTier;

  return (
    <div className="tactical-card p-5 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-tactical font-medium tracking-wider text-neutral-400 uppercase">
          {title}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
          {percentage}% Full
        </span>
      </div>

      {/* Circular Wave Gauge Container */}
      <div className="relative flex items-center justify-center my-2">
        <div className="w-32 h-32 rounded-full bg-[#10131a] border-2 border-neutral-800 relative overflow-hidden flex flex-col items-center justify-center shadow-[inset_0_4px_16px_rgba(0,0,0,0.85)]">
          {/* Animated Fluid Wave Layer */}
          <div
            className="absolute bottom-0 left-0 w-[200%] h-full bg-gradient-to-t from-amber-500/80 via-amber-400/40 to-transparent transition-all duration-1000"
            style={{
              height: `${percentage}%`,
            }}
          >
            <svg
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              className="absolute top-0 left-0 w-full h-4 -translate-y-full fluid-wave fill-amber-400/60"
            >
              <path d="M0.00,49.98 C150.00,150.00 349.20,-50.00 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" />
            </svg>
          </div>

          {/* Foreground Metrics */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="font-mono-code text-xl font-bold text-white tracking-wider drop-shadow-md">
              {displayItems} <span className="text-xs font-normal text-neutral-300">/ {totalLockers}</span>
            </span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-300 mt-1 bg-black/50 px-2.5 py-0.5 rounded-full border border-neutral-700/60">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
              <span>LOCKERS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="text-center mt-1">
        <span className="text-[11px] font-tactical text-neutral-500 tracking-wider">
          {displaySec}
        </span>
      </div>
    </div>
  );
};
