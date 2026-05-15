// app/(dashboard)/report/types.ts

export type ReportType =
  | "User Growth Report"
  | "Revenue Trend Report"
  | "Jobs Report"
  | "TAS Performance Report"
  | "Disputes Report"
  | "Top Service Category"
  | "Top Cities";

export type FormatType = "PDF" | "CSV" | "Excel";

export type ChartType = "line" | "donut";

export interface SummaryItem {
  label: string;
  value: string;
}

export interface DonutSegment {
  label: string;
  value: number; // percentage
  color: string;
}

export interface ReportConfig {
  title: string;
  chartType: ChartType;
  yLabel?: string;
  // line chart: weekly data points
  weeks?: number[];
  weekLabels?: string[];
  // donut chart
  segments?: DonutSegment[];
  summary: SummaryItem[];
}

export const REPORT_TYPES: ReportType[] = [
  "User Growth Report",
  "Revenue Trend Report",
  "Jobs Report",
  "TAS Performance Report",
  "Disputes Report",
  "Top Service Category",
  "Top Cities",
];

export const FORMATS: FormatType[] = ["PDF", "CSV", "Excel"];

export const DATE_FROM_OPTIONS = [
  "01/03/2026", "01/02/2026", "01/01/2026",
  "01/12/2025", "01/11/2025", "01/10/2025",
];

export const DATE_TO_OPTIONS = [
  "31/03/2026", "28/02/2026", "31/01/2026",
  "31/12/2025", "30/11/2025", "31/10/2025",
];

export const reportConfigs: Record<ReportType, ReportConfig> = {
  "User Growth Report": {
    title: "User Growth - March 2026",
    chartType: "line",
    yLabel: "Total Users",
    weeks: [3300, 4100, 5200, 6700],
    weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    summary: [
      { label: "Total New Users:", value: "2,847"       },
      { label: "Clients:",         value: "1,892 (66%)" },
      { label: "Experts:",         value: "845 (30%)"   },
      { label: "TAS:",             value: "110 (4%)"    },
    ],
  },
  "Revenue Trend Report": {
    title: "Revenue Trend Report - March 2026",
    chartType: "line",
    yLabel: "Revenue (₦)",
    weeks: [120000, 210000, 380000, 420000],
    weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    summary: [
      { label: "Total Revenue:",     value: "₦420,000" },
      { label: "Commission:",        value: "₦380,000" },
      { label: "TAS Bonuses:",       value: "₦40,000"  },
      { label: "Refunds Processed:", value: "₦18,500"  },
    ],
  },
  "Jobs Report": {
    title: "Jobs - March 2026",
    chartType: "line",
    yLabel: "Total Jobs",
    weeks: [45, 110, 190, 280],
    weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    summary: [
      { label: "Total Jobs:",  value: "280"       },
      { label: "Completed:",   value: "215 (77%)" },
      { label: "In Progress:", value: "38 (14%)"  },
      { label: "Disputed:",    value: "27 (9%)"   },
    ],
  },
  "TAS Performance Report": {
    title: "TAS Performance - March 2026",
    chartType: "line",
    yLabel: "Experts Recruited",
    weeks: [120, 310, 580, 900],
    weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    summary: [
      { label: "Active TAS:",      value: "48"       },
      { label: "Total Recruited:", value: "900"      },
      { label: "Avg per TAS:",     value: "18.75"    },
      { label: "TAS Payouts:",     value: "₦980,000" },
    ],
  },
  "Disputes Report": {
    title: "Disputes - March 2026",
    chartType: "line",
    yLabel: "Cases",
    weeks: [5, 12, 20, 25],
    weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    summary: [
      { label: "Total Cases:", value: "25"       },
      { label: "Resolved:",    value: "8 (32%)"  },
      { label: "In Progress:", value: "12 (48%)" },
      { label: "Open:",        value: "5 (20%)"  },
    ],
  },
  "Top Service Category": {
    title: "Top Service Category",
    chartType: "donut",
    segments: [
      { label: "Auto Repair",          value: 32, color: "#2563eb" },
      { label: "Creativity",           value: 27, color: "#F9A826" },
      { label: "Repair & Construction",value: 23, color: "#2E7D32" },
      { label: "Housekeeping",         value: 18, color: "#7B3F9E" },
    ],
    summary: [
      { label: "Auto Repair:",          value: "32%" },
      { label: "Creativity:",           value: "27%" },
      { label: "Repair & Construction:",value: "23%" },
      { label: "Housekeeping:",         value: "18%" },
    ],
  },
  "Top Cities": {
    title: "Top Cities - March 2026",
    chartType: "line",
    yLabel: "Jobs",
    weeks: [420, 680, 890, 1100],
    weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    summary: [
      { label: "Lagos:",   value: "1,100 (42%)" },
      { label: "Abuja:",   value: "680 (26%)"   },
      { label: "PH:",      value: "890 (34%)"   },
    ],
  },
};