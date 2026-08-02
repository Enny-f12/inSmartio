// components/TransactionDetailReport.tsx
"use client";

import { useState } from "react";
import { Search, Download, X, Receipt, TrendingUp, Wallet, Percent } from "lucide-react";
import {
  colors, card, kpiCard, kpiLabel, kpiValue, kpiDelta, th, thFirst, td, tdFirst,
  toolbarInput, exportBtn, modalOverlay, modalCard, fmtNaira, fmtCompactNaira,
} from "./shared";
import { SkelKPIRow, SkelTableRows, SkelCardRows } from "./Skeleton";
import { useSimulatedLoad } from "./useSimulatedLoad";
import { transactions, type Transaction } from "./mockData";

const TYPE_OPTIONS = ["All Types", "Escrow", "Refund", "Fee", "Payout"];
const STATUS_OPTIONS = ["All Status", "Completed", "Pending", "Failed"];
const REGION_OPTIONS = ["All Regions", "Mainland North (Ikeja)", "Mainland East (Yaba)", "Island South (Lekki)"];
const MODEL_OPTIONS = ["All Models", "Model 1 (Subscription)", "Model 2 (Commission)"];

function statusColor(status: Transaction["status"]) {
  if (status === "Completed") return { bg: colors.greenBg, fg: colors.green };
  if (status === "Pending") return { bg: colors.amberBg, fg: colors.amber };
  return { bg: colors.redBg, fg: colors.red };
}

export default function TransactionDetailReport() {
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-07-28");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All Types");
  const [status, setStatus] = useState("All Status");
  const [region, setRegion] = useState("All Regions");
  const [model, setModel] = useState("All Models");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [downloading, setDownloading] = useState(false);

  const loading = useSimulatedLoad([dateFrom, dateTo, search, type, status, region, model]);

  const filtered = transactions.filter((t) => {
    if (type !== "All Types" && t.type !== type) return false;
    if (status !== "All Status" && t.status !== status) return false;
    if (region !== "All Regions" && t.region !== region) return false;
    if (model !== "All Models" && t.paymentModel !== model) return false;
    if (search && !`${t.client} ${t.expert} ${t.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totals = {
    count: 12456,
    volume: 8200000,
    fees: 820000,
    tasComm: 82000,
  };

  const handleExport = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 900);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {selected && <TransactionModal txn={selected} onClose={() => setSelected(null)} />}

      {/* Date + search */}
      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input type="date" className="rp-select" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ fontSize: "12px", color: colors.textFaint }}>to</span>
          <input type="date" className="rp-select" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: colors.textFaint }} />
          <input
            type="text"
            placeholder="Search transaction, client, expert..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...toolbarInput, width: "100%", paddingLeft: "38px", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <select className="rp-select" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="rp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="rp-select" value={region} onChange={(e) => setRegion(e.target.value)}>
          {REGION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="rp-select" value={model} onChange={(e) => setModel(e.target.value)}>
          {MODEL_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><Receipt size={13} /> Total Transactions</span>
            <span style={kpiValue}>{totals.count.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 18%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><TrendingUp size={13} /> Total Volume</span>
            <span style={kpiValue}>{fmtCompactNaira(totals.volume)}</span>
            <span style={kpiDelta(true)}>↑ 22%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Wallet size={13} /> Total Fees</span>
            <span style={kpiValue}>{fmtCompactNaira(totals.fees)}</span>
            <span style={kpiDelta(true)}>↑ 20%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Percent size={13} /> Total TAS Comm.</span>
            <span style={kpiValue}>{fmtCompactNaira(totals.tasComm)}</span>
            <span style={kpiDelta(true)}>↑ 15%</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <button style={exportBtn()} onClick={handleExport} disabled={downloading}><Download size={13} /> CSV</button>
          <button style={exportBtn()} onClick={handleExport} disabled={downloading}><Download size={13} /> PDF</button>
          <button style={exportBtn("primary")} onClick={handleExport} disabled={downloading}><Download size={13} /> {downloading ? "Exporting..." : "Excel"}</button>
        </div>

        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["TXN ID", "Date", "Type", "Client", "Expert", "TAS", "Amount", "Status", ""].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={5} cols={9} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>No transactions match your filter.</td></tr>
              ) : filtered.map((t) => {
                const sc = statusColor(t.status);
                return (
                  <tr key={t.id} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}`, cursor: "pointer" }} onClick={() => setSelected(t)}>
                    <td style={{ ...tdFirst, fontFamily: "monospace", color: colors.textMuted }}>{t.id.slice(0, 14)}</td>
                    <td style={td}>{t.date}</td>
                    <td style={td}>{t.type}</td>
                    <td style={td}>{t.client}</td>
                    <td style={td}>{t.expert}</td>
                    <td style={td}>{t.tas}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{fmtNaira(t.amount)}</td>
                    <td style={td}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: sc.bg, color: sc.fg }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={td}><span style={{ color: colors.primary, fontSize: "12px", fontWeight: 600 }}>View</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? (
            <SkelCardRows rows={4} />
          ) : filtered.map((t) => {
            const sc = statusColor(t.status);
            return (
              <div key={t.id} onClick={() => setSelected(t)} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, backgroundColor: "#fff", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textMain }}>{t.client} → {t.expert}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>{fmtNaira(t.amount)}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: sc.bg, color: sc.fg }}>{t.status}</span>
                  <span style={{ fontSize: "12px", color: colors.textMuted }}>{t.type} · {t.date}</span>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of {totals.count.toLocaleString()} results
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionModal({ txn, onClose }: { txn: Transaction; onClose: () => void }) {
  const sc = statusColor(txn.status);
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textMain, margin: 0 }}>Transaction Detail</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}><X size={18} /></button>
        </div>

        <InfoRow label="Transaction ID" value={txn.id} mono />
        <InfoRow label="Date & Time" value={`${txn.date}, ${txn.time}`} />
        <InfoRow label="Type" value={`${txn.type} ${txn.type === "Escrow" ? "Release" : ""}`} />
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.borderSoft}` }}>
          <span style={{ fontSize: "12.5px", color: colors.textMuted }}>Status</span>
          <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: sc.bg, color: sc.fg }}>{txn.status}</span>
        </div>

        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, margin: "18px 0 8px" }}>
          Amount Details
        </p>
        <div style={{ backgroundColor: "#F9FAFB", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <AmtRow label="Original Job Value" value={txn.originalValue} />
          <AmtRow label="Platform Fee (10%)" value={txn.platformFee} />
          <AmtRow label="TAS Commission (1%)" value={txn.tasCommission} />
          <AmtRow label="Net Expert Payout" value={txn.netPayout} bold />
        </div>

        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, margin: "18px 0 8px" }}>
          Parties
        </p>
        <InfoRow label="Client" value={`${txn.client} (${txn.clientId})`} />
        <InfoRow label="Expert" value={`${txn.expert} (${txn.expertId})`} />
        <InfoRow label="TAS Agent" value={txn.tasId !== "—" ? `${txn.tas} (${txn.tasId})` : "—"} />
        <InfoRow label="Job" value={txn.jobId} mono />

        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, margin: "18px 0 8px" }}>
          Location
        </p>
        <InfoRow label="Region" value={txn.region} />
        <InfoRow label="Payment Model" value={txn.paymentModel} />

        <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
          <button style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: "#fff", color: colors.textMain, fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>View Job</button>
          <button style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: "#fff", color: colors.textMain, fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>View Client</button>
          <button style={{ padding: "9px 16px", borderRadius: "8px", border: `1px solid ${colors.border}`, backgroundColor: "#fff", color: colors.textMain, fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>View Expert</button>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: "8px", border: "none", backgroundColor: colors.primary, color: "#fff", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.borderSoft}`, gap: "12px" }}>
      <span style={{ fontSize: "12.5px", color: colors.textMuted, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: "12.5px", color: colors.textMain, fontWeight: 500, fontFamily: mono ? "monospace" : "inherit", textAlign: "right" }}>{value}</span>
    </div>
  );
}

function AmtRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: "12.5px", color: colors.textMuted, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: "12.5px", color: colors.textMain, fontWeight: bold ? 700 : 500 }}>{fmtNaira(value)}</span>
    </div>
  );
}