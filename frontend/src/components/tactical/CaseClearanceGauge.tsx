"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface CaseClearanceGaugeProps {
  rate?: number;
  clearanceRate?: number; // 0 - 100%
  totalResolved?: number;
  totalCases?: number;
  label?: string;
  sublabel?: string;
  statusText?: string;
}

export const CaseClearanceGauge: React.FC<CaseClearanceGaugeProps> = ({
  rate,
  clearanceRate = 86,
  totalResolved = 12,
  totalCases = 14,
  label = "Case Clearance Efficiency",
  sublabel = "Conviction Ratio",
  statusText = "Target Exceeded",
}) => {
  const effectiveRate = rate ?? clearanceRate;
  // Angle range: -135deg to +135deg (total 270deg)
  const normalizedValue = Math.min(Math.max(effectiveRate, 0), 100);
  const percentage = normalizedValue / 100;
  const angle = -135 + percentage * 270;

  return (
    <div className="tactical-card p-5 flex flex-col justify-between relative overflow-hidden h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-tactical font-medium tracking-wider text-neutral-400 uppercase">
          {label}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {statusText}
        </span>
      </div>

      {/* SVG Circular Clearance Dial */}
      <div className="relative flex items-center justify-center my-2">
        <svg viewBox="0 0 200 160" className="w-44 h-36">
          <defs>
            {/* Gradient Arc: Amber -> Cyan -> Emerald */}
            <linearGradient id="clearanceGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#00e5ff" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            <filter id="gaugeGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d="M 35 130 A 70 70 0 1 1 165 130"
            fill="none"
            stroke="#1c202a"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Active Gradient Arc */}
          <path
            d="M 35 130 A 70 70 0 1 1 165 130"
            fill="none"
            stroke="url(#clearanceGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray="275"
            strokeDashoffset={275 - 275 * percentage}
            filter="url(#gaugeGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Center Hub */}
          <circle cx="100" cy="115" r="8" fill="#141720" stroke="#374151" strokeWidth="2" />
          <circle cx="100" cy="115" r="3" fill="#00e5ff" />

          {/* Indicator Needle */}
          <g
            style={{
              transformOrigin: "100px 115px",
              transform: `rotate(${angle}deg)`,
              transition: "transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <polygon points="98,115 102,115 100,52" fill="#ffffff" filter="drop-shadow(0 0 4px #00e5ff)" />
          </g>

          {/* Tick Labels */}
          <text x="35" y="148" fill="#6b7280" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            0%
          </text>
          <text x="50" y="70" fill="#6b7280" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            25%
          </text>
          <text x="100" y="40" fill="#6b7280" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            50%
          </text>
          <text x="150" y="70" fill="#6b7280" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            75%
          </text>
          <text x="165" y="148" fill="#6b7280" fontSize="9" fontFamily="JetBrains Mono" textAnchor="middle">
            100%
          </text>
        </svg>

        {/* Digital Readout */}
        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="font-mono-code text-xl font-bold text-white tracking-wider">
            {clearanceRate}%
          </span>
        </div>
      </div>

      {/* Subtext */}
      <div className="text-center mt-1 flex items-center justify-center gap-1.5 text-[11px] font-mono text-neutral-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>{totalResolved} of {totalCases} Cases Successfully Solved</span>
      </div>
    </div>
  );
};
