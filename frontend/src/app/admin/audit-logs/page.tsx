"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuditLog, Pagination, UserProfile } from "@/lib/types";

export default function AuditLogsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Filter and Data state
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const t = {
    en: {
      title: "System Audit & Compliance Registry",
      subtitle: "Immutable, append-oriented audit record of system operations, authentication events, and administrative actions.",
      unauthorizedTitle: "403 - Access Denied",
      unauthorizedDesc: "Access to the Security & Audit Registry is restricted strictly to System Administrators and Certified System Auditors.",
      backToDashboard: "Return to Dashboard",
      searchPlaceholder: "Search by Entity ID, Route, or Username...",
      filterAllEvents: "All Event Types",
      filterAllResults: "All Results",
      fromDateLabel: "From Date",
      toDateLabel: "To Date",
      applyFilters: "Apply Filters",
      resetFilters: "Reset",
      timestamp: "Timestamp (Asia/Dhaka)",
      requestId: "Request ID",
      user: "User / Actor",
      event: "Event & Action",
      entity: "Entity Target",
      route: "Endpoint & Method",
      result: "Result",
      details: "Inspection",
      noLogs: "No audit logs match the specified search and filter criteria.",
      pageOf: (p: number, total: number) => `Page ${p} of ${total}`,
      totalRecords: (total: number) => `Total ${total} recorded events`,
      previous: "Previous",
      next: "Next",
      switchLang: "বাংলায় দেখুন",
      anonymous: "Anonymous / Pre-Auth",
    },
    bn: {
      title: "সিস্টেম অডিট ও কমপ্লায়েন্স রেজিস্ট্রি",
      subtitle: "সিস্টেম অপারেশন, প্রমাণীকরণ এবং প্রশাসনিক কার্যক্রমের অপরিবর্তনযোগ্য অডিট লগ।",
      unauthorizedTitle: "৪০৩ - প্রবেশাধিকার প্রত্যাখ্যাত",
      unauthorizedDesc: "নিরাপত্তা ও অডিট রেজিস্ট্রি শুধুমাত্র সিস্টেম অ্যাডমিনিস্ট্রেটর এবং সিস্টেম অডিটরদের জন্য সংরক্ষিত।",
      backToDashboard: "ড্যাশবোর্ডে ফিরে যান",
      searchPlaceholder: "এনটিটি আইডি, রুট অথবা ইউজারনেম দিয়ে অনুসন্ধান করুন...",
      filterAllEvents: "সকল ইভেন্ট টাইপ",
      filterAllResults: "সকল ফলাফল",
      fromDateLabel: "শুরুর তারিখ",
      toDateLabel: "শেষ তারিখ",
      applyFilters: "ফিল্টার প্রয়োগ করুন",
      resetFilters: "রিসেট",
      timestamp: "সময় (এশিয়া/ঢাকা)",
      requestId: "রিকোয়েস্ট আইডি",
      user: "ব্যবহারকারী / কর্মকর্তা",
      event: "ইভেন্ট ও অ্যাকশন",
      entity: "টার্গেট এনটিটি",
      route: "এন্ডপয়েন্ট ও মেথড",
      result: "ফলাফল",
      details: "বিবরণ",
      noLogs: "নির্দিষ্ট অনুসন্ধানের সাথে কোনো অডিট রেকর্ড পাওয়া যায়নি।",
      pageOf: (p: number, total: number) => `পৃষ্ঠা ${p} / ${total}`,
      totalRecords: (total: number) => `মোট ${total}টি সংরক্ষিত ইভেন্ট`,
      previous: "পূর্ববর্তী",
      next: "পরবর্তী",
      switchLang: "View in English",
      anonymous: "বেনামী / প্রাক-লগইন",
    },
  }[lang];

  // 1. Verify User Profile & Roles
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const meRes = await api.getMe();
        if (!mounted) return;
        if (!meRes.success || !meRes.data) {
          router.push("/login");
          return;
        }
        setUser(meRes.data);
        const roles = meRes.data.roles || [];
        const authorized = roles.includes("Administrator") || roles.includes("System Auditor");
        setIsAuthorized(authorized);
      } catch {
        router.push("/login");
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  // 2. Fetch Audit Logs
  const fetchLogs = useCallback(async (pageToLoad: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.listAuditLogs({
        page: pageToLoad,
        page_size: 20,
        search: search.trim() || undefined,
        event_type: eventType || undefined,
        result: resultFilter || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setErrorMsg(res.error || "Failed to load audit logs");
      }
    } catch {
      setErrorMsg("Failed to connect to audit repository");
    } finally {
      setLoading(false);
    }
  }, [search, eventType, resultFilter, fromDate, toDate]);

  useEffect(() => {
    let active = true;
    if (isAuthorized) {
      const init = async () => {
        if (active) {
          await fetchLogs(1);
        }
      };
      init();
    }
    return () => {
      active = false;
    };
  }, [isAuthorized, fetchLogs]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void fetchLogs(1);
  };

  const handleReset = () => {
    setSearch("");
    setEventType("");
    setResultFilter("");
    setFromDate("");
    setToDate("");
    void fetchLogs(1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Verifying authorization clearance...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#131926] border border-red-800/60 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center mx-auto mb-4 text-red-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-red-300">{t.unauthorizedTitle}</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.unauthorizedDesc}</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              {t.backToDashboard}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0f1422]/90 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            ← {lang === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}
          </Link>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">{t.title}</h1>
            <p className="text-xs text-slate-400 hidden sm:block">{t.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
            {user?.username} ({user?.roles?.join(", ")})
          </span>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "bn" : "en")}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            {t.switchLang}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Filter Bar */}
        <form onSubmit={handleFilterSubmit} className="bg-[#131926] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Event Type */}
            <div>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">{t.filterAllEvents}</option>
                <option value="AUTH">AUTH</option>
                <option value="DATA_MUTATION">DATA_MUTATION</option>
                <option value="SECURITY">SECURITY</option>
                <option value="ACCESS_CONTROL">ACCESS_CONTROL</option>
                <option value="EXPORT">EXPORT</option>
              </select>
            </div>

            {/* Result */}
            <div>
              <select
                value={resultFilter}
                onChange={(e) => setResultFilter(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">{t.filterAllResults}</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl transition"
              >
                {t.applyFilters}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition"
              >
                {t.resetFilters}
              </button>
            </div>
          </div>

          {/* Date Range Sub-row */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <span>{t.fromDateLabel}:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>{t.toDateLabel}:</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-[#0b0f17] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="ml-auto text-[11px] text-slate-500">
              {t.totalRecords(pagination.total)}
            </span>
          </div>
        </form>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Logs Table */}
        <div className="bg-[#131926] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-[#0f1422] border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t.timestamp}</th>
                  <th className="py-3.5 px-3">{t.requestId}</th>
                  <th className="py-3.5 px-4">{t.user}</th>
                  <th className="py-3.5 px-3">{t.event}</th>
                  <th className="py-3.5 px-4">{t.entity}</th>
                  <th className="py-3.5 px-4">{t.route}</th>
                  <th className="py-3.5 px-3">{t.result}</th>
                  <th className="py-3.5 px-3 text-right">{t.details}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        <span>Querying audit log entries...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                      {t.noLogs}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isExpanded = expandedId === log.audit_id;
                    const dateStr = new Date(log.created_at).toLocaleString("en-GB", {
                      timeZone: "Asia/Dhaka",
                    });

                    return (
                      <React.Fragment key={log.audit_id}>
                        <tr className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-sans text-xs">
                            {dateStr}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {log.request_id ? log.request_id.slice(0, 8) : "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className="font-semibold text-white">
                              {log.username || t.anonymous}
                            </span>
                            {log.branch_name && (
                              <span className="block text-[10px] text-slate-500">
                                {log.branch_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                              {log.event_type}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-sans whitespace-nowrap">
                            {log.entity_type ? (
                              <div>
                                <span className="font-medium text-slate-300">{log.entity_type}</span>
                                {log.entity_id && (
                                  <span className="block text-[10px] text-slate-500 font-mono">
                                    {log.entity_id}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-emerald-400 mr-1.5 font-bold">
                              {log.http_method}
                            </span>
                            <span className="text-slate-400">{log.route}</span>
                            {log.ip_address && (
                              <span className="block text-[10px] text-slate-600 font-sans">
                                IP: {log.ip_address}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.result === "SUCCESS"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : log.result === "BLOCKED"
                                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                                  : "bg-red-500/10 text-red-400 border border-red-500/30"
                              }`}
                            >
                              {log.result}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap font-sans">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : log.audit_id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
                            >
                              {isExpanded ? (lang === "bn" ? "বন্ধ করুন" : "Hide") : (lang === "bn" ? "বিস্তারিত" : "View")}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Inspector Panel */}
                        {isExpanded && (
                          <tr className="bg-[#0e121c] border-b border-slate-800">
                            <td colSpan={8} className="p-4 space-y-3 font-sans">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                                    Before State Summary (Sanitized)
                                  </h4>
                                  <pre className="p-3 bg-[#080b11] border border-slate-800 rounded-xl text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                    {log.before_summary || "No prior state recorded."}
                                  </pre>
                                </div>
                                <div>
                                  <h4 className="text-[11px] uppercase font-bold text-slate-400 mb-1">
                                    After State / Execution Summary (Sanitized)
                                  </h4>
                                  <pre className="p-3 bg-[#080b11] border border-slate-800 rounded-xl text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap">
                                    {log.after_summary || "No modification state recorded."}
                                  </pre>
                                </div>
                              </div>
                              <div className="flex items-center gap-6 text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                                <span>Audit ID: {log.audit_id}</span>
                                <span>Full Request ID: {log.request_id || "N/A"}</span>
                                <span>User Agent: {log.user_agent || "N/A"}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.total_pages > 1 && (
            <div className="p-4 border-t border-slate-800/80 bg-[#0f1422] flex items-center justify-between text-xs text-slate-400">
              <span>{t.pageOf(pagination.page, pagination.total_pages)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition"
                >
                  {t.previous}
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 border border-slate-700 transition"
                >
                  {t.next}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
