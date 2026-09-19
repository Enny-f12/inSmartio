// app/(dashboard)/reports/components/TASPerformanceReport.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCog, Users, Wallet, Gauge, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDetailedReport, downloadReport, setReportType, clearDownloadUrl } from "@/lib/redux/reportDetailSlice";
import type { ReportType, ReportFormat } from "@/lib/api/detailedReportApi";
import { colors, card, kpiCard, kpiLabel, kpiValue, th, thFirst, td, tdFirst, fmtNaira } from "./shared";
import { ExportMenuButton } from "./ExportMenuButton";
import { SkelKPIRow, SkelTableRows, SkelCardRows } from "./Skeleton";
import { pick, fmtNairaCell, pickSummary, matchesFilter } from "./rowUtils";
import TASDetailModal from "./TASDetailModal";

const REPORT_TYPE: ReportType = "tas-performance";

type Row = Record<string, unknown>;

interface Location {
  area?: string;
  city?: string;
  state?: string;
  address?: string;
  country?: string;
}

const PERIOD_OPTIONS = ["July 2026", "June 2026", "Q2 2026"];
const TIER_OPTIONS = ["All Tiers", "1", "2", "3", "4", "5"];

function getLocation(row: Row): Location | undefined {
  const raw = row["location"];
  return raw && typeof raw === "object" ? (raw as Location) : undefined;
}

// The API has no separate "zone"/"region" field — the closest real signal
// is location.state, so the Zone column and filter are sourced from that
// instead of a key that never appears in the response.
function pickState(row: Row): string {
  const state = getLocation(row)?.state;
  return state && state.trim() ? state.trim() : "—";
}

function statusPill(status: string) {
  const s = status.toLowerCase();
  const map: Record<string, { bg: string; fg: string }> = {
    active: { bg: colors.greenBg, fg: colors.green },
    inactive: { bg: colors.redBg, fg: colors.red },
    suspended: { bg: colors.redBg, fg: colors.red },
  };
  const c = map[s] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function TASPerformanceReport() {
  const dispatch = useAppDispatch();
  const { summary, rows, pagination, listStatus, downloadStatus } = useAppSelector((s) => s.reportDetail);

  useEffect(() => {
    dispatch(setReportType(REPORT_TYPE));
    dispatch(fetchDetailedReport({ reportType: REPORT_TYPE }));
  }, [dispatch]);

  const [period, setPeriod] = useState("July 2026");
  const [tier, setTier] = useState("All Tiers");
  const [zone, setZone] = useState("All Zones");
  const [selected, setSelected] = useState<Row | null>(null);

  const loading = listStatus === "loading" || listStatus === "idle";

  // Built from the states actually present in the loaded rows, instead of a
  // hardcoded list (MN-W, IS-E, ...) that doesn't match any real value.
  const zoneOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows as Row[]) {
      const s = pickState(r);
      if (s !== "—") set.add(s);
    }
    return ["All Zones", ...Array.from(set).sort()];
  }, [rows]);

  const filtered = (rows as Row[]).filter((a) => {
    if (tier !== "All Tiers" && !matchesFilter(pick(a, ["tier"]), tier)) return false;
    if (zone !== "All Zones" && !matchesFilter(pickState(a), zone)) return false;
    return true;
  });

  // Confirmed keys from the real response: totalTasAgents, expertsRecruited, totalEarnings.
  const totalAgents = pickSummary(summary, ["totalTasAgents"]);
  const recruited = pickSummary(summary, ["expertsRecruited"]);
  const totalEarnings = pickSummary(summary, ["totalEarnings"]);
  // Not returned by the API — derived client-side from the two confirmed totals.
  const avgEarnings = totalAgents && totalAgents > 0 && totalEarnings != null ? totalEarnings / totalAgents : undefined;

  const handleExport = async (format: ReportFormat) => {
    const action = await dispatch(downloadReport({ reportType: REPORT_TYPE, format }));
    if (downloadReport.fulfilled.match(action)) {
      const a = document.createElement("a");
      a.href = action.payload;
      a.download = `tas-performance_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      dispatch(clearDownloadUrl());
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {selected && <TASDetailModal row={selected} onClose={() => setSelected(null)} />}

      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select className="rp-select" value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIOD_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>{TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={zone} onChange={(e) => setZone(e.target.value)}>{zoneOptions.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
        <ExportMenuButton onExport={handleExport} exporting={downloadStatus === "loading"} />
      </div>

      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><UserCog size={13} /> Total TAS Agents</span>
            <span style={kpiValue}>{totalAgents != null ? totalAgents.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Users size={13} /> Experts Recruited</span>
            <span style={kpiValue}>{recruited != null ? recruited.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Wallet size={13} /> Total Earnings</span>
            <span style={kpiValue}>{totalEarnings != null ? fmtNaira(totalEarnings) : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><Gauge size={13} /> Avg. Earnings</span>
            <span style={kpiValue}>{avgEarnings != null ? fmtNaira(Math.round(avgEarnings)) : "—"}</span>
          </div>
        </div>
      )}

      <div style={card}>
        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["TAS Name", "Phone", "Email", "Tier", "Experts", "Status", "Earnings", "Zone (State)", "Joined", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={6} cols={10} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>No TAS agents match your filter.</td></tr>
              ) : filtered.map((a, i) => (
                <tr key={pick(a, ["id", "_id", "email"], String(i))} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{pick(a, ["name"])}</td>
                  <td style={td}>{pick(a, ["phone"])}</td>
                  <td style={td}>{pick(a, ["email"])}</td>
                  <td style={td}>{pick(a, ["tier"])}</td>
                  <td style={td}>{pick(a, ["expertsRecruited"])}</td>
                  <td style={td}>{statusPill(pick(a, ["status"]))}</td>
                  <td style={{ ...td, fontWeight: 600 }}>{fmtNairaCell(a, ["earnings"])}</td>
                  <td style={td}>{pickState(a)}</td>
                  <td style={td}>{pick(a, ["joined"])}</td>
                  <td style={td}>
                    <Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => setSelected(a)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : filtered.map((a, i) => (
            <div key={pick(a, ["id", "_id", "email"], String(i))} onClick={() => setSelected(a)} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{pick(a, ["name"])}</span>
                <span style={{ fontSize: "13px", fontWeight: 700 }}>{fmtNairaCell(a, ["earnings"])}</span>
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>Tier {pick(a, ["tier"])} · {pick(a, ["expertsRecruited"])} recruited · {pick(a, ["status"])} · {pickState(a)}</p>
            </div>
          ))}
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