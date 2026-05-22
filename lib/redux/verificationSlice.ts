// lib/redux/verificationSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllVerifications,
  verifyExpert,
  type ApiVerificationSummary,
  type VerifyExpertPayload,
} from "@/lib/api/verificationApi";

interface VerificationState {
  list:         ApiVerificationSummary[];
  listStatus:   "idle" | "loading" | "succeeded" | "failed";
  listError:    string | null;
  selected:     ApiVerificationSummary | null; // picked directly from list, no extra fetch
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateError:  string | null;
}

const initialState: VerificationState = {
  list:         [],
  listStatus:   "idle",
  listError:    null,
  selected:     null,
  mutateStatus: "idle",
  mutateError:  null,
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

// PUT /api/admin/experts/verification/{id}
export const verifyExpertThunk = createAsyncThunk(
  "verifications/verify",
  async (
    { id, payload }: { id: string; payload: VerifyExpertPayload },
    { rejectWithValue }
  ) => {
    try {
      await verifyExpert(id, payload);
      return await getAllVerifications(); // refetch since response is null
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to update verification"));
    }
  }
);

const verificationSlice = createSlice({
  name: "verifications",
  initialState,
  reducers: {
    // Open modal by picking the item from the list — no API call needed
    selectVerification: (state, action: PayloadAction<ApiVerificationSummary>) => {
      state.selected = action.payload;
    },
    clearSelectedVerification: (state) => {
      state.selected = null;
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerifications.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchVerifications.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchVerifications.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(verifyExpertThunk.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(verifyExpertThunk.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list         = action.payload as ApiVerificationSummary[];
        state.selected     = null;
      })
      .addCase(verifyExpertThunk.rejected,  (state, action) => {
        state.mutateStatus = "failed";
        state.mutateError  = action.payload as string;
      });
  },
});

export const { selectVerification, clearSelectedVerification, resetMutateStatus } = verificationSlice.actions;
export default verificationSlice.reducer;