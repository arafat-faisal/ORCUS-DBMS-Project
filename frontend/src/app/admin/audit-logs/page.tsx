"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { AuditLog, Pagination, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AuditLogsPage() {
  const { locale, formatDateTime } = useLocale();
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      });

      if (res.success && res.data) {
        setLogs(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setErrorMsg(res.error || "Failed to load audit logs from repository.");
      }
    } catch {
      setErrorMsg("Failed to connect to institutional audit repository.");
    } finally {
      setLoading(false);
    }
  }, [search, eventType, resultFilter]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const isAuthorized = user?.roles?.some((r) =>
    ["Administrator", "System Auditor"].includes(r)
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "অডিট ও কমপ্লায়েন্স লগ" : "System Audit Logs"}
          description={
            locale === "bn"
              ? "সিস্টেম অপারেশন, ব্যবহারকারীর ভূমিকা পরিবর্তন এবং প্রমাণীকরণের অপরিবর্তনীয় অডিট রেজিস্ট্রি।"
              : "Immutable chronological audit logs tracking database operations, status transitions, and authentication events."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Administration" },
            { label: "Audit Logs" },
          ]}
        />

        {!isAuthorized ? (
          <div className="bg-white border border-amber-200 rounded-lg p-8 text-center shadow-xs">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <h2 className="text-base font-bold text-slate-900">Administrative Permission Required</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              System audit trails and security logs are restricted to Administrator and System Auditor roles.
            </p>
          </div>
        ) : (
          <>
            {/* Filter Bar */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
              <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by action, route, or username..."
                    className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
                </div>

                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">All Event Types</option>
                  <option value="AUTH">Authentication</option>
                  <option value="DATA_READ">Read Operations</option>
                  <option value="DATA_WRITE">Write / Update</option>
                  <option value="ADMIN_ACTION">Admin Actions</option>
                </select>

                <select
                  value={resultFilter}
                  onChange={(e) => setResultFilter(e.target.value)}
                  className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">All Results</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-semibold transition"
                >
                  Filter
                </button>
              </form>
            </div>

            {/* State Render */}
            {loading ? (
              <LoadingState message="Loading immutable audit trail records..." />
            ) : errorMsg ? (
              <ErrorState message={errorMsg} onRetry={() => fetchLogs(1)} />
            ) : logs.length === 0 ? (
              <EmptyState
                title="No audit events recorded"
                description="No matching audit records found for the specified filter criteria."
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Date / Time</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Entity</th>
                        <th className="py-3 px-4">Route</th>
                        <th className="py-3 px-4">Result</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {logs.map((log) => {
                        const isExpanded = expandedId === log.audit_id;
                        return (
                          <React.Fragment key={log.audit_id}>
                            <tr className="hover:bg-slate-50/75 transition-colors">
                              <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                                {formatDateTime(log.created_at)}
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {log.username || "System Pre-Auth"}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {log.action}
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                                  {log.entity_type || "N/A"} {log.entity_id ? `#${log.entity_id}` : ""}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                                <span className="font-bold text-slate-700">{log.http_method}</span> {log.route}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    log.result === "SUCCESS"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : log.result === "FAILED"
                                      ? "bg-red-50 text-red-700 border border-red-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {log.result}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : log.audit_id)}
                                  className="text-slate-500 hover:text-slate-800 p-1"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-slate-50/90 border-b border-slate-100">
                                <td colSpan={7} className="p-4 text-xs space-y-2">
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                                    <div>
                                      <span className="text-slate-400 block text-[10px]">Request ID:</span>
                                      <span className="font-mono text-slate-800">{log.request_id || "N/A"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[10px]">Client IP:</span>
                                      <span className="font-mono text-slate-800">{log.ip_address || "127.0.0.1"}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[10px]">Event Type:</span>
                                      <span className="font-semibold text-slate-800">{log.event_type}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block text-[10px]">Branch:</span>
                                      <span className="text-slate-800">{log.branch_name || "Headquarters"}</span>
                                    </div>
                                  </div>
                                  {log.after_summary && (
                                    <div className="mt-2">
                                      <span className="text-slate-400 block text-[10px] mb-1">State Summary:</span>
                                      <pre className="p-2.5 rounded bg-white border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                                        {log.after_summary}
                                      </pre>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
                  <span>Page {pagination.page} of {pagination.total_pages || 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchLogs(pagination.page - 1)}
                      className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pagination.page >= pagination.total_pages}
                      onClick={() => fetchLogs(pagination.page + 1)}
                      className="px-2.5 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
