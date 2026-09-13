"use client";

import React from "react";
import { useLocale } from "@/lib/locale";
import { Globe } from "lucide-react";

export function LanguageSelector({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div className={`inline-flex items-center rounded-lg bg-slate-800/80 p-1 border border-slate-700/60 shadow-sm text-xs font-medium ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1.5" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "en"
            ? "bg-emerald-600 text-white font-semibold shadow-xs"
            : "text-slate-300 hover:text-white hover:bg-slate-700/50"
        }`}
        aria-pressed={locale === "en"}
        aria-label="Switch language to English"
      >
        English
      </button>
      <button
        type="button"
        onClick={() => setLocale("bn")}
        className={`px-2 py-1 rounded transition-colors ${
          locale === "bn"
            ? "bg-emerald-600 text-white font-semibold shadow-xs font-bangla"
            : "text-slate-300 hover:text-white hover:bg-slate-700/50 font-bangla"
        }`}
        aria-pressed={locale === "bn"}
        aria-label="বাংলা ভাষায় পরিবর্তন করুন"
      >
        বাংলা
      </button>
    </div>
  );
}
