// lib/api/reportApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Query params all endpoints share ─────────────────────
export interface ReportQuery {
  fromDate: string; // ISO 8601 e.g. "2026-03-01"
  toDate:   string;
}

// ── Response shapes ───────────────────────────────────────

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
  city:                             string;
  totalUsersInCity:                 number;
  totalUsersInCityPercentageOfOverall: number;
  breakdownInCity: {
    clients:          CityBreakdown;
    experts:          CityBreakdown;
    tas:              CityBreakdown;
    sumOfPercentages: number;
  };
}

// ── API endpoint strings (match backend reportType param) ──
export type ApiReportType =
  | "monthly-user-growth"
  | "revenue-trend"
  | "top-service-category"
  | "top-cities";

// ── Fetch functions ───────────────────────────────────────

export const fetchUserGrowth = async (q: ReportQuery): Promise<MonthlyUserGrowthItem[]> => {
  const { data } = await axiosInstance.get("/report/monthly-user-growth", { params: { fromDate: q.fromDate, toDate: q.toDate } });
  return data.data ?? [];
};

export const fetchRevenueTrend = async (q: ReportQuery): Promise<RevenueTrendItem[]> => {
  const { data } = await axiosInstance.get("/report/revenue-trend", { params: { fromDate: q.fromDate, toDate: q.toDate } });
  return data.data ?? [];
};

export const fetchTopServiceCategory = async (q: ReportQuery): Promise<TopServiceCategoryData> => {
  const { data } = await axiosInstance.get("/report/top-service-category", { params: { fromDate: q.fromDate, toDate: q.toDate } });
  return data.data;
};

export const fetchTopCities = async (q: ReportQuery): Promise<TopCityItem[]> => {
  const { data } = await axiosInstance.get("/report/top-cities", { params: { fromDate: q.fromDate, toDate: q.toDate } });
  return data.data ?? [];
};

// ── PDF download — returns a blob URL the browser can open ─
export const downloadReportPdf = async (reportType: ApiReportType, q: ReportQuery): Promise<string> => {
  const response = await axiosInstance.get("/report/download", {
    params:       { reportType, fromDate: q.fromDate, toDate: q.toDate },
    responseType: "blob",
  });
  return URL.createObjectURL(response.data as Blob);
};