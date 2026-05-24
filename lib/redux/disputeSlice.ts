// lib/redux/disputeSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllDisputes, getDisputeById, getDisputeByCaseId,
  createDispute, updateDispute, deleteDispute,
  resolveDispute, appealDispute,
  type ApiDispute,
  type CreateDisputePayload,
  type UpdateDisputePayload,
  type ResolveDisputePayload,
  type AppealDisputePayload,
} from "@/lib/api/disputeApi";

interface DisputeState {
  list:           ApiDispute[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiDispute | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
  mutateError:    string | null;
}

const initialState: DisputeState = {
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

export const fetchDisputes = createAsyncThunk(
  "disputes/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllDisputes(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch disputes")); }
  }
);

export const fetchDisputeById = createAsyncThunk(
  "disputes/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getDisputeById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch dispute")); }
  }
);

export const fetchDisputeByCaseId = createAsyncThunk(
  "disputes/fetchByCaseId",
  async (caseId: string, { rejectWithValue }) => {
    try { return await getDisputeByCaseId(caseId); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch dispute")); }
  }
);

export const addDispute = createAsyncThunk(
  "disputes/add",
  async (payload: CreateDisputePayload, { rejectWithValue }) => {
    try { return await createDispute(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to create dispute")); }
  }
);

export const editDispute = createAsyncThunk(
  "disputes/edit",
  async ({ id, payload }: { id: string; payload: UpdateDisputePayload }, { rejectWithValue }) => {
    try { return await updateDispute(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update dispute")); }
  }
);

export const removeDispute = createAsyncThunk(
  "disputes/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteDispute(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete dispute")); }
  }
);

// POST /api/dispute/{id}/resolve — Submit Decision
export const resolveDisputeThunk = createAsyncThunk(
  "disputes/resolve",
  async (
    { id, payload }: { id: string; payload: ResolveDisputePayload },
    { rejectWithValue }
  ) => {
    try { return await resolveDispute(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to submit decision")); }
  }
);

// POST /api/dispute/{id}/appeal — Appeal Later
export const appealDisputeThunk = createAsyncThunk(
  "disputes/appeal",
  async (
    { id, payload }: { id: string; payload: AppealDisputePayload },
    { rejectWithValue }
  ) => {
    try { return await appealDispute(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to submit appeal")); }
  }
);

const updateInState = (state: DisputeState, updated: ApiDispute) => {
  const idx = state.list.findIndex((d) => d.id === updated.id);
  if (idx !== -1) state.list[idx] = updated;
  if (state.selected?.id === updated.id) state.selected = updated;
};

const disputeSlice = createSlice({
  name: "disputes",
  initialState,
  reducers: {
    clearSelectedDispute: (state) => {
      state.selected       = null;
      state.selectedStatus = "idle";
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDisputes.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchDisputes.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchDisputes.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    [fetchDisputeById, fetchDisputeByCaseId].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
        .addCase(thunk.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
        .addCase(thunk.rejected,  (state) => { state.selectedStatus = "failed"; });
    });

    builder
      .addCase(addDispute.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(addDispute.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; state.list.unshift(action.payload); })
      .addCase(addDispute.rejected,  (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    builder
      .addCase(editDispute.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(editDispute.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; updateInState(state, action.payload); })
      .addCase(editDispute.rejected,  (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    builder
      .addCase(removeDispute.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(removeDispute.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((d) => d.id !== action.payload);
        if (state.selected?.id === action.payload) { state.selected = null; state.selectedStatus = "idle"; }
      })
      .addCase(removeDispute.rejected,  (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    // resolve — Submit Decision
    builder
      .addCase(resolveDisputeThunk.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(resolveDisputeThunk.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; updateInState(state, action.payload); })
      .addCase(resolveDisputeThunk.rejected,  (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    // appeal — Appeal Later
    builder
      .addCase(appealDisputeThunk.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(appealDisputeThunk.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; updateInState(state, action.payload); })
      .addCase(appealDisputeThunk.rejected,  (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });
  },
});

export const { clearSelectedDispute, resetMutateStatus } = disputeSlice.actions;
export default disputeSlice.reducer;