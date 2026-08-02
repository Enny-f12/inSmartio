// components/ExpertDetailsReport.tsx
"use client";

import { useState } from "react";
import { Search, Download, Users, ShieldCheck, Eye, Pencil } from "lucide-react";
import { colors, card, kpiCard, kpiLabel, kpiValue, kpiDelta, th, thFirst, td, tdFirst, toolbarInput, exportBtn } from "./shared";
import { SkelKPIRow, SkelTableRows, SkelCardRows } from "./Skeleton";
import { useSimulatedLoad } from "./useSimulatedLoad";
import { experts, expertTierTotals } from "./mockData";

const TIER_OPTIONS = ["All Tiers", "1", "2", "3"];
const MODEL_OPTIONS = ["All Models", "M1", "M2"];
const CATEGORY_OPTIONS = ["All Categories", "Plumbing", "Cleaning", "Auto Repair", "Tutoring", "Appliance", "Hairdressing"];
const REGION_OPTIONS = ["All Regions", "MN-W", "IS-E", "MN-N", "MN-E", "IS-N", "MN-S", "IS-W"];
const STATUS_OPTIONS = ["All Status", "Active", "Pending", "Suspended"];

function statusPill(status: string) {
  const map: Record<string, { bg: string; fg: string }> = {
    Active: { bg: colors.greenBg, fg: colors.green },
    Pending: { bg: colors.amberBg, fg: colors.amber },
    Suspended: { bg: colors.redBg, fg: colors.red },
  };
  const c = map[status] ?? { bg: "#F3F4F6", fg: colors.textMuted };
  return <span style={{ padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: c.bg, color: c.fg }}>{status}</span>;
}

export default function ExpertDetailsReport() {
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("All Tiers");
  const [model, setModel] = useState("All Models");
  const [category, setCategory] = useState("All Categories");
  const [region, setRegion] = useState("All Regions");
  const [status, setStatus] = useState("All Status");

  const loading = useSimulatedLoad([search, tier, model, category, region, status]);

  const filtered = experts.filter((e) => {
    if (tier !== "All Tiers" && String(e.tier) !== tier) return false;
    if (model !== "All Models" && e.model !== model) return false;
    if (category !== "All Categories" && e.category !== category) return false;
    if (region !== "All Regions" && e.region !== region) return false;
    if (status !== "All Status" && e.status !== status) return false;
    if (search && !`${e.name} ${e.email}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
          <select className="rp-select" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORY_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={region} onChange={(e) => setRegion(e.target.value)}>{REGION_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
          <select className="rp-select" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
        </div>
      </div>

      {loading ? (
        <SkelKPIRow count={4} />
      ) : (
        <div className="rp-kpis" style={{ display: "grid", gap: "14px" }}>
          <div style={kpiCard}>
            <span style={kpiLabel}><Users size={13} /> Total Experts</span>
            <span style={kpiValue}>{expertTierTotals.total.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 18%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Tier 1</span>
            <span style={kpiValue}>{expertTierTotals.tier1.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 12%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Tier 2</span>
            <span style={kpiValue}>{expertTierTotals.tier2.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 15%</span>
          </div>
          <div style={kpiCard}>
            <span style={kpiLabel}><ShieldCheck size={13} /> Tier 3</span>
            <span style={kpiValue}>{expertTierTotals.tier3.toLocaleString()}</span>
            <span style={kpiDelta(true)}>↑ 25%</span>
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", padding: "14px 20px", borderBottom: `1px solid ${colors.border}` }}>
          <button style={exportBtn()}><Download size={13} /> CSV</button>
          <button style={exportBtn()}><Download size={13} /> PDF</button>
          <button style={exportBtn("primary")}><Download size={13} /> Excel</button>
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
              ) : filtered.map((e) => (
                <tr key={e.email} className="rp-row" style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
                  <td style={tdFirst}>{e.name}</td>
                  <td style={td}>{e.phone}</td>
                  <td style={td}>{e.email}</td>
                  <td style={td}>{e.tier}</td>
                  <td style={td}>{e.model}</td>
                  <td style={td}>{e.category}</td>
                  <td style={td}>{e.region}</td>
                  <td style={td}>{e.joined}</td>
                  <td style={td}>{statusPill(e.status)}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Eye size={15} style={{ color: colors.textFaint, cursor: "pointer" }} />
                      <Pencil size={14} style={{ color: colors.textFaint, cursor: "pointer" }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-cards">
          {loading ? <SkelCardRows rows={4} /> : filtered.map((e) => (
            <div key={e.email} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${colors.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>{e.name}</span>
                {statusPill(e.status)}
              </div>
              <p style={{ fontSize: "12px", color: colors.textMuted, margin: 0 }}>{e.category} · {e.region} · Tier {e.tier} · {e.model}</p>
            </div>
          ))}
        </div>

        {!loading && (
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${colors.border}`, backgroundColor: "#F9FAFB", fontSize: "12px", color: colors.textFaint }}>
            Showing 1 to {filtered.length} of 3,456 experts
          </div>
        )}
      </div>
    </div>
  );
}