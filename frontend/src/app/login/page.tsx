"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

import { useLocale } from "@/lib/locale";

export default function LoginPage() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const lang = locale;
  const setLang = setLocale;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = {
    en: {
      systemTitle: "ORCUS",
      subtitle: "Organized Crime Understanding System",
      portalBadge: "Authorized Personnel Access",
      prototypeNotice: "Academic Prototype for demonstration purposes only. Does not connect to real law enforcement or government databases.",
      emergencyNotice: "ORCUS is an academic prototype and is not an emergency reporting service. For immediate emergency assistance in Bangladesh, call 999.",
      usernameLabel: "Official Username",
      usernamePlaceholder: "Enter your official username",
      passwordLabel: "Password",
      passwordPlaceholder: "Enter your password",
      showPassword: "Show",
      hidePassword: "Hide",
      signInBtn: "Sign In to Investigation Portal",
      signingIn: "Verifying Credentials...",
      switchLang: "বাংলায় দেখুন",
      genericError: "Invalid username or password. Please verify your credentials.",
      rateLimitError: "Too many failed attempts. For security reasons, please wait 15 minutes before retrying.",
      accountDisabled: "This account has been deactivated. Please contact your system administrator.",
    },
    bn: {
      systemTitle: "অরকাস (ORCUS)",
      subtitle: "সংগঠিত অপরাধ বিশ্লেষণ ও তদন্ত ব্যবস্থাপনা ব্যবস্থা",
      portalBadge: "অনুমোদিত কর্মকর্তা প্রবেশদ্বার",
      prototypeNotice: "এটি একটি একাডেমিক প্রোটোটাইপ। এটি কোনো বাস্তব আইন প্রয়োগকারী বা সরকারি ডাটাবেসের সাথে সংযুক্ত নয়।",
      emergencyNotice: "ORCUS একটি একাডেমিক প্রোটোটাইপ। এটি জরুরি অভিযোগ গ্রহণের সরকারি সেবা নয়। বাংলাদেশে জরুরি সহায়তার জন্য ৯৯৯ নম্বরে কল করুন।",
      usernameLabel: "অফিসিয়াল ব্যবহারকারী নাম (ইউজারনেম)",
      usernamePlaceholder: "আপনার ইউজারনেম লিখুন",
      passwordLabel: "পাসওয়ার্ড",
      passwordPlaceholder: "আপনার পাসওয়ার্ড লিখুন",
      showPassword: "দেখান",
      hidePassword: "লুকান",
      signInBtn: "তদন্ত পোর্টালে প্রবেশ করুন",
      signingIn: "যাচাই করা হচ্ছে...",
      switchLang: "View in English",
      genericError: "ভুল ব্যবহারকারীর নাম অথবা পাসওয়ার্ড। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      rateLimitError: "একাধিকবার ভুল তথ্য প্রদান করা হয়েছে। নিরাপত্তার স্বার্থে ১৫ মিনিট পর চেষ্টা করুন।",
      accountDisabled: "এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। অনুগ্রহ করে সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।",
    },
  }[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg(lang === "bn" ? "ব্যবহারকারীর নাম ও পাসওয়ার্ড উভয়ই আবশ্যক।" : "Both username and password are required.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.login(username.trim(), password);
      if (res.success && res.data) {
        router.push("/");
      } else {
        const err = res.error?.toLowerCase() || "";
        if (err.includes("too many") || err.includes("rate limit") || err.includes("throttled")) {
          setErrorMsg(t.rateLimitError);
        } else if (err.includes("inactive") || err.includes("disabled")) {
          setErrorMsg(t.accountDisabled);
        } else {
          setErrorMsg(t.genericError);
        }
      }
    } catch {
      setErrorMsg(t.genericError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* Top Bar with Language Toggle & Prototype Flag */}
      <header className="border-b border-slate-800/80 bg-[#0f1422]/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold tracking-wider text-sm">
            OS
          </div>
          <div>
            <span className="font-bold text-sm tracking-wide text-white">{t.systemTitle}</span>
            <span className="hidden md:inline-block ml-2 text-xs text-slate-400 border-l border-slate-700 pl-2">
              {t.subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium hidden sm:inline-block">
            {lang === "bn" ? "একাডেমিক সংস্করণ" : "Academic Prototype"}
          </span>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {t.switchLang}
          </button>
        </div>
      </header>

      {/* Main Login Card Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-[#131926] border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle Top Accent Border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

          {/* Badge & Header */}
          <div className="mb-6 text-center">
            <span className="inline-block text-[11px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              {t.portalBadge}
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t.systemTitle}
            </h1>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {t.subtitle}
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5"
            >
              <svg
                className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                {t.usernameLabel}
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.usernamePlaceholder}
                  className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-slate-300"
                >
                  {t.passwordLabel}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t.hidePassword : t.showPassword}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors focus:outline-none"
                >
                  {showPassword ? t.hidePassword : t.showPassword}
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className="w-full bg-[#0b0f17] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-black bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#131926]"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-black"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  <span>{t.signingIn}</span>
                </>
              ) : (
                <span>{t.signInBtn}</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Picker for Academic Presentation */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-2 font-semibold">
              Academic Demonstration Roles (Click to Fill):
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setUsername("insp_tariq");
                  setPassword("Tariq@Invest2026!");
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-200">Officer-in-Charge</div>
                <div className="text-[10px] font-mono text-cyan-400">insp_tariq</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("si_nusrat");
                  setPassword("Nusrat@Duty2026!");
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-200">Duty Officer</div>
                <div className="text-[10px] font-mono text-emerald-400">si_nusrat</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("det_shakil");
                  setPassword("Shakil@Invest2026!");
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-200">Investigating Officer</div>
                <div className="text-[10px] font-mono text-blue-400">det_shakil</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("forensic_liza");
                  setPassword("Liza@Forensic2026!");
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-200">Evidence Officer</div>
                <div className="text-[10px] font-mono text-amber-400">forensic_liza</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("system_auditor");
                  setPassword("Auditor@Audit2026!");
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-200">System Auditor</div>
                <div className="text-[10px] font-mono text-purple-400">system_auditor</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUsername("admin_faisal");
                  setPassword("Faisal@Admin2026!");
                }}
                className="p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/50 text-left transition-colors"
              >
                <div className="font-semibold text-slate-200">Administrator</div>
                <div className="text-[10px] font-mono text-rose-400">admin_faisal</div>
              </button>
            </div>
          </div>

          {/* Academic Prototype Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 leading-relaxed">
            <p>{t.prototypeNotice}</p>
          </div>
        </div>
      </main>

      {/* Emergency Notice Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0f1422]/90 px-6 py-3 text-center text-xs text-amber-300/90 font-medium">
        {t.emergencyNotice}
      </footer>
    </div>
  );
}
