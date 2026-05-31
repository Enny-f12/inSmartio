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

// ── Fetch detail helper ───────────────────────────────────────────────────────
// Tries "expert" type first.
// If detail.tier is 3 => also tries "tas" (which has more data for tier 3).
// If the id is an email (fallback when list has no id), both calls will likely
// 404 — in that case we return null and the modal shows a skeleton.
async function fetchDetailBestEffort(
  id: string,
): Promise<ApiVerificationDetail | null> {
  let detail: ApiVerificationDetail | null = null;

  try {
    detail = await getVerificationById(id, "expert");
  } catch {
    // 404 or network error — will try "tas" below
  }

  // If we got a tier-3 result from the expert call, upgrade to tas
  if (detail && Number(detail.tier) === 3) {
    try {
      const tasDetail = await getVerificationById(id, "tas");
      detail = tasDetail;
    } catch {
      // Keep expert detail if tas fails
    }
  }

  // If expert call failed completely, try tas directly
  // (covers cases where tier is unknown before fetching)
  if (!detail) {
    try {
      detail = await getVerificationById(id, "tas");
    } catch {
      // Both failed
    }
  }

  return detail;
}

// ── State ─────────────────────────────────────────────────────────────────────

interface VerificationState {
  list:            ApiVerificationSummary[];
  listStatus:      "idle" | "loading" | "succeeded" | "failed";
  listError:       string | null;
  selected:        ApiVerificationDetail | null;
  selectedStatus:  "idle" | "loading" | "succeeded" | "failed";
  selectedSummary: ApiVerificationSummary | null;
  // null = full detail loaded; string = warning message (skeleton only)
  selectedWarning: string | null;
  mutateStatus:    "idle" | "loading" | "succeeded" | "failed";
  mutateError:     string | null;
  localOverrides:  Record<string, LocalStatus>;
}

const initialState: VerificationState = {
  list:            [],
  listStatus:      "idle",
  listError:       null,
  selected:        null,
  selectedStatus:  "idle",
  selectedSummary: null,
  selectedWarning: null,
  mutateStatus:    "idle",
  mutateError:     null,
  localOverrides:  {},
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ───────────────────────────────────────────────────────────────────

export const fetchVerifications = createAsyncThunk(
  "verifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllVerifications(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch verifications")); }
  }
);

export const fetchVerificationById = createAsyncThunk(
  "verifications/fetchById",
  async ({ id, summary }: { id: string; summary: ApiVerificationSummary }) => {
    const detail = await fetchDetailBestEffort(id);

    if (!detail) {
      // Could not fetch detail — show skeleton from summary data
      const tierNum = Number(normaliseTier(summary.tier).replace("tier", ""));
      const skeleton: ApiVerificationDetail = {
        id,
        name:                  summary.name,
        email:                 summary.email,
        phone:                 summary.phone ?? "—",
        avatar:                null,
        gender:                "—",
        bio:                   "—",
        role:                  "expert",
        roles:                 ["expert"],
        status:                summary.status,
        currentMode:           "expert",
        category:              "—",
        skill:                 [],
        services:              null,
        tier:                  tierNum,
        verification:          normaliseTier(summary.tier),
        verify:                false,
        commission:            null,
        paymentModel:          "—",
        subscriptionActive:    false,
        subscriptionExpiresAt: null,
        referral:              null,
        lastModelSwitchDate:   null,
        createdAt:             summary.submitted ?? "",
        updatedAt:             summary.submitted ?? "",
        location:              { city: "—", state: "—", address: "—" },
        document:              Array.isArray(summary.documents)
                                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                 ? summary.documents.reduce<Record<string, any>>((acc, d, i) => ({ ...acc, [i]: d }), {})
                                 : {},
        bankDetails:           { bankName: "—", accountName: "—", accountNumber: "—" },
      };
      return {
        detail:  skeleton,
        summary,
        warning: `Could not load full profile for ${summary.name}. The list endpoint is returning the email as ID instead of the expert ID. Ask backend to add 'id' to the list response.`,
      };
    }

    return { detail, summary, warning: null };
  }
);

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
      state.selectedWarning = null;
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
    setLocalOverride: (
      state,
      action: PayloadAction<{ id: string; status: LocalStatus }>,
    ) => {
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
      })
      .addCase(fetchVerifications.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError  = action.payload as string;
      });

    builder
      .addCase(fetchVerificationById.pending, (state) => {
        state.selectedStatus  = "loading";
        state.selectedWarning = null;
        state.selected        = null;
        state.selectedSummary = null;
      })
      .addCase(fetchVerificationById.fulfilled, (state, action) => {
        state.selectedStatus  = "succeeded";
        state.selected        = action.payload.detail;
        state.selectedSummary = action.payload.summary;
        state.selectedWarning = action.payload.warning;
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
        state.selectedWarning = null;
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

export function selectItemTier(item: ApiVerificationSummary): VerificationTier {
  return normaliseTier(item.tier);
}

export default verificationSlice.reducer;