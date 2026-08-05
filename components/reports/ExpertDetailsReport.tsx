// app/(dashboard)/reports/components/ExpertDetailsReport.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users, ShieldCheck, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchDetailedReport, downloadReport, setReportType, clearDownloadUrl } from "@/lib/redux/reportDetailSlice";
import type { ReportType, ReportFormat } from "@/lib/api/detailedReportApi";
import { colors, card, kpiCard, kpiLabel, kpiValue, th, thFirst, td, tdFirst, toolbarInput } from "./shared";
import { ExportMenuButton } from "./ExportMenuButton";
import { SkelKPIRow, SkelTableRows, SkelCardRows } from "./Skeleton";
import { pick, pickSummary, matchesFilter } from "./rowUtils";
import { RowDetailModal } from "./RowDetailModal";

const REPORT_TYPE: ReportType = "expert-details";

type Row = Record<string, unknown>;

const TIER_OPTIONS = ["All Tiers", "1", "2", "3"];
// Displayed labels match the mapped values, not the raw "protected"/"unprotected" strings.
const MODEL_OPTIONS = ["All Models", "Model 1", "Model 2"];

// The real `category` field is often a comma-separated multi-value string
// (e.g. "Beauty Services, Events Services, Entertainment"), so options are
// built from the individual split-out values, not the raw row strings.
function getCategories(row: Row): string[] {
  const raw = pick(row, ["category", "serviceCategory"], "");
  if (!raw || raw === "—") return [];
  return raw.split(",").map((c) => c.trim()).filter(Boolean);
}

// Real statuses come back lowercase ("active"/"inactive"), so colors are
// keyed lowercase and the label is capitalized only for display.
const STATUS_META: Record<string, { bg: string; fg: string }> = {
  active: { bg: colors.greenBg, fg: colors.green },
  inactive: { bg: colors.redBg, fg: colors.red },
  pending: { bg: colors.amberBg, fg: colors.amber },
  suspended: { bg: colors.redBg, fg: colors.red },
};

function statusPill(status: string) {
  const key = status.toLowerCase();
  const c = STATUS_META[key] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{label}</span>;
}

/** "protected" -> "Model 1", "unprotected" -> "Model 2". Falls back to raw value (or "—") for anything unexpected. */
function formatPaymentModel(model: unknown) {
  const m = String(model ?? "").toLowerCase();
  if (m === "protected") return "Model 1";
  if (m === "unprotected") return "Model 2";
  return model ? String(model) : "—";
}

// Best-effort key match against data.summary — exact key names unconfirmed for this report type.

export default function ExpertDetailsReport() {
  const dispatch = useAppDispatch();
  const { summary, rows, pagination, listStatus, downloadStatus } = useAppSelector((s) => s.reportDetail);

  useEffect(() => {
    dispatch(setReportType(REPORT_TYPE));
    dispatch(fetchDetailedReport({ reportType: REPORT_TYPE }));
  }, [dispatch]);

  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("All Tiers");
  const [model, setModel] = useState("All Models");
  const [category, setCategory] = useState("All Categories");
  const [region, setRegion] = useState("All Regions");
  const [status, setStatus] = useState("All Status");
  const [selected, setSelected] = useState<Row | null>(null);

  const loading = listStatus === "loading" || listStatus === "idle";

  // Region — built from whatever regions are actually present in the loaded rows.
  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows as Row[]) {
      const v = pick(r, ["region"]);
      if (v && v !== "—") set.add(v.trim());
    }
    return ["All Regions", ...Array.from(set).sort()];
  }, [rows]);

  // Category — split multi-value strings into individual categories first.
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows as Row[]) {
      for (const c of getCategories(r)) set.add(c);
    }
    return ["All Categories", ...Array.from(set).sort()];
  }, [rows]);

  // Status — real values are lowercase; capitalize only for the dropdown label.
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows as Row[]) {
      const s = pick(r, ["status"]);
      if (s && s !== "—") set.add(s.toLowerCase());
    }
    const labels = Array.from(set).map((s) => s.charAt(0).toUpperCase() + s.slice(1));
    return ["All Status", ...labels.sort()];
  }, [rows]);

  const filtered = (rows as Row[]).filter((e) => {
    if (tier !== "All Tiers" && !matchesFilter(pick(e, ["tier", "verificationTier"]), tier)) return false;
    // Compare against the mapped label ("Model 1"/"Model 2"), since that's what the dropdown now offers.
    if (model !== "All Models" && formatPaymentModel(pick(e, ["paymentModel", "model"])) !== model) return false;
    if (category !== "All Categories" && !getCategories(e).some((c) => matchesFilter(c, category))) return false;
    if (region !== "All Regions" && !matchesFilter(pick(e, ["region"]), region)) return false;
    if (status !== "All Status" && !matchesFilter(pick(e, ["status"]), status)) return false;
    if (search && !`${pick(e, ["name", "fullName"])} ${pick(e, ["email"])}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const kpiTotal = pickSummary(summary, ["totalExperts"]);
  const kpiTier1 = pickSummary(summary, ["tier1", "tier1Count"]);
  const kpiTier2 = pickSummary(summary, ["tier2", "tier2Count"]);
  const kpiTier3 = pickSummary(summary, ["tier3", "tier3Count"]);

  const handleExport = async (format: ReportFormat) => {
    const action = await dispatch(downloadReport({ reportType: REPORT_TYPE, format }));
    if (downloadReport.fulfilled.match(action)) {
      const a = document.createElement("a");
      a.href = action.payload;
      a.download = `expert-details_${new Date().toISOString().split("T")[0]}.${format}`;
      a.click();
      dispatch(clearDownloadUrl());
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {selected && <RowDetailModal title="Expert Detail" row={selected} onClose={() => setSelected(null)} />}

      <p style={{ fontSize: "13px", color: colors.textMuted, margin: 0 }}>
        Dedicated report to monitor all experts — verification tier, payment mode, category, region, status, and activity.
      </p>

      <div className="rp-toolbar-row" style={{ display: "flex", gap: "10px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={14} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: colors.textFaint }} />
          <input
            type="text" placeholder="Search name, email..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...toolbarInput, width: "100%", paddingLeft: "38px", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select className="rp-select" value={tier} onChange={(e) => setTier(e.target.value)}>{TIER_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={model} onChange={(e) => setModel(e.target.value)}>{MODEL_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={category} onChange={(e) => setCategory(e.target.value)}>{categoryOptions.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={region} onChange={(e) => setRegion(e.target.value)}>{regionOptions.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={status} onChange={(e) => setStatus(e.target.value)}>{statusOptions.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
      </div>

      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><Users size={13} /> Total Experts</span>
            <span style={kpiValue}>{kpiTotal != null ? kpiTotal.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Tier 1</span>
            <span style={kpiValue}>{kpiTier1 != null ? kpiTier1.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Tier 2</span>
            <span style={kpiValue}>{kpiTier2 != null ? kpiTier2.toLocaleString() : "—"}</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Tier 3</span>
            <span style={kpiValue}>{kpiTier3 != null ? kpiTier3.toLocaleString() : "—"}</span>
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <ExportMenuButton onExport={handleExport} exporting={downloadStatus === "loading"} />
        </div>

        <div className="rp-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB" }}>
                {["Name", "Phone", "Email", "Tier", "Model", "Category", "Region", "Joined", "Status", "Actions"].map((h, i) => (
                  <th key={h} style={i === 0 ? thFirst : th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkelTableRows rows={7} cols={10} />
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: "center", padding: "56px", fontSize: "14px", color: colors.textFaint }}>No experts match your filter.</td></tr>
              ) : filtered.map((e, i) => (
                <tr key={pick(e, ["id", "_id", "email"], String(i))} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{pick(e, ["name", "fullName"])}</td>
                  <td style={td}>{pick(e, ["phone", "phoneNumber"])}</td>
                  <td style={td}>{pick(e, ["email"])}</td>
                  <td style={td}>{pick(e, ["tier", "verificationTier"])}</td>
                  <td style={td}>{formatPaymentModel(pick(e, ["paymentModel", "model"]))}</td>
                  <td style={td}>{pick(e, ["category", "serviceCategory"])}</td>
                  <td style={td}>{pick(e, ["region"])}</td>
                  <td style={td}>{pick(e, ["joined", "dateJoined", "createdAt"])}</td>
                  <td style={td}>{statusPill(pick(e, ["status"]))}</td>
                  <td style={td}>
                    <Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} onClick={() => setSelected(e)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : filtered.map((e, i) => (
            <div key={pick(e, ["id", "_id", "email"], String(i))} onClick={() => setSelected(e)} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}`, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{pick(e, ["name", "fullName"])}</span>
                {statusPill(pick(e, ["status"]))}
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{pick(e, ["category", "serviceCategory"])} · {pick(e, ["region"])} · Tier {pick(e, ["tier", "verificationTier"])} · {formatPaymentModel(pick(e, ["paymentModel", "model"]))}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of {(pagination?.total ?? rows.length).toLocaleString()} experts
          </div>
        )}
      </div>
    </div>
  );
}