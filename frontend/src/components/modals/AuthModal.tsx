"use client";

import React, { useState } from "react";
import { X, ShieldCheck, UserCheck, KeyRound, Check } from "lucide-react";
import { UserProfile } from "@/lib/types";

interface AuthModalProps {
  currentUser: UserProfile | null;
  onClose: () => void;
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const DEMO_ACCOUNTS = [
  { username: "admin_faisal", role: "Administrator & Lead Investigator", desc: "Chief Inspector Arafat Faisal (Full RBAC)", badge: "ORC-1001" },
  { username: "det_shakil", role: "Lead Investigator & Detective", desc: "Senior Detective Shakil Hossain", badge: "ORC-1002" },
  { username: "forensic_liza", role: "Forensic Specialist", desc: "Forensic Lead Ayshee Liza (Evidence Admin)", badge: "ORC-1003" },
  { username: "insp_tariq", role: "Lead Investigator", desc: "Inspector Tariq Ahmed (Regional Chittagong)", badge: "ORC-2001" },
  { username: "system_auditor", role: "System Auditor", desc: "Read-only access across all records", badge: "AUDIT" },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onClose,
  onLogin,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ok = await onLogin(username, password);
      if (ok) onClose();
      else setError("Invalid credentials or server rejected login");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = async (uname: string) => {
    setLoading(true);
    setError(null);
    try {
      const ok = await onLogin(uname, "password123");
      if (ok) onClose();
      else setError("Failed to switch demo account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#11131a] border border-neutral-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="font-tactical text-base font-bold text-white tracking-wide">
              INVESTIGATOR AUTHENTICATION
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400">
            {error}
          </div>
        )}

        {/* Quick Demo Switcher (1-Click) */}
        <div className="mt-4">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block mb-2">
            1-Click Demo Profiles (DBMS Presentation)
          </span>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = currentUser?.username === acc.username;
              return (
                <div
                  key={acc.username}
                  onClick={() => handleQuickSwitch(acc.username)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition ${
                    isCurrent
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-[#161822] border-neutral-800/80 hover:border-neutral-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code text-xs font-bold text-white">
                        {acc.username}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-800 text-neutral-300">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-tactical text-neutral-400 mt-0.5">{acc.desc}</p>
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-neutral-500 hover:text-cyan-300">
                      SWITCH
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Credentials Form */}
        <form onSubmit={handleCustomLogin} className="mt-6 pt-4 border-t border-neutral-800 space-y-3">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
            Or Sign In with Custom Credentials
          </span>

          <input
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
          />

          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#191c26] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold tracking-wider hover:bg-cyan-400 transition"
          >
            {loading ? "AUTHENTICATING..." : "VERIFY CREDENTIALS &amp; LOGIN"}
          </button>
        </form>
      </div>
    </div>
  );
};
