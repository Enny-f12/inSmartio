// lib/api/detailedReportApi.ts
//
// Wraps the live Swagger endpoints:
//   GET /api/reports/detailed/{reportType}            -> KPIs + individual rows
//   GET /api/reports/detailed/{reportType}/download    -> CSV or PDF file
//   GET /api/reports/detailed/dashboard                -> dashboard KPIs, revenue trend, quick reports, recent activity
//   GET /api/reports/detailed/{reportType}/trend        -> time-bucketed trend series for charting
//

import axiosInstance from "./axiosInstance";

// ── Types ──────────────────────────────────────────────────────────

/** Matches the `reportType` enum exactly as listed in Swagger. */
export type ReportType =
  | "transactions"
  | "user-growth"
  | "expert-details"
  | "verification"
  | "revenue"
  | "job-completion"
  | "tas-performance"
  | "dispute-analysis";

export type ReportFormat = "pdf" | "csv";

/** Query params shared by both endpoints (everything except `format`, which only the download endpoint takes). */
export interface DetailedReportQuery {
  fromDate?:     string;   // ISO date, e.g. "2026-07-01"
  toDate?:       string;   // ISO date, e.g. "2026-07-28"
  page?:         number;
  limit?:        number;
  search?:       string;
  status?:       string;
  priority?:     string;
  tier?:         number;
  paymentModel?: string;
}

export interface GetDetailedReportParams extends DetailedReportQuery {
  reportType: ReportType;
}

export interface DownloadDetailedReportParams extends DetailedReportQuery {
  reportType: ReportType;
  format:     ReportFormat;
}


export type ReportSummary = Record<string, number>;

export interface DetailedReportPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
}

export interface DetailedReportData<Row = Record<string, unknown>> {
  summary:    ReportSummary;
  rows:       Row[];
  pagination: DetailedReportPagination;
}

export interface DetailedReportResponse<Row = Record<string, unknown>> {
  status:  boolean;
  message: string;
  data:    DetailedReportData<Row>;
}

// ── TAS performance row (confirmed 2026-09-16) ────────────────────
//
// The backend now returns a fully populated `location` object and a new
// `bankDetails` object on every row. Both are typed below so consumers
// (tables, detail modals, exports)
export interface TasLocation {
  area:    string;
  city:    string;
  state:   string;
  address: string;
  country: string;
}

/** `bvn` is present in the payload but is routinely returned empty by the API. */
export interface TasBankDetails {
  bvn:           string;
  bankName:      string;
  accountCode:   string;
  accountName:   string;
  accountNumber: string;
}

export type TasAgentStatus = "active" | "inactive" | "suspended" | string;

export interface TasPerformanceRow {
  id:               string;
  name:             string;
  phone:            string;
  email:            string;
  tier:             number;
  status:           TasAgentStatus;
  expertsRecruited: number;
  earnings:         number;
  joined:           string; // ISO datetime, e.g. "2026-09-15T17:49:09.676Z"
  location:         TasLocation;
  bankDetails:      TasBankDetails;
}

// ── Calls ──────────────────────────────────────────────────────────

function stripEmpty<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((key) => {
    const v = obj[key];
    if (v !== undefined && v !== null && v !== "") out[key] = v;
  });
  return out;
}

/** GET /api/reports/detailed/{reportType} */
export const getDetailedReport = async <Row = Record<string, unknown>>(
  params: GetDetailedReportParams
): Promise<DetailedReportData<Row>> => {
  const { reportType, ...query } = params;
  const { data } = await axiosInstance.get<DetailedReportResponse<Row>>(
    `/reports/detailed/${reportType}`,
    { params: stripEmpty(query) }
  );
  return data.data;
};

/**
 * GET /api/reports/detailed/{reportType}/download
 * Returns an object URL for the downloaded blob, hand it to an <a download>
 * the same way handleExport() does in jobs/page.tsx, then URL.revokeObjectURL it.
 */
export const downloadDetailedReport = async (
  params: DownloadDetailedReportParams
): Promise<string> => {
  const { reportType, format, ...query } = params;
  const response = await axiosInstance.get(
    `/reports/detailed/${reportType}/download`,
    {
      params:       stripEmpty({ format, ...query }),
      responseType: "blob",
    }
  );
  return URL.createObjectURL(response.data as Blob);
};

// ── Dashboard ──────────────────────────────────────────────────────

export type DashboardRange = "7d" | "30d" | "month" | "quarter" | "custom";

/**
 * `fromDate`/`toDate` are required when range === "custom" and disallowed
 * otherwise, this discriminated union enforces that at compile time.
 */
export type GetDashboardParams =
  | { range?: Exclude<DashboardRange, "custom">; fromDate?: never; toDate?: never }
  | { range: "custom"; fromDate: string; toDate: string };

export interface QuickReportItem {
  key:   string;
  label: string;
}

export interface DashboardCardMetric {
  value:         number;
  changePercent: number;
}

export interface RevenueTrendPoint {
  date:  string;  // ISO date, e.g. "2026-07-07"
  value: number;
}

export interface RecentActivityItem {
  type:      string;   // e.g. "new_tas", "expert_verified", "escrow_released"
  message:   string;
  timestamp: string;   // ISO datetime
}

/**
 
 *   GET /api/reports/detailed/dashboard

 */
export interface ReportsDashboardData {
  range: {
    from: string;
    to:   string;
  };
  cards: {
    totalUsers: DashboardCardMetric;
    jobs:       DashboardCardMetric;
    revenue:    DashboardCardMetric;
    tasAgents:  DashboardCardMetric;
  };
  revenueTrend: {
    title:  string;
    total:  number;
    series: RevenueTrendPoint[];
  };
  quickReports:   QuickReportItem[];
  recentActivity: RecentActivityItem[];
}

export interface ReportsDashboardResponse {
  status:  boolean;
  message: string;
  data:    ReportsDashboardData;
}

/** GET /api/reports/detailed/dashboard */
export const getReportsDashboard = async (
  params: GetDashboardParams = {}
): Promise<ReportsDashboardData> => {
  const { data } = await axiosInstance.get<ReportsDashboardResponse>(
    `/reports/detailed/dashboard`,
    { params: stripEmpty(params) }
  );
  return data.data;
};

// ── Trend ──────────────────────────────────────────────────────────

export type TrendGroupBy = "day" | "week" | "month";

export interface GetReportTrendParams {
  reportType: ReportType;      // path param
  groupBy?:   TrendGroupBy;
  fromDate?:  string;
  toDate?:    string;
}

export interface ReportTrendPoint {
  date:  string;  // ISO date, e.g. "2026-07-07"
  value: number;
}

export interface ReportTrendResponse {
  status:  boolean;
  message: string;
  data: {
    series: ReportTrendPoint[];
  };
}

/** GET /api/reports/detailed/{reportType}/trend */
export const getReportTrend = async (
  params: GetReportTrendParams
): Promise<ReportTrendPoint[]> => {
  const { reportType, ...query } = params;
  const { data } = await axiosInstance.get<ReportTrendResponse>(
    `/reports/detailed/${reportType}/trend`,
    { params: stripEmpty(query) }
  );
  return data.data.series ?? [];
};