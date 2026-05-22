// lib/redux/commissionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllCommissions, createCommission, updateCommission,
  deleteCommission, toggleCommissionStatus,
  type ApiCommission, type CreateCommissionPayload, type UpdateCommissionPayload,
} from "@/lib/api/commissionApi";

interface CommissionState {
  list:         ApiCommission[];
  listStatus:   "idle" | "loading" | "succeeded" | "failed";
  listError:    string | null;
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateError:  string | null;
}

const initialState: CommissionState = {
  list:         [],
  listStatus:   "idle",
  listError:    null,
  mutateStatus: "idle",
  mutateError:  null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// GET /api/settings/commission
export const fetchCommissions = createAsyncThunk(
  "commission/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllCommissions(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch commission settings")); }
  }
);

// POST /api/settings/commission/create
export const addCommission = createAsyncThunk(
  "commission/add",
  async (payload: CreateCommissionPayload, { rejectWithValue }) => {
    try { return await createCommission(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to create commission")); }
  }
);

// PUT /api/settings/commission/{id}
export const editCommission = createAsyncThunk(
  "commission/edit",
  async ({ id, payload }: { id: string; payload: UpdateCommissionPayload }, { rejectWithValue }) => {
    try { return await updateCommission(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update commission")); }
  }
);

// DELETE /api/settings/commission/{id}
export const removeCommission = createAsyncThunk(
  "commission/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteCommission(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete commission")); }
  }
);

// PATCH /api/settings/commission/{id}/toggle-status
export const toggleCommission = createAsyncThunk(
  "commission/toggle",
  async (id: string, { rejectWithValue }) => {
    try { return await toggleCommissionStatus(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to toggle commission status")); }
  }
);

const commissionSlice = createSlice({
  name: "commission",
  initialState,
  reducers: {
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchCommissions.pending,   (s) => { s.listStatus = "loading"; s.listError = null; })
      .addCase(fetchCommissions.fulfilled, (s, a) => { s.listStatus = "succeeded"; s.list = a.payload; })
      .addCase(fetchCommissions.rejected,  (s, a) => { s.listStatus = "failed"; s.listError = a.payload as string; });

    // add
    builder
      .addCase(addCommission.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(addCommission.fulfilled, (s, a) => { s.mutateStatus = "succeeded"; s.list.push(a.payload); })
      .addCase(addCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // edit
    builder
      .addCase(editCommission.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(editCommission.fulfilled, (s, a) => {
        s.mutateStatus = "succeeded";
        const idx = s.list.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(editCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // remove
    builder
      .addCase(removeCommission.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(removeCommission.fulfilled, (s, a) => { s.mutateStatus = "succeeded"; s.list = s.list.filter((c) => c.id !== a.payload); })
      .addCase(removeCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // toggle
    builder
      .addCase(toggleCommission.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(toggleCommission.fulfilled, (s, a) => {
        s.mutateStatus = "succeeded";
        const idx = s.list.findIndex((c) => c.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(toggleCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });
  },
});

export const { resetMutateStatus } = commissionSlice.actions;
export default commissionSlice.reducer;