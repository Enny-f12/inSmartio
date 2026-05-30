// lib/api/reportApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

export interface ReportQuery {
  fromDate: string;
  toDate:   string;
}

export interface MonthlyUserGrowthItem {
  month: string;
  count: number;
}

export interface RevenueTrendItem {
  month:   string;
  revenue: number;
}

export interface ServiceCategoryItem {
  category:   string;
  percentage: number;
}
export interface TopServiceCategoryData {
  categories:       ServiceCategoryItem[];
  sumOfPercentages: number;
}

export interface CityBreakdown {
  count:      number;
  percentage: number;
}
export interface TopCityItem {
  city:                                string;
  totalUsersInCity:                    number;
  totalUsersInCityPercentageOfOverall: number;
  breakdownInCity: {
    clients:          CityBreakdown;
    experts:          CityBreakdown;
    tas:              CityBreakdown;
    sumOfPercentages: number;
  };
}

export interface TopCitiesOverall {
  totalUsers: number;
  clients:    { count: number; percentage: number };
  experts:    { count: number; percentage: number };
  tas:        { count: number; percentage: number };
  sumOfPercentages: number;
}

export interface TopCitiesData {
  overall: TopCitiesOverall;
  cities:  TopCityItem[];
}

// ── New report data types ─────────────────────────────────

export interface ReportsSummaryData {
  [key: string]: unknown;
}

export interface ExpertPerformanceItem {
  [key: string]: unknown;
}

export interface TasPerformanceItem {
  [key: string]: unknown;
}

// All backend reportType values
export type DownloadReportType =
  | "users"
  | "jobs"
  | "escrows"
  | "dispute"
  | "userGrowth"
  | "revenueTrend"
  | "serviceCategory"
  | "cities";

export type ReportFileType = "pdf" | "csv";

export interface DownloadReportPayload {
  reportType: DownloadReportType;
  type:       ReportFileType;
  fromDate:   string;
  toDate:     string;
}

// ── Existing endpoints ────────────────────────────────────

export const fetchUserGrowth = async (q: ReportQuery): Promise<MonthlyUserGrowthItem[]> => {
  const { data } = await axiosInstance.get("/report/monthly-user-growth", { params: q });
  return data.data ?? [];
};

export const fetchRevenueTrend = async (q: ReportQuery): Promise<RevenueTrendItem[]> => {
  const { data } = await axiosInstance.get("/report/revenue-trend", { params: q });
  return data.data ?? [];
};

export const fetchTopServiceCategory = async (q: ReportQuery): Promise<TopServiceCategoryData> => {
  const { data } = await axiosInstance.get("/report/top-service-category", { params: q });
  return data.data;
};

export const fetchTopCities = async (q: ReportQuery): Promise<TopCitiesData> => {
  const { data } = await axiosInstance.get("/report/top-cities", { params: q });
  return data.data;
};

// ── New report endpoints (from Swagger) ───────────────────

// GET /api/reports/summary — platform-wide summary statistics
export const fetchReportsSummary = async (): Promise<ReportsSummaryData> => {
  const { data } = await axiosInstance.get("/reports/summary");
  return data.data ?? {};
};

// GET /api/reports/expert-performance — expert performance report
// Optional: limit (number)
export const fetchExpertPerformance = async (limit?: number): Promise<ExpertPerformanceItem[]> => {
  const { data } = await axiosInstance.get("/reports/expert-performance", {
    params: limit ? { limit } : undefined,
  });
  return data.data ?? [];
};

// GET /api/reports/tas-performance — TAS performance report
// Optional: limit (number)
export const fetchTasPerformance = async (limit?: number): Promise<TasPerformanceItem[]> => {
  const { data } = await axiosInstance.get("/reports/tas-performance", {
    params: limit ? { limit } : undefined,
  });
  return data.data ?? [];
};

// POST /report/download — body: { reportType, type, fromDate, toDate }
export const downloadReport = async (payload: DownloadReportPayload): Promise<string> => {
  const response = await axiosInstance.post("/report/download", payload, {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data as Blob);
};