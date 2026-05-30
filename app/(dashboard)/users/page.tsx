"use client";

import { useState, useEffect } from "react";
import { Eye, Loader2, ArrowLeft, Download, SlidersHorizontal, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Topbar from "@/components/layout/Navbar";
import { PageLoader } from "@/components/ui/Loader";
import UserDetail, { type User } from "@/components/users/UserDetail";
import Modal from "@/components/ui/Modal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchUsers, fetchUserById, removeUser, clearSelected,
  suspendUserThunk, activateUserThunk,
} from "@/lib/redux/usersSlice";
import { downloadReport } from "@/lib/api/reportApi";
import type { ApiUser } from "@/lib/api/usersApi";

// ── Helpers ───────────────────────────────────────────────
const normalizeStatus = (raw: string): User["status"] => {
  if (!raw || typeof raw !== "string") return "Active";
  const map: Record<string, User["status"]> = {
    active: "Active", tier1: "Tier 1", tier2: "Tier 2", tier3: "Tier 3",
    "tier 1": "Tier 1", "tier 2": "Tier 2", "tier 3": "Tier 3",
    pending: "Pending", suspended: "Suspended",
  };
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return map[raw.toLowerCase()] ?? (cap(raw) as User["status"]);
};

const normalizeType = (role: string): User["type"] => {
  if (!role || typeof role !== "string") return "Client";
  const map: Record<string, User["type"]> = { client: "Client", expert: "Expert", tas: "TAS" };
  return map[role.toLowerCase()] ?? "Client";
};

const toUser = (u: ApiUser, avatarSeed: number): User => ({
  id: u.id, avatarSeed, name: u.name ?? "Unknown User", email: u.email ?? "",
  username: u.username, phone: u.phone,
  type: normalizeType(u.role ?? u.mode ?? "client"),
  status: normalizeStatus(u.status),
  joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "—",
  verify: u.verify, gender: u.gender, bio: u.bio,
  verification: u.verification, category: u.category, skill: u.skill,
  services: u.services, bankDetails: u.bankDetails, document: u.document,
  paymentModel: u.paymentModel, location: u.location,
  dob: (u as unknown as Record<string, unknown>).dateOfBirth as string ?? u.dob,
  referral: u.referral,
  account: u.account ?? (u.bankDetails ? {
    bankName:      (u.bankDetails as Record<string, string>).bankName,
    accountNumber: (u.bankDetails as Record<string, string>).accountNo,
  } : undefined),
});

const seedMap    = new Map<string, number>();
const jobCountMap = new Map<string, number>(); // cached from detail fetches

const FILTER_OPTIONS = ["All Users", "Client", "Expert", "TAS"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

const PAGE_SIZE = 10;

// ── Status pill ───────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const s = status ?? "";
  let color = "#6B7280", bg = "#F9FAFB", border = "1px solid #E5E7EB";
  if (s === "Active")                                  { color = "#15803d"; bg = "#f0fdf4"; border = "1px solid #bbf7d0"; }
  else if (["Tier 1","Tier 2","Tier 3"].includes(s))   { color = "#7c3aed"; bg = "#f5f3ff"; border = "1px solid #ddd6fe"; }
  else if (s === "Pending")                            { color = "#d97706"; bg = "#fffbeb"; border = "1px solid #fde68a"; }
  else if (s === "Suspended")                          { color = "#dc2626"; bg = "#fef2f2"; border = "1px solid #fecaca"; }
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 12px", borderRadius: "20px", whiteSpace: "nowrap", color, backgroundColor: bg, border }}>
      {s}
    </span>
  );
}

export default function UsersPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, selected, selectedStatus } = useAppSelector((s) => s.users);

  const [filter,         setFilter]         = useState<FilterOption>("All Users");
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);
  const [downloading,    setDownloading]    = useState(false);
  const [deleteOpen,     setDeleteOpen]     = useState(false);
  const [deleteLoading,  setDeleteLoading]  = useState(false);
  const [suspendOpen,    setSuspendOpen]    = useState(false);
  const [suspendLoading, setSuspendLoading] = useState(false);

  useEffect(() => { if (listStatus === "idle") dispatch(fetchUsers()); }, [dispatch, listStatus]);
  useEffect(() => { list.forEach((u, i) => { if (!seedMap.has(u.id)) seedMap.set(u.id, i); }); }, [list]);

  const handleBack     = () => dispatch(clearSelected());
  const handleViewUser = (userId: string) => {
    const found = list.find((u) => u.id === userId);
    dispatch(fetchUserById({ id: userId, type: found?.role?.toLowerCase() ?? "client" }));
  };

  const handleExport = async () => {
    setDownloading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const url   = await downloadReport({ reportType: "users", type: "pdf", fromDate: "2026-05-15", toDate: today });
      const a = document.createElement("a");
      a.href = url; a.download = `users_report_${today}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Users report downloaded");
    } catch { toast.error("Failed to download users report"); }
    finally { setDownloading(false); }
  };

  const handleDelete = () => {
    if (!selected) return;
    const rawUser = (selected as unknown as Record<string, unknown>).user as ApiUser ?? selected;
    setDeleteLoading(true);
    dispatch(removeUser({ type: rawUser.role ?? "client", id: rawUser.id }))
      .unwrap()
      .then(() => { toast.success("User deleted"); setDeleteOpen(false); handleBack(); })
      .catch((err: string) => toast.error("Delete failed", { description: err }))
      .finally(() => setDeleteLoading(false));
  };

  const handleSuspend = () => {
    if (!selected) return;
    const rawUser = (selected as unknown as Record<string, unknown>).user as ApiUser ?? selected;
    const isSuspended = rawUser.status?.toLowerCase() === "suspended";
    setSuspendLoading(true);
    dispatch((isSuspended ? activateUserThunk : suspendUserThunk)({ type: rawUser.role ?? "client", id: rawUser.id }))
      .unwrap()
      .then(() => { toast.success(isSuspended ? `${rawUser.name} reinstated` : `${rawUser.name} suspended`); setSuspendOpen(false); handleBack(); })
      .catch((err: string) => toast.error(isSuspended ? "Reinstate failed" : "Suspend failed", { description: err }))
      .finally(() => setSuspendLoading(false));
  };

  // ── Detail view states ────────────────────────────────
  if (selectedStatus === "loading") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="User Management" /><PageLoader text="Loading user..." />
    </div>
  );

  if (selectedStatus === "failed") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="User Management" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "12px" }}>
        <p style={{ fontSize: "14px", color: "#ef4444" }}>Failed to load user.</p>
        <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Users
        </button>
      </div>
    </div>
  );

  if (selectedStatus === "succeeded" && selected) {
    // API returns { user: {...}, jobs: [...] } — unwrap correctly
    const rawUser  = (selected as unknown as Record<string, unknown>).user as ApiUser ?? selected;
    const rawJobs  = (selected as unknown as Record<string, unknown>).jobs as Record<string, unknown>[] ?? [];

    // Cache job count so it shows in the list table
    if (rawUser.id) jobCountMap.set(rawUser.id, rawJobs.length);

    const detailUser = {
      ...toUser(rawUser, seedMap.get(rawUser.id ?? selected.id) ?? 0),
      // Map jobs from API shape to UserJob shape
      jobs: rawJobs.map((j) => ({
        id:      String(j.id ?? ""),
        info:    `${j.title ?? j.category ?? "—"}${j.location ? ` - ${(j.location as Record<string,string>).city ?? ""}` : ""}`,
        payment: Number((j.budget as Record<string,unknown>)?.amount ?? 0),
        notes:   j.closed ? "Completed" : j.verified ? "In-progress" : "Open",
        review:  Array.isArray(j.reviews) && (j.reviews as unknown[]).length > 0
          ? String((j.reviews as Record<string,unknown>[])[0]?.comment ?? "")
          : undefined,
      })),
    };
    const isSuspended = detailUser.status === "Suspended";
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <Topbar title="User Management" />
        <UserDetail user={detailUser} onBack={handleBack} onDelete={() => setDeleteOpen(true)} onSuspend={() => setSuspendOpen(true)} />
        <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title={isSuspended ? "Reinstate User" : "Suspend User"} size="sm"
          footer={<div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setSuspendOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #D1D5DB", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleSuspend} disabled={suspendLoading} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: isSuspended ? "#16a34a" : "#f59e0b", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: suspendLoading ? 0.7 : 1 }}>
              {suspendLoading ? <><Loader2 size={14} className="animate-spin" />{isSuspended ? "Reinstating..." : "Suspending..."}</> : isSuspended ? "Reinstate" : "Suspend"}
            </button>
          </div>}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            {isSuspended
              ? <>Reinstate <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? They will regain full access.</>
              : <>Suspend <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? They will lose access until reinstated.</>}
          </p>
        </Modal>
        <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm"
          footer={<div style={{ display: "flex", gap: "12px", width: "100%" }}>
            <button onClick={() => setDeleteOpen(false)} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid #D1D5DB", backgroundColor: "var(--color-surface)", fontSize: "13px", cursor: "pointer", color: "var(--color-text-muted)" }}>Cancel</button>
            <button onClick={handleDelete} disabled={deleteLoading} style={{ flex: 1, padding: "10px", borderRadius: "10px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: deleteLoading ? 0.7 : 1 }}>
              {deleteLoading ? <><Loader2 size={14} className="animate-spin" />Deleting...</> : "Delete"}
            </button>
          </div>}>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Delete <strong style={{ color: "var(--color-text-main)" }}>{detailUser.name}</strong>? This cannot be undone.
          </p>
        </Modal>
      </div>
    );
  }

  // ── List view ─────────────────────────────────────────
  const users = list.map((u) => toUser(u, seedMap.get(u.id) ?? 0));

  const filtered = users.filter((u) => {
    if (filter !== "All Users" && u.type !== filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) &&
                  !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  const TH: React.CSSProperties = {
    textAlign: "left", padding: "14px 24px",
    fontSize: "12px", fontWeight: 600, color: "#9CA3AF",
    borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap",
    backgroundColor: "#fff",
  };
  const TD: React.CSSProperties = {
    padding: "16px 24px", fontSize: "13px",
    color: "#374151", borderBottom: "1px solid #F3F4F6",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F9FAFB" }}>
      <Topbar title="User Management" />

      <style>{`
        .users-wrap { padding: 20px 24px; }
        @media (min-width: 640px) { .users-wrap { padding: 24px 32px; } }
        .users-table-wrap { display: none; }
        .users-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px; }
        .users-pgn { flex-direction: column; gap: 8px; }
        @media (min-width: 768px) {
          .users-table-wrap { display: block; }
          .users-cards { display: none; }
          .users-pgn { flex-direction: row; align-items: center; }
        }
      `}</style>

      <div className="users-wrap" style={{ flex: 1 }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>Manage all users</p>
        </div>

        <div style={{ backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #E5E7EB", overflow: "hidden" }}>

          {/* Filter bar */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F3F4F6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
              <SlidersHorizontal size={14} color="#6B7280" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>Filter</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                <svg style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" placeholder="Search name..." value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: "100%", paddingLeft: "38px", paddingRight: "14px", paddingTop: "9px", paddingBottom: "9px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative" }}>
                <select value={filter} onChange={(e) => { setFilter(e.target.value as FilterOption); setPage(1); }}
                  style={{ padding: "9px 36px 9px 14px", borderRadius: "10px", fontSize: "13px", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#374151", outline: "none", appearance: "none", cursor: "pointer", minWidth: "130px" }}>
                  {FILTER_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#6B7280", pointerEvents: "none" }} />
              </div>
              <button onClick={handleExport} disabled={downloading}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#374151", cursor: "pointer", opacity: downloading ? 0.7 : 1, whiteSpace: "nowrap" }}>
                {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                Export
              </button>
            </div>
          </div>

          {listStatus === "loading" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px", gap: "10px", color: "#9CA3AF" }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontSize: "13px" }}>Loading users...</span>
            </div>
          )}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "64px", fontSize: "13px", color: "#ef4444" }}>Failed to load users.</p>
          )}

          {listStatus === "succeeded" && (
            <>
              <div className="users-table-wrap" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={TH}>Name</th>
                      <th style={TH}>Type</th>
                      <th style={TH}>Status</th>
                      <th style={TH}>Joined</th>
                      <th style={TH}>Jobs</th>
                      <th style={TH}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "64px", fontSize: "14px", color: "#9CA3AF" }}>No users found.</td></tr>
                    ) : paginated.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={TD}><p style={{ fontWeight: 600, color: "#111827", fontSize: "13px", margin: 0 }}>{u.name}</p></td>
                        <td style={{ ...TD, color: "#6B7280" }}>{u.type}</td>
                        <td style={TD}><StatusPill status={u.status} /></td>
                        <td style={{ ...TD, color: "#6B7280" }}>{u.joined}</td>
                        <td style={{ ...TD, color: "#6B7280" }}>
                          {u.type === "TAS"
                            ? "N/A"
                            : jobCountMap.has(u.id)
                              ? String(jobCountMap.get(u.id))
                              : String((u as unknown as Record<string, unknown>).jobCount ?? "—")}
                        </td>
                        <td style={TD}>
                          <button onClick={() => handleViewUser(u.id)} title="View user"
                            style={{ padding: "4px", borderRadius: "6px", border: "none", background: "none", cursor: "pointer", color: "#6B7280", display: "flex", alignItems: "center" }}>
                            <Eye size={18} strokeWidth={1.6} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="users-cards" style={{ backgroundColor: "#F9FAFB" }}>
                {paginated.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF" }}>No users found.</p>
                ) : paginated.map((u) => (
                  <div key={u.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "13px", color: "#111827", margin: "0 0 2px" }}>{u.name}</p>
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>{u.type} · {u.joined}</p>
                      </div>
                      <StatusPill status={u.status} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px solid #F3F4F6" }}>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>
                        Jobs: {u.type === "TAS"
                          ? "N/A"
                          : jobCountMap.has(u.id)
                            ? String(jobCountMap.get(u.id))
                            : String((u as unknown as Record<string, unknown>).jobCount ?? "—")}
                      </span>
                      <button onClick={() => handleViewUser(u.id)}
                        style={{ padding: "4px", borderRadius: "6px", border: "none", background: "none", cursor: "pointer", color: "#6B7280" }}>
                        <Eye size={17} strokeWidth={1.6} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="users-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "14px 24px", borderTop: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
                  {filtered.length === 0 ? "No results" : `Showing ${from} to ${to} of ${filtered.length} results`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: p === page ? 600 : 400, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#2563eb" : "#fff", color: p === page ? "#fff" : "#6B7280", cursor: "pointer" }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}