"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { api } from "@/lib/api";
import { FIR } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Clock,
  ArrowRight,
  Shield,
  Building,
  AlertOctagon,
  Scale,
} from "lucide-react";

export default function FIRListPage() {
  const { t, formatDateTime } = useLocale();
  const [firs, setFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await api.listFIRs();
      if (res.success && res.data) {
        setFirs(res.data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredFIRs = firs.filter((fir) => {
    const matchesSearch =
      (fir.fir_number && fir.fir_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fir.crime_category && fir.crime_category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fir.complainant_name && fir.complainant_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoryFilter === "ALL" || fir.crime_category === categoryFilter;
    const matchesStatus = statusFilter === "ALL" || fir.current_status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Case Opened":
        return "bg-emerald-950/70 text-emerald-400 border-emerald-800/60";
      case "Investigation Pending":
      case "Registered":
        return "bg-cyan-950/70 text-cyan-400 border-cyan-800/60";
      case "Verified":
        return "bg-indigo-950/70 text-indigo-400 border-indigo-800/60";
      case "Submitted for Verification":
        return "bg-amber-950/70 text-amber-400 border-amber-800/60";
      case "Closed":
      case "Archived":
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
            <div className="flex items-center gap-2 text-xs font-mono text-rose-400 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Cognizable Offenses &bull; Section 154 CrPC</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              First Information Report (FIR) Registry
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Official station registry for cognizable criminal offenses, statutory penal sections, and judicial investigations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/complaints/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-rose-950/40"
            >
              <Plus className="w-4 h-4" />
              <span>Lodge New Complaint / FIR</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by FIR number, category, complainant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="ALL">All Offense Categories</option>
              <option value="Theft">Theft</option>
              <option value="Robbery">Robbery</option>
              <option value="Extortion">Extortion</option>
              <option value="Fraud">Fraud</option>
              <option value="Assault">Assault</option>
              <option value="Homicide">Homicide</option>
              <option value="Narcotics">Narcotics</option>
              <option value="Cybercrime">Cybercrime</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="Registered">Registered</option>
              <option value="Investigation Pending">Investigation Pending</option>
              <option value="Case Opened">Case Opened</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        {/* List of FIRs */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-xl border border-slate-800">
            <div className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-sm">Retrieving statutory FIR records...</span>
          </div>
        ) : filteredFIRs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800">
            <AlertOctagon className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-400">No FIR records match your filter criteria.</p>
            <p className="text-xs text-slate-600 mt-1">Check crime category or register a new cognizable offense.</p>
          </div>
        ) : (
          <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs uppercase font-mono text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">FIR Number</th>
                    <th className="py-3 px-4">Filing Date</th>
                    <th className="py-3 px-4">Crime Category & Sections</th>
                    <th className="py-3 px-4">Complainant / Informant</th>
                    <th className="py-3 px-4">Origin / GD Ref</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredFIRs.map((fir) => (
                    <tr key={fir.fir_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                        <Link href={`/fir/${fir.fir_id}`} className="hover:underline">
                          {fir.fir_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateTime(fir.filed_date)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{fir.crime_category}</div>
                        {fir.legal_sections && fir.legal_sections.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {fir.legal_sections.slice(0, 3).map((sec) => (
                              <span
                                key={sec.section_id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {sec.section_code}
                              </span>
                            ))}
                            {fir.legal_sections.length > 3 && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                +{fir.legal_sections.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-300">{fir.complainant_name || "State / Police Informant"}</div>
                        {fir.complainant_phone && (
                          <div className="text-xs font-mono text-slate-500">{fir.complainant_phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                        {fir.gd_number ? (
                          <Link href={`/gd`} className="text-cyan-400 hover:underline">
                            {fir.gd_number}
                          </Link>
                        ) : (
                          <span className="text-slate-600">Direct Intake</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(
                            fir.current_status || "Registered"
                          )}`}
                        >
                          {fir.current_status || "Registered"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/fir/${fir.fir_id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-rose-400 hover:text-rose-300 transition-colors"
                        >
                          <span>Formal Dossier</span>
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
