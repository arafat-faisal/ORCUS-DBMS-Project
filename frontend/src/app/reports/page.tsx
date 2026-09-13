"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import {
  CaseOverview,
  Complaint,
  OfficerCaseload,
  Evidence,
  AgencyBranch,
} from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrintHeader } from "@/components/ui/PrintHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingState } from "@/components/ui/FeedbackStates";
import {
  FileBarChart,
  Printer,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  Scale,
  FolderLock,
  Package,
} from "lucide-react";

type ReportType =
  | "cases_status"
  | "officer_workload"
  | "complaints_summary"
  | "evidence_inventory"
  | "branch_summary";

export default function ReportsPage() {
  const { locale, formatDateTime } = useLocale();

  const [selectedReport, setSelectedReport] = useState<ReportType>("cases_status");
  const [loading, setLoading] = useState(false);

  // Datasets
  const [cases, setCases] = useState<CaseOverview[]>([]);
  const [caseloads, setCaseloads] = useState<OfficerCaseload[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (selectedReport === "cases_status") {
        const res = await api.searchCases();
        if (res.success && res.data) setCases(res.data);
      } else if (selectedReport === "officer_workload") {
        const res = await api.getOfficerCaseload();
        if (res.success && res.data) setCaseloads(res.data);
      } else if (selectedReport === "complaints_summary") {
        const res = await api.listComplaints({ page_size: 50 });
        if (res.success && res.data) setComplaints(res.data);
      } else if (selectedReport === "evidence_inventory") {
        const res = await api.listEvidence();
        if (res.success && res.data) setEvidenceList(res.data);
      } else if (selectedReport === "branch_summary") {
        const res = await api.listBranches();
        if (res.success && res.data) setBranches(res.data);
      }
    } catch (err) {
      console.error("Error loading report", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (selectedReport === "cases_status") {
      csvContent += "Case ID,Title,Category,Status,Lead Officer,Date\n";
      cases.forEach((c) => {
        csvContent += `"${c.case_id}","${c.case_title}","${c.crime_category || ""}","${c.case_status || ""}","${c.lead_officer_name || ""}","${c.opened_date}"\n`;
      });
    } else if (selectedReport === "officer_workload") {
      csvContent += "Badge,Officer Name,Rank,Branch,Total Assigned,Active Cases,Closed Cases\n";
      caseloads.forEach((o) => {
        csvContent += `"${o.badge_no}","${o.officer_name}","${o.rank}","${o.branch_name}","${o.total_cases_assigned}","${o.active_cases}","${o.closed_cases}"\n`;
      });
    } else if (selectedReport === "evidence_inventory") {
      csvContent += "Evidence ID,Title,Type,Storage Location,Status,Collected At\n";
      evidenceList.forEach((e) => {
        csvContent += `"${e.evidence_id}","${e.title}","${e.evidence_type}","${e.storage_location || ""}","${e.status}","${e.collected_at}"\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orcus_report_${selectedReport}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reportOptions = [
    {
      id: "cases_status",
      title: "Cases by Status",
      desc: "Distribution of active, pending review, and closed investigation dossiers.",
      icon: FolderLock,
    },
    {
      id: "officer_workload",
      title: "Officer Caseload Analysis",
      desc: "Workload distribution, assigned investigations, and clearance per investigator.",
      icon: Scale,
    },
    {
      id: "complaints_summary",
      title: "Complaint Intake Outcomes",
      desc: "Status progression from initial citizen submission to GD or FIR.",
      icon: Calendar,
    },
    {
      id: "evidence_inventory",
      title: "Evidence Vault Inventory",
      desc: "Catalog of physical, forensic, and digital property under custody.",
      icon: Package,
    },
    {
      id: "branch_summary",
      title: "Branch Jurisdictions",
      desc: "Police branch jurisdictions and territorial coverage.",
      icon: Building,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <PrintHeader
          title={`Institutional Report: ${reportOptions.find((r) => r.id === selectedReport)?.title}`}
          referenceNo={`REP-${selectedReport.toUpperCase()}`}
        />

        <div className="no-print">
          <PageHeader
            title={locale === "bn" ? "প্রাতিষ্ঠানিক প্রতিবেদন ডিরেক্টরি" : "Institutional Reports"}
            description={
              locale === "bn"
                ? "ডাটাবেস ভিত্তিক মামলা, কর্মকর্তা এবং আলামত সম্পর্কিত বিশ্লেষণমূলক প্রতিবেদন।"
                : "Academic reporting directory providing verifiable database aggregates, caseloads, and evidentiary audits."
            }
            breadcrumbs={[
              { label: "ORCUS", href: "/dashboard" },
              { label: "Reports" },
            ]}
            action={
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            }
          />
        </div>

        {/* Report Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 no-print">
          {reportOptions.map((rep) => {
            const isSelected = selectedReport === rep.id;
            const Icon = rep.icon;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep.id as ReportType)}
                className={`p-3.5 rounded-lg border text-left transition shadow-xs ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <Icon className={`w-4 h-4 mb-2 ${isSelected ? "text-blue-700" : "text-slate-500"}`} />
                <div className="font-bold text-xs text-slate-900 mb-0.5">{rep.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-2">{rep.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Report Preview */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {reportOptions.find((r) => r.id === selectedReport)?.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {reportOptions.find((r) => r.id === selectedReport)?.desc}
              </p>
            </div>
            <span className="text-xs text-slate-500">Live Database Extract</span>
          </div>

          {loading ? (
            <LoadingState message="Generating database report view..." />
          ) : (
            <div className="overflow-x-auto text-xs">
              {/* REPORT: CASES BY STATUS */}
              {selectedReport === "cases_status" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Case ID</th>
                      <th className="py-2.5 px-3">Case Title</th>
                      <th className="py-2.5 px-3">Offense Category</th>
                      <th className="py-2.5 px-3">Lead Officer</th>
                      <th className="py-2.5 px-3">Opened Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {cases.map((c) => (
                      <tr key={c.case_id}>
                        <td className="py-2.5 px-3 font-mono font-bold">CASE-{c.case_id}</td>
                        <td className="py-2.5 px-3 font-medium">{c.case_title}</td>
                        <td className="py-2.5 px-3 text-slate-600">{c.crime_category || "General"}</td>
                        <td className="py-2.5 px-3">{c.lead_officer_name || "Unassigned"}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDateTime(c.opened_date)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={c.case_status || c.status || "Open"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORT: OFFICER WORKLOAD */}
              {selectedReport === "officer_workload" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Badge No</th>
                      <th className="py-2.5 px-3">Officer Name</th>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Branch</th>
                      <th className="py-2.5 px-3">Total Assigned</th>
                      <th className="py-2.5 px-3">Active Cases</th>
                      <th className="py-2.5 px-3">Closed Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {caseloads.map((o) => (
                      <tr key={o.officer_id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{o.badge_no}</td>
                        <td className="py-2.5 px-3 font-semibold">{o.officer_name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{o.rank}</td>
                        <td className="py-2.5 px-3 text-slate-600">{o.branch_name}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-700">{o.total_cases_assigned}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-700">{o.active_cases}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">{o.closed_cases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORT: EVIDENCE INVENTORY */}
              {selectedReport === "evidence_inventory" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Ref ID</th>
                      <th className="py-2.5 px-3">Item Title</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Locker Location</th>
                      <th className="py-2.5 px-3">Date Logged</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {evidenceList.map((e) => (
                      <tr key={e.evidence_id}>
                        <td className="py-2.5 px-3 font-mono font-bold">EV-{e.evidence_id}</td>
                        <td className="py-2.5 px-3 font-medium">{e.title}</td>
                        <td className="py-2.5 px-3 text-slate-600">{e.evidence_type}</td>
                        <td className="py-2.5 px-3 text-slate-600">{e.storage_location || "Vault"}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDateTime(e.collected_at)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={e.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORT: COMPLAINTS */}
              {selectedReport === "complaints_summary" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Tracking Code</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Complainant</th>
                      <th className="py-2.5 px-3">Receiving Branch</th>
                      <th className="py-2.5 px-3">Submission Date</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {complaints.map((c) => (
                      <tr key={c.complaint_id}>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{c.tracking_code}</td>
                        <td className="py-2.5 px-3 font-medium">{c.title}</td>
                        <td className="py-2.5 px-3">{c.complainant_name || "Walk-in"}</td>
                        <td className="py-2.5 px-3 text-slate-600">{c.branch_name || "Headquarters"}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{formatDateTime(c.submitted_at)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={c.current_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* REPORT: BRANCHES */}
              {selectedReport === "branch_summary" && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 px-3">Branch ID</th>
                      <th className="py-2.5 px-3">Branch Name</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Branch Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {branches.map((b) => (
                      <tr key={b.branch_id}>
                        <td className="py-2.5 px-3 font-mono font-bold">{b.branch_id}</td>
                        <td className="py-2.5 px-3 font-medium">{b.branch_name}</td>
                        <td className="py-2.5 px-3 text-slate-600">{b.district}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{b.branch_code || "BR-" + b.branch_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
