// lib/api/detailedReportApi.ts
//
// Wraps the two live Swagger endpoints:
//   GET /api/reports/detailed/{reportType}            -> KPIs + individual rows
//   GET /api/reports/detailed/{reportType}/download    -> CSV or PDF file
//
// Follows the same shape as lib/api/adminApi.ts: typed axios calls, response
// unwrapped from the standard { status, message, data } envelope.
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

/**
 * Confirmed shape from the real tas-performance response:
 *   "summary": { "totalTasAgents": 6, "expertsRecruited": 23, "totalEarnings": 0 }
 * i.e. a flat object of numbers, keyed per report type — NOT an array, and
 * with no delta/% change field. Other report types are assumed to follow the
 * same `summary` pattern with their own keys until confirmed individually.
 */
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

// ── Calls ──────────────────────────────────────────────────────────

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const key in obj) {
    const v = obj[key];
    if (v !== undefined && v !== null && v !== "") out[key] = v;
  }
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
 * Returns an object URL for the downloaded blob — hand it to an <a download>
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