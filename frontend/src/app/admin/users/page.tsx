"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Officer, Role, AgencyBranch, UserProfile, AdminUserItem } from "@/lib/types";
import { useLocale } from "@/lib/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/FeedbackStates";
import {
  UserCheck,
  Search,
  PlusCircle,
  ShieldAlert,
  Building,
  AlertCircle,
  CheckCircle2,
  Lock,
  KeyRound,
  UserX,
  RefreshCw,
  Users,
  Edit3,
  Building2,
  Check,
  Trash2,
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

export default function AdminUsersPage() {
  const { locale, formatDateTime } = useLocale();

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<AgencyBranch[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(api.getUserProfile());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "officers">("users");

  // Register User Form
  const [showAddUser, setShowAddUser] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regOfficerId, setRegOfficerId] = useState<number | undefined>();
  const [regRoleId, setRegRoleId] = useState<number | undefined>();
  const [creating, setCreating] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Edit User & Multi-Branch Modal
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);
  const [editOfficerId, setEditOfficerId] = useState<number | null>(null);
  const [editRoleIds, setEditRoleIds] = useState<number[]>([]);
  const [editBranchIds, setEditBranchIds] = useState<number[]>([]);
  const [savingUser, setSavingUser] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<AdminUserItem | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  // Delete User Modal
  const [deleteModalUser, setDeleteModalUser] = useState<AdminUserItem | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeletingUser(true);
    setDeleteError(null);
    try {
      const res = await api.deleteUser(deleteModalUser.user_id);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.user_id !== deleteModalUser.user_id));
        setDeleteModalUser(null);
        setActionFeedback(`User account '${deleteModalUser.username}' was permanently deleted.`);
      } else {
        setDeleteError(res.error || "Failed to delete user account.");
      }
    } catch {
      setDeleteError("Network error while deleting user account.");
    } finally {
      setDeletingUser(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, offRes, roleRes, branchRes] = await Promise.all([
        api.listUsers(),
        api.listOfficers(),
        api.listRoles(),
        api.listBranches(),
      ]);

      if (usersRes.success && usersRes.data) setUsers(usersRes.data);
      if (offRes.success && offRes.data) setOfficers(offRes.data);
      if (roleRes.success && roleRes.data) {
        setRoles(roleRes.data);
        if (roleRes.data.length > 0) setRegRoleId(roleRes.data[0].role_id);
      }
      if (branchRes.success && branchRes.data) setBranches(branchRes.data);
    } catch {
      setError("Failed to load user administration records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regPassword) {
      setActionFeedback("Username and password are required.");
      return;
    }
    if (!regRoleId) {
      setActionFeedback("Please select a system security role.");
      return;
    }

    setCreating(true);
    setActionFeedback(null);
    try {
      const res = await api.registerUser({
        username: regUsername.trim(),
        password: regPassword,
        officer_id: regOfficerId,
        role_ids: [regRoleId],
      });

      if (res.success && res.data) {
        setActionFeedback(`User '${regUsername}' created successfully.`);
        setShowAddUser(false);
        setRegUsername("");
        setRegPassword("");
        loadData();
      } else {
        setActionFeedback(res.error || "Failed to register user account.");
      }
    } catch {
      setActionFeedback("Network error while creating user account.");
    } finally {
      setCreating(false);
    }
  };

  const openEditUser = (u: AdminUserItem) => {
    setEditingUser(u);
    setEditFeedback(null);
    setEditOfficerId(u.officer_id ?? null);
    setEditRoleIds(u.role_ids && u.role_ids.length > 0 ? [...u.role_ids] : []);
    setEditBranchIds(u.branch_ids && u.branch_ids.length > 0 ? [...u.branch_ids] : []);
  };

  const toggleEditRole = (roleId: number) => {
    setEditRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleEditBranch = (branchId: number) => {
    setEditBranchIds((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  const handleUpdateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editRoleIds.length === 0) {
      setEditFeedback("At least one system role must be assigned.");
      return;
    }

    setSavingUser(true);
    setEditFeedback(null);
    try {
      const res = await api.updateUser(editingUser.user_id, {
        officer_id: editOfficerId,
        role_ids: editRoleIds,
        branch_ids: editBranchIds,
      });

      if (res.success) {
        setEditingUser(null);
        await loadData();
      } else {
        setEditFeedback(res.error || "Failed to update user assignments.");
      }
    } catch {
      setEditFeedback("Network error updating user assignments.");
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserItem) => {
    try {
      const res = await api.updateUserStatus(user.user_id, !user.is_active);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "Failed to update user status");
      }
    } catch {
      alert("Network error updating status");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;
    if (newPassword.trim().length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setResetting(true);
    try {
      const res = await api.resetUserPassword(resetModalUser.user_id, newPassword.trim());
      if (res.success) {
        alert(`Password for '${resetModalUser.username}' reset successfully!`);
        setResetModalUser(null);
        setNewPassword("");
        loadData();
      } else {
        alert(res.error || "Failed to reset password");
      }
    } catch {
      alert("Network error resetting password");
    } finally {
      setResetting(false);
    }
  };

  const isAuthorized = currentUser?.roles?.includes("Administrator");

  const filteredUsers = users.filter((u) => {
    const s = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      u.username.toLowerCase().includes(s) ||
      (u.officer_name && u.officer_name.toLowerCase().includes(s)) ||
      (u.badge_no && u.badge_no.toLowerCase().includes(s)) ||
      (u.branch_name && u.branch_name.toLowerCase().includes(s)) ||
      u.roles.some((r) => r.toLowerCase().includes(s))
    );
  });

  const filteredOfficers = officers.filter((o) => {
    const s = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      `${o.first_name} ${o.last_name}`.toLowerCase().includes(s) ||
      o.badge_no.toLowerCase().includes(s) ||
      o.rank.toLowerCase().includes(s)
    );
  });

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <PageHeader
          title={locale === "bn" ? "ব্যবহারকারী ও কর্মকর্তা ব্যবস্থাপনা" : "User & Officer Accounts"}
          description={
            locale === "bn"
              ? "সিস্টেম ব্যবহারকারী, লগইন অনুমোদন, পাসওয়ার্ড রিসেট এবং কর্মকর্তা প্রোফাইল সংযোগ।"
              : "Administrative registry of active user logins, password management, role bindings, and police station postings."
          }
          breadcrumbs={[
            { label: "ORCUS", href: "/dashboard" },
            { label: "Administration" },
            { label: "Users" },
          ]}
          action={
            isAuthorized ? (
              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-semibold shadow-xs transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{showAddUser ? "Close Form" : "Create New User"}</span>
              </button>
            ) : undefined
          }
        />

        {/* Access Restriction Notice if not Administrator */}
        {!isAuthorized && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              You are viewing the authorized directory in read-only mode. Modifying user credentials requires the Administrator role.
            </span>
          </div>
        )}

        {/* Add User Form Drawer */}
        {showAddUser && isAuthorized && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Register New User Account
              </h3>
              <button
                onClick={() => setShowAddUser(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>

            {actionFeedback && (
              <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                <span>{actionFeedback}</span>
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    System Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. si_kamal"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Link to Officer Record
                  </label>
                  <select
                    value={regOfficerId || ""}
                    onChange={(e) => setRegOfficerId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">No Officer Profile (e.g. System Auditor/Staff)</option>
                    {officers.map((off) => (
                      <option key={off.officer_id} value={off.officer_id}>
                        {off.rank} {off.first_name} {off.last_name} ({off.badge_no})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Assign Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={regRoleId || ""}
                    onChange={(e) => setRegRoleId(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.role_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-right pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-xs transition disabled:opacity-50"
                >
                  {creating ? "Creating User..." : "Register User Account"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Selector & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("users")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "users"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              System Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab("officers")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                activeTab === "officers"
                  ? "bg-blue-700 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Officer Directory ({officers.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, officer, badge, role..."
              className="w-full bg-white border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* State Render */}
        {loading ? (
          <LoadingState message="Loading administration records..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : activeTab === "users" ? (
          filteredUsers.length === 0 ? (
            <EmptyState title="No system users found" description="No user accounts match your search." />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Linked Officer</th>
                    <th className="py-3 px-4">Roles</th>
                    <th className="py-3 px-4">Station / Branch</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-600">
                        #{u.user_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-blue-700">
                        {u.username}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {u.officer_name ? (
                          <div>
                            <span className="font-semibold">{u.officer_name}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-1.5">
                              ({u.badge_no || "Badge N/A"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No Officer Profile</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium text-[10px]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.branches && u.branches.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.branches.map((b, bi) => (
                              <span
                                key={bi}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  bi === 0
                                    ? "bg-slate-100 text-slate-800 border-slate-300"
                                    : "bg-teal-50 text-teal-800 border-teal-200"
                                }`}
                                title={bi === 0 ? "Primary Station" : "Additional Assignment"}
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>{u.branch_name || "Central Headquarters"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded border font-semibold text-[10px] ${
                            u.is_active
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-rose-50 text-rose-800 border-rose-200"
                          }`}
                        >
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAuthorized && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditUser(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 text-[11px] font-semibold text-blue-800 transition"
                              title="Assign branches, update roles, or link officer profile"
                            >
                              <Edit3 className="w-3 h-3 text-blue-700" />
                              <span>Edit & Assign</span>
                            </button>
                            <button
                              onClick={() => {
                                setResetModalUser(u);
                                setNewPassword("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 transition"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Password</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-semibold transition ${
                                u.is_active
                                  ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {u.is_active ? (
                                <>
                                  <UserX className="w-3 h-3" />
                                  <span>Suspend</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                            {u.user_id !== 1 && (
                              <button
                                onClick={() => {
                                  setDeleteModalUser(u);
                                  setDeleteError(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-[11px] font-semibold text-rose-700 transition"
                                title="Permanently delete user record"
                              >
                                <Trash2 className="w-3 h-3 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Badge No</th>
                  <th className="py-3 px-4">Officer Name</th>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Assigned Branch</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredOfficers.map((o) => (
                  <tr key={o.officer_id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{o.badge_no}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {o.first_name} {o.last_name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{o.rank}</td>
                    <td className="py-3 px-4 text-slate-600">{o.branch_name || "Headquarters"}</td>
                    <td className="py-3 px-4 text-slate-500">{o.district || "Dhaka"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                        Active Officer
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit User & Assign Branches Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-xl w-full shadow-2xl space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Manage User & Station Postings
                    </h3>
                    <p className="text-xs text-slate-500">
                      Account: <strong className="text-blue-700 font-mono">{editingUser.username}</strong> (ID #{editingUser.user_id})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded"
                >
                  ✕
                </button>
              </div>

              {editFeedback && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{editFeedback}</span>
                </div>
              )}

              <form onSubmit={handleUpdateUserSubmit} className="space-y-4 text-xs">
                {/* Linked Officer Profile */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Linked Officer Profile
                  </label>
                  <select
                    value={editOfficerId ?? ""}
                    onChange={(e) => setEditOfficerId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- No Linked Officer Profile (System Staff / Auditor) --</option>
                    {officers.map((off) => (
                      <option key={off.officer_id} value={off.officer_id}>
                        {off.rank} {off.first_name} {off.last_name} ({off.badge_no})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Linking an officer profile connects cases, complaints, and evidence assigned to that badge.
                  </p>
                </div>

                {/* Assigned Roles */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Assigned System Roles <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                    {roles.map((r) => {
                      const checked = editRoleIds.includes(r.role_id);
                      return (
                        <label
                          key={r.role_id}
                          onClick={() => toggleEditRole(r.role_id)}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition ${
                            checked
                              ? "bg-blue-50/80 border-blue-300 text-blue-900"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span className="font-semibold text-xs">{r.role_name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Multi-Branch Assignments */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700">
                      Station & Division Assignments (One or Multiple)
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {editBranchIds.length} station{editBranchIds.length === 1 ? "" : "s"} selected
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                    {branches.map((b, idx) => {
                      const checked = editBranchIds.includes(b.branch_id);
                      const isPrimary = checked && editBranchIds[0] === b.branch_id;
                      return (
                        <div
                          key={b.branch_id}
                          onClick={() => toggleEditBranch(b.branch_id)}
                          className={`flex items-center justify-between p-2 rounded border cursor-pointer select-none transition ${
                            checked
                              ? "bg-teal-50/80 border-teal-300 text-teal-950"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
                            />
                            <div>
                              <span className="font-semibold text-xs block">{b.branch_name}</span>
                              <span className="text-[10px] text-slate-500">District: {b.district}</span>
                            </div>
                          </div>
                          {checked && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                isPrimary
                                  ? "bg-slate-800 text-white font-bold"
                                  : "bg-teal-100 text-teal-800"
                              }`}
                            >
                              {isPrimary ? "Primary Base" : "Auxiliary"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tip: The first selected station acts as the primary headquarters base. Full administrators retain cross-branch inspection authority system-wide.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-3.5 py-2 rounded border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingUser}
                    className="px-5 py-2 rounded bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50"
                  >
                    {savingUser ? "Saving Changes..." : "Save User & Assignments"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetModalUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-sm w-full shadow-lg space-y-4">
              <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm">Reset User Password</h3>
              </div>

              <p className="text-xs text-slate-600">
                Enter a new password for account <strong className="text-blue-700">{resetModalUser.username}</strong>.
              </p>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetting}
                    className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-800 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {resetting ? "Resetting..." : "Save New Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={!!deleteModalUser}
          title="Delete User Account"
          itemType="User Account"
          itemName={deleteModalUser ? `${deleteModalUser.username} (User #${deleteModalUser.user_id})` : ""}
          warningDetails="Deleting this user account will permanently remove their authentication credentials and revoke their role assignments. Any historical activity or audit references will be preserved with a disassociated user reference."
          isDeleting={deletingUser}
          error={deleteError}
          onConfirm={handleDeleteUser}
          onClose={() => setDeleteModalUser(null)}
        />
      </div>
    </AppShell>
  );
}
