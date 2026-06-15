import axiosInstance from "@/lib/api/axiosInstance";
import type {
  Bid,
  BidFilters,
  BidKPISummary,
  CancellationFeeFilters,
  CancellationFeeRecord,
  ExpertDispute,
  ClientDispute,
  NotificationLog,
  PaginatedResponse,
} from "@/components/bid/types";

// ─── Bids ─────────────────────────────────────────────────────────────────────

export const bidService = {
  /**
   * GET /bid/admin/bids
   * Actual API envelope:
   *   { status, message, data: { data: Bid[], total, page, limit, pages } }
   * Unwrapped to PaginatedResponse<Bid>:
   *   { data: Bid[], total, page, limit, totalPages }
   */
  getBids: async (filters: BidFilters = {}): Promise<PaginatedResponse<Bid>> => {
    const params = new URLSearchParams();
    if (filters.step && filters.step !== "all")
      params.set("step", String(filters.step));
    if (filters.status && filters.status !== "all")
      params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.page)   params.set("page",   String(filters.page));
    if (filters.limit)  params.set("limit",  String(filters.limit));

    const res = await axiosInstance.get(`/bid/admin/bids?${params.toString()}`);
    const envelope = res.data?.data ?? res.data;
    return {
      data:       envelope.data       ?? [],
      total:      envelope.total      ?? 0,
      page:       envelope.page       ?? 1,
      limit:      envelope.limit      ?? 20,
      totalPages: envelope.totalPages ?? envelope.pages ?? 1,
    };
  },

  /**
   * GET /bid/admin/overview
   * Actual envelope: { status, message, data: { kpis: { totalBids, activeBids, ... } } }
   */
  getKPISummary: async (): Promise<BidKPISummary> => {
    const res = await axiosInstance.get("/bid/admin/overview");
    const k = res.data?.data?.kpis ?? {};
    return {
      totalBids:             k.totalBids             ?? 0,
      totalBidsDelta:        k.totalBidsDelta        ?? 0,
      activeBids:            k.activeBids            ?? 0,
      activeBidsDelta:       k.activeBidsDelta       ?? 0,
      priceRequests:         k.priceRequestBids      ?? 0,
      priceRequestsDelta:    k.priceRequestsDelta    ?? 0,
      rejected:              k.rejectedBids          ?? 0,
      rejectedDelta:         k.rejectedDelta         ?? 0,
      cancellationFees:      k.totalCancellationFees ?? 0,
      cancellationFeesDelta: k.cancellationFeesDelta ?? 0,
      cancellationFeeRate:   parseFloat(k.cancellationFeeRatio) || 0,
    };
  },

  /**
   * GET /bid/admin/bids/:bidId
   * Actual envelope: { status, message, data: { id, jobId, expert, job, ... } }
   */
  getBidDetail: async (bidId: string): Promise<Bid> => {
    const res = await axiosInstance.get(`/bid/admin/bids/${bidId}`);
    return res.data?.data ?? res.data;
  },

  /**
   * PUT /bid/admin/bids/:bidId/flag
   * Flag a bid for review with reason and priority
   */
  flagBid: async (
    bidId: string,
    reason: string,
    priority: "HIGH" | "MEDIUM" | "LOW"
  ): Promise<void> => {
    await axiosInstance.put(`/bid/admin/bids/${bidId}/flag`, { reason, priority });
  },

  /**
   * POST /bid/admin/bids/:bidId/extend-offer
   * Extend offer/selection window
   * Body: { hours: number }
   */
  extendOffer: async (bidId: string, hours: number): Promise<void> => {
    await axiosInstance.post(`/bid/admin/bids/${bidId}/extend-offer`, { hours });
  },

  /**
   * POST /bid/admin/bids/:bidId/note
   * Add a note to a bid
   */
  addNote: async (bidId: string, note: string): Promise<void> => {
    await axiosInstance.post(`/bid/admin/bids/${bidId}/note`, { note });
  },

  /**
   * POST /bid/admin/bids/:bidId/waive-fee
   * Waive a cancellation fee
   * Body: { reason: string }
   */
  waiveFee: async (bidId: string, reason: string): Promise<void> => {
    await axiosInstance.post(`/bid/admin/bids/${bidId}/waive-fee`, { reason });
  },
};

// ─── Cancellation Fees ────────────────────────────────────────────────────────

export const cancellationFeeService = {
  /**
   * GET /bid/admin/cancellation-fees
   * Cancellation fee monitoring
   * Query: { limit, page }
   * Envelope: { message, data: { stats: {...}, data: [], total, page, limit, pages } }
   *
   * NOTE: `stats` is returned alongside pagination fields and exposed here
   * so fetchCancellationFeeSummary can consume it without a second API call.
   */
  getCancellationFees: async (
    filters: CancellationFeeFilters = {}
  ): Promise<PaginatedResponse<CancellationFeeRecord> & { stats?: Record<string, unknown> }> => {
    const params = new URLSearchParams();
    if (filters.page)  params.set("page",  String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await axiosInstance.get(`/bid/admin/cancellation-fees?${params.toString()}`);
    const envelope = res.data?.data ?? res.data;
    return {
      data:       envelope.data       ?? [],
      total:      envelope.total      ?? 0,
      page:       envelope.page       ?? 1,
      limit:      envelope.limit      ?? 20,
      totalPages: envelope.totalPages ?? envelope.pages ?? 1,
      stats:      envelope.stats,          // ← expose raw stats for summary thunk
    };
  },

  /**
   * GET /bid/admin/cancellation-fees/:bidId
   * Get single cancellation fee detail
   * Envelope: { status, message, data: { id, status, step, expert, client, job, ... } }
   */
  getCancellationFeeDetail: async (bidId: string): Promise<CancellationFeeRecord> => {
    const res = await axiosInstance.get(`/bid/admin/cancellation-fees/${bidId}`);
    return res.data?.data ?? res.data;
  },
};

// ─── Expert & Client Patterns ─────────────────────────────────────────────────

export const patternService = {
  /**
   * GET /bid/admin/expert-patterns
   * Get expert cancellation patterns and flags
   * Shows experts with repeated cancellations. Includes cancellation rate,
   * priority (HIGH/MEDIUM/LOW), and recommended actions.
   * No parameters required.
   * Envelope: { status, message, data: { totalExperts, patterns: [] } }
   */
  getExpertPatterns: async (): Promise<{
    totalExperts: number;
    patterns: ExpertDispute[];
  }> => {
    const res = await axiosInstance.get("/bid/admin/expert-patterns");
    const d = res.data?.data ?? {};
    return {
      totalExperts: d.totalExperts ?? 0,
      patterns:     d.patterns    ?? [],
    };
  },

  /**
   * GET /bid/admin/client-patterns
   * Get client rejection patterns and flags
   * Shows clients with repeated bid rejections/cancellations.
   * Includes rejection count, priority, and rejection history.
   * No parameters required.
   * Envelope: { status, message, data: { totalClients, patterns: [] } }
   */
  getClientPatterns: async (): Promise<{
    totalClients: number;
    patterns: ClientDispute[];
  }> => {
    const res = await axiosInstance.get("/bid/admin/client-patterns");
    const d = res.data?.data ?? {};
    return {
      totalClients: d.totalClients ?? 0,
      patterns:     d.patterns     ?? [],
    };
  },
};

// ─── Client Refunds ───────────────────────────────────────────────────────────

export interface ClientRefundKPIs {
  totalRefunded: number;
  processed:     number;
  pending:       number;
  failed:        number;
}

export interface ClientRefundRecord {
  id:             string;
  jobId:          string;
  jobTitle:       string;
  originalEscrow: number;
  cancelFee:      number;
  clientRefund:   number;
  status:         "completed" | "pending" | "failed";
  escrowStatus:   string;
  createdAt:      string;
}

export interface ClientRefundResponse {
  kpis: ClientRefundKPIs;
  data: ClientRefundRecord[];
}

export interface ClientRefundByIdResponse {
  client: {
    id:       string;
    name:     string;
    email:    string;
    phone:    string;
    username: string;
    avatar:   { url: string };
    tier:     number;
  };
  kpis: ClientRefundKPIs;
  data: ClientRefundRecord[];
}

export const clientRefundService = {
  /**
   * GET /bid/admin/client-refunds
   * Client refund tracking
   * Tracks refunds issued to clients after cancellation fee deduction.
   * Queries FinanceEscrow records for cancelled bids.
   * Query: { status, clientId, limit, page }
   * Envelope: { status, message, data: { kpis: {}, data: [] } }
   */
  getClientRefunds: async (filters: {
    status?:   "pending" | "completed" | "failed";
    clientId?: string;
    limit?:    number;
    page?:     number;
  } = {}): Promise<ClientRefundResponse> => {
    const params = new URLSearchParams();
    if (filters.status)   params.set("status",   filters.status);
    if (filters.clientId) params.set("clientId", filters.clientId);
    if (filters.page)     params.set("page",     String(filters.page));
    if (filters.limit)    params.set("limit",    String(filters.limit));

    const res = await axiosInstance.get(`/bid/admin/client-refunds?${params.toString()}`);
    return res.data?.data ?? res.data;
  },

  /**
   * GET /bid/admin/client-refunds/:clientId
   * Get client refunds by client ID
   * Client-specific refunds with KPIs
   * Query: { limit, page }
   * Envelope: { status, message, data: { client: {}, kpis: {}, data: [] } }
   */
  getClientRefundsByClientId: async (
    clientId: string,
    filters: { limit?: number; page?: number } = {}
  ): Promise<ClientRefundByIdResponse> => {
    const params = new URLSearchParams();
    if (filters.page)  params.set("page",  String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await axiosInstance.get(
      `/bid/admin/client-refunds/${clientId}?${params.toString()}`
    );
    return res.data?.data ?? res.data;
  },
};

// ─── Expert Payouts ───────────────────────────────────────────────────────────

export interface ExpertPayoutKPIs {
  totalPaidOut: number;
  paid:         number;
  pending:      number;
  failed:       number;
}

export interface ExpertPayoutRecord {
  id:            string;
  jobId:         string;
  jobTitle:      string;
  originalEscrow: number;
  feeAmount:     number;
  status:        "completed" | "pending" | "failed";
  method:        string;
  payoutDate:    string;
  transactionId: string;
  expert: {
    id:    string;
    name:  string;
    email: string;
    phone: string;
  };
}

export interface ExpertPayoutResponse {
  kpis: ExpertPayoutKPIs;
  data: ExpertPayoutRecord[];
}

export interface ExpertPayoutByIdResponse {
  expert: {
    id:    string;
    name:  string;
    email: string;
    phone: string;
  };
  kpis: ExpertPayoutKPIs;
  data: ExpertPayoutRecord[];
}

export const expertPayoutService = {
  /**
   * GET /bid/admin/expert-payouts
   * Expert payout tracking
   * Tracks cancellation fee payouts to experts.
   * Queries FinanceEscrow records for expert-side payouts on cancelled bids.
   * Query: { status, expertId, limit, page }
   * Envelope: { status, message, data: { kpis: {}, data: [] } }
   */
  getExpertPayouts: async (filters: {
    status?:   "paid" | "pending" | "failed";
    expertId?: string;
    limit?:    number;
    page?:     number;
  } = {}): Promise<ExpertPayoutResponse> => {
    const params = new URLSearchParams();
    if (filters.status)   params.set("status",   filters.status);
    if (filters.expertId) params.set("expertId", filters.expertId);
    if (filters.page)     params.set("page",     String(filters.page));
    if (filters.limit)    params.set("limit",    String(filters.limit));

    const res = await axiosInstance.get(`/bid/admin/expert-payouts?${params.toString()}`);
    return res.data?.data ?? res.data;
  },

  /**
   * GET /bid/admin/expert-payouts/:expertId
   * Get expert payouts by expert ID
   * Expert-specific payouts with KPIs
   * Query: { limit, page }
   * Envelope: { status, message, data: { expert: {}, kpis: {}, data: [] } }
   */
  getExpertPayoutsByExpertId: async (
    expertId: string,
    filters: { limit?: number; page?: number } = {}
  ): Promise<ExpertPayoutByIdResponse> => {
    const params = new URLSearchParams();
    if (filters.page)  params.set("page",  String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await axiosInstance.get(
      `/bid/admin/expert-payouts/${expertId}?${params.toString()}`
    );
    return res.data?.data ?? res.data;
  },
};

// ─── Notification History ─────────────────────────────────────────────────────

export const notificationLogService = {
  /**
   * GET /bid/admin/history
   * Notification history log for bid activities
   * Query: { limit, page }
   * Envelope: { status, message, data: { data: [], total, page, limit, pages } }
   */
  getHistory: async (filters: {
    limit?: number;
    page?:  number;
  } = {}): Promise<PaginatedResponse<NotificationLog>> => {
    const params = new URLSearchParams();
    if (filters.page)  params.set("page",  String(filters.page));
    if (filters.limit) params.set("limit", String(filters.limit));

    const res = await axiosInstance.get(`/bid/admin/history?${params.toString()}`);
    const envelope = res.data?.data ?? res.data;
    return {
      data:       envelope.data       ?? [],
      total:      envelope.total      ?? 0,
      page:       envelope.page       ?? 1,
      limit:      envelope.limit      ?? 20,
      totalPages: envelope.totalPages ?? envelope.pages ?? 1,
    };
  },

  /**
   * GET /bid/admin/bids/:bidId/notifications
   * Get notifications for a specific bid
   * Envelope: { status, message, data: { data: [], total, page, limit, pages } }
   */
  getNotifications: async (bidId: string): Promise<NotificationLog[]> => {
    const res = await axiosInstance.get(`/bid/admin/bids/${bidId}/notifications`);
    return res.data?.data?.data ?? res.data?.data ?? [];
  },

  resendNotification: async (bidId: string, notificationId: string): Promise<void> => {
    await axiosInstance.post(`/bid/admin/bids/${bidId}/notifications/resend`, {
      notificationId,
    });
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportService = {
  /**
   * GET /bid/admin/export
   * Export cancellation fee report
   * No parameters required (based on Swagger — no params shown)
   * Returns a blob (PDF/CSV/Excel)
   */
  exportReport: async (): Promise<Blob> => {
    const res = await axiosInstance.get("/bid/admin/export", {
      responseType: "blob",
    });
    return res.data;
  },
};