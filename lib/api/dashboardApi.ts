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

// Rewrites raw activity text into a cleaner, human-friendly message based on type.
// - expert_registered: "Name registered on EXPERT-026-2190-07-26" -> "Name registered as an expert"
// - tas_application:    "Name applied on 2026-07-25T08:02:34.697Z" -> "Name applied as TAS"
function formatActivityText(item: Pick<RecentActivityItem, "type" | "text">): string {
  const { type, text } = item;
  if (!text) return text;

  if (type === "expert_registered") {
    return text.replace(/\s+on\s+EXPERT-[\w-]+/i, " as an expert");
  }

  if (type === "tas_application") {
    // strip trailing double spaces from names too, then replace the ISO timestamp
    return text
      .replace(/\s+on\s+\d{4}-\d{2}-\d{2}T[\d:.]+Z?/i, " as TAS")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  return text;
}

export const getRecentActivity = (): Promise<RecentActivityItem[]> =>
  axiosInstance
    .get<{ success: boolean; data: RecentActivityItem[] }>("/logs")
    .then((r) =>
      r.data.data.map((item) => ({
        ...item,
        text: formatActivityText(item),
      }))
    );

export const getPendingAlerts = (): Promise<PendingAlerts> =>
  axiosInstance
    .get<{ success: boolean; data: PendingAlerts }>("/admin/dashboard/pending-alerts")
    .then((r) => r.data.data);