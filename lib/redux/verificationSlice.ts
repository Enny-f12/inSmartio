// lib/redux/verificationSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllVerifications,
  getVerificationById,
  verifyExpertDocument,
  type ApiVerificationExpert,
  type VerifyExpertDocumentPayload,
} from "@/lib/api/verificationApi";

interface VerificationState {
  list:           ApiVerificationExpert[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiVerificationExpert | null;
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

// ── Thunks ────────────────────────────────────────────────

// GET /api/admin/experts/verification
export const fetchVerifications = createAsyncThunk(
  "verifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllVerifications(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch verifications")); }
  }
);

// GET /api/admin/experts/verification/{id}
export const fetchVerificationById = createAsyncThunk(
  "verifications/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getVerificationById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch verification")); }
  }
);

// PUT /api/admin/experts/verification/{id} — returns null, so we refetch
export const verifyDocument = createAsyncThunk(
  "verifications/verify",
  async (
    { id, payload }: { id: string; payload: VerifyExpertDocumentPayload },
    { rejectWithValue }
  ) => {
    try {
      await verifyExpertDocument(id, payload);
      // Refetch list since response is null
      const updated = await getAllVerifications();
      return updated;
    } catch (err) { return rejectWithValue(errMsg(err, "Failed to update verification")); }
  }
);

// ── Slice ─────────────────────────────────────────────────
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
    // fetchVerifications
    builder
      .addCase(fetchVerifications.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchVerifications.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchVerifications.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // fetchVerificationById
    builder
      .addCase(fetchVerificationById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchVerificationById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchVerificationById.rejected,  (state) => { state.selectedStatus = "failed"; });

    // verifyDocument — refetches full list on success
    builder
      .addCase(verifyDocument.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(verifyDocument.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = action.payload as ApiVerificationExpert[];
      })
      .addCase(verifyDocument.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.mutateError  = action.payload as string;
      });
  },
});

export const { clearSelectedVerification, resetMutateStatus } = verificationSlice.actions;
export default verificationSlice.reducer;