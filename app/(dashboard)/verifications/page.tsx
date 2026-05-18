// app/(dashboard)/verifications/page.tsx
"use client";

import { useState } from "react";
import { Search, Eye } from "lucide-react";
import Topbar from "@/components/layout/Navbar";
import VerificationModal from "@/components/verifications/VerificationModal";
import { StatusBadge } from "@/components/ui/Badge";
import type { Expert, Tier } from "@/components/verifications/types";

const mockExperts: Expert[] = [
  {
    id: 1, name: "Emeka O.", phone: "+234 801 234 5678", email: "emeka@email.com",
    appliedTier: "Tier 1", submitted: "20/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 3,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "12345678901", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: 2, name: "Ngozi E.", phone: "+234 802 345 6789", email: "ngozi@email.com",
    appliedTier: "Tier 1", submitted: "20/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 3,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "98765432100", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: 3, name: "Chidi E.", phone: "+234 801 234 5678", email: "chidi@email.com",
    appliedTier: "Tier 3", submitted: "19/03/2026",
    verificationFee: "₦1,500", feePaidOn: "18/03/2026",
    status: "Pending", docsTotal: 7, docsVerified: 5,
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
  },
  {
    id: 4, name: "Peter O.", phone: "+234 803 456 7890", email: "peter@email.com",
    appliedTier: "Tier 2", submitted: "18/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 1,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Pending" },
      { name: "Proof of Address", status: "Pending" },
    ],
  },
  {
    id: 5, name: "Mary K.", phone: "+234 804 567 8901", email: "mary@email.com",
    appliedTier: "Tier 1", submitted: "18/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 3,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Verified" },
      { name: "Passport Photograph", status: "Verified" },
    ],
    nin: { number: "11223344556", status: "Verified", nameMatch: true, dobMatch: true },
  },
  {
    id: 6, name: "John D.", phone: "+234 805 678 9012", email: "john@email.com",
    appliedTier: "Tier 2", submitted: "15/03/2026", status: "Pending",
    docsTotal: 3, docsVerified: 2,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Verified" },
      { name: "Proof of Address", status: "Pending" },
    ],
  },
  {
    id: 7, name: "James O.", phone: "+234 806 789 0123", email: "james@email.com",
    appliedTier: "Tier 1", submitted: "13/02/2026", status: "Pending",
    docsTotal: 3, docsVerified: 1,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "Valid ID (National ID)", status: "Pending" },
      { name: "Passport Photograph", status: "Pending" },
    ],
  },
  {
    id: 8, name: "Mayowa S.", phone: "+234 807 890 1234", email: "mayowa@email.com",
    appliedTier: "Tier 2", submitted: "10/02/2026", status: "Pending",
    docsTotal: 3, docsVerified: 2,
    documents: [
      { name: "NIN Slip", status: "Verified" },
      { name: "BVN Consent Form", status: "Verified" },
      { name: "Proof of Address", status: "Pending" },
    ],
  },
];

const TIERS: Tier[] = ["Tier 1", "Tier 2", "Tier 3"];
const PAGE_SIZE = 10;
const TOTAL_PENDING = 45;

export default function VerificationsPage() {
  const [activeTier, setActiveTier] = useState<Tier>("Tier 1");
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<Expert | null>(null);

  const filtered = mockExperts.filter((e) =>
    e.appliedTier === activeTier &&
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main { padding: 16px; gap: 16px; }
        .ver-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        .ver-tiers { display: flex; gap: 8px; width: 100%; }
        .ver-tier-btn { flex: 1; text-align: center; }
        .ver-table { display: none; }
        .ver-cards { display: flex; flex-direction: column; gap: 10px; }
        .ver-pagination { flex-direction: column; gap: 8px; align-items: flex-start; }
        @media (min-width: 640px) {
          .ver-main { padding: 24px 32px; gap: 20px; }
          .ver-header { flex-direction: row; align-items: center; }
          .ver-tiers { width: auto; }
          .ver-tier-btn { flex: none; }
          .ver-table { display: block; }
          .ver-cards { display: none; }
          .ver-pagination { flex-direction: row; align-items: center; }
        }
      `}</style>

      <main className="ver-main" style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Sub-header */}
        <div className="ver-header" style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, backgroundColor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", whiteSpace: "nowrap" }}>
            {TOTAL_PENDING} pending
          </span>
          <div className="ver-tiers">
            {TIERS.map((tier) => (
              <button
                key={tier}
                className="ver-tier-btn"
                onClick={() => { setActiveTier(tier); setPage(1); }}
                style={{
                  padding: "8px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
                  border: tier === activeTier ? "none" : "1px solid var(--color-border)",
                  backgroundColor: tier === activeTier ? "#16a34a" : "var(--color-surface)",
                  color: tier === activeTier ? "#fff" : "var(--color-text-muted)",
                  cursor: "pointer",
                }}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Table card */}
        <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", overflow: "hidden" }}>

          {/* Search */}
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                placeholder="Search name..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* ── Desktop table ── */}
          <div className="ver-table" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                  {["Name", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "var(--color-text-muted)" }}>No verifications found.</td></tr>
                ) : paginated.map((expert) => (
                  <tr key={expert.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{expert.name}</td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{expert.submitted}</td>
                    <td style={{ padding: "16px 24px" }}><StatusBadge label="Pending" variant="yellow" /></td>
                    <td style={{ padding: "16px 24px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{expert.docsVerified}/{expert.docsTotal}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <button onClick={() => setSelected(expert)} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
                        <Eye size={17} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile cards ── */}
          <div className="ver-cards" style={{ padding: "12px" }}>
            {paginated.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)" }}>No verifications found.</p>
            ) : paginated.map((expert) => (
              <div key={expert.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>{expert.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <StatusBadge label="Pending" variant="yellow" />
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{expert.submitted}</span>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Docs: {expert.docsVerified}/{expert.docsTotal}</span>
                  </div>
                </div>
                <button onClick={() => setSelected(expert)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--color-border)", background: "none", cursor: "pointer", color: "var(--color-text-muted)", flexShrink: 0 }}>
                  <Eye size={16} strokeWidth={1.8} />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="ver-pagination" style={{ display: "flex", justifyContent: "space-between", padding: "16px", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {TOTAL_PENDING} results
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={p === page ? "btn-primary" : ""} style={p !== page ? { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: "pointer" } : { width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", border: "none", cursor: "pointer" }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text-muted)", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
            </div>
          </div>
        </div>
      </main>

      {selected && (
        <VerificationModal
          expert={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setSelected(null)}
          onReject={() => setSelected(null)}
        />
      )}
    </div>
  );
}