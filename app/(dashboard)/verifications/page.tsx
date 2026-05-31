/* eslint-disable react-hooks/set-state-in-effect */
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
  docLabel,
  normaliseVerificationStatus,
  type ApiVerificationSummary,
  type VerificationTier,
  type VerificationStatus,
} from "@/lib/api/verificationApi";
import type { LocalStatus } from "@/lib/redux/verificationSlice";

const PAGE_SIZE = 10;
const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type TierLabel = (typeof TIERS)[number];

const TIER_LABEL_TO_KEY: Record<TierLabel, VerificationTier> = {
  "Tier 1": "tier1",
  "Tier 2": "tier2",
  "Tier 3": "tier3",
};

const TIER_STYLE: Record<VerificationTier, { bg: string; text: string; label: string }> = {
  tier1: { bg: "#dcfce7", text: "#15803d", label: "Tier 1" },
  tier2: { bg: "#fef3c7", text: "#b45309", label: "Tier 2" },
  tier3: { bg: "#ede9fe", text: "#6d28d9", label: "Tier 3" },
};

const STATUS_VARIANT: Record<VerificationStatus, "green" | "yellow" | "red"> = {
  approved: "green",
  pending:  "yellow",
  rejected: "red",
};

const STATUS_TABS: { key: VerificationStatus; label: string }[] = [
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function VerificationsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus, localOverrides } =
    useAppSelector((s) => s.verifications);

  const [statusTab,  setStatusTab]  = useState<VerificationStatus>("pending");
  const [activeTier, setActiveTier] = useState<TierLabel>("Tier 1");
  const [tierSet,    setTierSet]    = useState(false); // has auto-select run?
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchVerifications());
  }, [dispatch, listStatus]);

  // ── Per-item derived values ───────────────────────────────────────────────

  const getStatus = (e: ApiVerificationSummary): VerificationStatus => {
    const local = localOverrides[e.id] as LocalStatus | undefined;
    if (local) return local;
    return normaliseVerificationStatus(e.status, e.verify);
  };

  const getTier = (e: ApiVerificationSummary): VerificationTier =>
    selectItemTier(e);

  // ── Counts (memoised so auto-select effect sees stable values) ────────────

  const statusCounts = useMemo(() => ({
    pending:  list.filter((e) => getStatus(e) === "pending").length,
    approved: list.filter((e) => getStatus(e) === "approved").length,
    rejected: list.filter((e) => getStatus(e) === "rejected").length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [list, localOverrides]);

  const tierCounts = useMemo(() => ({
    tier1: list.filter((e) => getStatus(e) === "pending" && getTier(e) === "tier1").length,
    tier2: list.filter((e) => getStatus(e) === "pending" && getTier(e) === "tier2").length,
    tier3: list.filter((e) => getStatus(e) === "pending" && getTier(e) === "tier3").length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [list, localOverrides]);

  // Auto-select the first tier that has pending items (runs once after list loads)
  useEffect(() => {
    if (listStatus !== "succeeded" || tierSet) return;
    const first = TIERS.find((t) => tierCounts[TIER_LABEL_TO_KEY[t]] > 0);
    if (first) {
      setActiveTier(first);
      setTierSet(true);
    } else {
      // No pending items in any tier — default to Tier 1 and stop trying
      setTierSet(true);
    }
  }, [listStatus, tierCounts, tierSet]);

  // ── Filtering ─────────────────────────────────────────────────────────────

  const filtered = useMemo(() => list.filter((e) => {
    if (getStatus(e) !== statusTab) return false;
    if (statusTab === "pending" && getTier(e) !== TIER_LABEL_TO_KEY[activeTier]) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [list, statusTab, activeTier, search, localOverrides]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleOpenDetail = (e: ApiVerificationSummary) =>
    dispatch(fetchVerificationById({ id: e.id, summary: e }));

  const handleCloseModal   = () => dispatch(clearSelectedVerification());
  const handleStatusChange = () => dispatch(clearSelectedVerification());

  const isModalOpen = selectedStatus === "loading" || selectedStatus === "succeeded";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main    { padding: 16px; }
        .ver-tiers   { display: flex; gap: 8px; flex-wrap: wrap; }
        .ver-pgn     { flex-direction: column; gap: 8px; align-items: flex-start; }
        .ver-row:hover { background: #F9FAFB; }
        .ver-desktop { display: none !important; }
        .ver-mobile  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
        @media (min-width: 640px) {
          .ver-main    { padding: 24px 32px; }
          .ver-pgn     { flex-direction: row; align-items: center; }
          .ver-desktop { display: block !important; }
          .ver-mobile  { display: none !important; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* ── Status tabs ── */}
          <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 20px" }}>
            {STATUS_TABS.map((t) => (
              <button key={t.key}
                onClick={() => { setStatusTab(t.key); setPage(1); }}
                style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: statusTab === t.key ? "#111827" : "#6B7280", borderBottom: statusTab === t.key ? "2px solid #16a34a" : "2px solid transparent", display: "flex", alignItems: "center", gap: "6px" }}>
                {t.label}
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "999px", backgroundColor: statusTab === t.key ? "#16a34a" : "#E5E7EB", color: statusTab === t.key ? "#fff" : "#6B7280" }}>
                  {statusCounts[t.key]}
                </span>
              </button>
            ))}
          </div>

          {/* ── Tier pills (pending tab only) ── */}
          {statusTab === "pending" && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <div className="ver-tiers">
                {TIERS.map((tier) => {
                  const isActive = tier === activeTier;
                  const count    = tierCounts[TIER_LABEL_TO_KEY[tier]];
                  return (
                    <button key={tier}
                      onClick={() => { setActiveTier(tier); setPage(1); }}
                      style={{ padding: "7px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: isActive ? "none" : "1px solid #D1D5DB", backgroundColor: isActive ? "#16a34a" : "#fff", color: isActive ? "#fff" : "#6B7280", display: "flex", alignItems: "center", gap: "6px", opacity: count === 0 && !isActive ? 0.45 : 1 }}>
                      {tier}
                      <span style={{ fontSize: "11px", fontWeight: 700, backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#E5E7EB", color: isActive ? "#fff" : "#6B7280", padding: "1px 6px", borderRadius: "999px" }}>
                        {listStatus === "loading" ? "…" : count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Search ── */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input type="text" placeholder="Search name..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }} />
            </div>
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
                          No {statusTab} verifications{statusTab === "pending" ? ` in ${activeTier}` : ""}.
                        </td>
                      </tr>
                    ) : paginated.map((expert) => {
                      const tier = getTier(expert);
                      const ts   = TIER_STYLE[tier];
                      const st   = getStatus(expert);
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
                          <td style={{ padding: "14px 20px", fontSize: "13px", color: "#6B7280" }}>
                            {docLabel(expert)}
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
                    No {statusTab} verifications{statusTab === "pending" ? ` in ${activeTier}` : ""}.
                  </p>
                ) : paginated.map((expert) => {
                  const tier = getTier(expert);
                  const ts   = TIER_STYLE[tier];
                  const st   = getStatus(expert);
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
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>Docs: {docLabel(expert)}</span>
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