// lib/redux/paymentSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getTransactionHistory, getTransactionById,
  refundTransaction, getBalances,
  type ApiTransaction, type ApiBalances, type RefundPayload,
} from "@/lib/api/paymentApi";

interface PaymentState {
  // transactions list
  list:           ApiTransaction[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  // single transaction
  selected:       ApiTransaction | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  // balances
  balances:       ApiBalances | null;
  balancesStatus: "idle" | "loading" | "succeeded" | "failed";
  balancesError:  string | null;
  // mutations (refund)
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
  mutateError:    string | null;
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
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ────────────────────────────────────────────────

// GET /api/admin/transaction-history
export const fetchTransactions = createAsyncThunk(
  "payments/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getTransactionHistory(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch transactions")); }
  }
);

// GET /api/admin/transaction/{id}
export const fetchTransactionById = createAsyncThunk(
  "payments/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getTransactionById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch transaction")); }
  }
);

// POST /api/admin/transaction/{id}/refund
export const refundTransactionThunk = createAsyncThunk(
  "payments/refund",
  async ({ id, payload }: { id: string; payload?: RefundPayload }, { rejectWithValue }) => {
    try { return await refundTransaction(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to process refund")); }
  }
);

// GET /api/admin/balances
export const fetchBalances = createAsyncThunk(
  "payments/fetchBalances",
  async (_, { rejectWithValue }) => {
    try { return await getBalances(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch balances")); }
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

    // refundTransaction — update in list + selected
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
  },
});

export const { clearSelectedTransaction, resetMutateStatus } = paymentSlice.actions;
export default paymentSlice.reducer;