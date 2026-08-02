// lib/redux/tasSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllTas, getTasById, adjustTasTier, suspendTas, activateTas,
  type ApiTas, type AdjustTierPayload,
} from "@/lib/api/tasApi";

interface TasState {
  list:           ApiTas[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiTas | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
  mutateError:    string | null;
}

const initialState: TasState = {
  list:           [],
  listStatus:     "idle",
  listError:      null,
  selected:       null,
  selectedStatus: "idle",
  mutateStatus:   "idle",
  mutateError:    null,
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

// GET /api/admin/tas-managements/{id}
// Falls back to the list item if the detail API fails
export const fetchTasById = createAsyncThunk(
  "tas/fetchById",
  async (
    { id, fallback }: { id: string; fallback: ApiTas },
    { }
  ) => {
    try { return await getTasById(id); }
    catch { return fallback; }  // API not ready — use list item
  }
);

// PUT /api/admin/tas-managements/{id}/adjust-tier
export const adjustTier = createAsyncThunk(
  "tas/adjustTier",
  async ({ id, payload }: { id: string; payload: AdjustTierPayload }, { rejectWithValue }) => {
    try { await adjustTasTier(id, payload); return await getAllTas(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to adjust tier")); }
  }
);

// PUT /api/admin/users/suspend/tas/{id}
export const suspendTasThunk = createAsyncThunk(
  "tas/suspend",
  async (id: string, { rejectWithValue }) => {
    try { await suspendTas(id); return await getAllTas(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to suspend TAS agent")); }
  }
);

// PUT /api/admin/users/activate/tas/{id}
export const activateTasThunk = createAsyncThunk(
  "tas/activate",
  async (id: string, { rejectWithValue }) => {
    try { await activateTas(id); return await getAllTas(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to reinstate TAS agent")); }
  }
);

const tasSlice = createSlice({
  name: "tas",
  initialState,
  reducers: {
    // kept for backward compat — page now uses fetchTasById instead
    selectTas: (state, action: PayloadAction<string>) => {
      state.selected = state.list.find((t) => t.id === action.payload) ?? null;
    },
    clearSelectedTas: (state) => {
      state.selected       = null;
      state.selectedStatus = "idle";
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchTas.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchTas.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchTas.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // fetchById
    builder
      .addCase(fetchTasById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchTasById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchTasById.rejected,  (state) => { state.selectedStatus = "failed"; });

    // shared handler for adjustTier, suspend, activate
    const refetchFulfilled = (state: TasState, action: { payload: unknown }) => {
      state.mutateStatus = "succeeded";
      state.list = action.payload as ApiTas[];
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