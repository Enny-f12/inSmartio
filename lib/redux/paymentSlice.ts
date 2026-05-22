// lib/redux/paymentSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getTransactionHistory, getTransactionById,
  refundTransaction, getBalances,
  getEscrows, releaseEscrow,
  getPayouts, retryPayout,
  type ApiTransaction, type ApiBalances, type RefundPayload,
  type ApiEscrow, type ReleaseEscrowPayload,
  type ApiPayout,
} from "@/lib/api/paymentApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface PaymentState {
  // transactions
  list:           ApiTransaction[];
  listStatus:     Status;
  listError:      string | null;
  selected:       ApiTransaction | null;
  selectedStatus: Status;
  // balances
  balances:       ApiBalances | null;
  balancesStatus: Status;
  balancesError:  string | null;
  // refund
  mutateStatus:   Status;
  mutateError:    string | null;
  // escrows
  escrows:        ApiEscrow[];
  escrowsStatus:  Status;
  escrowsError:   string | null;
  releaseStatus:  Status;
  releaseError:   string | null;
  // payouts
  payouts:        ApiPayout[];
  payoutsStatus:  Status;
  payoutsError:   string | null;
  retryStatus:    Status;
  retryError:     string | null;
}

const initialState: PaymentState = {
  list:           [],
  listStatus:     "idle",
  listError:      null,
  selected:       null,
  selectedStatus: "idle",
  balances:       null,
  balancesStatus: "idle",
  balancesError:  null,
  mutateStatus:   "idle",
  mutateError:    null,
  escrows:        [],
  escrowsStatus:  "idle",
  escrowsError:   null,
  releaseStatus:  "idle",
  releaseError:   null,
  payouts:        [],
  payoutsStatus:  "idle",
  payoutsError:   null,
  retryStatus:    "idle",
  retryError:     null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Transaction thunks ────────────────────────────────────

export const fetchTransactions = createAsyncThunk(
  "payments/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getTransactionHistory(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch transactions")); }
  }
);

export const fetchTransactionById = createAsyncThunk(
  "payments/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getTransactionById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch transaction")); }
  }
);

export const refundTransactionThunk = createAsyncThunk(
  "payments/refund",
  async ({ id, payload }: { id: string; payload?: RefundPayload }, { rejectWithValue }) => {
    try { return await refundTransaction(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to process refund")); }
  }
);

export const fetchBalances = createAsyncThunk(
  "payments/fetchBalances",
  async (_, { rejectWithValue }) => {
    try { return await getBalances(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch balances")); }
  }
);

// ── Escrow thunks ─────────────────────────────────────────

// GET /api/admin/escrows
export const fetchEscrows = createAsyncThunk(
  "payments/fetchEscrows",
  async (_, { rejectWithValue }) => {
    try { return await getEscrows(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch escrows")); }
  }
);

// POST /api/admin/escrows/{escrowId}/release
export const releaseEscrowThunk = createAsyncThunk(
  "payments/releaseEscrow",
  async ({ escrowId, payload }: { escrowId: string; payload?: ReleaseEscrowPayload }, { rejectWithValue }) => {
    try { return await releaseEscrow(escrowId, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to release escrow")); }
  }
);

// ── Payout thunks ─────────────────────────────────────────

// GET /api/admin/payouts
export const fetchPayouts = createAsyncThunk(
  "payments/fetchPayouts",
  async (_, { rejectWithValue }) => {
    try { return await getPayouts(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch payouts")); }
  }
);

// POST /api/admin/payouts/{payoutId}/retry
export const retryPayoutThunk = createAsyncThunk(
  "payments/retryPayout",
  async (payoutId: string, { rejectWithValue }) => {
    try { return await retryPayout(payoutId); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to retry payout")); }
  }
);

// ── Slice ─────────────────────────────────────────────────
const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearSelectedTransaction: (state) => {
      state.selected       = null;
      state.selectedStatus = "idle";
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
    resetReleaseStatus: (state) => {
      state.releaseStatus = "idle";
      state.releaseError  = null;
    },
    resetRetryStatus: (state) => {
      state.retryStatus = "idle";
      state.retryError  = null;
    },
  },
  extraReducers: (builder) => {
    // fetchTransactions
    builder
      .addCase(fetchTransactions.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchTransactions.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchTransactions.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // fetchTransactionById
    builder
      .addCase(fetchTransactionById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchTransactionById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchTransactionById.rejected,  (state) => { state.selectedStatus = "failed"; });

    // refundTransaction
    builder
      .addCase(refundTransactionThunk.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(refundTransactionThunk.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(refundTransactionThunk.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.mutateError  = action.payload as string;
      });

    // fetchBalances
    builder
      .addCase(fetchBalances.pending,   (state) => { state.balancesStatus = "loading"; state.balancesError = null; })
      .addCase(fetchBalances.fulfilled, (state, action) => { state.balancesStatus = "succeeded"; state.balances = action.payload; })
      .addCase(fetchBalances.rejected,  (state, action) => { state.balancesStatus = "failed"; state.balancesError = action.payload as string; });

    // fetchEscrows
    builder
      .addCase(fetchEscrows.pending,   (state) => { state.escrowsStatus = "loading"; state.escrowsError = null; })
      .addCase(fetchEscrows.fulfilled, (state, action) => { state.escrowsStatus = "succeeded"; state.escrows = action.payload; })
      .addCase(fetchEscrows.rejected,  (state, action) => { state.escrowsStatus = "failed"; state.escrowsError = action.payload as string; });

    // releaseEscrow — update in-list record
    builder
      .addCase(releaseEscrowThunk.pending,   (state) => { state.releaseStatus = "loading"; state.releaseError = null; })
      .addCase(releaseEscrowThunk.fulfilled, (state, action) => {
        state.releaseStatus = "succeeded";
        const idx = state.escrows.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.escrows[idx] = action.payload;
      })
      .addCase(releaseEscrowThunk.rejected, (state, action) => {
        state.releaseStatus = "failed";
        state.releaseError  = action.payload as string;
      });

    // fetchPayouts
    builder
      .addCase(fetchPayouts.pending,   (state) => { state.payoutsStatus = "loading"; state.payoutsError = null; })
      .addCase(fetchPayouts.fulfilled, (state, action) => { state.payoutsStatus = "succeeded"; state.payouts = action.payload; })
      .addCase(fetchPayouts.rejected,  (state, action) => { state.payoutsStatus = "failed"; state.payoutsError = action.payload as string; });

    // retryPayout — update in-list record
    builder
      .addCase(retryPayoutThunk.pending,   (state) => { state.retryStatus = "loading"; state.retryError = null; })
      .addCase(retryPayoutThunk.fulfilled, (state, action) => {
        state.retryStatus = "succeeded";
        const idx = state.payouts.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.payouts[idx] = action.payload;
      })
      .addCase(retryPayoutThunk.rejected, (state, action) => {
        state.retryStatus = "failed";
        state.retryError  = action.payload as string;
      });
  },
});

export const {
  clearSelectedTransaction,
  resetMutateStatus,
  resetReleaseStatus,
  resetRetryStatus,
} = paymentSlice.actions;

export default paymentSlice.reducer;