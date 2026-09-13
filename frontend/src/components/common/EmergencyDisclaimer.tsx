"use client";

import React from "react";
import { useLocale } from "@/lib/locale";
import { AlertTriangle, PhoneCall } from "lucide-react";

export function EmergencyDisclaimer({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();

  if (compact) {
    return (
      <div className="bg-amber-950/40 border border-amber-800/50 rounded-md px-3 py-2 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>
            {locale === "bn"
              ? "জরুরি অভিযোগের জন্য নয়। বাংলাদেশে জরুরি সহায়তায় ৯৯৯ নম্বরে কল করুন।"
              : "Academic prototype — Not for emergency dispatch. Call 999 for emergencies in Bangladesh."}
          </span>
        </div>
        <a
          href="tel:999"
          className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white bg-amber-900/60 px-2 py-0.5 rounded transition-colors"
        >
          <PhoneCall className="w-3 h-3" />
          999
        </a>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="bg-amber-950/30 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm mb-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <h4 className="font-semibold text-amber-200">
            {locale === "bn" ? "জরুরি সহায়তার জাতীয় সতর্কতা" : "Emergency Assistance Notice"}
          </h4>
          <p className="text-amber-100/90 leading-relaxed">
            {locale === "bn"
              ? "ORCUS একটি একাডেমিক প্রোটোটাইপ। এটি জরুরি অভিযোগ গ্রহণের সরকারি সেবা নয়। বাংলাদেশে জরুরি সহায়তার জন্য ৯৯৯ নম্বরে কল করুন।"
              : "ORCUS is an academic prototype and is not an emergency reporting service. For immediate emergency assistance in Bangladesh, call 999."}
          </p>
        </div>
        <a
          href="tel:999"
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-md shadow-sm transition-colors"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{locale === "bn" ? "কল ৯৯৯" : "CALL 999"}</span>
        </a>
      </div>
    </div>
  );
}
