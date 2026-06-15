// lib/api/auditLogsApi.ts
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────

export type AuditAction =
  | "USER_CREATED"     | "USER_DELETED"      | "USER_SUSPENDED"
  | "USER_ACTIVATED"   | "USER_UPDATED"      | "EXPERT_VERIFIED"
  | "TAS_TIER_ADJUSTED"| "PAYOUT_PROCESSED"  | "PAYOUT_REJECTED"
  | "ADMIN_LOGIN"      | "ADMIN_LOGOUT"      | "ADMIN_CREATED"
  | "ADMIN_DELETED"    | "ROLE_UPDATED"      | "REPORT_EXPORTED"
  | "SETTINGS_UPDATED" | "JOB_DELETED"       | "JOB_FLAGGED"
  | "DISPUTE_RESOLVED";

export interface AuditLog {
  id:          string;
  timestamp:   string;
  adminId:     string;
  adminName:   string;
  adminEmail:  string;
  action:      AuditAction;
  details:     string;
  targetId?:   string;
  targetType?: string;
  ipAddress:   string;
  userAgent?:  string;
}

export interface AuditLogPagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

export interface AuditLogsParams {
  page?:     number;
  limit?:    number;
  action?:   AuditAction | "";
  adminId?:  string;
  fromDate?: string;
  toDate?:   string;
  search?:   string;
}

// ── Response shapes ───────────────────────────────────────

interface AuditLogsResponse {
  status:  boolean;
  message: string;
  data: {
    logs:       AuditLog[];
    pagination: AuditLogPagination;
  };
}

interface RecentLogsResponse {
  status:  boolean;
  message: string;
  data: { logs: AuditLog[] };
}

export interface AuditLogStats {
  totalToday:          number;
  totalThisMonth:      number;
  totalAdmins:         number;
  mostFrequentAction:  string;
}

interface AuditStatsResponse {
  status:  boolean;
  message: string;
  data:    AuditLogStats;
}

// ── API calls ─────────────────────────────────────────────

export const getAuditLogs = async (
  params: AuditLogsParams = {},
): Promise<{ logs: AuditLog[]; pagination: AuditLogPagination }> => {
  // Strip empty/undefined params so the URL stays clean
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  const { data } = await axiosInstance.get<AuditLogsResponse>("/admin/audit-logs", { params: clean });
  return data.data;
};

export const getRecentAuditLogs = async (): Promise<AuditLog[]> => {
  const { data } = await axiosInstance.get<RecentLogsResponse>("/admin/audit-logs/recent");
  return data.data.logs;
};

export const getAuditLogStats = async (): Promise<AuditLogStats> => {
  const { data } = await axiosInstance.get<AuditStatsResponse>("/admin/audit-logs/stats");
  return data.data;
};

export const exportAuditLogs = async (
  params: AuditLogsParams & { format: "csv" | "pdf" },
): Promise<string> => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
  );
  const response = await axiosInstance.get("/admin/audit-logs/export", {
    params,
    responseType: "blob",
  });
  void clean;
  return URL.createObjectURL(response.data as Blob);
};