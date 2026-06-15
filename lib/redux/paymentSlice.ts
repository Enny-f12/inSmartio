// lib/redux/paymentSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getTransactionHistory, getTransactionById,
  refundTransaction, getBalances,
  getEscrows, getEscrowById,
  getPayouts, retryPayout,
  type ApiTransaction, type ApiBalances, type RefundPayload,
  type ApiEscrow, type TransactionMeta,
  type ApiPayout, type PayoutSummary,
} from "@/lib/api/paymentApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface PaymentState {
  // transactions
  list:           ApiTransaction[];
  listMeta:       TransactionMeta;
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
  escrowsMeta:    TransactionMeta;
  escrowsStatus:  Status;
  escrowsError:   string | null;
  selectedEscrow:       ApiEscrow | null;
  selectedEscrowStatus: Status;
  selectedEscrowError:  string | null;
  // payouts
  payouts:        ApiPayout[];
  payoutSummary:  PayoutSummary | null;   // ← added
  payoutsStatus:  Status;
  payoutsError:   string | null;
  retryStatus:    Status;
  retryError:     string | null;
}

const initialState: PaymentState = {
  list:           [],
  listMeta:       { total: 0, totalPages: 1 },
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
  escrowsMeta:    { total: 0, totalPages: 1 },
  escrowsStatus:  "idle",
  escrowsError:   null,
  selectedEscrow:       null,
  selectedEscrowStatus: "idle",
  selectedEscrowError:  null,
  payouts:        [],
  payoutSummary:  null,                   // ← added
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

export const fetchEscrows = createAsyncThunk(
  "payments/fetchEscrows",
  async (_, { rejectWithValue }) => {
    try { return await getEscrows(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch escrows")); }
  }
);

export const fetchEscrowById = createAsyncThunk(
  "payments/fetchEscrowById",
  async (escrowId: string, { rejectWithValue }) => {
    try { return await getEscrowById(escrowId); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch escrow detail")); }
  }
);

// ── Payout thunks ─────────────────────────────────────────

export const fetchPayouts = createAsyncThunk(
  "payments/fetchPayouts",
  async (_, { rejectWithValue }) => {
    try { return await getPayouts(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch payouts")); }
  }
);

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
    clearSelectedEscrow: (state) => {
      state.selectedEscrow       = null;
      state.selectedEscrowStatus = "idle";
      state.selectedEscrowError  = null;
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
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
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.list       = action.payload.data;
        state.listMeta   = action.payload.meta;
      })
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
      .addCase(fetchEscrows.fulfilled, (state, action) => {
        state.escrowsStatus = "succeeded";
        state.escrows       = action.payload.data;
        state.escrowsMeta   = action.payload.meta;
      })
      .addCase(fetchEscrows.rejected,  (state, action) => { state.escrowsStatus = "failed"; state.escrowsError = action.payload as string; });

    // fetchEscrowById
    builder
      .addCase(fetchEscrowById.pending,   (state) => { state.selectedEscrowStatus = "loading"; state.selectedEscrow = null; state.selectedEscrowError = null; })
      .addCase(fetchEscrowById.fulfilled, (state, action) => { state.selectedEscrowStatus = "succeeded"; state.selectedEscrow = action.payload; })
      .addCase(fetchEscrowById.rejected,  (state, action) => { state.selectedEscrowStatus = "failed"; state.selectedEscrowError = action.payload as string; });

    // fetchPayouts                         ← updated: now also stores summary
    builder
      .addCase(fetchPayouts.pending,   (state) => { state.payoutsStatus = "loading"; state.payoutsError = null; })
      .addCase(fetchPayouts.fulfilled, (state, action) => {
        state.payoutsStatus  = "succeeded";
        state.payouts        = action.payload.data;
        state.payoutSummary  = action.payload.summary ?? null; // ← added
      })
      .addCase(fetchPayouts.rejected,  (state, action) => { state.payoutsStatus = "failed"; state.payoutsError = action.payload as string; });

    // retryPayout
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
  clearSelectedEscrow,
  resetMutateStatus,
  resetRetryStatus,
} = paymentSlice.actions;

export default paymentSlice.reducer;