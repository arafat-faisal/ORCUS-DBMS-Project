"use client";

import React from "react";
import { Star, ShieldAlert, BadgeCheck, Briefcase } from "lucide-react";
import { Officer } from "@/lib/types";

interface OfficerDossierCardProps {
  officer: {
    name: string;
    badge_no: string;
    rank: string;
    branch_name: string;
    active_cases: number;
    closed_cases: number;
    rating?: number;
    status?: string;
  };
}

export const OfficerDossierCard: React.FC<OfficerDossierCardProps> = ({
  officer,
}) => {
  return (
    <div className="tactical-card p-4 flex flex-col justify-between">
      {/* Top Header Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar / Badge Icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-brand font-bold text-sm shadow-[0_0_15px_rgba(0,229,255,0.15)]">
            {officer.name.charAt(0)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-tactical font-semibold text-sm text-white">
                {officer.name}
              </h4>
              <BadgeCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <p className="font-mono-code text-[11px] text-neutral-400">
              {officer.rank} &bull; {officer.badge_no}
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          {officer.status || "On Duty"}
        </span>
      </div>

      {/* Metrics Row (Screenshot 1 Style) */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-800/80">
        <div>
          <span className="text-[10px] font-tactical text-neutral-500 uppercase tracking-wider block">
            Active Cases
          </span>
          <span className="font-mono-code text-sm font-semibold text-neutral-200">
            {officer.active_cases}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-tactical text-neutral-500 uppercase tracking-wider block">
            Solved
          </span>
          <span className="font-mono-code text-sm font-semibold text-emerald-400">
            {officer.closed_cases}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-tactical text-neutral-500 uppercase tracking-wider block">
            Efficiency
          </span>
          <span className="inline-flex items-center gap-1 font-mono-code text-sm font-semibold text-amber-400">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            {officer.rating || "4.9"}
          </span>
        </div>
      </div>
    </div>
  );
};
