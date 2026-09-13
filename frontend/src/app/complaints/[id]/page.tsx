"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  User,
  Shield,
  History,
  AlertCircle,
  CheckCircle2,
  Share2,
  ExternalLink,
} from "lucide-react";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { Complaint, ComplaintStatusHistory, ComplaintTransferHistory } from "@/lib/types";

export default function ComplaintDetailPage() {
  const params = useParams();

  const id = Number(params?.id);

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<ComplaintStatusHistory[]>([]);
  const [transfers, setTransfers] = useState<ComplaintTransferHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || isNaN(id)) return;
    let active = true;

    async function fetchDetail() {
      try {
        const [compRes, histRes, transRes] = await Promise.all([
          api.getComplaint(id),
          api.getComplaintHistory(id),
          api.getComplaintTransfers(id),
        ]);

        if (active) {
          if (compRes.success && compRes.data) {
            setComplaint(compRes.data);
          } else {
            setError(compRes.error || "Complaint record not found.");
          }
          if (histRes.success && histRes.data) setHistory(histRes.data);
          if (transRes.success && transRes.data) setTransfers(transRes.data);
        }
      } catch {
        if (active) setError("Failed to fetch complaint details.");
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      active = false;
    };
  }, [id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "Under Review":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "Correction Required":
        return "bg-orange-950/80 text-orange-300 border-orange-800";
      case "Verified":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-800";
      case "Converted to GD":
      case "Converted to FIR":
      case "Resolved":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      case "Transferred":
        return "bg-purple-950/80 text-purple-300 border-purple-800";
      case "Rejected":
      case "Closed":
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  if (loading) {
    return (
      <PortalLayout>
        <div className="flex items-center justify-center py-24 text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading Complaint Record...</span>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !complaint) {
    return (
      <PortalLayout>
        <div className="max-w-2xl mx-auto py-12 text-center">
          <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-white">Record Inaccessible</h2>
            <p className="text-xs text-slate-400">{error || "Could not retrieve complaint."}</p>
            <Link
              href="/complaints"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Complaints</span>
            </Link>
          </div>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/complaints" className="hover:text-emerald-400 flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Complaints</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-emerald-400 font-bold">{complaint.tracking_code}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/public/complaints/track?code=${encodeURIComponent(
                complaint.tracking_code
              )}&phone=${encodeURIComponent(complaint.complainant_phone || "")}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <span>Citizen View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={`/complaints/${complaint.complaint_id}/assessment`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Perform Assessment / Action</span>
            </Link>
          </div>
        </div>

        {/* Complaint Primary Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold text-emerald-400">
                  {complaint.tracking_code}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                    complaint.current_status
                  )}`}
                >
                  {complaint.current_status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {complaint.confidentiality_level}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-100">{complaint.title}</h1>
            </div>

            <div className="text-right text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">Submitted: </span>
                <span className="font-semibold text-slate-200">
                  {new Date(complaint.submitted_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Channel: </span>
                <span className="font-semibold text-slate-300">{complaint.submission_channel}</span>
              </div>
            </div>
          </div>

          {/* Complainant & Incident Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-5 border-b border-slate-800 text-xs">
            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold">Complainant</span>
              </div>
              <div className="font-semibold text-slate-200 text-sm">
                {complaint.complainant_name || "Unknown"}
              </div>
              <div className="text-slate-400 font-mono mt-0.5">
                {complaint.complainant_phone || "No phone logged"}
              </div>
            </div>

            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold">Receiving Branch</span>
              </div>
              <div className="font-semibold text-slate-200 text-sm">
                {complaint.branch_name || "Headquarters"}
              </div>
              <div className="text-slate-500 mt-0.5">Branch ID: #{complaint.receiving_branch_id}</div>
            </div>

            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold">Incident Timing</span>
              </div>
              <div className="font-semibold text-slate-200">{complaint.incident_date}</div>
              <div className="text-slate-400 mt-0.5">
                {complaint.incident_time
                  ? `${complaint.incident_time} ${complaint.approximate_time ? "(Approximate)" : ""}`
                  : "Time unspecified"}
              </div>
            </div>

            <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="font-semibold">Category & Reviewer</span>
              </div>
              <div className="font-semibold text-slate-200">
                {complaint.category_name || "General"}
              </div>
              <div className="text-slate-400 mt-0.5">
                Reviewer: {complaint.reviewer_name || "Unassigned"}
              </div>
            </div>
          </div>

          {/* Detailed Narrative */}
          <div className="py-5 border-b border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Incident Narrative
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/30 p-4 rounded-lg border border-slate-800/50 font-normal">
              {complaint.description}
            </p>
          </div>

          {/* Internal Notes & Public Status Message */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Public Tracking Status Message
              </span>
              <p className="text-xs text-slate-300 italic">
                &ldquo;{complaint.public_status_message || "Under preliminary intake assessment."}&rdquo;
              </p>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-2">
                Confidential Officer Notes
              </span>
              <p className="text-xs text-slate-300 whitespace-pre-line">
                {complaint.internal_notes || "No internal notes recorded at intake."}
              </p>
            </div>
          </div>
        </div>

        {/* Status History Progression Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">
                Assessment History & Audit Trail ({history.length})
              </h2>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No subsequent state transitions recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((h, idx) => (
                <div
                  key={h.history_id || idx}
                  className="relative pl-6 border-l-2 border-emerald-500/40 pb-4 last:pb-0"
                >
                  <div className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-emerald-500" />
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-sm">{h.decision}</span>
                        <span className="text-slate-500">&rarr;</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(
                            h.new_status
                          )}`}
                        >
                          {h.new_status}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(h.created_at).toLocaleString()}
                      </span>
                    </div>

                    {h.reason && (
                      <div className="text-slate-300 leading-relaxed">
                        <span className="text-slate-500 font-medium">Reason: </span>
                        {h.reason}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1 border-t border-slate-800/60">
                      <span>Acting Officer: {h.acting_username || "System Officer"}</span>
                      {h.acting_branch && <span>Branch: {h.acting_branch}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transfer History if Any */}
        {transfers.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4 text-purple-400">
              <Share2 className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">Jurisdictional Transfers</h2>
            </div>
            <div className="space-y-3">
              {transfers.map((t) => (
                <div
                  key={t.transfer_id}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-slate-200">
                      From {t.from_branch_name} &rarr; To {t.to_branch_name}
                    </span>
                    <p className="text-slate-400 mt-0.5">{t.transfer_reason}</p>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>By: {t.transferred_by || "Duty Officer"}</div>
                    <div>{new Date(t.transferred_at).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
