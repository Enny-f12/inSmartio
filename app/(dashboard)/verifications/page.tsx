// app/(dashboard)/verifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Eye, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";

import { fetchVerifications } from "@/lib/redux/verificationSlice";
import type { AppDispatch, RootState } from "@/lib/redux/store";
import type { ApiVerificationExpert } from "@/lib/api/verificationApi";

// ── Strict Swagger Compliant Fallback Dataset ─────────────
const MOCK_FALLBACK_EXPERTS: ApiVerificationExpert[] = [
  {
    id: "v-expert-1",
    name: "Emeka O.",
    email: "emeka@email.com",
    phone: "+234 801 234 5678",
    status: "Pending",
    verify: false,
    role: "expert",
    avatar: null,
    verification: "tier1",
    appliedTier: "Tier 1", 
    submitted: "20/03/2026",
    docsTotal: 3, docsVerified: 3,
    createdAt: "2026-03-20T10:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "12345678901", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: "v-expert-2",
    name: "Chidi E.",
    email: "chidi@email.com",
    phone: "+234 801 234 5678",
    status: "Pending",
    verify: false,
    role: "expert",
    avatar: null,
    verification: "tier3",
    appliedTier: "Tier 3",
    submitted: "19/03/2026",
    verificationFee: "₦1,500", feePaidOn: "18/03/2026",
    docsTotal: 7, docsVerified: 5,
    createdAt: "2026-03-19T11:00:00.000Z",
    updatedAt: "2026-03-19T11:00:00.000Z",
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
      { name: "Proof of Address", status: "Verified" },
      { name: "Guarantor Form", status: "Pending" },
      { name: "Police Clearance", status: "Pending" },
    ],
    guarantor: { name: "Chief Okafor M.", phone: "+234 809 876 5432", occupation: "Civil Servant (Level 14)", status: "Call Guarantor" },
    policeClearance: { certificate: "PC-2026-12345", issued: "10/03/2026 (within 6 months)", issuingState: "Lagos" },
  }
];

const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type TierType = typeof TIERS[number];
const PAGE_SIZE = 10;

export default function VerificationsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: verifications, listStatus, listError } = useSelector((state: RootState) => state.verifications);

  const [activeTier, setActiveTier] = useState<TierType>("Tier 1");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<ApiVerificationExpert | null>(null);

  useEffect(() => {
    dispatch(fetchVerifications());
  }, [dispatch]);

  // Fallback state evaluation gate
  const isUsingFallback = listStatus === "succeeded" && verifications.length === 0;
  const operationalData = isUsingFallback ? MOCK_FALLBACK_EXPERTS : verifications;

  // Handles safe extraction regardless of tier key variations ("tier1" vs "Tier 1")
  const filtered = operationalData.filter((e) => {
    const rawTier = e.verification || (e.appliedTier as string) || "tier1";
    const normalTier = rawTier.toLowerCase().replace(/\s/g, "");
    const activeNormal = activeTier.toLowerCase().replace(/\s/g, "");

    const matchTier = normalTier === activeNormal;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    
    return matchTier && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Formatting utilities for presentation mapping
  const extractDate = (expert: ApiVerificationExpert) => {
    if (expert.createdAt) return new Date(expert.createdAt).toLocaleDateString("en-GB");
    return (expert.submitted as string) || "Pending";
  };

  const getDocRatio = (expert: ApiVerificationExpert) => {
    if (expert.docsVerified !== undefined && expert.docsTotal !== undefined) {
      return `${expert.docsVerified}/${expert.docsTotal}`;
    }
    return expert.verify ? "1/1" : "0/1";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main { padding: 16px; gap: 16px; }
        .ver-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        .ver-tiers { display: flex; gap: 8px; width: 100%; }
        .ver-tier-btn { flex: 1; text-align: center; }
        .ver-pgn { flex-direction: column; gap: 8px; align-items: flex-start; }
        .ver-row:hover { background: #F9FAFB; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .ver-desktop { display: none !important; }
        .ver-mobile  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }

        @media (min-width: 640px) {
          .ver-main      { padding: 24px 32px; gap: 20px; }
          .ver-header    { flex-direction: row; align-items: center; }
          .ver-tiers     { width: auto; }
          .ver-tier-btn  { flex: none; }
          .ver-pgn       { flex-direction: row; align-items: center; }
          .ver-desktop   { display: block !important; }
          .ver-mobile    { display: none !important; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header toolbar */}
        <div className="ver-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{
            padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
            backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", whiteSpace: "nowrap",
          }}>
            {filtered.length} active pending logs
          </span>
          <div className="ver-tiers">
            {TIERS.map((tier) => (
              <button
                key={tier}
                className="ver-tier-btn"
                onClick={() => { setActiveTier(tier); setPage(1); }}
                style={{
                  padding: "8px 24px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
                  cursor: "pointer", transition: "all 0.15s",
                  border: tier === activeTier ? "none" : "1px solid #D1D5DB",
                  backgroundColor: tier === activeTier ? "#16a34a" : "#ffffff",
                  color: tier === activeTier ? "#ffffff" : "#6B7280",
                }}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Area Sheet Container */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden", marginTop: "8px" }}>

          {/* Search bar input container */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{
                  width: "100%", paddingLeft: "40px", paddingRight: "16px",
                  paddingTop: "10px", paddingBottom: "10px",
                  borderRadius: "10px", fontSize: "13px", outline: "none",
                  border: "1px solid #E5E7EB", backgroundColor: "#F9FAFB",
                  color: "#111827", boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Loader View handler component state */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", gap: "8px", color: "var(--color-text-muted)", fontSize: "14px" }}>
              <Loader2 size={18} className="animate-spin" /> Fetching active registry...
            </div>
          )}

          {/* Error view */}
          {listStatus === "failed" && (
            <div style={{ padding: "24px", textAlign: "center", color: "#ef4444", fontSize: "13.5px" }}>
              Error: {listError}
            </div>
          )}

          {/* Desktop Matrix Output View Grid list */}
          {listStatus === "succeeded" && (
            <div className="ver-desktop" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                    {["Name", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No verification profiles found.</td></tr>
                  ) : paginated.map((expert: ApiVerificationExpert) => (
                    <tr key={expert.id} className="ver-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                      <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{expert.name}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{extractDate(expert)}</td>
                      <td style={{ padding: "16px 24px" }}><StatusBadge label={expert.status || "Pending"} variant="yellow" /></td>
                      <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{getDocRatio(expert)}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <button onClick={() => setSelected(expert)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
                          <Eye size={17} strokeWidth={1.8} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Display Component Blocks */}
          {listStatus === "succeeded" && (
            <div className="ver-mobile">
              {paginated.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#9CA3AF", margin: 0 }}>No verification profiles found.</p>
              ) : paginated.map((expert: ApiVerificationExpert) => (
                <div key={expert.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: "0 0 4px" }}>{expert.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <StatusBadge label={expert.status || "Pending"} variant="yellow" />
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>{extractDate(expert)}</span>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Docs: {getDocRatio(expert)}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelected(expert)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
                    <Eye size={16} strokeWidth={1.8} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Blocks layout */}
          {listStatus === "succeeded" && (
            <div className="ver-pgn" style={{ display: "flex", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
              <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0 }}>
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#ffffff", color: p === page ? "#ffffff" : "#6B7280", cursor: "pointer" }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {selected && (
        <VerificationModal
          expert={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}