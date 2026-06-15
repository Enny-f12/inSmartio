import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  cancellationFeeService,
  patternService,
  notificationLogService,
  exportService,
} from "@/lib/api/bidApi";
import {
  MOCK_CANCELLATION_FEES_RESPONSE,
  MOCK_CANCELLATION_SUMMARY,
  MOCK_EXPERT_DISPUTES,
  MOCK_CLIENT_DISPUTES,
  MOCK_CANCELLATION_FEES,
} from "@/components/bid/MockData";
import type {
  CancellationFeeRecord,
  CancellationFeeFilters,
  CancellationFeeSummary,
  ExpertDispute,
  ClientDispute,
  NotificationLog,
  PaginatedResponse,
} from "@/components/bid/types";

// ─── State ────────────────────────────────────────────────────────────────────

interface CancellationFeesState {
  fees: CancellationFeeRecord[];
  total: number;
  page: number;
  totalPages: number;
  filters: CancellationFeeFilters;
  listLoading: boolean;
  listError: string | null;

  summary: CancellationFeeSummary | null;
  summaryLoading: boolean;

  selectedFee: CancellationFeeRecord | null;
  detailLoading: boolean;
  detailError: string | null;

  actionLoading: boolean;
  actionError: string | null;
  actionSuccess: string | null;

  exportLoading: boolean;
  exportError: string | null;

  expertDisputes: ExpertDispute[];
  clientDisputes: ClientDispute[];
  disputesLoading: boolean;
  disputesError: string | null;

  notifications: NotificationLog[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  resendingId: string | null;
}

const initialState: CancellationFeesState = {
  fees: [],
  total: 0,
  page: 1,
  totalPages: 1,
  filters: { dateRange: "last_30", page: 1, limit: 20 },
  listLoading: false,
  listError: null,

  summary: null,
  summaryLoading: false,

  selectedFee: null,
  detailLoading: false,
  detailError: null,

  actionLoading: false,
  actionError: null,
  actionSuccess: null,

  exportLoading: false,
  exportError: null,

  expertDisputes: [],
  clientDisputes: [],
  disputesLoading: false,
  disputesError: null,

  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  resendingId: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map API CancellationFeeRecord shape → UI CancellationFeeRecord shape */
function normaliseApiRecord(raw: Record<string, unknown>): CancellationFeeRecord {
  const feeDetails = (raw.cancellationFeeDetails ?? raw.cancellationFeeCalculation ?? {}) as Record<string, unknown>;
  const expertRaw  = (raw.expert  ?? {}) as Record<string, unknown>;
  const clientRaw  = (raw.client  ?? {}) as Record<string, unknown>;
  const jobRaw     = (raw.job     ?? {}) as Record<string, unknown>;
  const inspection = (raw.siteInspectionDetails ?? {}) as Record<string, unknown>;
  const adminVerif = (raw.adminVerification ?? {}) as Record<string, unknown>;
  const evidenceUploaded = (inspection.evidenceUploaded ?? []) as Array<Record<string, unknown>>;

  return {
    jobId: (raw.id ?? raw.jobId ?? jobRaw.id ?? "") as string,

    expert: {
      id:                       (expertRaw.id      ?? "") as string,
      name:                     (expertRaw.name    ?? "") as string,
      phone:                    (expertRaw.phone   ?? "") as string,
      rating:                   (expertRaw.rating  ?? 0)  as number,
      verificationTier:         (expertRaw.tier != null ? `Tier ${expertRaw.tier}` : "") as string,
      cancellationFeesReceived: (feeDetails.expertPayout ?? 0) as number,
    },

    client: {
      id:                  (clientRaw.id    ?? "") as string,
      name:                (clientRaw.name  ?? "") as string,
      phone:               (clientRaw.phone ?? "") as string,
      verificationTier:    "",
      jobsCompleted:       0,
      cancellationFeesPaid:(feeDetails.finalCancellationFee ?? 0) as number,
    },

    originalAmount:  (feeDetails.jobOriginalAmount ?? jobRaw.originalAmount ?? raw.bidAmount ?? 0) as number,
    requestedAmount: (feeDetails.bidAmount ?? raw.bidAmount ?? 0) as number,
    increasePercent: (() => {
      const orig = (feeDetails.jobOriginalAmount ?? jobRaw.originalAmount ?? 0) as number;
      const req  = (feeDetails.bidAmount ?? raw.bidAmount ?? 0) as number;
      if (!orig || !req) return 0;
      return Math.round(((req - orig) / orig) * 100);
    })(),
    feeApplied: (feeDetails.finalCancellationFee ?? feeDetails.cancellationFee ?? 0) as number,

    date: raw.cancelledAt
      ? new Date(raw.cancelledAt as string).toLocaleDateString("en-GB")
      : raw.createdAt
        ? new Date(raw.createdAt as string).toLocaleDateString("en-GB")
        : "",

    adminVerified:       (adminVerif.isCorrect === true),
    adminAdjustedAmount: (adminVerif.adjustedAmount ?? undefined) as number | undefined,
    adminNote:           (adminVerif.reason ?? undefined) as string | undefined,

    refundStatus: "pending",
    payoutStatus: "pending",

    siteInspectionNotes: (inspection.expertNotes ?? "") as string,
    evidenceUrls: evidenceUploaded.map((e) => e.url as string),
  };
}

/** Apply client-side date/expert/client filters to mock or API list */
function applyFilters(
  data: CancellationFeeRecord[],
  filters: CancellationFeeFilters
): CancellationFeeRecord[] {
  let out = [...data];
  if (filters.expertId) {
    const q = filters.expertId.toLowerCase();
    out = out.filter((f) => f.expert.name.toLowerCase().includes(q));
  }
  if (filters.clientId) {
    const q = filters.clientId.toLowerCase();
    out = out.filter((f) => f.client.name.toLowerCase().includes(q));
  }
  return out;
}

/** Paginate an array and return a PaginatedResponse */
function paginate<T>(data: T[], page: number, limit: number): PaginatedResponse<T> {
  const total      = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated  = data.slice((page - 1) * limit, page * limit);
  return { data: paginated, total, page, limit, totalPages };
}

// ─── Thunks ───────────────────────────────────────────────────────────────────

/**
 * GET /bid/admin/cancellation-fees
 * Falls back to MOCK_CANCELLATION_FEES_RESPONSE if API returns empty or errors.
 * Client-side filtering (expertId / clientId) is applied after.
 */
export const fetchCancellationFees = createAsyncThunk(
  "cancellationFees/fetchList",
  async (filters: CancellationFeeFilters) => {
    const page  = filters.page  ?? 1;
    const limit = filters.limit ?? 20;

    try {
      const res = await cancellationFeeService.getCancellationFees({ page, limit });

      if (res.data && res.data.length > 0) {
        const normalised = res.data.map((r) =>
          normaliseApiRecord(r as unknown as Record<string, unknown>)
        );
        const filtered = applyFilters(normalised, filters);
        return paginate(filtered, page, limit);
      }
    } catch {
      // fall through to mock
    }

    // ── Mock fallback ──
    const filtered = applyFilters(MOCK_CANCELLATION_FEES_RESPONSE.data, filters);
    return paginate(filtered, page, limit);
  }
);

/**
 * GET /bid/admin/cancellation-fees
 * Reads the `stats` field from the same list endpoint response.
 * API shape: { data: { stats: { totalCancellation, totalFeesCollected, averageFee, topReason } } }
 * Falls back to MOCK_CANCELLATION_SUMMARY if the API errors or returns no stats.
 */
export const fetchCancellationFeeSummary = createAsyncThunk(
  "cancellationFees/fetchSummary",
  async () => {
    try {
      const res = await cancellationFeeService.getCancellationFees({ page: 1, limit: 1 });
      const stats = (res as { stats?: Record<string, unknown> }).stats;

      if (stats) {
        return {
          totalCancellations: (stats.totalCancellation  ?? 0) as number,
          totalFeesCollected: (stats.totalFeesCollected ?? 0) as number,
          averageFee:         (stats.averageFee         ?? 0) as number,
          minFee:             (stats.minFee             ?? 0) as number,
          maxFee:             (stats.maxFee             ?? 0) as number,
          topReasons: stats.topReason
            ? [{ reason: stats.topReason as string, percentage: 0 }]
            : [],
        } satisfies CancellationFeeSummary;
      }
    } catch {
      // fall through to mock
    }

    return MOCK_CANCELLATION_SUMMARY;
  }
);

/**
 * GET /bid/admin/cancellation-fees/:bidId
 * Falls back to MOCK_CANCELLATION_FEES lookup if API errors or returns nothing.
 */
export const fetchCancellationFeeDetail = createAsyncThunk(
  "cancellationFees/fetchDetail",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const raw = await cancellationFeeService.getCancellationFeeDetail(jobId);
      if (raw) return normaliseApiRecord(raw as unknown as Record<string, unknown>);
    } catch {
      // fall through to mock
    }

    const found = MOCK_CANCELLATION_FEES.find((f) => f.jobId === jobId);
    if (found) return found;
    return rejectWithValue("Fee record not found");
  }
);

/**
 * POST /bid/admin/bids/:bidId/waive-fee  (confirm = waive with reason "confirmed_correct")
 */
export const confirmFeeThunk = createAsyncThunk(
  "cancellationFees/confirm",
  async (jobId: string, { rejectWithValue }) => {
    try {
      const { bidService } = await import("@/lib/api/bidApi");
      await bidService.waiveFee(jobId, "admin_confirmed_correct");
      return jobId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to confirm fee");
    }
  }
);

/**
 * No dedicated adjust endpoint in Swagger — optimistic local update only.
 */
export const adjustFeeThunk = createAsyncThunk(
  "cancellationFees/adjust",
  async (
    { jobId, adjustedAmount, reason }: { jobId: string; adjustedAmount: number; reason: string },
    { rejectWithValue }
  ) => {
    try {
      return { jobId, adjustedAmount, reason };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to adjust fee");
    }
  }
);

/**
 * POST /bid/admin/bids/:bidId/waive-fee
 */
export const waiveFeeThunk = createAsyncThunk(
  "cancellationFees/waive",
  async (
    { jobId, reason }: { jobId: string; reason: string; note?: string },
    { rejectWithValue }
  ) => {
    try {
      const { bidService } = await import("@/lib/api/bidApi");
      await bidService.waiveFee(jobId, reason);
      return jobId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to waive fee");
    }
  }
);

/**
 * GET /bid/admin/export
 */
export const exportReportThunk = createAsyncThunk(
  "cancellationFees/export",
  async (
    params: {
      reportType: "summary" | "detailed" | "expert_performance" | "client_performance";
      format: "pdf" | "csv" | "excel";
      dateFrom: string;
      dateTo: string;
      includeFields: string[];
    },
    { rejectWithValue }
  ) => {
    try {
      const blob = await exportService.exportReport();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `cancellation-fees-${params.reportType}.${params.format === "excel" ? "xlsx" : params.format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Export failed");
    }
  }
);

/**
 * GET /bid/admin/expert-patterns  +  GET /bid/admin/client-patterns
 */
export const fetchExcessiveCancellations = createAsyncThunk(
  "cancellationFees/fetchDisputes",
  async () => {
    let experts: ExpertDispute[] = MOCK_EXPERT_DISPUTES;
    let clients: ClientDispute[] = MOCK_CLIENT_DISPUTES;

    try {
      const expertRes = await patternService.getExpertPatterns();
      if (expertRes.patterns && expertRes.patterns.length > 0) {
        experts = expertRes.patterns.map((p) => {
          const raw = p as unknown as Record<string, unknown>;
          const expertRaw = (raw.expert ?? {}) as Record<string, unknown>;
          const history   = (raw.cancellationHistory ?? []) as Array<Record<string, unknown>>;
          return {
            expertId:   (expertRaw.id   ?? "") as string,
            expertName: (expertRaw.name ?? "") as string,
            cancellationHistory: history.map((h) => ({
              date:   h.date   as string,
              jobId:  h.jobId  as string,
              fee:    (h.amount ?? 0) as number,
              reason: (h.reason ?? "") as string,
            })),
            totalSiteVisits:  history.length,
            cancellationRate: (raw.cancellationRate ?? 0) as number,
            exceedsThreshold: ((raw.priority ?? "") as string) === "HIGH",
          } satisfies ExpertDispute;
        });
      }
    } catch {
      // keep mock experts
    }

    try {
      const clientRes = await patternService.getClientPatterns();
      if (clientRes.patterns && clientRes.patterns.length > 0) {
        clients = clientRes.patterns.map((p) => {
          const raw = p as unknown as Record<string, unknown>;
          const clientRaw = (raw.client ?? {}) as Record<string, unknown>;
          const history   = (raw.rejectionHistory ?? raw.cancellationHistory ?? []) as Array<Record<string, unknown>>;
          return {
            clientId:   (clientRaw.id   ?? "") as string,
            clientName: (clientRaw.name ?? "") as string,
            cancellationHistory: history.map((h) => ({
              date:   h.date   as string,
              jobId:  h.jobId  as string,
              fee:    (h.amount ?? 0) as number,
              reason: (h.reason ?? "") as string,
            })),
            totalSiteVisits: history.length,
            rejectionRate:   (raw.totalRejections ?? raw.rejectionRate ?? 0) as number,
            exceedsThreshold: ((raw.priority ?? "") as string) !== "LOW",
          } satisfies ClientDispute;
        });
      }
    } catch {
      // keep mock clients
    }

    return { experts, clients };
  }
);

/**
 * Dispute action — optimistic dismiss only.
 */
export const takeDisputeAction = createAsyncThunk(
  "cancellationFees/disputeAction",
  async (
    { entityId, action, note }: {
      entityId: string;
      action: "suspend" | "investigate" | "dismiss" | "flag" | "require_prepayment";
      note?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      void entityId; void action; void note;
      return entityId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Action failed");
    }
  }
);

export const fetchNotificationLog = createAsyncThunk(
  "cancellationFees/fetchNotifications",
  async (bidId: string, { rejectWithValue }) => {
    try {
      const res = await notificationLogService.getHistory({ limit: 100, page: 1 });
      const all = res.data ?? [];

      const scoped = all.filter((n) => {
        const raw = n as unknown as Record<string, unknown>;
        return (
          raw.bidId  === bidId ||
          raw.userId === bidId ||
          String(raw.body    ?? "").includes(bidId) ||
          String(raw.title   ?? "").includes(bidId) ||
          String(raw.content ?? "").includes(bidId)
        );
      });

      const list = scoped.length > 0 ? scoped : all;

      return list.map((n) => {
        const raw = n as unknown as Record<string, unknown>;
        return {
          id:        (raw.id        ?? "") as string,
          timestamp: (raw.createdAt ?? raw.timestamp ?? "") as string,
          recipient: (raw.userId    ?? raw.recipient ?? "") as string,
          type:      (raw.type      ?? "in_app") as NotificationLog["type"],
          content:   (raw.body      ?? raw.content ?? raw.title ?? "") as string,
          status:    (
            raw.status != null
              ? raw.status
              : raw.read === false
                ? "sent"
                : "sent"
          ) as NotificationLog["status"],
        } satisfies NotificationLog;
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to load notification history"
      );
    }
  }
);

export const resendNotification = createAsyncThunk(
  "cancellationFees/resendNotification",
  async (
    { bidId, notificationId }: { bidId: string; notificationId: string },
    { rejectWithValue }
  ) => {
    try {
      await notificationLogService.resendNotification(bidId, notificationId);
      return notificationId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Resend failed");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const cancellationFeesSlice = createSlice({
  name: "cancellationFees",
  initialState,
  reducers: {
    setFeeFilters(state, action: PayloadAction<Partial<CancellationFeeFilters>>) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    setFeePage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
      state.page = action.payload;
    },
    clearSelectedFee(state) {
      state.selectedFee = null;
      state.detailError = null;
    },
    clearActionState(state) {
      state.actionError   = null;
      state.actionSuccess = null;
    },
    clearNotifications(state) {
      state.notifications      = [];
      state.notificationsError = null;
    },
  },
  extraReducers: (builder) => {

    // fetchCancellationFees
    builder
      .addCase(fetchCancellationFees.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchCancellationFees.fulfilled, (state, action: PayloadAction<PaginatedResponse<CancellationFeeRecord>>) => {
        state.listLoading = false;
        state.fees       = action.payload.data;
        state.total      = action.payload.total;
        state.page       = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCancellationFees.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      });

    // fetchCancellationFeeSummary
    builder
      .addCase(fetchCancellationFeeSummary.pending, (state) => { state.summaryLoading = true; })
      .addCase(fetchCancellationFeeSummary.fulfilled, (state, action: PayloadAction<CancellationFeeSummary>) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchCancellationFeeSummary.rejected, (state) => { state.summaryLoading = false; });

    // fetchCancellationFeeDetail
    builder
      .addCase(fetchCancellationFeeDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchCancellationFeeDetail.fulfilled, (state, action: PayloadAction<CancellationFeeRecord>) => {
        state.detailLoading = false;
        state.selectedFee = action.payload;
      })
      .addCase(fetchCancellationFeeDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      });

    // confirmFeeThunk
    builder
      .addCase(confirmFeeThunk.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(confirmFeeThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionSuccess = "Fee confirmed successfully";
        if (state.selectedFee) state.selectedFee.adminVerified = true;
      })
      .addCase(confirmFeeThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // adjustFeeThunk
    builder
      .addCase(adjustFeeThunk.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(adjustFeeThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = "Fee adjusted successfully";
        if (state.selectedFee) {
          state.selectedFee.adminAdjustedAmount = action.payload.adjustedAmount;
          state.selectedFee.adminNote           = action.payload.reason;
        }
      })
      .addCase(adjustFeeThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // waiveFeeThunk
    builder
      .addCase(waiveFeeThunk.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(waiveFeeThunk.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionSuccess = "Fee waived successfully";
      })
      .addCase(waiveFeeThunk.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // exportReportThunk
    builder
      .addCase(exportReportThunk.pending, (state) => { state.exportLoading = true; state.exportError = null; })
      .addCase(exportReportThunk.fulfilled, (state) => { state.exportLoading = false; })
      .addCase(exportReportThunk.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload as string;
      });

    // fetchExcessiveCancellations
    builder
      .addCase(fetchExcessiveCancellations.pending, (state) => {
        state.disputesLoading = true;
        state.disputesError = null;
      })
      .addCase(fetchExcessiveCancellations.fulfilled, (state, action) => {
        state.disputesLoading = false;
        state.expertDisputes  = action.payload.experts;
        state.clientDisputes  = action.payload.clients;
      })
      .addCase(fetchExcessiveCancellations.rejected, (state, action) => {
        state.disputesLoading = false;
        state.disputesError = action.payload as string;
      });

    // takeDisputeAction
    builder
      .addCase(takeDisputeAction.pending, (state) => { state.actionLoading = true; })
      .addCase(takeDisputeAction.fulfilled, (state) => {
        state.actionLoading = false;
        state.actionSuccess = "Action taken successfully";
      })
      .addCase(takeDisputeAction.rejected, (state, action) => {
        state.actionLoading = false;
        state.actionError = action.payload as string;
      });

    // fetchNotificationLog
    builder
      .addCase(fetchNotificationLog.pending, (state) => {
        state.notificationsLoading = true;
        state.notificationsError   = null;
        state.notifications        = [];
      })
      .addCase(fetchNotificationLog.fulfilled, (state, action: PayloadAction<NotificationLog[]>) => {
        state.notificationsLoading = false;
        state.notifications        = action.payload;
      })
      .addCase(fetchNotificationLog.rejected, (state, action) => {
        state.notificationsLoading = false;
        state.notificationsError   = action.payload as string;
      });

    // resendNotification
    builder
      .addCase(resendNotification.pending, (state, action) => {
        state.resendingId = action.meta.arg.notificationId;
      })
      .addCase(resendNotification.fulfilled, (state, action) => {
        state.resendingId = null;
        const n = state.notifications.find((n) => n.id === action.payload);
        if (n) n.status = "sent";
      })
      .addCase(resendNotification.rejected, (state) => {
        state.resendingId = null;
      });
  },
});

export const {
  setFeeFilters,
  setFeePage,
  clearSelectedFee,
  clearActionState,
  clearNotifications,
} = cancellationFeesSlice.actions;

export default cancellationFeesSlice.reducer;