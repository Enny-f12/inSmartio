// app/(dashboard)/reports/components/TransactionDetailReport.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Receipt, TrendingUp, Lock, CheckCircle2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDetailedReport, downloadReport, setReportType, clearDownloadUrl } from "@/lib/redux/reportDetailSlice";
import type { ReportType, ReportFormat } from "@/lib/api/detailedReportApi";
import {
  colors, card, kpiCard, kpiLabel, kpiValue, th, thFirst, td, tdFirst,
  toolbarInput, modalOverlay, modalCard, fmtNaira,
} from "./shared";
import { SkelKPIRow, SkelTableRows, SkelCardRows } from "./Skeleton";
import { ExportMenuButton } from "./ExportMenuButton";
import { pick, fmtNairaCell, pickSummary, matchesFilter, formatDate, uniqueValues } from "./rowUtils";

const REPORT_TYPE: ReportType = "transactions";

type Row = Record<string, unknown>;

// providerStatus values confirmed from the real payload: completed, failed, paid.
const STATUS_OPTIONS = ["All Status", "completed", "failed", "paid"];

function statusPill(status: string) {
  const s = status.toLowerCase();
  const map: Record<string, { bg: string; fg: string }> = {
    completed: { bg: colors.greenBg, fg: colors.green },
    paid:      { bg: colors.greenBg, fg: colors.green },
    failed:    { bg: colors.redBg, fg: colors.red },
    pending:   { bg: colors.amberBg, fg: colors.amber },
    released:  { bg: colors.greenBg, fg: colors.green },
    disputed:  { bg: colors.redBg, fg: colors.red },
    holding:   { bg: colors.amberBg, fg: colors.amber },
  };
  const c = map[s] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function TransactionDetailReport() {
  const dispatch = useAppDispatch();
  const { summary, rows, pagination, listStatus, downloadStatus } = useAppSelector((s) => s.reportDetail);

  useEffect(() => {
    dispatch(setReportType(REPORT_TYPE));
    dispatch(fetchDetailedReport({ reportType: REPORT_TYPE }));
  }, [dispatch]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All Status");
  const [selected, setSelected] = useState<Row | null>(null);

  const loading = listStatus === "loading" || listStatus === "idle";

  // The API's `type` field is free text (e.g. "job_posting", "Expert Premium
  // Monthly Subscription", "Payment for job posting: Ironing"), not a fixed
  // enum — so the dropdown is built from whatever values are actually loaded.
  const typeOptions = useMemo(() => uniqueValues(rows as Row[], ["type"]), [rows]);

  const filtered = (rows as Row[]).filter((r) => {
    const rType = pick(r, ["type"]);
    const rStatus = pick(r, ["providerStatus", "status"]);
    if (type !== "All" && rType !== type) return false;
    if (status !== "All Status" && !matchesFilter(rStatus, status)) return false;
    if (search) {
      const hay = `${pick(r, ["client"])} ${pick(r, ["expert"])} ${pick(r, ["txnId"])} ${pick(r, ["job"])}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const kpiTotalTxn = pickSummary(summary, ["totalTransactions"]);
  const kpiVolume = pickSummary(summary, ["totalVolume"]);
  const kpiHolding = pickSummary(summary, ["holdingVolume"]);
  const kpiReleased = pickSummary(summary, ["releasedVolume"]);

  const handleExport = async (format: ReportFormat) => {
    const action = await dispatch(downloadReport({ reportType: REPORT_TYPE, format, fromDate: dateFrom || undefined, toDate: dateTo || undefined }));
    if (downloadReport.fulfilled.match(action)) {
      const a = document.createElement("a");
      a.href = action.payload;
      a.download = `transactions_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      dispatch(clearDownloadUrl());
    }
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
            placeholder="Search transaction, client, expert, job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...toolbarInput, width: "100%", paddingLeft: "38px", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <select className="rp-select" value={type} onChange={(e) => setType(e.target.value)}>
          {typeOptions.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select className="rp-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
        </select>
      </div>

      {/* KPIs */}
      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><Receipt size={13} /> Total Transactions</span>
            <span style={kpiValue}>{kpiTotalTxn != null ? kpiTotalTxn.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><TrendingUp size={13} /> Total Volume</span>
            <span style={kpiValue}>{kpiVolume != null ? fmtNaira(kpiVolume) : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Lock size={13} /> Holding Volume</span>
            <span style={kpiValue}>{kpiHolding != null ? fmtNaira(kpiHolding) : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><CheckCircle2 size={13} /> Released Volume</span>
            <span style={kpiValue}>{kpiReleased != null ? fmtNaira(kpiReleased) : "—"}</span>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <ExportMenuButton onExport={handleExport} exporting={downloadStatus === "loading"} />
        </div>

        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["TXN ID", "Date", "Type", "Client", "Expert", "Amount", "Status", ""].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={5} cols={8} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>No transactions match your filter.</td></tr>
              ) : filtered.map((t, i) => {
                const rowId = pick(t, ["txnId"], String(i));
                return (
                  <tr key={rowId} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}`, cursor: "pointer" }} onClick={() => setSelected(t)}>
                    <td style={{ ...tdFirst, fontFamily: "monospace", color: colors.textMuted }}>{rowId}</td>
                    <td style={td}>{formatDate(t, ["date"])}</td>
                    <td style={{ ...td, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pick(t, ["type"])}</td>
                    <td style={td}>{pick(t, ["client"])}</td>
                    <td style={td}>{pick(t, ["expert"])}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{fmtNairaCell(t, ["amount"])}</td>
                    <td style={td}>{statusPill(pick(t, ["providerStatus", "status"]))}</td>
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
          ) : filtered.map((t, i) => {
            const rowId = pick(t, ["txnId"], String(i));
            return (
              <div key={rowId} onClick={() => setSelected(t)} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, backgroundColor: "#fff", cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: colors.textMain }}>{pick(t, ["client"])} → {pick(t, ["expert"])}</span>
                  <span style={{ fontSize: "13px", fontWeight: 700 }}>{fmtNairaCell(t, ["amount"])}</span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {statusPill(pick(t, ["providerStatus", "status"]))}
                  <span style={{ fontSize: "12px", color: colors.textMuted }}>{pick(t, ["type"])} · {formatDate(t, ["date"])}</span>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of {(pagination?.total ?? rows.length).toLocaleString()} results
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionModal({ txn, onClose }: { txn: Row; onClose: () => void }) {
  const providerStatus = pick(txn, ["providerStatus"]);
  const escrowStatus = pick(txn, ["escrowStatus"]);
  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: colors.textMain, margin: 0 }}>Transaction Detail</p>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: colors.textFaint }}><X size={18} /></button>
        </div>

        <InfoRow label="Transaction ID" value={pick(txn, ["txnId"])} mono />
        <InfoRow label="Reference" value={pick(txn, ["reference"])} mono />
        <InfoRow label="Date" value={formatDate(txn, ["date"])} />
        <InfoRow label="Type" value={pick(txn, ["type"])} />
        <InfoRow label="Amount" value={fmtNairaCell(txn, ["amount"])} />

        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.borderSoft}` }}>
          <span style={{ fontSize: "12.5px", color: colors.textMuted }}>Provider Status</span>
          {statusPill(providerStatus)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${colors.borderSoft}` }}>
          <span style={{ fontSize: "12.5px", color: colors.textMuted }}>Escrow Status</span>
          {statusPill(escrowStatus)}
        </div>

        <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: colors.textFaint, margin: "18px 0 8px" }}>
          Parties & Job
        </p>
        <InfoRow label="Client" value={pick(txn, ["client"])} />
        <InfoRow label="Expert" value={pick(txn, ["expert"])} />
        <InfoRow label="Job" value={pick(txn, ["job"])} />
        <InfoRow label="Provider" value={pick(txn, ["provider"])} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: "8px", border: "none", backgroundColor: colors.primary, color: "#fff", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}>Close</button>
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