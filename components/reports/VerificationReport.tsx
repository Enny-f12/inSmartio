// app/(dashboard)/reports/components/VerificationReport.tsx
"use client";

import { useEffect, useState } from "react";
import { FileClock, ShieldCheck, ShieldAlert, ClipboardList, Eye, Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDetailedReport, downloadReport, setReportType, clearDownloadUrl } from "@/lib/redux/reportDetailSlice";
import type { ReportType, ReportFormat } from "@/lib/api/detailedReportApi";
import { colors, card, kpiCard, kpiLabel, kpiValue, th, thFirst, td, tdFirst } from "./shared";
import { ExportMenuButton } from "./ExportMenuButton";
import { SkelKPIRow, SkelTableRows, SkelChart, SkelCardRows } from "./Skeleton";
import { HorizontalBarList } from "./ChartBits";
import DashboardLineChart from "./DashboardLineChart";
import { pick, pickNumber, pickSummary, matchesFilter } from "./rowUtils";
import { rejectionReasons, officerWorkload } from "./mockData";
import { RowDetailModal } from "./RowDetailModal";

const REPORT_TYPE: ReportType = "verification";

type Row = Record<string, unknown>;

const PERIOD_OPTIONS = ["July 2026", "June 2026", "May 2026"];
const TIER_OPTIONS = ["All Tiers", "Tier 1", "Tier 2", "Tier 3"];
const STATUS_OPTIONS = ["All Status", "Pending", "Approved", "Rejected"];
const OFFICER_OPTIONS = ["All Officers", "Chioma", "Olu", "Unassigned"];

// TODO: illustrative until the API exposes a trends endpoint.
const verificationTrend = [80, 120, 110, 160, 150, 170, 190];
const verificationTrendLabels = ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 30"];

// Best-effort key match against data.summary — exact key names unconfirmed for this report type.

export default function VerificationReport() {
  const dispatch = useAppDispatch();
  const { summary, rows, listStatus, downloadStatus } = useAppSelector((s) => s.reportDetail);

  useEffect(() => {
    dispatch(setReportType(REPORT_TYPE));
    dispatch(fetchDetailedReport({ reportType: REPORT_TYPE }));
  }, [dispatch]);

  const [period, setPeriod] = useState("July 2026");
  const [tier, setTier] = useState("All Tiers");
  const [status, setStatus] = useState("All Status");
  const [officer, setOfficer] = useState("All Officers");
  const [selected, setSelected] = useState<Row | null>(null);

  const loading = listStatus === "loading" || listStatus === "idle";

  const handleExport = async (format: ReportFormat) => {
    const action = await dispatch(downloadReport({ reportType: REPORT_TYPE, format }));
    if (downloadReport.fulfilled.match(action)) {
      const a = document.createElement("a");
      a.href = action.payload;
      a.download = `verification_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      dispatch(clearDownloadUrl());
    }
  };

  const filtered = (rows as Row[]).filter((v) => {
    if (tier !== "All Tiers" && !matchesFilter(`Tier ${pick(v, ["tier", "verificationTier"])}`, tier)) return false;
    if (officer !== "All Officers" && !matchesFilter(pick(v, ["officer", "assignedOfficer"]), officer)) return false;
    if (status !== "All Status" && !matchesFilter(pick(v, ["status"]), status)) return false;
    return true;
  });

  // Tier breakdown computed from the currently loaded rows — real data, but
  // scoped to this page only (not the full dataset) until the API exposes a
  // proper aggregate. Officer workload / rejection reasons stay on mock data:
  // no `officer`/`reason` fields are confirmed in the response yet.
  const tierBreakdown = (() => {
    const counts = new Map<string, number>();
    for (const v of rows as Row[]) {
      const t = pick(v, ["tier", "verificationTier"]);
      if (t === "—") continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label: `Tier ${label}`, value }));
  })();

  const kpiTotal = pickSummary(summary, ["totalSubmissions"]);
  const kpiPending = pickSummary(summary, ["pending", "pendingVerifications"]);
  const kpiApproved = pickSummary(summary, ["approved", "approvedVerifications"]);
  const kpiRejected = pickSummary(summary, ["rejected", "rejectedVerifications"]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {selected && <RowDetailModal title="Verification Detail" row={selected} onClose={() => setSelected(null)} />}

      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select className="rp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>{TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={officer} onChange={(e) => setOfficer(e.target.value)}>{OFFICER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
        <ExportMenuButton onExport={handleExport} exporting={downloadStatus === "loading"} />
      </div>

      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><ClipboardList size={13} /> Total Submissions</span>
            <span style={kpiValue}>{kpiTotal != null ? kpiTotal.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><FileClock size={13} /> Pending Verifications</span>
            <span style={kpiValue}>{kpiPending != null ? kpiPending.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Approved</span>
            <span style={kpiValue}>{kpiApproved != null ? kpiApproved.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldAlert size={13} /> Rejected</span>
            <span style={kpiValue}>{kpiRejected != null ? kpiRejected.toLocaleString() : "—"}</span>
          </div>
        </div>
      )}

      {loading ? <SkelChart height={160} /> : (
        <div style={card}>
          <div style={{ padding: "20px 20px 20px" }}>
            <DashboardLineChart
              title="Verification Trends (Last 30 Days)"
              yLabel="Submissions"
              xLabel="Day"
              color={colors.primary}
              data={verificationTrend}
              labels={verificationTrendLabels}
              yStep={50}
              statValue={kpiTotal != null ? `${kpiTotal.toLocaleString()} submissions` : undefined}
            />
          </div>
        </div>
      )}

      {/* Pending queue */}
      <div style={card}>
        <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px" }}>
          Verification Queue — Pending Verifications
        </p>
        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["Name", "Phone", "Email", "Tier", "Docs", "Submitted", "Days Pending", "Officer", "Status", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={6} cols={10} />
              ) : filtered.map((v, i) => {
                const days = pickNumber(v, ["daysPending"]);
                const officerName = pick(v, ["officer", "assignedOfficer"]);
                return (
                  <tr key={pick(v, ["id", "_id", "email"], String(i))} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                    <td style={tdFirst}>{pick(v, ["name", "fullName"])}</td>
                    <td style={td}>{pick(v, ["phone", "phoneNumber"])}</td>
                    <td style={td}>{pick(v, ["email"])}</td>
                    <td style={td}>{pick(v, ["tier", "verificationTier"])}</td>
                    <td style={td}>{pick(v, ["docs", "documents"])}</td>
                    <td style={td}>{pick(v, ["submitted", "submittedAt", "createdAt"])}</td>
                    <td style={td}>
                      {days == null ? "—" : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: days >= 6 ? colors.red : colors.textMain, fontWeight: days >= 6 ? 600 : 400 }}>
                          <Clock size={12} /> {days} day{days === 1 ? "" : "s"}
                        </span>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{ color: officerName === "Unassigned" ? colors.red : colors.textMain, fontWeight: officerName === "Unassigned" ? 600 : 400 }}>{officerName}</span>
                    </td>
                    <td style={td}>
                      <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: colors.amberBg, color: colors.amber }}>{pick(v, ["status"])}</span>
                    </td>
                    <td style={td}><Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => setSelected(v)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : filtered.map((v, i) => (
            <div key={pick(v, ["id", "_id", "email"], String(i))} onClick={() => setSelected(v)} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{pick(v, ["name", "fullName"])}</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: colors.textMuted }}>{pick(v, ["daysPending"])}d pending</span>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>Tier {pick(v, ["tier", "verificationTier"])} · Docs {pick(v, ["docs"])} · {pick(v, ["officer", "assignedOfficer"])}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of {filtered.length} pending
          </div>
        )}
      </div>

      {/* Breakdown charts — illustrative until the API exposes these breakdowns */}
      <div className="rp-two-col" style={{ display: "grid", gap: "16px" }}>
        {loading ? <SkelChart height={110} /> : (
          <div style={card}>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>Verification Summary by Tier ({period})</p>
            <p style={{ fontSize: "11.5px", color: colors.textFaint, margin: "0 20px 10px" }}>Based on the currently loaded page — ask backend for a full aggregate to cover all pages.</p>
            <div style={{ padding: "0 20px 20px" }}>
              {tierBreakdown.length === 0
                ? <p style={{ fontSize: "12.5px", color: colors.textFaint }}>No tier data in the loaded rows.</p>
                : <HorizontalBarList data={tierBreakdown} color={colors.primary} />}
            </div>
          </div>
        )}
        {loading ? <SkelChart height={110} /> : (
          <div style={card}>
            <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>Verification Officer Workload ({period})</p>
            <div style={{ padding: "0 20px 20px" }}><HorizontalBarList data={officerWorkload} color="#10B981" /></div>
          </div>
        )}
      </div>

      {loading ? <SkelChart height={110} /> : (
        <div style={card}>
          <p style={{ fontSize: "13.5px", fontWeight: 600, color: colors.textMain, margin: 0, padding: "18px 20px 14px" }}>Rejection Reasons ({period})</p>
          <div style={{ padding: "0 20px 20px" }}><HorizontalBarList data={rejectionReasons} color={colors.red} /></div>
        </div>
      )}
    </div>
  );
}