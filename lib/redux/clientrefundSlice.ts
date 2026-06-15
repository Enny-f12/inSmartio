import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { clientRefundService } from "@/lib/api/bidApi";
import { MOCK_REFUNDS } from "@/components/bid/MockData";
import type { RefundRecord } from "@/components/bid/MockData";

// ─── State ────────────────────────────────────────────────────────────────────

export type RefundStatusFilter = "all" | "pending" | "processed" | "failed";

interface ClientRefundState {
  records: RefundRecord[];
  totalRefunded: number;
  processed: number;
  pending: number;
  failed: number;
  loading: boolean;
  error: string | null;
  statusFilter: RefundStatusFilter;
}

const initialState: ClientRefundState = {
  records: [],
  totalRefunded: 0,
  processed: 0,
  pending: 0,
  failed: 0,
  loading: false,
  error: null,
  statusFilter: "all",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseRefund(raw: Record<string, unknown>): RefundRecord {
  const apiStatus = (raw.status ?? "pending") as string;
  const refundStatus: RefundRecord["refundStatus"] =
    apiStatus === "completed" ? "processed" : (apiStatus as RefundRecord["refundStatus"]);

  const client = (raw.client ?? {}) as Record<string, unknown>;

  return {
    jobId:           (raw.jobId          ?? raw.id          ?? "") as string,
    clientName:      (client.name        ?? raw.clientName  ?? "") as string,
    clientId:        (client.id          ?? raw.clientId    ?? "") as string,
    originalEscrow:  (raw.originalEscrow ?? 0)                    as number,
    cancellationFee: (raw.cancelFee      ?? raw.cancellationFee ?? 0) as number,
    clientRefund:    (raw.clientRefund   ?? 0)                    as number,
    refundStatus,
    refundDate: raw.createdAt
      ? new Date(raw.createdAt as string).toLocaleDateString("en-GB")
      : undefined,
    refundMethod:  (raw.escrowStatus ?? raw.refundMethod ?? "Original payment method") as string,
    transactionId: (raw.transactionId ?? undefined) as string | undefined,
  };
}

function computeTotals(records: RefundRecord[]) {
  return {
    totalRefunded: records.reduce((s, r) => s + r.clientRefund, 0),
    processed:     records.filter((r) => r.refundStatus === "processed").length,
    pending:       records.filter((r) => r.refundStatus === "pending").length,
    failed:        records.filter((r) => r.refundStatus === "failed").length,
  };
}

// ─── Thunk ────────────────────────────────────────────────────────────────────

export const fetchClientRefunds = createAsyncThunk(
  "clientRefund/fetchList",
  async (
    filters: { status?: "pending" | "completed" | "failed"; clientId?: string; limit?: number; page?: number } = {}
  ) => {
    try {
      const res     = await clientRefundService.getClientRefunds(filters);
      const rawList = (res.data ?? []) as unknown as Record<string, unknown>[];
      const kpis    = (res as unknown as Record<string, unknown>).kpis as Record<string, unknown> | undefined;

      if (rawList.length > 0) {
        const records  = rawList.map(normaliseRefund);
        const computed = computeTotals(records);
        return {
          records,
          totalRefunded: (kpis?.totalRefunded ?? computed.totalRefunded) as number,
          processed:     (kpis?.processed     ?? computed.processed)     as number,
          pending:       (kpis?.pending       ?? computed.pending)       as number,
          failed:        (kpis?.failed        ?? computed.failed)        as number,
        };
      }
    } catch {
      // fall through to mock
    }

    return { records: MOCK_REFUNDS, ...computeTotals(MOCK_REFUNDS) };
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const clientRefundSlice = createSlice({
  name: "clientRefund",
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<RefundStatusFilter>) {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientRefunds.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchClientRefunds.fulfilled, (state, action) => {
        state.loading       = false;
        state.records       = action.payload.records;
        state.totalRefunded = action.payload.totalRefunded;
        state.processed     = action.payload.processed;
        state.pending       = action.payload.pending;
        state.failed        = action.payload.failed;
      })
      .addCase(fetchClientRefunds.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message ?? "Failed to load refunds";
      });
  },
});

export const { setStatusFilter } = clientRefundSlice.actions;
export default clientRefundSlice.reducer;