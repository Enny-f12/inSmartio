// lib/redux/verificationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllVerifications,
  getVerificationById,
  verifyExpert,
  normaliseTier,
  type ApiVerificationSummary,
  type ApiVerificationDetail,
  type VerificationTier,
  type VerificationType,
  type VerifyExpertPayload,
} from "@/lib/api/verificationApi";

export type LocalStatus = "approved" | "rejected";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Fetch detail — try "expert" first; upgrade to "tas" if tier is 3
async function fetchDetailBestEffort(id: string): Promise<ApiVerificationDetail | null> {
  let detail: ApiVerificationDetail | null = null;
  try { detail = await getVerificationById(id, "expert"); } catch { /* noop */ }
  if (detail && Number(detail.tier) === 3) {
    try { detail = await getVerificationById(id, "tas"); } catch { /* keep expert detail */ }
  }
  return detail;
}

interface VerificationState {
  list:            ApiVerificationSummary[];
  listStatus:      "idle" | "loading" | "succeeded" | "failed";
  listError:       string | null;
  selected:        ApiVerificationDetail | null;
  selectedStatus:  "idle" | "loading" | "succeeded" | "failed";
  selectedSummary: ApiVerificationSummary | null;
  mutateStatus:    "idle" | "loading" | "succeeded" | "failed";
  mutateError:     string | null;
  // Optimistic status overrides — survive list refreshes
  localOverrides:  Record<string, LocalStatus>;
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
  localOverrides:  {},
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ───────────────────────────────────────────────────────────────────

// List — backend now returns tier + documents array directly, no batch fetch needed
export const fetchVerifications = createAsyncThunk(
  "verifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllVerifications(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch verifications")); }
  }
);

// Detail modal open
export const fetchVerificationById = createAsyncThunk(
  "verifications/fetchById",
  async ({ id, summary }: { id: string; summary: ApiVerificationSummary }) => {
    const detail = await fetchDetailBestEffort(id);
    if (!detail) {
      // Skeleton fallback so modal can still render
      const fallback: ApiVerificationDetail = {
        id, name: summary.name, email: summary.email,
        phone: summary.phone ?? "—", avatar: null, gender: "—", bio: "—",
        role: "expert", roles: ["expert"], status: summary.status ?? "—",
        currentMode: "expert", category: "—", skill: [], services: null,
        tier: Number(normaliseTier(summary.tier).replace("tier", "")),
        verification: normaliseTier(summary.tier),
        verify: false, commission: null, paymentModel: "—",
        subscriptionActive: false, subscriptionExpiresAt: null,
        referral: null, lastModelSwitchDate: null,
        createdAt: summary.submitted ?? "", updatedAt: summary.submitted ?? "",
        location: { city: "—", state: "—", address: "—" },
        document: {}, bankDetails: { bankName: "—", accountName: "—", accountNumber: "—" },
      };
      return { detail: fallback, summary };
    }
    return { detail, summary };
  }
);

// Approve / Reject
export const verifyExpertThunk = createAsyncThunk(
  "verifications/verify",
  async ({
    id, type, payload, localStatus,
  }: {
    id:          string;
    type:        VerificationType;
    payload:     VerifyExpertPayload;
    localStatus: LocalStatus;
  }) => {
    try { await verifyExpert(id, type, payload); } catch { /* optimistic */ }
    return { id, localStatus };
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────
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
    setLocalOverride: (state, action: PayloadAction<{ id: string; status: LocalStatus }>) => {
      state.localOverrides[action.payload.id] = action.payload.status;
    },
  },
  extraReducers: (builder) => {

    builder
      .addCase(fetchVerifications.pending, (state) => {
        state.listStatus = "loading";
        state.listError  = null;
      })
      .addCase(fetchVerifications.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.list       = action.payload;
        // localOverrides intentionally NOT reset — they survive refreshes
      })
      .addCase(fetchVerifications.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError  = action.payload as string;
      });

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
      .addCase(verifyExpertThunk.pending, (state) => {
        state.mutateStatus = "loading";
        state.mutateError  = null;
      })
      .addCase(verifyExpertThunk.fulfilled, (state, action) => {
        const { id, localStatus } = action.payload;
        state.mutateStatus = "succeeded";
        state.localOverrides[id] = localStatus;
        const item = state.list.find((e) => e.id === id);
        if (item) {
          item.status = localStatus;
          if (localStatus === "approved") item.verify = true;
        }
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

export const {
  clearSelectedVerification,
  resetMutateStatus,
  setLocalOverride,
} = verificationSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

// Derive the correct VerificationTier for a list item, respecting localOverrides
export function selectItemTier(
  item: ApiVerificationSummary,
): VerificationTier {
  return normaliseTier(item.tier);
}

export default verificationSlice.reducer;