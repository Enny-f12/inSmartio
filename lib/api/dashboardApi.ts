import axiosInstance from "@/lib/api/axiosInstance";

export interface RecentActivityItem {
  id:        string;
  type:      string;
  text:      string;
  createdAt: string;
}

export interface PendingAlerts {
  pendingVerifications: { total: number; tier1: number; tier2: number; tier3: number };
  openDisputes:         { total: number; new: number; inProgress: number; inMediation: number };
  tasApplications:      { total: number };
  pendingPayouts:       { total: number; amountNaira: number };
}

export const getRecentActivity = (): Promise<RecentActivityItem[]> =>
  axiosInstance
    .get<{ success: boolean; data: RecentActivityItem[] }>("/admin/dashboard/recent-activity")
    .then((r) => r.data.data);

export const getPendingAlerts = (): Promise<PendingAlerts> =>
  axiosInstance
    .get<{ success: boolean; data: PendingAlerts }>("/admin/dashboard/pending-alerts")
    .then((r) => r.data.data);