// app/(dashboard)/verifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchVerifications,
  selectVerification,
  clearSelectedVerification,
} from "@/lib/redux/verificationSlice";
import type { ApiVerificationSummary, VerificationTier } from "@/lib/api/verificationApi";

const PAGE_SIZE = 10;
const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type TierLabel = typeof TIERS[number];

const tierLabelToKey: Record<TierLabel, VerificationTier> = {
  "Tier 1": "tier1",
  "Tier 2": "tier2",
  "Tier 3": "tier3",
};

// ── Mock data — used when API returns nothing or as tier fill ──
const MOCK_VERIFICATIONS: ApiVerificationSummary[] = [
  {
    id: "mock-t1-1", name: "Emeka O.", email: "emeka@email.com", phone: "+234 801 234 5678",
    status: "active", submitted: "2026-03-20T10:00:00.000Z",
    documents: 3, totalDocuments: 3, tier: "tier1",
    appliedTier: "Tier 1", verificationFee: "₦500 · Paid on 20/03/2026",
    verificationDocuments: [
      { name: "NIN Slip",            url: "#", status: "verified" },
      { name: "Valid ID (National ID)", url: "#", status: "verified" },
      { name: "Passport Photograph", url: "#", status: "verified" },
    ],
    ninVerification: { ninNumber: "12345678901", ninStatus: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: "mock-t1-2", name: "Ngozi E.", email: "ngozi@email.com", phone: "+234 802 345 6789",
    status: "active", submitted: "2026-03-21T09:00:00.000Z",
    documents: 3, totalDocuments: 3, tier: "tier1",
    appliedTier: "Tier 1", verificationFee: "₦500 · Paid on 21/03/2026",
    verificationDocuments: [
      { name: "NIN Slip",            url: "#", status: "verified" },
      { name: "Valid ID (National ID)", url: "#", status: "verified" },
      { name: "Passport Photograph", url: "#", status: "verified" },
    ],
    ninVerification: { ninNumber: "98765432100", ninStatus: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: "mock-t1-3", name: "Peter O.", email: "peter@email.com", phone: "+234 803 456 7891",
    status: "active", submitted: "2026-03-18T08:00:00.000Z",
    documents: 1, totalDocuments: 3, tier: "tier1",
    appliedTier: "Tier 1",
    verificationDocuments: [
      { name: "NIN Slip",            url: "#", status: "verified" },
      { name: "Valid ID (National ID)",         status: "pending" },
      { name: "Passport Photograph",            status: "pending" },
    ],
  },
  // ── Tier 2 ──
  {
    id: "mock-t2-1", name: "Chidi E.", email: "chidi@email.com", phone: "+234 803 456 7890",
    status: "active", submitted: "2026-03-19T11:00:00.000Z",
    documents: 7, totalDocuments: 7, tier: "tier2",
    appliedTier: "Tier 2", verificationFee: "₦1,500 · Paid on 18/03/2026",
    verificationDocuments: [
      { name: "NIN Slip",              url: "#", status: "verified" },
      { name: "BVN Consent Form",      url: "#", status: "verified" },
      { name: "Valid ID (National ID)",url: "#", status: "verified" },
      { name: "Passport Photograph",   url: "#", status: "verified" },
      { name: "Proof of Address",      url: "#", status: "verified" },
      { name: "Guarantor Form",        url: "#", status: "pending"  },
      { name: "Police Clearance",      url: "#", status: "pending"  },
    ],
    guarantor: { name: "Chief Okafor M.", phone: "+234 809 876 5432", occupation: "Civil Servant (Level 14)" },
    policeClearance: { certificateNo: "PC-2026-12345", issued: "10/03/2026 (within 6 months)", issuingState: "Lagos", status: "Verify Online" },
  },
  {
    id: "mock-t2-2", name: "Mary K.", email: "mary@email.com", phone: "+234 804 567 8901",
    status: "active", submitted: "2026-03-17T14:00:00.000Z",
    documents: 5, totalDocuments: 7, tier: "tier2",
    appliedTier: "Tier 2", verificationFee: "₦1,500 · Paid on 17/03/2026",
    verificationDocuments: [
      { name: "NIN Slip",              url: "#", status: "verified" },
      { name: "BVN Consent Form",      url: "#", status: "verified" },
      { name: "Valid ID (National ID)",url: "#", status: "verified" },
      { name: "Passport Photograph",   url: "#", status: "verified" },
      { name: "Proof of Address",      url: "#", status: "verified" },
      { name: "Guarantor Form",                  status: "pending"  },
      { name: "Police Clearance",                status: "pending"  },
    ],
    guarantor: { name: "Alhaji Musa B.", phone: "+234 811 234 5678", occupation: "Business Owner" },
  },
  // ── Tier 3 ──
  {
    id: "mock-t3-1", name: "James A.", email: "james@email.com", phone: "+234 805 678 9012",
    status: "active", submitted: "2026-03-16T10:00:00.000Z",
    documents: 2, totalDocuments: 3, tier: "tier3",
    appliedTier: "Tier 3", verificationFee: "₦3,000 · Paid on 16/03/2026",
    verificationDocuments: [
      { name: "NIN Slip",              url: "#", status: "verified" },
      { name: "BVN Consent Form",      url: "#", status: "verified" },
      { name: "CAC Certificate",                 status: "pending"  },
    ],
  },
  {
    id: "mock-t3-2", name: "Fatima B.", email: "fatima@email.com", phone: "+234 806 789 0123",
    status: "active", submitted: "2026-03-14T08:00:00.000Z",
    documents: 3, totalDocuments: 3, tier: "tier3",
    appliedTier: "Tier 3", verificationFee: "₦3,000 · Paid on 14/03/2026",
    verificationDocuments: [
      { name: "NIN Slip",       url: "#", status: "verified" },
      { name: "BVN Consent Form", url: "#", status: "verified" },
      { name: "CAC Certificate",  url: "#", status: "verified" },
    ],
  },
];

const getDocLabel = (e: ApiVerificationSummary) => `${e.documents}/${e.totalDocuments}`;

const statusVariant = (s: string): "green" | "yellow" | "red" | "gray" => {
  if (s === "active")   return "green";
  if (s === "rejected") return "red";
  if (s === "pending")  return "yellow";
  return "gray";
};

export default function VerificationsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected } = useAppSelector((s) => s.verifications);

  const [activeTier, setActiveTier] = useState<TierLabel>("Tier 1");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchVerifications());
  }, [dispatch, listStatus]);

  // Merge real API data with mock — real data wins, mock fills the rest
  // Real API items get tier assigned by index position (first third = tier1 etc.)
  // until backend adds a tier field
  const mergedData: ApiVerificationSummary[] = (() => {
    if (listStatus === "succeeded" && list.length > 0) {
      // Assign tiers to real data by index until backend provides tier field
      const withTiers = list.map((item, i): ApiVerificationSummary => ({
        ...item,
        tier: item.tier ?? (i % 3 === 0 ? "tier1" : i % 3 === 1 ? "tier2" : "tier3"),
      }));
      // Supplement with mock data for tiers that have no real entries
      const realTiers = new Set(withTiers.map((i) => i.tier));
      const mockFill  = MOCK_VERIFICATIONS.filter((m) => !realTiers.has(m.tier));
      return [...withTiers, ...mockFill];
    }
    return MOCK_VERIFICATIONS;
  })();

  const activeTierKey = tierLabelToKey[activeTier];

  const filtered = mergedData.filter((e) => {
    const matchTier   = e.tier === activeTierKey;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    return matchTier && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  // Counts per tier for the badge
  const tierCounts: Record<VerificationTier, number> = {
    tier1: mergedData.filter((e) => e.tier === "tier1").length,
    tier2: mergedData.filter((e) => e.tier === "tier2").length,
    tier3: mergedData.filter((e) => e.tier === "tier3").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main { padding: 16px; gap: 16px; }
        .ver-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        .ver-tiers { display: flex; gap: 8px; }
        .ver-pgn { flex-direction: column; gap: 8px; align-items: flex-start; }
        .ver-row:hover { background: #F9FAFB; }
        .ver-desktop { display: none !important; }
        .ver-mobile  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
        @media (min-width: 640px) {
          .ver-main    { padding: 24px 32px; gap: 20px; }
          .ver-header  { flex-direction: row; align-items: center; }
          .ver-pgn     { flex-direction: row; align-items: center; }
          .ver-desktop { display: block !important; }
          .ver-mobile  { display: none !important; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="ver-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
            {mergedData.length} pending
          </span>

          {/* Tier filters */}
          <div className="ver-tiers">
            {TIERS.map((tier) => {
              const count = tierCounts[tierLabelToKey[tier]];
              const isActive = tier === activeTier;
              return (
                <button key={tier} onClick={() => { setActiveTier(tier); setPage(1); }}
                  style={{
                    padding: "8px 20px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                    cursor: "pointer", border: isActive ? "none" : "1px solid #D1D5DB",
                    backgroundColor: isActive ? "#16a34a" : "#ffffff",
                    color: isActive ? "#ffffff" : "#6B7280",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}>
                  {tier}
                  <span style={{
                    fontSize: "11px", fontWeight: 700,
                    backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#E5E7EB",
                    color: isActive ? "#fff" : "#6B7280",
                    padding: "1px 6px", borderRadius: "999px",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* Search */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
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

          {(listStatus !== "loading") && (
            <>
              {/* Desktop table */}
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
                      <tr><td colSpan={5} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No verifications found.</td></tr>
                    ) : paginated.map((expert) => (
                      <tr key={expert.id} className="ver-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                        <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{expert.name}</td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}</td>
                        <td style={{ padding: "16px 24px" }}><StatusBadge label={expert.status ?? "pending"} variant={statusVariant(expert.status ?? "")} /></td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{getDocLabel(expert)}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <button onClick={() => dispatch(selectVerification(expert))}
                            style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                            <Eye size={17} strokeWidth={1.8} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="ver-mobile">
                {paginated.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No verifications found.</p>
                ) : paginated.map((expert) => (
                  <div key={expert.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{expert.name}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <StatusBadge label={expert.status ?? "pending"} variant={statusVariant(expert.status ?? "")} />
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>{expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}</span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>Docs: {getDocLabel(expert)}</span>
                      </div>
                    </div>
                    <button onClick={() => dispatch(selectVerification(expert))}
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
                      <Eye size={16} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="ver-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                  {filtered.length === 0 ? "No results" : `Showing ${from}–${to} of ${filtered.length} results`}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#ffffff", color: p === page ? "#ffffff" : "#6B7280", cursor: "pointer" }}>{p}</button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {selected && (
        <VerificationModal expert={selected} onClose={() => dispatch(clearSelectedVerification())} />
      )}
    </div>
  );
}