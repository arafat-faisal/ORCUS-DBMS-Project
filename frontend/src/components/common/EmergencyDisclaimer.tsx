"use client";

import React from "react";
import { useLocale } from "@/lib/locale";
import { AlertTriangle, PhoneCall } from "lucide-react";

export function EmergencyDisclaimer({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();

  if (compact) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 text-xs text-amber-900 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
          <span>
            {locale === "bn"
              ? "জরুরি অভিযোগের জন্য নয়। বাংলাদেশে জরুরি সহায়তায় ৯৯৯ নম্বরে কল করুন।"
              : "Academic prototype — Not for emergency dispatch. Call 999 for emergencies in Bangladesh."}
          </span>
        </div>
        <a
          href="tel:999"
          className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors"
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
      className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md border-t border-b border-r border-amber-200 text-amber-900 mb-4"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <h4 className="font-semibold text-amber-900">
            {locale === "bn" ? "জরুরি সহায়তার জাতীয় সতর্কতা" : "Emergency Assistance Notice"}
          </h4>
          <p className="text-amber-800 text-xs sm:text-sm leading-relaxed">
            {locale === "bn"
              ? "ORCUS একটি একাডেমিক প্রোটোটাইপ। এটি জরুরি অভিযোগ গ্রহণের সরকারি সেবা নয়। বাংলাদেশে জরুরি সহায়তার জন্য ৯৯৯ নম্বরে কল করুন।"
              : "ORCUS is an academic prototype and is not an emergency reporting service. For immediate emergency assistance in Bangladesh, call 999."}
          </p>
        </div>
        <a
          href="tel:999"
          className="ml-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-md shadow-xs transition-colors"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>{locale === "bn" ? "কল ৯৯৯" : "Call 999"}</span>
        </a>
      </div>
    </div>
  );
}
