// app/(dashboard)/verifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchVerifications, fetchVerificationById, clearSelectedVerification } from "@/lib/redux/verificationSlice";
import type { ApiVerificationExpert } from "@/lib/api/verificationApi";

// ── Mock fallback — matches real API schema exactly ───────
const MOCK_VERIFICATIONS: ApiVerificationExpert[] = [
  {
    id: "v1", name: "Emeka O.", email: "emeka@email.com", phone: "+234 801 234 5678",
    gender: "male", bio: "Professional plumber with 5 years experience",
    location: { country: "Nigeria", state: "Lagos", city: "Ikeja", area: "Opebi" },
    skill: { role: "Plumber", experience: "5 years", description: "Expert in pipe installation and repairs", area: "Residential" },
    category: ["Plumbing", "Home Repair"],
    verificationDocument: { idCard: "https://example.com/id1.jpg", referenceLetter: "https://example.com/ref1.pdf" },
    paymentModel: "protected",
    bankDetails: { bankName: "Access Bank", accountNo: "0123456789" },
    services: [],
    verification: "tier1",
    createdAt: "2026-03-20T10:00:00.000Z", updatedAt: "2026-03-20T10:00:00.000Z",
  },
  {
    id: "v2", name: "Ngozi E.", email: "ngozi@email.com", phone: "+234 802 345 6789",
    gender: "female", bio: "Interior decorator and home stylist",
    location: { country: "Nigeria", state: "Abuja", city: "Garki", area: "Area 1" },
    skill: { role: "Interior Decorator", experience: "3 years", description: "Specializes in modern interior design", area: "Commercial & Residential" },
    category: ["Interior Design", "Decoration"],
    verificationDocument: { idCard: "https://example.com/id2.jpg", referenceLetter: "" },
    paymentModel: "protected",
    bankDetails: { bankName: "GTBank", accountNo: "0234567890" },
    services: [],
    verification: "tier1",
    createdAt: "2026-03-21T09:00:00.000Z", updatedAt: "2026-03-21T09:00:00.000Z",
  },
  {
    id: "v3", name: "Chidi E.", email: "chidi@email.com", phone: "+234 803 456 7890",
    gender: "male", bio: "Certified electrical engineer",
    location: { country: "Nigeria", state: "Rivers", city: "Port Harcourt", area: "GRA" },
    skill: { role: "Electrician", experience: "8 years", description: "Industrial and domestic electrical works", area: "Industrial & Domestic" },
    category: ["Electrical", "Generator Repair"],
    verificationDocument: { idCard: "https://example.com/id3.jpg", referenceLetter: "https://example.com/ref3.pdf" },
    paymentModel: "direct",
    bankDetails: { bankName: "UBA", accountNo: "0345678901" },
    services: [],
    verification: "tier3",
    createdAt: "2026-03-19T11:00:00.000Z", updatedAt: "2026-03-19T11:00:00.000Z",
  },
  {
    id: "v4", name: "Peter O.", email: "peter@email.com", phone: "+234 803 456 7891",
    gender: "male", bio: "Experienced auto mechanic",
    location: { country: "Nigeria", state: "Kano", city: "Kano", area: "Nassarawa" },
    skill: { role: "Auto Mechanic", experience: "10 years", description: "Engine overhaul and diagnostics", area: "Automotive" },
    category: ["Auto Repair", "Diagnostics"],
    verificationDocument: { idCard: "https://example.com/id4.jpg", referenceLetter: "" },
    paymentModel: "protected",
    bankDetails: { bankName: "Zenith Bank", accountNo: "0456789012" },
    services: [],
    verification: "tier2",
    createdAt: "2026-03-18T08:00:00.000Z", updatedAt: "2026-03-18T08:00:00.000Z",
  },
  {
    id: "v5", name: "Mary K.", email: "mary@email.com", phone: "+234 804 567 8901",
    gender: "female", bio: "Hair stylist and makeup artist",
    location: { country: "Nigeria", state: "Lagos", city: "Victoria Island", area: "Adeola Odeku" },
    skill: { role: "Stylist", experience: "4 years", description: "Bridal and event makeup and hairstyling", area: "Beauty" },
    category: ["Hair Styling", "Makeup"],
    verificationDocument: { idCard: "https://example.com/id5.jpg", referenceLetter: "https://example.com/ref5.pdf" },
    paymentModel: "protected",
    bankDetails: { bankName: "First Bank", accountNo: "0567890123" },
    services: [],
    verification: "tier1",
    createdAt: "2026-03-17T14:00:00.000Z", updatedAt: "2026-03-17T14:00:00.000Z",
  },
  {
    id: "v6", name: "James A.", email: "james@email.com", phone: "+234 805 678 9012",
    gender: "male", bio: "Carpenter and bespoke furniture maker",
    location: { country: "Nigeria", state: "Ogun", city: "Abeokuta", area: "Oke-Mosan" },
    skill: { role: "Carpenter", experience: "6 years", description: "Custom furniture and woodwork", area: "Residential" },
    category: ["Carpentry", "Furniture"],
    verificationDocument: { idCard: "https://example.com/id6.jpg", referenceLetter: "" },
    paymentModel: "protected",
    bankDetails: { bankName: "Stanbic IBTC", accountNo: "0678901234" },
    services: [],
    verification: "tier2",
    createdAt: "2026-03-16T10:00:00.000Z", updatedAt: "2026-03-16T10:00:00.000Z",
  },
];

const TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;
type TierType = typeof TIERS[number];
const PAGE_SIZE = 10;

// Normalize tier string from API
const getTier = (e: ApiVerificationExpert): string => {
  const v = String(e.verification ?? "").toLowerCase().replace(/\s/g, "");
  if (v === "tier2") return "Tier 2";
  if (v === "tier3") return "Tier 3";
  return "Tier 1";
};

const getDocCount = (e: ApiVerificationExpert): string => {
  const doc = e.verificationDocument as Record<string, string | undefined> | undefined;
  if (!doc) return "0/0";
  const total    = Object.keys(doc).length;
  const verified = Object.values(doc).filter((v) => v && v.trim() !== "").length;
  return `${verified}/${total}`;
};

export default function VerificationsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected, selectedStatus } = useAppSelector((s) => s.verifications);

  const [activeTier, setActiveTier] = useState<TierType>("Tier 1");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchVerifications());
  }, [dispatch, listStatus]);

  // Open modal when detail loads
  const handleView = (id: string) => {
    // For mock data, use from list directly; for real data, fetch detail
    const fromList = data.find((e) => e.id === id);
    if (fromList?.verificationDocument !== undefined || fromList?.skill !== undefined) {
      // Already has full detail (mock data)
      dispatch({ type: "verifications/fetchById/fulfilled", payload: fromList });
    } else {
      dispatch(fetchVerificationById(id));
    }
  };

  const handleClose = () => {
    dispatch(clearSelectedVerification());
  };

  // Use real data if available, else mock
  const data = listStatus === "succeeded" && list.length > 0 ? list : MOCK_VERIFICATIONS;

  const filtered = data.filter((e) => {
    const matchTier   = getTier(e) === activeTier;
    const matchSearch = (e.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTier && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

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
        .ver-desktop { display: none !important; }
        .ver-mobile  { display: flex !important; flex-direction: column; gap: 10px; padding: 12px; }
        @media (min-width: 640px) {
          .ver-main    { padding: 24px 32px; gap: 20px; }
          .ver-header  { flex-direction: row; align-items: center; }
          .ver-tiers   { width: auto; }
          .ver-tier-btn { flex: none; }
          .ver-pgn     { flex-direction: row; align-items: center; }
          .ver-desktop { display: block !important; }
          .ver-mobile  { display: none !important; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="ver-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
            {listStatus === "succeeded" ? `${list.length} pending` : `${MOCK_VERIFICATIONS.length} pending (mock)`}
          </span>
          <div className="ver-tiers">
            {TIERS.map((tier) => (
              <button key={tier} className="ver-tier-btn" onClick={() => { setActiveTier(tier); setPage(1); }}
                style={{ padding: "8px 24px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: tier === activeTier ? "none" : "1px solid #D1D5DB", backgroundColor: tier === activeTier ? "#16a34a" : "#ffffff", color: tier === activeTier ? "#ffffff" : "#6B7280" }}>
                {tier}
              </button>
            ))}
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

          {/* Loading */}
          {listStatus === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "56px", gap: "8px", color: "#9CA3AF", fontSize: "14px" }}>
              <Loader2 size={18} className="animate-spin" /> Loading verifications...
            </div>
          )}

          {listStatus === "failed" && (
            <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "#ef4444" }}>{listError}</p>
          )}

          {(listStatus === "succeeded" || listStatus === "idle") && (
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
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{expert.createdAt ? new Date(expert.createdAt).toLocaleDateString("en-GB") : "—"}</td>
                        <td style={{ padding: "16px 24px" }}><StatusBadge label="Pending" variant="yellow" /></td>
                        <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "#6B7280" }}>{getDocCount(expert)}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <button onClick={() => handleView(expert.id)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}>
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
                        <StatusBadge label="Pending" variant="yellow" />
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>{expert.createdAt ? new Date(expert.createdAt).toLocaleDateString("en-GB") : "—"}</span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>Docs: {getDocCount(expert)}</span>
                      </div>
                    </div>
                    <button onClick={() => handleView(expert.id)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}>
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
                    <button key={p} onClick={() => setPage(p)} style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#ffffff", color: p === page ? "#ffffff" : "#6B7280", cursor: "pointer" }}>{p}</button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {selectedStatus === "loading" && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", backgroundColor: "#1E293B", color: "#fff", padding: "10px 16px", borderRadius: "10px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Loader2 size={14} className="animate-spin" /> Loading detail...
        </div>
      )}
      {selected && (
        <VerificationModal expert={selected} onClose={handleClose} />
      )}
    </div>
  );
}