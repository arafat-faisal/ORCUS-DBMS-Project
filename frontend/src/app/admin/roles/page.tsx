"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Role, UserProfile } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import { ShieldCheck, Lock, CheckCircle2, PlusCircle, AlertCircle } from "lucide-react";

export default function AdminRolesPage() {
  const { locale } = useLocale();

  const [roles, setRoles] = useState<Role[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(api.getUserProfile());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Role State
  const [showAddRole, setShowAddRole] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rolePermissionMap: Record<string, string[]> = {
    Administrator: [
      "Full System Configuration",
      "User & Officer Account Provisioning",
      "Audit Log Inspection",
      "Security Policy Management",
      "All Operational Privileges",
    ],
    "Officer-in-Charge": [
      "Complaint Intake & Formal Assessment",
      "FIR Registration Approval",
      "Case Assignment & IO Supervision",
      "Judicial Report Signoff",
    ],
    "Duty Officer": [
      "Citizen Complaint Intake",
      "General Diary (GD) Registration",
      "Initial Fact Verification",
      "Station Logistics Tracking",
    ],
    "Investigating Officer": [
      "Investigative Case File Updates",
      "Suspect & Witness Interrogation Logs",
      "Crime Scene Location Mapping",
      "Evidence Seizure Documentation",
    ],
    "Evidence Officer": [
      "Evidence Vault Storage",
      "Forensic Chain of Custody Logging",
      "Lab Analysis Despatch",
      "Court Property Disposal",
    ],
    "System Auditor": [
      "Read-Only Audit Trail Inspection",
      "Compliance Verification",
      "Activity Timeline Reviews",
    ],
    "Public Complainant": [
      "Public Citizen Complaint Tracking",
      "Submission Acknowledgement",
    ],
  };

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listRoles();
      if (res.success && res.data) {
        setRoles(res.data);
      } else {
        setError(res.error || "Failed to load system security roles.");
      }
    } catch {
      setError("Network communication error with ORCUS API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setFeedback("Role name is required.");
      return;
    }

    setCreating(true);
    setFeedback(null);
    try {
      const res = await api.createRole({
        role_name: roleName.trim(),
        description: roleDesc.trim() || undefined,
      });

      if (res.success && res.data) {
        setFeedback(`Role '${roleName}' created successfully.`);
        setShowAddRole(false);
        setRoleName("");
        setRoleDesc("");
        loadRoles();
      } else {
        setFeedback(res.error || "Failed to create security role.");
      }
    } catch {
      setFeedback("Network error while creating role.");
    } finally {
      setCreating(false);
    }
  };

  const isAuthorized = currentUser?.roles?.includes("Administrator");

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "নিরাপত্তা ভূমিকা ও অধিকার (RBAC)" : "Roles & Access Permissions"}
          description={
            locale === "bn"
              ? "সিস্টেম ভূমিকাভিত্তিক প্রবেশাধিকার নিয়ন্ত্রণ (Role-Based Access Control) নীতি ও অনুমতিমালা।"
              : "Institutional role-based access control (RBAC) definitions, privilege boundaries, and functional scopes."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Administration" },
            { label: "Roles" },
          ]}
          action={
            isAuthorized ? (
              <button
                onClick={() => setShowAddRole(!showAddRole)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddRole ? "Close Form" : "Create New Role"}</span>
              </button>
            ) : undefined
          }
        />

        {/* Add Role Drawer */}
        {showAddRole && isAuthorized && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Add New System Role</h3>
              <button
                onClick={() => setShowAddRole(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            {feedback && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Forensics Lead"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Description / Operational Scope
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Specialized cyber incident investigation and digital evidence extraction"
                    value={roleDesc}
                    onChange={(e) => setRoleDesc(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs transition disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Role"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading security roles and permissions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadRoles} />
        ) : roles.length === 0 ? (
          <EmptyState title="No roles found" description="Database roles table returned zero rows." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roles.map((r) => {
                const perms = rolePermissionMap[r.role_name] || [
                  "Standard Operational Reading",
                  "Basic Case Viewing",
                ];
                return (
                  <div
                    key={r.role_id}
                    className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-bold text-slate-900">{r.role_name}</h3>
                      </div>
                      <span className="font-mono text-xs text-slate-400">ID: {r.role_id}</span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {r.description || "Authorized institutional role in ORCUS investigation system."}
                    </p>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Authorized Permissions:
                      </span>
                      <ul className="space-y-1 text-xs">
                        {perms.map((p, idx) => (
                          <li key={idx} className="flex items-center gap-1.5 text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
