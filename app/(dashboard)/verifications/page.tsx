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
import type { ApiVerificationSummary } from "@/lib/api/verificationApi";

const PAGE_SIZE = 10;

// Doc count display — e.g. "0/7"
const getDocLabel = (e: ApiVerificationSummary) => `${e.documents}/${e.totalDocuments}`;

// Status badge variant
const statusVariant = (s: string): "green" | "yellow" | "red" | "gray" => {
  if (s === "active")   return "green";
  if (s === "rejected") return "red";
  if (s === "pending")  return "yellow";
  return "gray";
};

export default function VerificationsPage() {
  const dispatch = useAppDispatch();
  const { list, listStatus, listError, selected } = useAppSelector((s) => s.verifications);

  const [search, setSearch] = useState("");
  const [page,   setPage]   = useState(1);

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchVerifications());
  }, [dispatch, listStatus]);

  const filtered = list.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const from       = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to         = Math.min(page * PAGE_SIZE, filtered.length);

  const handleView = (expert: ApiVerificationSummary) => {
    dispatch(selectVerification(expert));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#F4F5F7" }}>
      <Topbar title="Verifications" />

      <style>{`
        .ver-main { padding: 16px; gap: 16px; }
        .ver-header { flex-direction: column; align-items: flex-start; gap: 12px; }
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

        {/* Header — pending count badge */}
        <div className="ver-header" style={{ display: "flex", justifyContent: "space-between" }}>
          {listStatus === "succeeded" && (
            <span style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, backgroundColor: "#FFFBEB", color: "#B45309", border: "1px solid #FDE68A", whiteSpace: "nowrap" }}>
              {list.length} pending
            </span>
          )}
        </div>

        {/* Card */}
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #E5E7EB", borderRadius: "16px", overflow: "hidden" }}>

          {/* Search */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={search}
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
                      {["Name", "Email", "Submitted", "Status", "Documents", "Actions"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: "#9CA3AF" }}>No verifications found.</td></tr>
                    ) : paginated.map((expert, idx) => (
                      <tr key={expert.id ?? expert.email ?? idx} className="ver-row" style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.1s" }}>
                        <td style={{ padding: "16px 24px", fontSize: "14px", fontWeight: 600, color: "#111827" }}>{expert.name}</td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "#6B7280" }}>{expert.email}</td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "#6B7280" }}>
                          {expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <StatusBadge label={expert.status ?? "pending"} variant={statusVariant(expert.status ?? "")} />
                        </td>
                        <td style={{ padding: "16px 24px", fontSize: "13px", color: "#6B7280" }}>{getDocLabel(expert)}</td>
                        <td style={{ padding: "16px 24px" }}>
                          <button
                            onClick={() => handleView(expert)}
                            style={{ padding: "6px", borderRadius: "8px", border: "none", background: "none", cursor: "pointer", color: "#9CA3AF", display: "flex", alignItems: "center" }}
                          >
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
                ) : paginated.map((expert, idx) => (
                  <div key={expert.id ?? expert.email ?? idx} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid #E5E7EB", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#111827", margin: "0 0 2px" }}>{expert.name}</p>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "0 0 6px" }}>{expert.email}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <StatusBadge label={expert.status ?? "pending"} variant={statusVariant(expert.status ?? "")} />
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>
                          {expert.submitted ? new Date(expert.submitted).toLocaleDateString("en-GB") : "—"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>Docs: {getDocLabel(expert)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleView(expert)}
                      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "none", cursor: "pointer", color: "#9CA3AF", flexShrink: 0, display: "flex", alignItems: "center" }}
                    >
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
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === 1 ? "not-allowed" : "pointer", opacity: page === 1 ? 0.4 : 1 }}>
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: "32px", height: "32px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, border: p === page ? "none" : "1px solid #E5E7EB", backgroundColor: p === page ? "#16a34a" : "#ffffff", color: p === page ? "#ffffff" : "#6B7280", cursor: "pointer" }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, border: "1px solid #E5E7EB", backgroundColor: "#ffffff", color: "#6B7280", cursor: page === totalPages ? "not-allowed" : "pointer", opacity: page === totalPages ? 0.4 : 1 }}>
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal — only opens when something is selected */}
      {selected && (
        <VerificationModal
          expert={selected}
          onClose={() => dispatch(clearSelectedVerification())}
        />
      )}
    </div>
  );
}