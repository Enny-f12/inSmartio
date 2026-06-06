import axiosInstance from "@/lib/api/axiosInstance"; // adjust to your axios path
import type {
  Bid,
  BidFilters,
  BidKPISummary,
  CancellationFeeFilters,
  CancellationFeeRecord,
  CancellationFeeSummary,
  ExpertDispute,
  ClientDispute,
  NotificationLog,
  PaginatedResponse,
  ApiResponse,
} from "@/components/bid/types";

// ─── Bids ─────────────────────────────────────────────────────────────────────

export const bidService = {
  /** GET /api/admin/bids */
  getBids: async (
    filters: BidFilters = {}
  ): Promise<PaginatedResponse<Bid>> => {
    const params = new URLSearchParams();
    if (filters.step && filters.step !== "all")
      params.set("step", String(filters.step));
    if (filters.status && filters.status !== "all")
      params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await axiosInstance.get<PaginatedResponse<Bid>>(
      `/api/admin/bids?${params.toString()}`
    );
    return res.data;
  },

  /** GET /api/admin/bids/kpi-summary */
  getKPISummary: async (): Promise<BidKPISummary> => {
    const res = await axiosInstance.get<ApiResponse<BidKPISummary>>(
      "/api/admin/bids/kpi-summary"
    );
    return res.data.data;
  },

  /** GET /api/admin/bids/:bidId */
  getBidDetail: async (bidId: string): Promise<Bid> => {
    const res = await axiosInstance.get<ApiResponse<Bid>>(
      `/api/admin/bids/${bidId}`
    );
    return res.data.data;
  },

  /** PATCH /api/admin/bids/:bidId/flag */
  flagBid: async (
    bidId: string,
    reason: string,
    priority: "HIGH" | "MEDIUM" | "LOW"
  ): Promise<void> => {
    await axiosInstance.patch(`/api/admin/bids/${bidId}/flag`, {
      reason,
      priority,
    });
  },
};

// ─── Cancellation Fees ────────────────────────────────────────────────────────

export const cancellationFeeService = {
  /** GET /api/admin/cancellation-fees */
  getCancellationFees: async (
    filters: CancellationFeeFilters = {}
  ): Promise<PaginatedResponse<CancellationFeeRecord>> => {
    const params = new URLSearchParams();
    if (filters.dateRange) params.set("dateRange", filters.dateRange);
    if (filters.expertId) params.set("expertId", filters.expertId);
    if (filters.clientId) params.set("clientId", filters.clientId);
    if (filters.page) params.set("page", String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await axiosInstance.get<PaginatedResponse<CancellationFeeRecord>>(
      `/api/admin/cancellation-fees?${params.toString()}`
    );
    return res.data;
  },

  /** GET /api/admin/cancellation-fees/summary */
  getSummary: async (): Promise<CancellationFeeSummary> => {
    const res = await axiosInstance.get<ApiResponse<CancellationFeeSummary>>(
      "/api/admin/cancellation-fees/summary"
    );
    return res.data.data;
  },

  /** GET /api/admin/cancellation-fees/:jobId */
  getCancellationFeeDetail: async (
    jobId: string
  ): Promise<CancellationFeeRecord> => {
    const res = await axiosInstance.get<ApiResponse<CancellationFeeRecord>>(
      `/api/admin/cancellation-fees/${jobId}`
    );
    return res.data.data;
  },

  /** PATCH /api/admin/cancellation-fees/:jobId/confirm */
  confirmFee: async (jobId: string): Promise<void> => {
    await axiosInstance.patch(
      `/api/admin/cancellation-fees/${jobId}/confirm`
    );
  },

  /** PATCH /api/admin/cancellation-fees/:jobId/adjust */
  adjustFee: async (
    jobId: string,
    adjustedAmount: number,
    reason: string
  ): Promise<void> => {
    await axiosInstance.patch(
      `/api/admin/cancellation-fees/${jobId}/adjust`,
      { adjustedAmount, reason }
    );
  },

  /** POST /api/admin/cancellation-fees/:jobId/waive */
  waiveFee: async (
    jobId: string,
    reason: string,
    note: string
  ): Promise<void> => {
    await axiosInstance.post(
      `/api/admin/cancellation-fees/${jobId}/waive`,
      { reason, note }
    );
  },

  /** GET /api/admin/cancellation-fees/export */
  exportReport: async (params: {
    reportType: "summary" | "detailed" | "expert_performance" | "client_performance";
    format: "pdf" | "csv" | "excel";
    dateFrom: string;
    dateTo: string;
    includeFields: string[];
  }): Promise<Blob> => {
    const res = await axiosInstance.get("/api/admin/cancellation-fees/export", {
      params,
      responseType: "blob",
    });
    return res.data;
  },
};

// ─── Dispute Flags ────────────────────────────────────────────────────────────

export const disputeService = {
  /** GET /api/admin/flags/excessive-cancellations */
  getExcessiveCancellations: async (): Promise<{
    experts: ExpertDispute[];
    clients: ClientDispute[];
  }> => {
    const res = await axiosInstance.get<
      ApiResponse<{ experts: ExpertDispute[]; clients: ClientDispute[] }>
    >("/api/admin/flags/excessive-cancellations");
    return res.data.data;
  },

  /** POST /api/admin/flags/:entityId/action */
  takeAction: async (
    entityId: string,
    action: "suspend" | "investigate" | "dismiss" | "flag" | "require_prepayment",
    note?: string
  ): Promise<void> => {
    await axiosInstance.post(`/api/admin/flags/${entityId}/action`, {
      action,
      note,
    });
  },
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationLogService = {
  /** GET /api/admin/bids/:bidId/notifications */
  getNotifications: async (bidId: string): Promise<NotificationLog[]> => {
    const res = await axiosInstance.get<ApiResponse<NotificationLog[]>>(
      `/api/admin/bids/${bidId}/notifications`
    );
    return res.data.data;
  },

  /** POST /api/admin/bids/:bidId/notifications/resend */
  resendNotification: async (
    bidId: string,
    notificationId: string
  ): Promise<void> => {
    await axiosInstance.post(
      `/api/admin/bids/${bidId}/notifications/resend`,
      { notificationId }
    );
  },
};