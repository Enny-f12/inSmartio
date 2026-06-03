/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchVerifications,
  fetchVerificationById,
  clearSelectedVerification,
  selectItemTier,
} from "@/lib/redux/verificationSlice";
import {
  normaliseVerificationStatus,
  type ApiVerificationSummary,
  type VerificationTier,
  type VerificationStatus,
} from "@/lib/api/verificationApi";
import type { LocalStatus } from "@/lib/redux/verificationSlice";

// ── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;
const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type TierLabel = (typeof TIERS)[number];

const TIER_LABEL_TO_KEY: Record<TierLabel, VerificationTier> = {
  "Tier 1": "tier1",
  "Tier 2": "tier2",
  "Tier 3": "tier3",
};

const TIER_STYLE: Record<VerificationTier, { bg: string; text: string; label: string }> = {
  tier1: { bg: "#e0f2fe", text: "#0369a1", label: "Tier 1" },
  tier2: { bg: "#fef3c7", text: "#b45309", label: "Tier 2" },
  tier3: { bg: "#ede9fe", text: "#6d28d9", label: "Tier 3" },
};

const STATUS_VARIANT: Record<VerificationStatus, "green" | "yellow" | "red"> = {
  approved: "green",
  pending:  "yellow",
  rejected: "red",
};

/**
 * Maps backend status values to frontend display statuses.
 *
 * Backend  → Frontend
 * active   → approved
 * inactive → pending
 * suspend  → rejected
 *
 * This is the single source of truth for the mapping. The existing
 * `normaliseVerificationStatus` in verificationApi.ts should be updated
 * to handle these three raw values and return the correct VerificationStatus.
 */
const STATUS_OPTIONS: { value: VerificationStatus | ""; label: string }[] = [
  { value: "",         label: "All statuses" },
  { value: "approved", label: "Approved"     },
  { value: "pending",  label: "Pending"      },
  { value: "rejected", label: "Rejected"     },
];

// ── Doc fraction helpers ─────────────────────────────────────────────────────

/**
 * Returns { submitted, total } from an ApiVerificationSummary.
 *
 * `totalDocuments` — total docs required (from backend).
 * `documents`      — either an array of VerificationDocument objects
 *                    or a plain number of submitted docs.
 *
 * When documents is an array, "submitted" = docs where verify===true
 * or status==="verified", mirroring the existing docLabel() logic.
 */
function getDocCounts(e: ApiVerificationSummary): { submitted: number; total: number } {
  const total = e.totalDocuments ?? 0;
  if (Array.isArray(e.documents)) {
    const submitted = e.documents.filter(
      (d) => d.verify === true || d.status === "verified"
    ).length;
    return { submitted, total };
  }
  const submitted = typeof e.documents === "number" ? e.documents : 0;
  return { submitted, total };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function VerificationsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus, localOverrides } =
    useAppSelector((s) => s.verifications);

  const [activeTier,   setActiveTier]   = useState<TierLabel>("Tier 1");
  const [tierSet,      setTierSet]      = useState(false);
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | "">("");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);

  // ── Data loading ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchVerifications());
  }, [dispatch, listStatus]);

  // ── Per-item derived values ────────────────────────────────────────────────

  const getStatus = (e: ApiVerificationSummary): VerificationStatus => {
    const local = localOverrides[e.id] as LocalStatus | undefined;
    if (local) return local;
    return normaliseVerificationStatus(e.status, e.verify);
  };

  const getTier = (e: ApiVerificationSummary): VerificationTier => selectItemTier(e);

  // ── Tier counts (pending items per tier, for tab badges) ──────────────────

  const tierCounts = useMemo(() => ({
    tier1: list.filter((e) => getTier(e) === "tier1").length,
    tier2: list.filter((e) => getTier(e) === "tier2").length,
    tier3: list.filter((e) => getTier(e) === "tier3").length,
  }), [list, localOverrides]);

  // Auto-select the first tier that has items (runs once after list loads)
  useEffect(() => {
    if (listStatus !== "succeeded" || tierSet) return;
    const first = TIERS.find((t) => tierCounts[TIER_LABEL_TO_KEY[t]] > 0);
    setActiveTier(first ?? "Tier 1");
    setTierSet(true);
  }, [listStatus, tierCounts, tierSet]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filtered = useMemo(() => list.filter((e) => {
    if (getTier(e) !== TIER_LABEL_TO_KEY[activeTier]) return false;
    if (statusFilter && getStatus(e) !== statusFilter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [list, activeTier, statusFilter, search, localOverrides]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTierChange = (tier: TierLabel) => {
    setActiveTier(tier);
    setPage(1);
  };

  const handleStatusFilterChange = (val: VerificationStatus | "") => {
    setStatusFilter(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleOpenDetail  = (e: ApiVerificationSummary) =>
    dispatch(fetchVerificationById({ id: e.id, summary: e }));
  const handleCloseModal  = () => dispatch(clearSelectedVerification());
  const handleStatusChange = () => dispatch(clearSelectedVerification());

  const isModalOpen = selectedStatus === "loading" || selectedStatus === "succeeded";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main      { padding: 16px; }
        .ver-pgn       { flex-direction: column; gap: 8px; align-items: flex-start; }
        .ver-row:hover { background: #F9FAFB; }
        .ver-desktop   { display: none !important; }
        .ver-mobile    { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
        @media (min-width: 640px) {
          .ver-main    { padding: 24px 32px; }
          .ver-pgn     { flex-direction: row; align-items: center; }
          .ver-desktop { display: block !important; }
          .ver-mobile  { display: none !important; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* ── Tier tabs ── */}
          <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 20px" }}>
            {TIERS.map((tier) => {
              const isActive = tier === activeTier;
              const count    = tierCounts[TIER_LABEL_TO_KEY[tier]];
              return (
                <button key={tier}
                  onClick={() => handleTierChange(tier)}
                  style={{
                    padding: "14px 20px", fontSize: "13px", fontWeight: 600, border: "none",
                    background: "none", cursor: "pointer",
                    color: isActive ? "#111827" : "#6B7280",
                    borderBottom: isActive ? "2px solid #16a34a" : "2px solid transparent",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                  {tier}
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "999px",
                    backgroundColor: isActive ? "#16a34a" : "#E5E7EB",
                    color: isActive ? "#fff" : "#6B7280",
                  }}>
                    {listStatus === "loading" ? "…" : count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Toolbar: search + status filter ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 20px", borderBottom: "1px solid #E5E7EB", flexWrap: "wrap" }}>
            {/* Search */}
            <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                type="text"
                placeholder="Search name…"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                style={{
                  width: "100%", paddingLeft: "40px", paddingRight: "16px",
                  paddingTop: "10px", paddingBottom: "10px",
                  borderRadius: "10px", fontSize: "13px", outline: "none",
                  border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
                  color: "#111827", boxSizing: "border-box",
                }} />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as VerificationStatus | "")}
              style={{
                padding: "10px 14px", borderRadius: "10px", fontSize: "13px",
                border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
                color: "#111827", outline: "none", cursor: "pointer", minWidth: "140px",
              }}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Loading / error ── */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", gap: "8px", color: "#9CA3AF", fontSize: "14px" }}>
              <Loader2 size={18} className="animate-spin" /> Loading verifications…
            </div>
          )}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus !== "loading" && (
            <>
              {/* ── Desktop table ── */}
              <div className="ver-desktop" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {["Name", "Tier", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>
                          No verifications found.
                        </td>
                      </tr>
                    ) : paginated.map((expert) => {
                      const tier              = getTier(expert);
                      const ts                = TIER_STYLE[tier];
                      const st                = getStatus(expert);
                      const { submitted: docsIn, total: docsTotal } = getDocCounts(expert);
                      const docsComplete      = docsIn === docsTotal;
                      const docsNone          = docsIn === 0;
                      return (
                        <tr key={expert.id} className="ver-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                          <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{expert.name}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: ts.text, backgroundColor: ts.bg, padding: "3px 10px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                              {ts.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "13px", color: "#6B7280" }}>
                            {expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <StatusBadge label={st} variant={STATUS_VARIANT[st]} />
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
                            <span style={{ fontWeight: 600, color: docsComplete ? "#15803d" : docsNone ? "#9CA3AF" : "#111827" }}>{docsIn}</span>
                            <span style={{ color: "#D1D5DB", margin: "0 1px" }}>/</span>
                            <span style={{ color: "#6B7280" }}>{docsTotal}</span>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <button onClick={() => handleOpenDetail(expert)}
                              style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                              <Eye size={17} strokeWidth={1.8} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="ver-mobile">
                {paginated.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF", margin: 0 }}>
                    No verifications found.
                  </p>
                ) : paginated.map((expert) => {
                  const tier              = getTier(expert);
                  const ts                = TIER_STYLE[tier];
                  const st                = getStatus(expert);
                  const { submitted: docsIn, total: docsTotal } = getDocCounts(expert);
                  const docsComplete      = docsIn === docsTotal;
                  const docsNone          = docsIn === 0;
                  return (
                    <div key={expert.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: 0 }}>{expert.name}</p>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: ts.text, backgroundColor: ts.bg, padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap" }}>
                            {ts.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <StatusBadge label={st} variant={STATUS_VARIANT[st]} />
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>
                            {expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}
                          </span>
                          <span style={{ fontSize: "12px", color: "#6B7280", fontVariantNumeric: "tabular-nums" }}>
                            Docs:{" "}
                            <span style={{ fontWeight: 600, color: docsComplete ? "#15803d" : docsNone ? "#9CA3AF" : "#374151" }}>{docsIn}</span>
                            <span style={{ color: "#D1D5DB", margin: "0 1px" }}>/</span>
                            <span>{docsTotal}</span>
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleOpenDetail(expert)}
                        style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
                        <Eye size={16} strokeWidth={1.8} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ── Pagination ── */}
              <div className="ver-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                  {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#fff", color: p === page ? "#fff" : "#6B7280", cursor: "pointer" }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {isModalOpen && (
        <VerificationModal
          expert={selected}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}