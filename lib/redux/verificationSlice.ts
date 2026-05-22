// lib/redux/verificationSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllVerifications,
  getVerificationById,
  verifyExpert,
  type ApiVerificationSummary,
  type VerificationTier,
  type VerifyExpertPayload,
} from "@/lib/api/verificationApi";

interface VerificationState {
  list:           ApiVerificationSummary[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiVerificationSummary | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
  mutateError:    string | null;
}

const initialState: VerificationState = {
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

// GET /api/admin/experts/verification
export const fetchVerifications = createAsyncThunk(
  "verifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllVerifications(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch verifications")); }
  }
);

// GET /api/admin/experts/verification/{id}?type=...
export const fetchVerificationById = createAsyncThunk(
  "verifications/fetchById",
  async (
    { id, type }: { id: string; type: VerificationTier },
    { rejectWithValue }
  ) => {
    try { return await getVerificationById(id, type); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch verification detail")); }
  }
);

// PUT /api/admin/experts/verification/{id}?type=...
// approve  → { verify: true }
// reject   → { reject: true, reason: "..." }
export const verifyExpertThunk = createAsyncThunk(
  "verifications/verify",
  async (
    {
      id,
      type,
      payload,
    }: { id: string; type: VerificationTier; payload: VerifyExpertPayload },
    { rejectWithValue }
  ) => {
    try {
      await verifyExpert(id, type, payload);
      return await getAllVerifications(); // refetch list since PUT returns null
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to update verification"));
    }
  }
);

const verificationSlice = createSlice({
  name: "verifications",
  initialState,
  reducers: {
    clearSelectedVerification: (state) => {
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
      .addCase(fetchVerifications.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchVerifications.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchVerifications.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // fetchById
    builder
      .addCase(fetchVerificationById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchVerificationById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchVerificationById.rejected,  (state) => { state.selectedStatus = "failed"; state.selected = null; });

    // verify / reject
    builder
      .addCase(verifyExpertThunk.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(verifyExpertThunk.fulfilled, (state, action) => {
        state.mutateStatus   = "succeeded";
        state.list           = action.payload as ApiVerificationSummary[];
        state.selected       = null;
        state.selectedStatus = "idle";
      })
      .addCase(verifyExpertThunk.rejected,  (state, action) => {
        state.mutateStatus = "failed";
        state.mutateError  = action.payload as string;
      });
  },
});

export const { clearSelectedVerification, resetMutateStatus } = verificationSlice.actions;
export default verificationSlice.reducer;