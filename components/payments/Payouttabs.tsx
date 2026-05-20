// components/payments/Payouttabs.tsx
"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { mockPayouts } from "./types";

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  const style =
    s === "paid" || s === "completed"
      ? { color: "#15803d", background: "#f0fdf4", border: "1px solid #bbf7d0" }
      : s === "pending"
      ? { color: "#d97706", background: "#fffbeb", border: "1px solid #fde68a" }
      : s === "failed"
      ? { color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca" }
      : { color: "var(--color-text-muted)", background: "var(--color-background)", border: "1px solid var(--color-border)" };
  return (
    <span style={{ ...style, fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "20px", whiteSpace: "nowrap" }}>
      {status}
    </span>
  );
}

export default function PayoutsTab() {
  const [search, setSearch] = useState("");

  const filtered = mockPayouts.filter((p) =>
    p.recipient.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <style>{`
        .payouts-table { display: none; }
        .payouts-cards { display: flex; flex-direction: column; gap: 10px; padding: 12px 0; }
        @media (min-width: 640px) {
          .payouts-table { display: block; overflow-x: auto; }
          .payouts-cards { display: none; }
        }
      `}</style>

      <div style={{ borderRadius: "16px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff", overflow: "hidden" }}>

        {/* Search */}
        <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input
              type="text" placeholder="Search recipient..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", paddingLeft: "40px", paddingRight: "16px", paddingTop: "10px", paddingBottom: "10px", borderRadius: "12px", fontSize: "13px", outline: "none", border: "1px solid var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-text-main)", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="payouts-table">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
                {["Recipient", "Type", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover:bg-background/40 transition-colors">
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)" }}>{p.recipient}</td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{p.type}</td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", fontWeight: 500, color: "var(--color-text-main)" }}>{p.amount}</td>
                  <td style={{ padding: "16px 20px" }}><StatusPill status={p.status} /></td>
                  <td style={{ padding: "16px 20px", fontSize: "13.5px", color: "var(--color-text-muted)" }}>{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards wrapper */}
        <div className="payouts-cards" style={{ backgroundColor: "var(--color-background)" }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", fontSize: "13px", color: "var(--color-text-muted)", backgroundColor: "#ffffff" }}>No results found.</p>
          ) : filtered.map((p) => (
            <div key={p.id} style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", backgroundColor: "#ffffff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", gap: "8px" }}>
                <div>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "2px" }}>{p.recipient}</p>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{p.type}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--color-text-main)", marginBottom: "4px" }}>{p.amount}</p>
                  <StatusPill status={p.status} />
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>{p.date}</p>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}