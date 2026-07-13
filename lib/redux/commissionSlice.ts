// lib/redux/commissionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllCommissions, createCommission, updateCommission,
  deleteCommission, toggleCommissionStatus,
  getActiveModel, setActiveModel, toggleActiveModel, toggleCommissionActiveModel,
  type ApiCommission, type CreateCommissionPayload, type UpdateCommissionPayload,
  type ActiveModel,
} from "@/lib/api/commissionApi";

interface CommissionState {
  list:              ApiCommission[];
  listStatus:        "idle" | "loading" | "succeeded" | "failed";
  listError:         string | null;
  mutateStatus:      "idle" | "loading" | "succeeded" | "failed";
  mutateError:       string | null;

  // Global active payment model (GET /settings/active-model, etc.)
  activeModel:       ActiveModel | null;
  activeModelStatus: "idle" | "loading" | "succeeded" | "failed";
  activeModelError:  string | null;
}

const initialState: CommissionState = {
  list:              [],
  listStatus:        "idle",
  listError:         null,
  mutateStatus:      "idle",
  mutateError:       null,

  activeModel:       null,
  activeModelStatus: "idle",
  activeModelError:  null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// Defensive equality check — guards against id type drift (e.g. "1" vs 1,
// or trailing whitespace from one endpoint but not another).
const sameId = (a: unknown, b: unknown) => String(a).trim() === String(b).trim();

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

// ── Active payment model thunks ─────────────────────────────────────────────

// GET /settings/active-model — public
export const fetchActiveModel = createAsyncThunk(
  "commission/fetchActiveModel",
  async (_, { rejectWithValue }) => {
    try { return await getActiveModel(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch active payment model")); }
  }
);

// PATCH /settings/commission/active-model — admin only, explicit set
export const updateActiveModel = createAsyncThunk(
  "commission/updateActiveModel",
  async (model: ActiveModel, { rejectWithValue }) => {
    try { return await setActiveModel(model); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update active payment model")); }
  }
);

// PATCH /settings/commission/active-model/toggle — admin only, global cycle
export const toggleGlobalActiveModel = createAsyncThunk(
  "commission/toggleGlobalActiveModel",
  async (_, { rejectWithValue }) => {
    try { return await toggleActiveModel(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to toggle active payment model")); }
  }
);

// PATCH /settings/commission/{id}/active-model/toggle — admin only, per-record
export const toggleRecordActiveModel = createAsyncThunk(
  "commission/toggleRecordActiveModel",
  async (id: string, { rejectWithValue }) => {
    try { return await toggleCommissionActiveModel(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to toggle active payment model for this record")); }
  }
);

// Shared handling for any thunk that resolves an ApiCommission representing
// the "current" commission settings: merges it into `list` if its id is
// present there, and syncs the global `activeModel` if the record carries one.
function applyCommissionSettingsUpdate(state: CommissionState, commission: ApiCommission) {
  const idx = state.list.findIndex((c) => sameId(c.id, commission.id));
  if (idx !== -1) {
    state.list[idx] = { ...state.list[idx], ...commission };
  }
  if (commission.activePaymentModel) {
    state.activeModel = commission.activePaymentModel;
  }
}

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
        const idx = s.list.findIndex((c) => sameId(c.id, a.payload.id));
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(editCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // remove
    builder
      .addCase(removeCommission.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(removeCommission.fulfilled, (s, a) => { s.mutateStatus = "succeeded"; s.list = s.list.filter((c) => !sameId(c.id, a.payload)); })
      .addCase(removeCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // toggle status
    builder
      .addCase(toggleCommission.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(toggleCommission.fulfilled, (s, a) => {
        s.mutateStatus = "succeeded";
        const idx = s.list.findIndex((c) => sameId(c.id, a.payload.id));
        if (idx !== -1) s.list[idx] = { ...s.list[idx], ...a.payload };
      })
      .addCase(toggleCommission.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // fetch active model (public)
    builder
      .addCase(fetchActiveModel.pending,   (s) => { s.activeModelStatus = "loading"; s.activeModelError = null; })
      .addCase(fetchActiveModel.fulfilled, (s, a) => { s.activeModelStatus = "succeeded"; s.activeModel = a.payload; })
      .addCase(fetchActiveModel.rejected,  (s, a) => { s.activeModelStatus = "failed"; s.activeModelError = a.payload as string; });

    // explicit set
    builder
      .addCase(updateActiveModel.pending,   (s) => { s.activeModelStatus = "loading"; s.activeModelError = null; })
      .addCase(updateActiveModel.fulfilled, (s, a) => { s.activeModelStatus = "succeeded"; applyCommissionSettingsUpdate(s, a.payload); })
      .addCase(updateActiveModel.rejected,  (s, a) => { s.activeModelStatus = "failed"; s.activeModelError = a.payload as string; });

    // global cyclical toggle
    builder
      .addCase(toggleGlobalActiveModel.pending,   (s) => { s.activeModelStatus = "loading"; s.activeModelError = null; })
      .addCase(toggleGlobalActiveModel.fulfilled, (s, a) => { s.activeModelStatus = "succeeded"; applyCommissionSettingsUpdate(s, a.payload); })
      .addCase(toggleGlobalActiveModel.rejected,  (s, a) => { s.activeModelStatus = "failed"; s.activeModelError = a.payload as string; });

    // per-record toggle
    builder
      .addCase(toggleRecordActiveModel.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(toggleRecordActiveModel.fulfilled, (s, a) => { s.mutateStatus = "succeeded"; applyCommissionSettingsUpdate(s, a.payload); })
      .addCase(toggleRecordActiveModel.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });
  },
});

export const { resetMutateStatus } = commissionSlice.actions;
export default commissionSlice.reducer;