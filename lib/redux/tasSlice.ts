// lib/redux/tasSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllTas, getTasById, adjustTasTier,
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

// ── Thunks ────────────────────────────────────────────────

// GET /api/admin/tas-managements
export const fetchTas = createAsyncThunk(
  "tas/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllTas(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch TAS")); }
  }
);

// GET /api/admin/tas-managements/{id}
export const fetchTasById = createAsyncThunk(
  "tas/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getTasById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch TAS agent")); }
  }
);

// PUT /api/admin/tas-managements/{id}/adjust-tier
export const adjustTier = createAsyncThunk(
  "tas/adjustTier",
  async ({ id, payload }: { id: string; payload: AdjustTierPayload }, { rejectWithValue }) => {
    try { return await adjustTasTier(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to adjust tier")); }
  }
);

// ── Slice ─────────────────────────────────────────────────
const tasSlice = createSlice({
  name: "tas",
  initialState,
  reducers: {
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
    // fetchTas
    builder
      .addCase(fetchTas.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchTas.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchTas.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // fetchTasById
    builder
      .addCase(fetchTasById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchTasById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchTasById.rejected,  (state) => { state.selectedStatus = "failed"; });

    // adjustTier — update in list + selected
    builder
      .addCase(adjustTier.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(adjustTier.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })
      .addCase(adjustTier.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.mutateError  = action.payload as string;
      });
  },
});

export const { clearSelectedTas, resetMutateStatus } = tasSlice.actions;
export default tasSlice.reducer;