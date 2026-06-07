import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  cancellationFeeService,
  disputeService,
  notificationLogService,
} from "../api/bidApi";
import {
  MOCK_CANCELLATION_FEES_RESPONSE,
  MOCK_CANCELLATION_SUMMARY,
  MOCK_EXPERT_DISPUTES,
  MOCK_CLIENT_DISPUTES,
  MOCK_NOTIFICATIONS,
  MOCK_CANCELLATION_FEES,
} from "@/components/bid/MockData"; // adjust path to where you put mockData.ts
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
  resendingId: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCancellationFees = createAsyncThunk(
  "cancellationFees/fetchList",
  async (filters: CancellationFeeFilters) => {
    try {
      return await cancellationFeeService.getCancellationFees(filters);
    } catch {
      // Client-side filter mock data
      let data = [...MOCK_CANCELLATION_FEES_RESPONSE.data];

      if (filters.expertId) {
        const q = filters.expertId.toLowerCase();
        data = data.filter((f) => f.expert.name.toLowerCase().includes(q));
      }
      if (filters.clientId) {
        const q = filters.clientId.toLowerCase();
        data = data.filter((f) => f.client.name.toLowerCase().includes(q));
      }

      const page       = filters.page  ?? 1;
      const limit      = filters.limit ?? 20;
      const total      = data.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const paginated  = data.slice((page - 1) * limit, page * limit);

      return { data: paginated, total, page, limit, totalPages };
    }
  }
);

export const fetchCancellationFeeSummary = createAsyncThunk(
  "cancellationFees/fetchSummary",
  async () => {
    try {
      return await cancellationFeeService.getSummary();
    } catch {
      return MOCK_CANCELLATION_SUMMARY;
    }
  }
);

export const fetchCancellationFeeDetail = createAsyncThunk(
  "cancellationFees/fetchDetail",
  async (jobId: string, { rejectWithValue }) => {
    try {
      return await cancellationFeeService.getCancellationFeeDetail(jobId);
    } catch {
      const found = MOCK_CANCELLATION_FEES.find((f) => f.jobId === jobId);
      if (found) return found;
      return rejectWithValue("Fee record not found");
    }
  }
);

export const confirmFeeThunk = createAsyncThunk(
  "cancellationFees/confirm",
  async (jobId: string, { rejectWithValue }) => {
    try {
      await cancellationFeeService.confirmFee(jobId);
      return jobId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to confirm fee");
    }
  }
);

export const adjustFeeThunk = createAsyncThunk(
  "cancellationFees/adjust",
  async (
    { jobId, adjustedAmount, reason }: { jobId: string; adjustedAmount: number; reason: string },
    { rejectWithValue }
  ) => {
    try {
      await cancellationFeeService.adjustFee(jobId, adjustedAmount, reason);
      return { jobId, adjustedAmount, reason };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to adjust fee");
    }
  }
);

export const waiveFeeThunk = createAsyncThunk(
  "cancellationFees/waive",
  async (
    { jobId, reason, note }: { jobId: string; reason: string; note: string },
    { rejectWithValue }
  ) => {
    try {
      await cancellationFeeService.waiveFee(jobId, reason, note);
      return jobId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to waive fee");
    }
  }
);

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
      const blob = await cancellationFeeService.exportReport(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cancellation-fees-${params.reportType}.${params.format === "excel" ? "xlsx" : params.format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Export failed");
    }
  }
);

export const fetchExcessiveCancellations = createAsyncThunk(
  "cancellationFees/fetchDisputes",
  async () => {
    try {
      return await disputeService.getExcessiveCancellations();
    } catch {
      return { experts: MOCK_EXPERT_DISPUTES, clients: MOCK_CLIENT_DISPUTES };
    }
  }
);

export const takeDisputeAction = createAsyncThunk(
  "cancellationFees/disputeAction",
  async (
    { entityId, action, note }: { entityId: string; action: "suspend" | "investigate" | "dismiss" | "flag" | "require_prepayment"; note?: string },
    { rejectWithValue }
  ) => {
    try {
      await disputeService.takeAction(entityId, action, note);
      return entityId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Action failed");
    }
  }
);

export const fetchNotificationLog = createAsyncThunk(
  "cancellationFees/fetchNotifications",
  async (bidId: string) => {
    try {
      return await notificationLogService.getNotifications(bidId);
    } catch {
      return MOCK_NOTIFICATIONS;
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
      state.actionError = null;
      state.actionSuccess = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCancellationFees.pending, (state) => { state.listLoading = true; state.listError = null; })
      .addCase(fetchCancellationFees.fulfilled, (state, action: PayloadAction<PaginatedResponse<CancellationFeeRecord>>) => {
        state.listLoading = false;
        state.fees = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchCancellationFees.rejected, (state, action) => { state.listLoading = false; state.listError = action.payload as string; });

    builder
      .addCase(fetchCancellationFeeSummary.pending, (state) => { state.summaryLoading = true; })
      .addCase(fetchCancellationFeeSummary.fulfilled, (state, action: PayloadAction<CancellationFeeSummary>) => { state.summaryLoading = false; state.summary = action.payload; })
      .addCase(fetchCancellationFeeSummary.rejected, (state) => { state.summaryLoading = false; });

    builder
      .addCase(fetchCancellationFeeDetail.pending, (state) => { state.detailLoading = true; state.detailError = null; })
      .addCase(fetchCancellationFeeDetail.fulfilled, (state, action: PayloadAction<CancellationFeeRecord>) => { state.detailLoading = false; state.selectedFee = action.payload; })
      .addCase(fetchCancellationFeeDetail.rejected, (state, action) => { state.detailLoading = false; state.detailError = action.payload as string; });

    builder
      .addCase(confirmFeeThunk.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(confirmFeeThunk.fulfilled, (state) => { state.actionLoading = false; state.actionSuccess = "Fee confirmed successfully"; })
      .addCase(confirmFeeThunk.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload as string; });

    builder
      .addCase(adjustFeeThunk.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(adjustFeeThunk.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.actionSuccess = "Fee adjusted successfully";
        if (state.selectedFee) {
          state.selectedFee.adminAdjustedAmount = action.payload.adjustedAmount;
          state.selectedFee.adminNote = action.payload.reason;
        }
      })
      .addCase(adjustFeeThunk.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload as string; });

    builder
      .addCase(waiveFeeThunk.pending, (state) => { state.actionLoading = true; state.actionError = null; })
      .addCase(waiveFeeThunk.fulfilled, (state) => { state.actionLoading = false; state.actionSuccess = "Fee waived successfully"; })
      .addCase(waiveFeeThunk.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload as string; });

    builder
      .addCase(exportReportThunk.pending, (state) => { state.exportLoading = true; state.exportError = null; })
      .addCase(exportReportThunk.fulfilled, (state) => { state.exportLoading = false; })
      .addCase(exportReportThunk.rejected, (state, action) => { state.exportLoading = false; state.exportError = action.payload as string; });

    builder
      .addCase(fetchExcessiveCancellations.pending, (state) => { state.disputesLoading = true; state.disputesError = null; })
      .addCase(fetchExcessiveCancellations.fulfilled, (state, action) => {
        state.disputesLoading = false;
        state.expertDisputes = action.payload.experts;
        state.clientDisputes = action.payload.clients;
      })
      .addCase(fetchExcessiveCancellations.rejected, (state, action) => { state.disputesLoading = false; state.disputesError = action.payload as string; });

    builder
      .addCase(takeDisputeAction.pending, (state) => { state.actionLoading = true; })
      .addCase(takeDisputeAction.fulfilled, (state) => { state.actionLoading = false; state.actionSuccess = "Action taken successfully"; })
      .addCase(takeDisputeAction.rejected, (state, action) => { state.actionLoading = false; state.actionError = action.payload as string; });

    builder
      .addCase(fetchNotificationLog.pending, (state) => { state.notificationsLoading = true; })
      .addCase(fetchNotificationLog.fulfilled, (state, action: PayloadAction<NotificationLog[]>) => { state.notificationsLoading = false; state.notifications = action.payload; })
      .addCase(fetchNotificationLog.rejected, (state) => { state.notificationsLoading = false; });

    builder
      .addCase(resendNotification.pending, (state, action) => { state.resendingId = action.meta.arg.notificationId; })
      .addCase(resendNotification.fulfilled, (state, action) => {
        state.resendingId = null;
        const n = state.notifications.find((n) => n.id === action.payload);
        if (n) n.status = "sent";
      })
      .addCase(resendNotification.rejected, (state) => { state.resendingId = null; });
  },
});

export const { setFeeFilters, setFeePage, clearSelectedFee, clearActionState } =
  cancellationFeesSlice.actions;
export default cancellationFeesSlice.reducer;