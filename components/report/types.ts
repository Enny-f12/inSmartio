// components/report/types.ts

export type ReportType =
  | "User Growth Report"
  | "Revenue Report"
  | "Top Service Category"
  | "Top Cities"
  | "Job Completion Report"
  | "TAS Performance Report"
  | "Dispute Analysis Report"
  | "Verification Report";

export type FormatType = "PDF" | "CSV";

export type ChartType = "line" | "donut";

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
  title:       string;
  description: string;
  chartType:   ChartType;
  yLabel?:     string;
  weeks?:      number[];
  weekLabels?: string[];
  segments?:   DonutSegment[];
  summary:     ReportSummaryItem[];
}

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FLAT         = [0,0,0,0,0,0,0,0,0,0,0,0];

export const reportConfigs: Record<ReportType, ReportConfig> = {
  "User Growth Report": {
    title: "User Growth Report", description: "New users by day/week/month",
    chartType: "line", yLabel: "Total Users",
    weeks: FLAT, weekLabels: MONTH_LABELS,
    summary: [{ label: "Total New Users:", value: "—" }],
  },
  "Revenue Report": {
    title: "Revenue Report", description: "Platform revenue breakdown",
    chartType: "line", yLabel: "Revenue (₦)",
    weeks: FLAT, weekLabels: MONTH_LABELS,
    summary: [{ label: "Total Revenue:", value: "—" }],
  },
  "Top Service Category": {
    title: "Top Service Category", description: "Jobs by service category",
    chartType: "donut",
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
    title: "Top Cities", description: "User distribution by city",
    chartType: "line", yLabel: "Users",
    weeks: [42, 28, 16, 9, 5], weekLabels: ["Lagos","Abuja","PH","Ibadan","Kano"],
    summary: [
      { label: "Lagos:",  value: "42%" },
      { label: "Abuja:",  value: "28%" },
      { label: "PH:",     value: "16%" },
      { label: "Ibadan:", value: "9%"  },
      { label: "Kano:",   value: "5%"  },
    ],
  },
  "Job Completion Report": {
    title: "Job Completion Report", description: "Jobs by category, status, location",
    chartType: "line", yLabel: "Jobs",
    weeks: FLAT, weekLabels: MONTH_LABELS,
    summary: [{ label: "Total Jobs:", value: "—" }],
  },
  "TAS Performance Report": {
    title: "TAS Performance Report", description: "Top TAS agents, earnings, recruitment",
    chartType: "line", yLabel: "Recruits",
    weeks: FLAT, weekLabels: MONTH_LABELS,
    summary: [{ label: "Total TAS:", value: "—" }],
  },
  "Dispute Analysis Report": {
    title: "Dispute Analysis Report", description: "Disputes by type, resolution rate",
    chartType: "donut",
    segments: [
      { label: "Service Quality", value: 38, color: "#2563eb" },
      { label: "Payment Issue",   value: 29, color: "#F9A826" },
      { label: "No-Show",        value: 20, color: "#2E7D32" },
      { label: "Other",           value: 13, color: "#7B3F9E" },
    ],
    summary: [
      { label: "Total Disputes:", value: "—" },
      { label: "Resolved:",       value: "—" },
    ],
  },
  "Verification Report": {
    title: "Verification Report", description: "Verification queue, approval rates",
    chartType: "line", yLabel: "Verifications",
    weeks: FLAT, weekLabels: MONTH_LABELS,
    summary: [{ label: "Total Verifications:", value: "—" }],
  },
};