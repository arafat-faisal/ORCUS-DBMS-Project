"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, ArrowLeft, ShieldCheck, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLocale } from "@/lib/locale";
import { LanguageSelector } from "@/components/common/LanguageSelector";

export default function LoginPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberUsername, setRememberUsername] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("orcus_remembered_username");
    if (saved) {
      setUsername(saved);
      setRememberUsername(true);
    }
  }, []);

  const performLogin = async (userToLogin: string, passToLogin: string) => {
    if (!userToLogin.trim() || !passToLogin) {
      setErrorMsg(
        locale === "bn"
          ? "ব্যবহারকারীর নাম এবং পাসওয়ার্ড উভয়ই প্রদান করুন।"
          : "Please enter both your username and password."
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.login(userToLogin.trim(), passToLogin);
      if (res.success && res.data) {
        if (rememberUsername) {
          localStorage.setItem("orcus_remembered_username", userToLogin.trim());
        } else {
          localStorage.removeItem("orcus_remembered_username");
        }
        if (typeof window !== "undefined") {
          window.location.href = "/dashboard";
        } else {
          router.push("/dashboard");
        }
      } else {
        const err = res.error?.toLowerCase() || "";
        if (err.includes("rate limit") || err.includes("too many") || err.includes("throttled")) {
          setErrorMsg(
            locale === "bn"
              ? "অতিরিক্ত ব্যর্থ প্রচেষ্টা। নিরাপত্তার জন্য কিছুক্ষণ পর চেষ্টা করুন।"
              : "Too many failed attempts. For security reasons, please wait before retrying."
          );
        } else if (err.includes("inactive") || err.includes("disabled") || err.includes("deactivated")) {
          setErrorMsg(
            locale === "bn"
              ? "অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে। সিস্টেম প্রশাসকের সাথে যোগাযোগ করুন।"
              : "This account is inactive or disabled. Please contact your system administrator."
          );
        } else {
          setErrorMsg(
            locale === "bn"
              ? "ব্যবহারকারীর নাম বা পাসওয়ার্ড সঠিক নয়। পুনরায় চেষ্টা করুন।"
              : "Invalid username or password. Please verify your credentials."
          );
        }
      }
    } catch {
      setErrorMsg(
        locale === "bn"
          ? "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। পুনরায় চেষ্টা করুন।"
          : "Could not connect to the authentication service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{locale === "bn" ? "মূল পাতায় ফিরুন" : "Back to Public Home"}</span>
          </Link>
          <LanguageSelector />
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-700 text-white rounded-lg flex items-center justify-center font-bold text-lg mx-auto mb-3">
              OR
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ORCUS</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 mt-1">
              {locale === "bn" ? "তদন্ত ও কর্মকর্তা পোর্টাল" : "Officer Portal"}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              {locale === "bn"
                ? "অনুমোদিত কর্মকর্তাদের জন্য প্রাতিষ্ঠানিক ডেটাবেস লগইন"
                : "Authorized institutional access for database evaluation"}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {locale === "bn" ? "ব্যবহারকারীর নাম (Username)" : "Username"}
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={locale === "bn" ? "ইউজারনেম লিখুন" : "Enter officer username"}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  {locale === "bn" ? "পাসওয়ার্ড (Password)" : "Password"}
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "লুকান" : "Hide"}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{locale === "bn" ? "দেখান" : "Show"}</span>
                    </>
                  )}
                </button>
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={locale === "bn" ? "পাসওয়ার্ড দিন" : "Enter password"}
                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberUsername}
                  onChange={(e) => setRememberUsername(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600">
                  {locale === "bn" ? "ইউজারনেম মনে রাখুন" : "Remember username"}
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-md font-semibold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-xs"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{locale === "bn" ? "যাচাই করা হচ্ছে..." : "Signing In..."}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{locale === "bn" ? "প্রবেশ করুন" : "Sign In to Portal"}</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Academic Evaluation */}
          <div className="mt-5 pt-4 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>{locale === "bn" ? "ডেমো অ্যাকাউন্ট নির্বাচন করুন (১-ক্লিকে তাৎক্ষণিক লগইন):" : "Quick Demo Accounts (1-Click Instant Login):"}</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 font-mono px-1.5 py-0.5 rounded border border-blue-200">Auto-Login</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-left">
              {[
                { name: "admin_faisal", role: "Administrator", pass: "OrcusAdmin#2026", label: "Admin (Faisal)" },
                { name: "det_shakil", role: "Investigating Officer", pass: "OrcusShakil#2026", label: "Lead Det. (Shakil)" },
                { name: "si_nusrat", role: "Duty Officer", pass: "OrcusNusrat#2026", label: "Duty Off. (Nusrat)" },
                { name: "forensic_liza", role: "Evidence Officer", pass: "OrcusLiza#2026", label: "Forensic (Liza)" },
                { name: "insp_tariq", role: "Officer-in-Charge", pass: "OrcusTariq#2026", label: "Inspector (Tariq)" },
                { name: "system_auditor", role: "System Auditor", pass: "OrcusAudit#2026", label: "System Auditor" },
              ].map((acc) => (
                <button
                  key={acc.name}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setUsername(acc.name);
                    setPassword(acc.pass);
                    performLogin(acc.name, acc.pass);
                  }}
                  className="p-1.5 rounded border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50 text-left transition group disabled:opacity-50"
                  title="Click to instantly fill and sign in"
                >
                  <div className="text-[11px] font-semibold text-slate-800 group-hover:text-blue-700 truncate flex items-center justify-between">
                    <span>{acc.label}</span>
                    <span className="text-[9px] text-blue-600 font-mono font-normal">➔</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {acc.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Academic Prototype Notice */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-slate-500 leading-relaxed">
            <p>
              {locale === "bn"
                ? "একাডেমিক ডাটাবেস মূল্যায়ন প্রোটোটাইপ। এটি কোনো বাস্তব আইন প্রয়োগকারী ব্যবস্থার সাথে সংযুক্ত নয়।"
                : "Academic database management prototype for course demonstration. Fictional investigation data only."}
            </p>
          </div>
        </div>
      </main>

      {/* Emergency Notice Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 py-2.5 text-center text-xs text-slate-500">
        <span>
          {locale === "bn"
            ? "বাংলাদেশে তাৎক্ষণিক জরুরি সহায়তার জন্য ৯৯৯ নম্বরে কল করুন।"
            : "For immediate emergency assistance in Bangladesh, call 999."}
        </span>
      </footer>
    </div>
  );
}
