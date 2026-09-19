import axiosInstance from "@/lib/api/axiosInstance";

export interface RecentActivityItem {
  id:        string;
  type:      string;
  text:      string;
  createdAt: string;
}

//  GET /admin/alerts 
export interface AlertsSummary {
  totalAlerts: number;
  total:       number;
  verification: { total: number; tier1: number; tier2: number; tier3: number };
  tas:          { total: number; pendingReview: number; rejectedDocuments: number; pendingPayout: number };
  dispute:      { total: number; new: number; inProgress: number; mediation: number };
  payouts:      { count: number; totalAmount: number; formattedTotalAmount: string };
}


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

export const getAlerts = (): Promise<AlertsSummary> =>
  axiosInstance
    .get<{ status: boolean; message: string; data: AlertsSummary }>("/admin/alerts")
    .then((r) => r.data.data);