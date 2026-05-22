// lib/redux/verificationSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllVerifications,
  getVerificationById,
  verifyExpert,
  type ApiVerificationSummary,
  type ApiVerificationDetail,
  type VerificationType,
  type VerifyExpertPayload,
} from "@/lib/api/verificationApi";

interface VerificationState {
  list:           ApiVerificationSummary[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  // selected is now the full expert profile from the detail endpoint
  selected:       ApiVerificationDetail | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  // keep a reference to the summary item so we retain tier/id for PUT
  selectedSummary: ApiVerificationSummary | null;
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
  mutateError:    string | null;
}

const initialState: VerificationState = {
  list:            [],
  listStatus:      "idle",
  listError:       null,
  selected:        null,
  selectedStatus:  "idle",
  selectedSummary: null,
  mutateStatus:    "idle",
  mutateError:     null,
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

// Converts a summary (mock or list item) into a ApiVerificationDetail shape
// so the modal always has something to render even when the API fails
const summaryToDetail = (s: ApiVerificationSummary): ApiVerificationDetail => ({
  id:                   s.id,
  name:                 s.name,
  email:                s.email,
  phone:                s.phone ?? "—",
  avatar:               null,
  gender:               "—",
  bio:                  "—",
  role:                 "expert",
  roles:                ["expert"],
  status:               s.status ?? "—",
  currentMode:          "expert",
  category:             "—",
  skill:                [],
  services:             null,
  tier:                 s.tier === "tier3" ? 3 : s.tier === "tier2" ? 2 : 1,
  verification:         s.tier ?? "tier1",
  verify:               false,
  commission:           null,
  paymentModel:         "—",
  subscriptionActive:   false,
  subscriptionExpiresAt: null,
  referral:             null,
  lastModelSwitchDate:  null,
  createdAt:            s.submitted ?? new Date().toISOString(),
  updatedAt:            s.submitted ?? new Date().toISOString(),
  location:             { city: "—", state: "—", address: "—" },
  document:             { number: "—", kycType: "—", verified: false },
  bankDetails:          { bankName: "—", accountName: "—", accountNumber: "—" },
});

// GET /api/admin/experts/verification/{id}?type=expert|tas
export const fetchVerificationById = createAsyncThunk(
  "verifications/fetchById",
  async (
    { id, type, summary }: { id: string; type: VerificationType; summary: ApiVerificationSummary },
    { }
  ) => {
    try {
      const detail = await getVerificationById(id, type);
      return { detail, summary };
    } catch {
      // API failed (mock id, network issue etc.) — build detail from summary
      return { detail: summaryToDetail(summary), summary };
    }
  }
);

// PUT /api/admin/experts/verification/{id}?type=expert|tas
export const verifyExpertThunk = createAsyncThunk(
  "verifications/verify",
  async (
    { id, type, payload }: { id: string; type: VerificationType; payload: VerifyExpertPayload },
    { }
  ) => {
    try {
      await verifyExpert(id, type, payload);
      return await getAllVerifications();
    } catch {
      return [] as ApiVerificationSummary[];
    }
  }
);

const verificationSlice = createSlice({
  name: "verifications",
  initialState,
  reducers: {
    clearSelectedVerification: (state) => {
      state.selected        = null;
      state.selectedSummary = null;
      state.selectedStatus  = "idle";
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
      .addCase(fetchVerificationById.pending, (state) => {
        state.selectedStatus  = "loading";
        state.selected        = null;
        state.selectedSummary = null;
      })
      .addCase(fetchVerificationById.fulfilled, (state, action) => {
        state.selectedStatus  = "succeeded";
        state.selected        = action.payload.detail;
        state.selectedSummary = action.payload.summary;
      })
      .addCase(fetchVerificationById.rejected, (state) => {
        state.selectedStatus = "failed";
        state.selected       = null;
      });

    builder
      .addCase(verifyExpertThunk.pending,   (state) => { state.mutateStatus = "loading"; state.mutateError = null; })
      .addCase(verifyExpertThunk.fulfilled, (state, action) => {
        state.mutateStatus    = "succeeded";
        state.list            = action.payload as ApiVerificationSummary[];
        state.selected        = null;
        state.selectedSummary = null;
        state.selectedStatus  = "idle";
      })
      .addCase(verifyExpertThunk.rejected, (state, action) => {
        state.mutateStatus = "failed";
        state.mutateError  = action.payload as string;
      });
  },
});

export const { clearSelectedVerification, resetMutateStatus } = verificationSlice.actions;
export default verificationSlice.reducer;