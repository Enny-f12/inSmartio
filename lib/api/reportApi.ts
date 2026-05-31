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

export interface ReportsSummaryData {
  [key: string]: unknown;
}

export interface ExpertPerformanceItem {
  [key: string]: unknown;
}

export interface TasPerformanceItem {
  [key: string]: unknown;
}

// ── Job Completion ────────────────────────────────────────

export interface JobCompletionMonthlyItem {
  month:     string;
  completed: number;
  cancelled: number;
  disputed:  number;
}

export interface JobCompletionData {
  summary: {
    totalJobs:      number;
    completedJobs:  number;
    cancelledJobs:  number;
    disputedJobs:   number;
    completionRate: number;
  };
  monthly: JobCompletionMonthlyItem[];
}

// ── Dispute Analysis ──────────────────────────────────────

export interface DisputeMonthlyItem {
  month:      string;
  total:      number;
  resolved:   number;
  inProgress: number;
  escalated:  number;
}

export interface DisputeReasonItem {
  reason:     string;
  count:      number;
  percentage: number;
}

export interface DisputeAnalysisData {
  summary: {
    totalDisputes:  number;
    resolved:       number;
    inProgress:     number;
    escalated:      number;
    resolutionRate: number;
  };
  monthly:    DisputeMonthlyItem[];
  topReasons: DisputeReasonItem[];
}

export type DownloadReportType =
  | "user-growth"
  | "revenue-trend"
  | "service-category"
  | "cities"
  | "job-completion-report"
  | "tas-performance-report"
  | "dispute-analysis-report"
  | "expert-verification"
  | "users"
  | "jobs"
  | "escrows"
  | "dispute";

export type ReportFileType = "pdf" | "csv";

export interface DownloadReportPayload {
  reportType: DownloadReportType;
  type:       ReportFileType;
  fromDate:   string;
  toDate:     string;
}

// ── Endpoints ─────────────────────────────────────────────

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

export const fetchReportsSummary = async (): Promise<ReportsSummaryData> => {
  const { data } = await axiosInstance.get("/reports/summary");
  return data.data ?? {};
};

export const fetchExpertPerformance = async (limit?: number): Promise<ExpertPerformanceItem[]> => {
  const { data } = await axiosInstance.get("/reports/expert-verification", {
    params: limit ? { limit } : undefined,
  });
  return data.data ?? [];
};

export const fetchTasPerformance = async (limit?: number): Promise<TasPerformanceItem[]> => {
  const { data } = await axiosInstance.get("/reports/tas-performance", {
    params: limit ? { limit } : undefined,
  });
  return data.data ?? [];
};

export const fetchJobCompletion = async (q: ReportQuery): Promise<JobCompletionData> => {
  const { data } = await axiosInstance.get("/reports/job-completion", { params: q });
  return data.data;
};

export const fetchDisputeAnalysis = async (q: ReportQuery): Promise<DisputeAnalysisData> => {
  const { data } = await axiosInstance.get("/reports/dispute-analysis", { params: q });
  return data.data;
};

export const downloadReport = async (payload: DownloadReportPayload): Promise<string> => {
  const response = await axiosInstance.post("/report/download", payload, {
    responseType: "blob",
  });
  return URL.createObjectURL(response.data as Blob);
};