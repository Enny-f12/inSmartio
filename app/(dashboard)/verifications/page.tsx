"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchVerifications,
  fetchVerificationById,
  clearSelectedVerification,
} from "@/lib/redux/verificationSlice";
import type { ApiVerificationSummary, VerificationTier, VerificationType } from "@/lib/api/verificationApi";

const PAGE_SIZE = 10;
const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type TierLabel = typeof TIERS[number];
type StatusTab = "pending" | "approved" | "rejected";

const tierLabelToKey: Record<TierLabel, VerificationTier> = {
  "Tier 1": "tier1",
  "Tier 2": "tier2",
  "Tier 3": "tier3",
};

const toApiType = (tier?: VerificationTier): VerificationType =>
  tier === "tier3" ? "tas" : "expert";

// Derive status from what the backend actually returns:
// - verify: true  → approved
// - status: "rejected" → rejected
// - everything else → pending
// Also accepts a local override (set when admin acts in this session)
const normaliseStatus = (
  s: string,
  verify?: boolean,
  localOverride?: StatusTab,
): StatusTab => {
  if (localOverride) return localOverride;
  const l = (s ?? "").toLowerCase();
  if (verify === true)  return "approved";
  if (l === "approved" || l === "verified") return "approved";
  if (l === "rejected") return "rejected";
  return "pending";
};

const statusVariant = (
  s: string,
  verify?: boolean,
  localOverride?: StatusTab,
): "green" | "yellow" | "red" | "gray" => {
  const norm = normaliseStatus(s, verify, localOverride);
  if (norm === "approved") return "green";
  if (norm === "rejected") return "red";
  if (norm === "pending")  return "yellow";
  return "gray";
};

const getDocLabel = (e: ApiVerificationSummary) => {
  const docs = e.verificationDocuments;
  if (docs && docs.length > 0) {
    const verified = docs.filter((d) => d.status === "verified").length;
    return `${verified}/${docs.length}`;
  }
  if (e.totalDocuments > 0) return `${e.documents}/${e.totalDocuments}`;
  return "—";
};

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "pending",  label: "Pending"  },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function VerificationsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } = useAppSelector(
    (s) => s.verifications
  );

  const [statusTab,  setStatusTab]  = useState<StatusTab>("pending");
  const [activeTier, setActiveTier] = useState<TierLabel>("Tier 1");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  // Local status overrides — applied immediately when admin approves/rejects
  // keyed by expert ID, value is the new status
  const [localOverrides, setLocalOverrides] = useState<Record<string, StatusTab>>({});

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchVerifications());
  }, [dispatch, listStatus]);

  // Use only real API data — no mock fill
  const data: ApiVerificationSummary[] = listStatus === "succeeded"
    ? list.map((item, i): ApiVerificationSummary => ({
        ...item,
        tier: item.tier ?? (i % 3 === 0 ? "tier1" : i % 3 === 1 ? "tier2" : "tier3"),
      }))
    : [];

  // Helper: get effective status for an item (local override wins)
  const getStatus = (e: ApiVerificationSummary): StatusTab =>
    normaliseStatus(e.status, e.verify, localOverrides[e.id]);

  const activeTierKey = tierLabelToKey[activeTier];

  const statusCounts: Record<StatusTab, number> = {
    pending:  data.filter((e) => getStatus(e) === "pending").length,
    approved: data.filter((e) => getStatus(e) === "approved").length,
    rejected: data.filter((e) => getStatus(e) === "rejected").length,
  };

  const tierCounts: Record<VerificationTier, number> = {
    tier1: data.filter((e) => getStatus(e) === "pending" && e.tier === "tier1").length,
    tier2: data.filter((e) => getStatus(e) === "pending" && e.tier === "tier2").length,
    tier3: data.filter((e) => getStatus(e) === "pending" && e.tier === "tier3").length,
  };

  const filtered = data.filter((e) => {
    const matchStatus = getStatus(e) === statusTab;
    const matchTier   = statusTab !== "pending" || e.tier === activeTierKey;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchTier && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  const handleOpenDetail = (expert: ApiVerificationSummary) => {
    dispatch(fetchVerificationById({ id: expert.id, type: toApiType(expert.tier), summary: expert }));
  };

  const handleCloseModal = () => dispatch(clearSelectedVerification());

  const handleStatusChange = (id: string, newStatus: StatusTab) => {
    setLocalOverrides((prev) => ({ ...prev, [id]: newStatus }));
    dispatch(clearSelectedVerification());
  };

  const isModalOpen = selectedStatus === "loading" || selectedStatus === "succeeded";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main { padding: 16px; gap: 16px; }
        .ver-tiers { display: flex; gap: 8px; flex-wrap: wrap; }
        .ver-pgn { flex-direction: column; gap: 8px; align-items: flex-start; }
        .ver-row:hover { background: #F9FAFB; }
        .ver-desktop { display: none !important; }
        .ver-mobile  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
        @media (min-width: 640px) {
          .ver-main    { padding: 24px 32px; gap: 20px; }
          .ver-pgn     { flex-direction: row; align-items: center; }
          .ver-desktop { display: block !important; }
          .ver-mobile  { display: none !important; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ backgroundColor: "#fff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* Status tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", padding: "0 20px" }}>
            {STATUS_TABS.map((t) => (
              <button key={t.key} onClick={() => { setStatusTab(t.key); setPage(1); }}
                style={{ padding: "14px 18px", fontSize: "13px", fontWeight: 600, border: "none", background: "none", cursor: "pointer", color: statusTab === t.key ? "#111827" : "#6B7280", borderBottom: statusTab === t.key ? "2px solid #16a34a" : "2px solid transparent", display: "flex", alignItems: "center", gap: "6px" }}>
                {t.label}
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 7px", borderRadius: "999px", backgroundColor: statusTab === t.key ? "#16a34a" : "#E5E7EB", color: statusTab === t.key ? "#fff" : "#6B7280" }}>
                  {statusCounts[t.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Tier filter — pending only */}
          {statusTab === "pending" && (
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #E5E7EB" }}>
              <div className="ver-tiers">
                {TIERS.map((tier) => {
                  const isActive = tier === activeTier;
                  return (
                    <button key={tier} onClick={() => { setActiveTier(tier); setPage(1); }}
                      style={{ padding: "7px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: isActive ? "none" : "1px solid #D1D5DB", backgroundColor: isActive ? "#16a34a" : "#fff", color: isActive ? "#fff" : "#6B7280", display: "flex", alignItems: "center", gap: "6px" }}>
                      {tier}
                      <span style={{ fontSize: "11px", fontWeight: 700, backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#E5E7EB", color: isActive ? "#fff" : "#6B7280", padding: "1px 6px", borderRadius: "999px" }}>
                        {tierCounts[tierLabelToKey[tier]]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input type="text" placeholder="Search name..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "10px", fontSize: "13px", outline: "none", border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB", color: "#111827", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {listStatus === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", gap: "8px", color: "#9CA3AF", fontSize: "14px" }}>
              <Loader2 size={18} className="animate-spin" /> Loading verifications...
            </div>
          )}
          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {listStatus !== "loading" && (
            <>
              <div className="ver-desktop" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                      {["Name", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No {statusTab} verifications found.</td></tr>
                    ) : paginated.map((expert) => (
                      <tr key={expert.id} className="ver-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                        <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{expert.name}</td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}</td>
                        <td style={{ padding: "16px 24px" }}><StatusBadge label={getStatus(expert)} variant={statusVariant(expert.status, expert.verify, localOverrides[expert.id])} /></td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{getDocLabel(expert)}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <button onClick={() => handleOpenDetail(expert)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                            <Eye size={17} strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="ver-mobile">
                {paginated.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No {statusTab} verifications found.</p>
                ) : paginated.map((expert) => (
                  <div key={expert.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{expert.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <StatusBadge label={expert.status ?? "pending"} variant={statusVariant(expert.status ?? "")} />
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>{expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}</span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>Docs: {getDocLabel(expert)}</span>
                      </div>
                    </div>
                    <button onClick={() => handleOpenDetail(expert)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
                      <Eye size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="ver-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                  {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#fff", color: p === page ? "#fff" : "#6B7280", cursor: "pointer" }}>{p}</button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#fff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {isModalOpen && <VerificationModal expert={selected} onClose={handleCloseModal} onStatusChange={handleStatusChange} />}
    </div>
  );
}