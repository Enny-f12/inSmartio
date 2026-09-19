import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { subscriptionApi } from "../api/subscriptionApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SubscriptionPlanType = "bid" | "job" | "expert" | "tas";

export interface SubscriptionPlan {
  id: string;
  amount: number;
  frequency: "monthly" | "yearly" | "weekly";
  type: SubscriptionPlanType;
  status: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubscriptionPayload {
  amount: number;
  frequency: "monthly" | "yearly" | "weekly";
  type: SubscriptionPlanType;
  status: boolean;
}

export type UpdateSubscriptionPayload = Partial<CreateSubscriptionPayload>;

// ── API response envelope types ───────────────────────────────────────────────
// Backend always sends:  { message, data: T, status }
// For list endpoints:    { message, data: T[], status }

export interface ApiResponse<T> {
  message: string;
  data: T;
  status: boolean;
}

export type ApiListResponse<T> = ApiResponse<T[]>;

// ── State ─────────────────────────────────────────────────────────────────────

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan | null;
  selectedPlan: SubscriptionPlan | null;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

// ── Error helper ──────────────────────────────────────────────────────────────

interface ApiError {
  response?: { data?: { message?: string | string[] } };
}

function getErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  return msg ?? fallback;
}

// ── Initial State ─────────────────────────────────────────────────────────────

const initialState: SubscriptionState = {
  plans: [],
  currentPlan: null,
  selectedPlan: null,
  loading: false,
  actionLoading: false,
  error: null,
};

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchAllSubscriptions = createAsyncThunk(
  "subscription/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await subscriptionApi.getAll();
      // data = { message, data: SubscriptionPlan[], status }
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch subscriptions"));
    }
  }
);

export const fetchSubscriptionById = createAsyncThunk(
  "subscription/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const { data } = await subscriptionApi.getById(id);
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch subscription"));
    }
  }
);

export const fetchCurrentSubscription = createAsyncThunk(
  "subscription/fetchCurrent",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await subscriptionApi.getCurrent();
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to fetch current subscription"));
    }
  }
);

export const createSubscription = createAsyncThunk(
  "subscription/create",
  async (payload: CreateSubscriptionPayload, { rejectWithValue }) => {
    try {
      const { data } = await subscriptionApi.create(payload);
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to create subscription"));
    }
  }
);

export const updateSubscription = createAsyncThunk(
  "subscription/update",
  async (
    { id, payload }: { id: string; payload: UpdateSubscriptionPayload },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await subscriptionApi.update(id, payload);
      return data.data;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to update subscription"));
    }
  }
);

export const deleteSubscription = createAsyncThunk(
  "subscription/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await subscriptionApi.delete(id);
      return id;
    } catch (err: unknown) {
      return rejectWithValue(getErrorMessage(err, "Failed to delete subscription"));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    setSelectedPlan(state, action: PayloadAction<SubscriptionPlan | null>) {
      state.selectedPlan = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch All ──
    builder
      .addCase(fetchAllSubscriptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllSubscriptions.fulfilled, (state, action) => {
        state.loading = false;
        state.plans = action.payload;
      })
      .addCase(fetchAllSubscriptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Fetch By ID ──
    builder.addCase(fetchSubscriptionById.fulfilled, (state, action) => {
      state.selectedPlan = action.payload;
    });

    // ── Fetch Current ──
    builder.addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
      state.currentPlan = action.payload;
    });

    // ── Create ──
    builder
      .addCase(createSubscription.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.plans.unshift(action.payload);
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // ── Update ──
    builder
      .addCase(updateSubscription.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.plans.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.plans[idx] = action.payload;
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });

    // ── Delete ──
    builder
      .addCase(deleteSubscription.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.actionLoading = false;
        state.plans = state.plans.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteSubscription.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSelectedPlan, clearError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;