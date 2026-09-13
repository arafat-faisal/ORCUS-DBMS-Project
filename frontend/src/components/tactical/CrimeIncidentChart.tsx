"use client";

import React from "react";
import { TrendingUp, RefreshCw, ShieldAlert } from "lucide-react";

export const CrimeIncidentChart: React.FC = () => {
  return (
    <div className="tactical-card p-5 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-tactical text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <span>WEEKLY CRIME INTAKE &amp; CLEARANCE TREND</span>
          </h4>
          <p className="font-mono-code text-xs text-neutral-400 mt-0.5">
            Registered FIRs vs active investigation closures
          </p>
        </div>

        <button className="w-7 h-7 rounded-lg bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center text-neutral-400 hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Purple Wave Area Graph (Faithfully Preserving the Screenshot 1 Color & Style) */}
      <div className="relative my-3 w-full h-36">
        <svg viewBox="0 0 500 160" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            {/* Purple Fill Gradient */}
            <linearGradient id="incidentPurpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7059e2" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#5b45d6" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2e1065" stopOpacity="0.05" />
            </linearGradient>

            {/* Glowing Stroke Filter */}
            <filter id="purpleIncidentGlow">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="20" x2="500" y2="20" stroke="#1f232d" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="65" x2="500" y2="65" stroke="#1f232d" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="0" y1="110" x2="500" y2="110" stroke="#1f232d" strokeWidth="1" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path
            d="
              M 0 160
              L 0 55
              Q 35 30, 70 70
              T 140 40
              T 210 80
              T 280 45
              T 350 75
              T 420 50
              T 500 40
              L 500 160
              Z
            "
            fill="url(#incidentPurpleGrad)"
          />

          {/* Top Glowing Wave Line */}
          <path
            d="
              M 0 55
              Q 35 30, 70 70
              T 140 40
              T 210 80
              T 280 45
              T 350 75
              T 420 50
              T 500 40
            "
            fill="none"
            stroke="#a78bfa"
            strokeWidth="2.5"
            filter="url(#purpleIncidentGlow)"
          />
        </svg>

        {/* Floating Stat Indicator */}
        <div className="absolute top-2 left-6 px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-500/40 text-[11px] font-mono text-purple-300 flex items-center gap-1.5 shadow-md">
          <TrendingUp className="w-3 h-3" />
          <span>89.2% Forensic Resolution Peak</span>
        </div>
      </div>

      {/* Weekday Axis */}
      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 border-t border-neutral-800/80 pt-2 px-1">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </div>
  );
};
