"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { GD, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Clock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Building,
} from "lucide-react";

export default function GDListPage() {
  const { t, formatDateTime } = useLocale();
  const [gds, setGds] = useState<GD[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [user, setUser] = useState<UserProfile | null>(api.getUserProfile());

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await api.listGDs();
      if (res.success && res.data) {
        setGds(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredGDs = gds.filter((gd) => {
    const matchesSearch =
      (gd.gd_number && gd.gd_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gd.subject && gd.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (gd.complainant_name && gd.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || gd.current_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/60";
      case "Assigned for Inquiry":
      case "Inquiry in Progress":
        return "bg-cyan-950/70 text-cyan-400 border-cyan-800/60";
      case "Submitted for Approval":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60";
      case "Linked to FIR":
        return "bg-purple-950/70 text-purple-400 border-purple-800/60";
      case "Resolved":
      case "Closed":
        return "bg-slate-800 text-slate-300 border-slate-700";
      default:
        return "bg-slate-900 text-slate-400 border-slate-800";
    }
  };

  return (
    <PortalLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Investigation Intake &bull; General Diary</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              General Diary (GD) Register
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Official station diary for non-cognizable incidents, missing persons, property losses, and inquiries.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Intake New GD / Complaint</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by GD number, subject, complainant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted for Approval">Submitted for Approval</option>
              <option value="Approved">Approved</option>
              <option value="Assigned for Inquiry">Assigned for Inquiry</option>
              <option value="Inquiry in Progress">Inquiry in Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Linked to FIR">Linked to FIR</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* List of GDs */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
            <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-sm">Loading station diary records...</span>
          </div>
        ) : filteredGDs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No General Diary records match your criteria.</p>
            <p className="text-xs text-slate-600 mt-1">Try resetting search filters or register a new incident.</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">GD Number</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Subject & Location</th>
                    <th className="py-3 px-4">Complainant</th>
                    <th className="py-3 px-4">Station / Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredGDs.map((gd) => (
                    <tr key={gd.gd_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                        <Link href={`/gd/${gd.gd_id}`} className="hover:underline">
                          {gd.gd_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateTime(gd.gd_date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200 line-clamp-1">{gd.subject}</div>
                        {gd.incident_place && (
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{gd.incident_place}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-300">{gd.complainant_name || "Anonymous / State"}</div>
                        {gd.complainant_phone && (
                          <div className="text-xs font-mono text-slate-500">{gd.complainant_phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{gd.branch_name || "HQ / Station"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            gd.current_status || "Approved"
                          )}`}
                        >
                          {gd.current_status || "Approved"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/gd/${gd.gd_id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <span>View Dossier</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
