// lib/redux/disputeSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllDisputes, getDisputeById, createDispute,
  updateDispute, deleteDispute,
  type ApiDispute, type CreateDisputePayload, type UpdateDisputePayload,
} from "@/lib/api/disputeApi";

interface DisputeState {
  list:           ApiDispute[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiDispute | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
}

const initialState: DisputeState = {
  list:           [],
  listStatus:     "idle",
  listError:      null,
  selected:       null,
  selectedStatus: "idle",
  mutateStatus:   "idle",
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
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDisputes.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchDisputes.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchDisputes.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(fetchDisputeById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchDisputeById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchDisputeById.rejected,  (state) => { state.selectedStatus = "failed"; });

    builder
      .addCase(addDispute.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(addDispute.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; state.list.unshift(action.payload); })
      .addCase(addDispute.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(editDispute.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(editDispute.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((d) => d.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(editDispute.rejected, (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(removeDispute.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(removeDispute.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((d) => d.id !== action.payload);
      })
      .addCase(removeDispute.rejected, (state) => { state.mutateStatus = "failed"; });
  },
});

export const { clearSelectedDispute, resetMutateStatus } = disputeSlice.actions;
export default disputeSlice.reducer;