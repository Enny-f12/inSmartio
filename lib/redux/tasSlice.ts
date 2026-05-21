// lib/redux/tasSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllTas, adjustTasTier, suspendTas, activateTas,
  type ApiTas, type AdjustTierPayload,
} from "@/lib/api/tasApi";

interface TasState {
  list:         ApiTas[];
  listStatus:   "idle" | "loading" | "succeeded" | "failed";
  listError:    string | null;
  selected:     ApiTas | null;
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateError:  string | null;
}

const initialState: TasState = {
  list:         [],
  listStatus:   "idle",
  listError:    null,
  selected:     null,
  mutateStatus: "idle",
  mutateError:  null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// GET /api/admin/tas-managements
export const fetchTas = createAsyncThunk(
  "tas/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllTas(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch TAS")); }
  }
);

// PUT /api/admin/tas-managements/{id}/adjust-tier — refetches list after
export const adjustTier = createAsyncThunk(
  "tas/adjustTier",
  async ({ id, payload }: { id: string; payload: AdjustTierPayload }, { rejectWithValue }) => {
    try {
      await adjustTasTier(id, payload);
      return await getAllTas();
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to adjust tier"));
    }
  }
);

// PUT /api/admin/users/suspend/tas/{id} — refetches list after
export const suspendTasThunk = createAsyncThunk(
  "tas/suspend",
  async (id: string, { rejectWithValue }) => {
    try {
      await suspendTas(id);
      return await getAllTas();
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to suspend TAS agent"));
    }
  }
);

// PUT /api/admin/users/activate/tas/{id} — refetches list after
export const activateTasThunk = createAsyncThunk(
  "tas/activate",
  async (id: string, { rejectWithValue }) => {
    try {
      await activateTas(id);
      return await getAllTas();
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to reinstate TAS agent"));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────
const tasSlice = createSlice({
  name: "tas",
  initialState,
  reducers: {
    selectTas: (state, action: PayloadAction<string>) => {
      state.selected = state.list.find((t) => t.id === action.payload) ?? null;
    },
    clearSelectedTas: (state) => {
      state.selected = null;
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
  },
  extraReducers: (builder) => {
    // fetchTas
    builder
      .addCase(fetchTas.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchTas.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchTas.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // shared handler for adjustTier, suspend, activate — all refetch the list
    const refetchFulfilled = (state: TasState, action: { payload: unknown }) => {
      state.mutateStatus = "succeeded";
      state.list = action.payload as ApiTas[];
      // keep selected in sync
      if (state.selected) {
        state.selected = (action.payload as ApiTas[]).find((t) => t.id === state.selected!.id) ?? state.selected;
      }
    };
    const mutatePending  = (state: TasState) => { state.mutateStatus = "loading"; state.mutateError = null; };
    const mutateRejected = (state: TasState, action: { payload: unknown }) => {
      state.mutateStatus = "failed";
      state.mutateError  = action.payload as string;
    };

    builder
      .addCase(adjustTier.pending,   mutatePending)
      .addCase(adjustTier.fulfilled, refetchFulfilled)
      .addCase(adjustTier.rejected,  mutateRejected);

    builder
      .addCase(suspendTasThunk.pending,   mutatePending)
      .addCase(suspendTasThunk.fulfilled, refetchFulfilled)
      .addCase(suspendTasThunk.rejected,  mutateRejected);

    builder
      .addCase(activateTasThunk.pending,   mutatePending)
      .addCase(activateTasThunk.fulfilled, refetchFulfilled)
      .addCase(activateTasThunk.rejected,  mutateRejected);
  },
});

export const { selectTas, clearSelectedTas, resetMutateStatus } = tasSlice.actions;
export default tasSlice.reducer;