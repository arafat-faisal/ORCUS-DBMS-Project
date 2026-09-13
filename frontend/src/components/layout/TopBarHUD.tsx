"use client";

import React from "react";
import { Search, Bell, Volume2, VolumeX, ShieldAlert, Plus, UserCircle2 } from "lucide-react";
import { UserProfile, DashboardOverview } from "@/lib/types";

interface TopBarHUDProps {
  user: UserProfile | null;
  overview: DashboardOverview | null;
  onOpenNewCase: () => void;
  onOpenIntake: () => void;
  onOpenAuthModal: () => void;
  soundPlaying: boolean;
  onToggleSound: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const TopBarHUD: React.FC<TopBarHUDProps> = ({
  user,
  overview,
  onOpenNewCase,
  onOpenIntake,
  onOpenAuthModal,
  soundPlaying,
  onToggleSound,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="h-16 px-6 bg-[#0f1117]/90 backdrop-blur-md border-b border-neutral-800/80 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Left: Quick Stat Pills (Directly from Screenshot 2) */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <div className="tactical-glass-pill px-3 py-1 rounded-full flex items-center gap-2 text-xs font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Active Cases:</span>
          <span className="text-white font-bold">{overview?.active_cases_count ?? 8}</span>
        </div>

        <div className="tactical-glass-pill px-3 py-1 rounded-full flex items-center gap-2 text-xs font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Officers:</span>
          <span className="text-white font-bold">{overview?.total_officers_count ?? 12}</span>
        </div>

        <div className="tactical-glass-pill px-3 py-1 rounded-full flex items-center gap-2 text-xs font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Pending FIRs:</span>
          <span className="text-white font-bold">{overview?.pending_firs_count ?? 4}</span>
        </div>

        <div className="tactical-glass-pill px-3 py-1 rounded-full flex items-center gap-2 text-xs font-mono text-neutral-300 hidden lg:flex">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Vault Evidence:</span>
          <span className="text-white font-bold">{overview?.evidence_count ?? 27}</span>
        </div>
      </div>

      {/* Center/Right: Global Search (From Screenshot 2) */}
      <div className="flex items-center gap-3">
        <div className="relative w-48 sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search cases, badge..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#161822] border border-neutral-700/60 rounded-full pl-9 pr-8 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-500 bg-neutral-800 px-1 rounded">
            ⌘K
          </span>
        </div>

        {/* Action Button: Open Case */}
        <button
          onClick={onOpenNewCase}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-tactical font-semibold tracking-wider bg-cyan-500 text-black hover:bg-cyan-400 transition shadow-[0_0_15px_rgba(0,229,255,0.3)]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>OPEN CASE</span>
        </button>

        {/* Ambient Sound Toggle */}
        <button
          onClick={onToggleSound}
          title="Toggle Ambient Audio"
          className={`w-9 h-9 rounded-full border flex items-center justify-center transition ${
            soundPlaying
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/10 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              : "border-neutral-700 text-neutral-400 bg-neutral-800/60 hover:text-white"
          }`}
        >
          {soundPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* User Profile Chip (From Screenshot 2) */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-700 bg-neutral-900/80 hover:border-neutral-600 transition"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-[10px] font-bold text-black">
            {user?.username ? user.username.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="text-left hidden md:block">
            <span className="text-xs font-semibold text-white block leading-none">
              {user?.officer_name || user?.username || "Admin Faisal"}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 block leading-none mt-1">
              {user?.roles?.[0] || "Administrator"}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
