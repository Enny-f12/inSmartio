// components/report/types.ts

export type ReportType =
  | "User Growth Report"
  | "Revenue Report"
  | "Top Service Category"
  | "Top Cities"
  | "Job Completion Report"
  | "TAS Performance Report"
  | "Dispute Analysis Report"
  | "Verification Report"
  | "Users Report"
  | "Jobs Report"
  | "Escrow Report"
  | "Disputes Report";

export type FormatType = "PDF" | "CSV";

export interface ReportSummaryItem {
  label: string;
  value: string;
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface ReportConfig {
  yLabel:      string;
  chartType:   string;
  title:       string;
  description: string;
  weeks?:      number[];
  weekLabels?: string[];
  segments?:   DonutSegment[];
  summary:     ReportSummaryItem[];
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FLAT         = [0,0,0,0,0,0,0,0,0,0,0,0];

export const reportConfigs: Record<ReportType, ReportConfig> = {
  "User Growth Report": {
    title:       "User Growth Report",
    description: "New users by day/week/month",
    yLabel:      "Users",
    chartType:   "line",
    weeks:       FLAT,
    weekLabels:  MONTH_LABELS,
    summary:     [{ label: "Total New Users:", value: "—" }],
  },
  "Revenue Report": {
    title:       "Revenue Report",
    description: "Platform revenue breakdown",
    yLabel:      "Revenue ($)",
    chartType:   "bar",
    weeks:       FLAT,
    weekLabels:  MONTH_LABELS,
    summary:     [{ label: "Total Revenue:", value: "—" }],
  },
  "Top Service Category": {
    title:       "Top Service Category",
    description: "Jobs by service category",
    yLabel:      "Percentage",
    chartType:   "donut",
    segments: [
      { label: "Auto Repair",           value: 32, color: "#2563eb" },
      { label: "Creativity",            value: 27, color: "#F9A826" },
      { label: "Repair & Construction", value: 23, color: "#2E7D32" },
      { label: "Housekeeping",          value: 18, color: "#7B3F9E" },
    ],
    summary: [
      { label: "Auto Repair:",           value: "32%" },
      { label: "Creativity:",            value: "27%" },
      { label: "Repair & Construction:", value: "23%" },
      { label: "Housekeeping:",          value: "18%" },
    ],
  },
  "Top Cities": {
    title:       "Top Cities",
    description: "User distribution by city",
    yLabel:      "Percentage",
    chartType:   "bar",
    weeks:       [42, 28, 16, 9, 5],
    weekLabels:  ["Lagos", "Abuja", "PH", "Ibadan", "Kano"],
    summary: [
      { label: "Lagos:",  value: "42%" },
      { label: "Abuja:",  value: "28%" },
      { label: "PH:",     value: "16%" },
      { label: "Ibadan:", value: "9%"  },
      { label: "Kano:",   value: "5%"  },
    ],
  },
  "Job Completion Report": {
    title:       "Job Completion Report",
    description: "Jobs by category, status, location",
    yLabel:      "Jobs",
    chartType:   "bar",
    weeks:       [0],
    weekLabels:  ["No data"],
    summary:     [{ label: "Total Jobs:", value: "0" }],
  },
  "TAS Performance Report": {
    title:       "TAS Performance Report",
    description: "Top TAS agents, earnings, recruitment",
    yLabel:      "Performance",
    chartType:   "line",
    weeks:       [0],
    weekLabels:  ["No data"],
    summary:     [{ label: "Total TAS:", value: "0" }],
  },
  "Dispute Analysis Report": {
    title:       "Dispute Analysis Report",
    description: "Disputes by type, resolution rate",
    yLabel:      "Disputes",
    chartType:   "pie",
    weeks:       [0],
    weekLabels:  ["No data"],
    summary:     [{ label: "Total Disputes:", value: "0" }],
  },
  "Verification Report": {
    title:       "Verification Report",
    description: "Verification queue, approval rates",
    yLabel:      "Verifications",
    chartType:   "bar",
    weeks:       [0],
    weekLabels:  ["No data"],
    summary:     [{ label: "Total Verifications:", value: "0" }],
  },

  // ── Download-only types (no chart rendered) ───────────────
  "Users Report": {
    title:       "Users Report",
    description: "Comprehensive user registrations (clients, experts, TAS)",
    yLabel:      "",
    chartType:   "none",
    weeks:       [],
    weekLabels:  [],
    summary:     [],
  },
  "Jobs Report": {
    title:       "Jobs Report",
    description: "Jobs list and basic job metrics",
    yLabel:      "",
    chartType:   "none",
    weeks:       [],
    weekLabels:  [],
    summary:     [],
  },
  "Escrow Report": {
    title:       "Escrow Report",
    description: "Finance escrow records (client/expert)",
    yLabel:      "",
    chartType:   "none",
    weeks:       [],
    weekLabels:  [],
    summary:     [],
  },
  "Disputes Report": {
    title:       "Disputes Report",
    description: "Dispute cases list",
    yLabel:      "",
    chartType:   "none",
    weeks:       [],
    weekLabels:  [],
    summary:     [],
  },
};