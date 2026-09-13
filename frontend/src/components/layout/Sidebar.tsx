"use client";

import React from "react";
import {
  LayoutDashboard,
  FolderLock,
  FilePlus,
  Users,
  Package,
  Building2,
  Shield,
  LogOut,
  Sparkles,
} from "lucide-react";

export type NavTab = "dashboard" | "cases" | "intake" | "participants" | "evidence" | "agency";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenGate: () => void;
  onLogout: () => void;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenGate,
  onLogout,
  userRole,
}) => {
  const navItems = [
    { id: "dashboard" as NavTab, label: "Operations Dashboard", icon: LayoutDashboard },
    { id: "cases" as NavTab, label: "Case Central & Dossiers", icon: FolderLock },
    { id: "intake" as NavTab, label: "Intake (GD & FIR)", icon: FilePlus },
    { id: "participants" as NavTab, label: "Suspects & Participants", icon: Users },
    { id: "evidence" as NavTab, label: "Evidence & Chain of Custody", icon: Package },
    { id: "agency" as NavTab, label: "Agency Branches & Roster", icon: Building2 },
  ];

  return (
    <aside className="w-16 md:w-20 bg-[#0d0f14] border-r border-neutral-800/80 flex flex-col items-center justify-between py-6 select-none z-30 shrink-0">
      {/* Top Logo / Brand Icon */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={onOpenGate}
          title="Return to Splash Water-Ripple Gate"
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 hover:scale-110 hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all"
        >
          <Shield className="w-6 h-6" />
        </button>

        {/* Navigation Buttons */}
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 group relative ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,229,255,0.2)]"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />

                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute -left-3 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_8px_#00e5ff]" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        {/* Return to intro splash */}
        <button
          onClick={onOpenGate}
          title="Open Water-Ripple Screen"
          className="w-10 h-10 rounded-xl text-neutral-400 hover:text-cyan-300 hover:bg-neutral-800/80 flex items-center justify-center transition"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Logout button */}
        <button
          onClick={onLogout}
          title="Sign Out / Switch Demo Profile"
          className="w-10 h-10 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-800/80 flex items-center justify-center transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
