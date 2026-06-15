import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { expertPayoutService } from "@/lib/api/bidApi";
import { MOCK_PAYOUTS } from "@/components/bid/MockData";
import type { PayoutRecord } from "@/components/bid/MockData";

// ─── State ────────────────────────────────────────────────────────────────────

export type PayoutStatusFilter = "all" | "paid" | "pending" | "failed";

interface ExpertPayoutState {
  records: PayoutRecord[];
  totalPaidOut: number;
  paid: number;
  pending: number;
  failed: number;
  loading: boolean;
  error: string | null;
  statusFilter: PayoutStatusFilter;
}

const initialState: ExpertPayoutState = {
  records: [],
  totalPaidOut: 0,
  paid: 0,
  pending: 0,
  failed: 0,
  loading: false,
  error: null,
  statusFilter: "all",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalisePayout(raw: Record<string, unknown>): PayoutRecord {
  const expertRaw = (raw.expert ?? {}) as Record<string, unknown>;
  const apiStatus = (raw.status ?? "pending") as string;
  const payoutStatus: PayoutRecord["payoutStatus"] =
    apiStatus === "completed" ? "paid" : (apiStatus as PayoutRecord["payoutStatus"]);

  return {
    jobId:           (raw.jobId          ?? raw.id       ?? "") as string,
    expertName:      (expertRaw.name     ?? raw.expertName ?? "") as string,
    expertId:        (expertRaw.id       ?? raw.expertId  ?? "") as string,
    cancellationFee: (raw.feeAmount      ?? raw.cancellationFee ?? 0) as number,
    payoutStatus,
    payoutDate: raw.payoutDate
      ? new Date(raw.payoutDate as string).toLocaleDateString("en-GB")
      : raw.createdAt
        ? new Date(raw.createdAt as string).toLocaleDateString("en-GB")
        : undefined,
    payoutMethod:  (raw.method        ?? raw.payoutMethod ?? "Bank Transfer") as string,
    transactionId: (raw.transactionId ?? undefined) as string | undefined,
  };
}

function computeTotals(records: PayoutRecord[]) {
  return {
    totalPaidOut: records.reduce((s, r) => s + r.cancellationFee, 0),
    paid:         records.filter((r) => r.payoutStatus === "paid").length,
    pending:      records.filter((r) => r.payoutStatus === "pending").length,
    failed:       records.filter((r) => r.payoutStatus === "failed").length,
  };
}

// ─── Thunk ────────────────────────────────────────────────────────────────────

export const fetchExpertPayouts = createAsyncThunk(
  "expertPayout/fetchList",
  async (
    filters: { status?: "paid" | "pending" | "failed"; expertId?: string; limit?: number; page?: number } = {}
  ) => {
    try {
      const res     = await expertPayoutService.getExpertPayouts(filters);
      const rawList = (res.data ?? []) as unknown as Record<string, unknown>[];
      const kpis    = (res as unknown as Record<string, unknown>).kpis as Record<string, unknown> | undefined;

      if (rawList.length > 0) {
        const records  = rawList.map(normalisePayout);
        const computed = computeTotals(records);
        return {
          records,
          totalPaidOut: (kpis?.totalPaidOut ?? computed.totalPaidOut) as number,
          paid:         (kpis?.paid         ?? computed.paid)         as number,
          pending:      (kpis?.pending      ?? computed.pending)      as number,
          failed:       (kpis?.failed       ?? computed.failed)       as number,
        };
      }
    } catch {
      // fall through to mock
    }

    return { records: MOCK_PAYOUTS, ...computeTotals(MOCK_PAYOUTS) };
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const expertPayoutSlice = createSlice({
  name: "expertPayout",
  initialState,
  reducers: {
    setPayoutStatusFilter(state, action: PayloadAction<PayoutStatusFilter>) {
      state.statusFilter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpertPayouts.pending, (state) => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchExpertPayouts.fulfilled, (state, action) => {
        state.loading     = false;
        state.records     = action.payload.records;
        state.totalPaidOut = action.payload.totalPaidOut;
        state.paid        = action.payload.paid;
        state.pending     = action.payload.pending;
        state.failed      = action.payload.failed;
      })
      .addCase(fetchExpertPayouts.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.error.message ?? "Failed to load payouts";
      });
  },
});

export const { setPayoutStatusFilter } = expertPayoutSlice.actions;
export default expertPayoutSlice.reducer;