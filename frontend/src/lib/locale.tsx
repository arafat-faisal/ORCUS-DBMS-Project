"use client";

import React, { createContext, useContext, useState } from "react";

export type Locale = "en" | "bn";

// Bengali numeral map
const bnNumerals: { [key: string]: string } = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Brand & System
    system_name: "ORCUS",
    system_subtitle: "Investigation Management & Case Tracking System",
    academic_disclaimer: "Academic DBMS Prototype — Fictional Demonstration Data Only",
    emergency_notice: "ORCUS is an academic prototype and is not an emergency reporting service. For immediate emergency assistance in Bangladesh, call 999.",

    // Navigation
    nav_dashboard: "Dashboard",
    nav_complaints: "Complaints Intake",
    nav_gd: "General Diary (GD)",
    nav_fir: "FIR Registration",
    nav_cases: "Investigation Cases",
    nav_participants: "Participants",
    nav_evidence: "Evidence & Custody",
    nav_search: "Global Search",
    nav_reports: "Reports & Dossiers",
    nav_audit_logs: "System Audit Logs",
    nav_branches: "Branches",
    nav_users: "User Governance",
    nav_logout: "Sign Out",

    // Common Actions
    action_submit: "Submit",
    action_cancel: "Cancel",
    action_save: "Save Changes",
    action_filter: "Filter",
    action_reset: "Reset",
    action_search: "Search",
    action_details: "View Details",
    action_history: "Audit History",
    action_print: "Print Dossier",
    action_export: "Export CSV",
    action_register: "Register New",
    action_track: "Track Progress",

    // Statuses
    status_draft: "Draft",
    status_submitted: "Submitted",
    status_under_review: "Under Review",
    status_correction_required: "Correction Required",
    status_verified: "Verified",
    status_approved: "Approved",
    status_converted_gd: "Converted to GD",
    status_converted_fir: "Converted to FIR",
    status_transferred: "Transferred",
    status_rejected: "Rejected",
    status_resolved: "Resolved",
    status_closed: "Closed",
    status_open: "Open",
    status_under_investigation: "Under Investigation",
    status_awaiting_info: "Awaiting Information",
    status_evidence_exam: "Evidence Examination",
    status_supervisor_review: "Supervisor Review",
    status_sealed: "Sealed",
    status_in_storage: "Received in Storage",

    // Roles
    role_admin: "Administrator",
    role_duty_officer: "Duty Officer",
    role_oic: "Officer-in-Charge",
    role_investigator: "Investigating Officer",
    role_evidence_officer: "Evidence Officer",
    role_supervisor: "Supervising Officer",
    role_auditor: "System Auditor",
    role_public: "Public Complainant",
  },
  bn: {
    // Brand & System
    system_name: "ওরকাস (ORCUS)",
    system_subtitle: "তদন্ত ব্যবস্থাপনা ও মামলা ট্র্যাকিং সিস্টেম",
    academic_disclaimer: "একাডেমিক ডিবিএমএস প্রোটোটাইপ — শুধুমাত্র কাল্পনিক প্রদর্শনী তথ্য",
    emergency_notice: "ORCUS একটি একাডেমিক প্রোটোটাইপ। এটি জরুরি অভিযোগ গ্রহণের সরকারি সেবা নয়। বাংলাদেশে জরুরি সহায়তার জন্য ৯৯৯ নম্বরে কল করুন।",

    // Navigation
    nav_dashboard: "ড্যাশবোর্ড",
    nav_complaints: "অভিযোগ গ্রহণ",
    nav_gd: "সাধারণ ডায়েরি (জিডি)",
    nav_fir: "প্রাথমিক তথ্য বিবরণী (এফআইআর)",
    nav_cases: "তদন্ত মামলাসমূহ",
    nav_participants: "সংশ্লিষ্ট ব্যক্তিবর্গ",
    nav_evidence: "আলামত ও হেফাজত",
    nav_search: "সমন্বিত অনুসন্ধান",
    nav_reports: "প্রতিবেদন ও ডসিয়ার",
    nav_audit_logs: "সিস্টেম নিরীক্ষা লগ",
    nav_branches: "শাখা ব্যবস্থাপনা",
    nav_users: "ব্যবহারকারী পরিচালনা",
    nav_logout: "প্রস্থান",

    // Common Actions
    action_submit: "দাখিল করুন",
    action_cancel: "বাতিল",
    action_save: "সংরক্ষণ করুন",
    action_filter: "ফিল্টার",
    action_reset: "রিসেট",
    action_search: "অনুসন্ধান",
    action_details: "বিস্তারিত দেখুন",
    action_history: "নিরীক্ষা ইতিহাস",
    action_print: "মুদ্রণ করুন",
    action_export: "সিএসভি ডাউনলোড",
    action_register: "নতুন নিবন্ধন",
    action_track: "অবস্থা যাচাই",

    // Statuses
    status_draft: "খসড়া",
    status_submitted: "দাখিলকৃত",
    status_under_review: "পর্যালোচনায়",
    status_correction_required: "সংশোধন প্রয়োজন",
    status_verified: "যাচাইকৃত",
    status_approved: "অনুমোদিত",
    status_converted_gd: "জিডিতে রূপান্তরিত",
    status_converted_fir: "এফআইআরে রূপান্তরিত",
    status_transferred: "হস্তান্তরিত",
    status_rejected: "প্রত্যাখ্যাত",
    status_resolved: "নিষ্পত্তিকৃত",
    status_closed: "সমাপ্ত",
    status_open: "উন্মুক্ত",
    status_under_investigation: "তদন্তাধীন",
    status_awaiting_info: "তথ্যের অপেক্ষায়",
    status_evidence_exam: "আলামত পরীক্ষা",
    status_supervisor_review: "তত্ত্বাবধায়ক পর্যালোচনা",
    status_sealed: "সিলগালাকৃত",
    status_in_storage: "হেফাজতে সংরক্ষিত",

    // Roles
    role_admin: "প্রশাসক (Administrator)",
    role_duty_officer: "ডিউটি অফিসার (Duty Officer)",
    role_oic: "অফিসার ইনচার্জ (OIC)",
    role_investigator: "তদন্তকারী কর্মকর্তা (IO)",
    role_evidence_officer: "আলামত কর্মকর্তা (Evidence Officer)",
    role_supervisor: "তত্ত্বাবধায়ক কর্মকর্তা (Supervisor)",
    role_auditor: "সিস্টেম অডিটর (Auditor)",
    role_public: "সাধারণ অভিযোগকারী (Complainant)",
  },
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: (key: string, fallback?: string) => string;
  formatNumber: (value: number | string) => string;
  formatDate: (dateStr: string | Date | null | undefined) => string;
  formatDateTime: (dateStr: string | Date | null | undefined) => string;
  formatMobile: (phoneStr: string) => string;
  maskDocument: (docType: string, docNumber: string) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orcus_locale");
      if (saved === "en" || saved === "bn") {
        return saved;
      }
    }
    return "en";
  });

  const setLocale = (loc: Locale) => {
    setLocaleState(loc);
    localStorage.setItem("orcus_locale", loc);
    document.documentElement.lang = loc;
  };

  const t = (key: string, fallback?: string): string => {
    return translations[locale][key] || fallback || key;
  };

  const formatNumber = (value: number | string): string => {
    const str = String(value);
    if (locale !== "bn") return str;
    return str.replace(/[0-9]/g, (w) => bnNumerals[w] || w);
  };

  const formatDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return "—";
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return String(dateInput);

    // Format in Asia/Dhaka timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const formatted = new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-GB", options).format(date);
    return formatted;
  };

  const formatMobile = (phoneStr: string): string => {
    if (!phoneStr) return "—";
    const cleaned = phoneStr.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("01")) {
      return `+880 ${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
    }
    if (cleaned.length === 13 && cleaned.startsWith("8801")) {
      return `+880 ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phoneStr;
  };

  const maskDocument = (docType: string, docNumber: string): string => {
    if (!docNumber) return "—";
    const trimmed = docNumber.trim();
    if (trimmed.length <= 4) return "••••";
    const last4 = trimmed.slice(-4);
    return `${docType}-••••••••${last4}`;
  };

  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatNumber,
        formatDate,
        formatDateTime: formatDate,
        formatMobile,
        maskDocument,
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    // Safe fallback if used outside provider
    return {
      locale: "en",
      setLocale: () => {},
      t: (k: string, f?: string) => f || k,
      formatNumber: (v: number | string) => String(v),
      formatDate: (d: string | Date | null | undefined) => (d ? String(d) : "—"),
      formatDateTime: (d: string | Date | null | undefined) => (d ? String(d) : "—"),
      formatMobile: (p: string) => p,
      maskDocument: (t: string, d: string) => (d ? `${t}-••••${d.slice(-4)}` : "—"),
    };
  }
  return context;
}
