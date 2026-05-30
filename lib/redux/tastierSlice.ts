import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { tasApi, TasTier, TasTierData } from "../api/tastierApi";
import { AxiosError } from "axios";

// ── CUSTOM STATE INTERFACE ──────────────────────────────────────────────────
interface TasState {
  tiers: TasTier[];
  currentTier: TasTier | null;
  loading: boolean;
  error: string | null;
}

const initialState: TasState = {
  tiers: [],
  currentTier: null,
  loading: false,
  error: null,
};

// ── HELPER FOR TYPED ERRORS ─────────────────────────────────────────────────
interface ApiErrorResponse {
  message?: string;
}

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message || defaultMessage;
  }
  if (error instanceof Error) return error.message;
  return defaultMessage;
};

// ── ASYNC THUNKS ────────────────────────────────────────────────────────────

export const fetchTasTiers = createAsyncThunk<TasTier[], void, { rejectValue: string }>(
  "tas/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await tasApi.fetchAll();
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to fetch TAS tiers"));
    }
  }
);

export const fetchTasTierById = createAsyncThunk<TasTier, string, { rejectValue: string }>(
  "tas/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await tasApi.fetchById(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to fetch TAS tier details"));
    }
  }
);

export const createTasTier = createAsyncThunk<TasTier, TasTierData, { rejectValue: string }>(
  "tas/create",
  async (data, { rejectWithValue }) => {
    try {
      return await tasApi.create(data);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to create TAS tier"));
    }
  }
);

export const updateTasTier = createAsyncThunk<TasTier, { id: string; data: TasTierData }, { rejectValue: string }>(
  "tas/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await tasApi.update(id, data);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to update TAS tier"));
    }
  }
);

export const deleteTasTier = createAsyncThunk<string, string, { rejectValue: string }>(
  "tas/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await tasApi.delete(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to delete TAS tier"));
    }
  }
);

export const toggleTasTierStatus = createAsyncThunk<TasTier, string, { rejectValue: string }>(
  "tas/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      return await tasApi.toggleStatus(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to toggle status"));
    }
  }
);

// ── THE SLICE ────────────────────────────────────────────────────────────────
const tasSlice = createSlice({
  name: "tas",
  initialState,
  reducers: {
    clearTasError: (state) => {
      state.error = null;
    },
    clearCurrentTier: (state) => {
      state.currentTier = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 1. Explicit Case Handlers run first
      // Fetch All Success
      .addCase(fetchTasTiers.fulfilled, (state, action: PayloadAction<TasTier[]>) => {
        state.loading = false;
        state.tiers = action.payload;
      })
      // Fetch By ID Success
      .addCase(fetchTasTierById.fulfilled, (state, action: PayloadAction<TasTier>) => {
        state.loading = false;
        state.currentTier = action.payload;
      })
      // Create Success (Handles your 201 response data)
      .addCase(createTasTier.fulfilled, (state, action: PayloadAction<TasTier>) => {
        state.loading = false;
        state.tiers.push(action.payload);
      })
      // Update Success
      .addCase(updateTasTier.fulfilled, (state, action: PayloadAction<TasTier>) => {
        state.loading = false;
        const index = state.tiers.findIndex((tier: TasTier) => tier.id === action.payload.id);
        if (index !== -1) {
          state.tiers[index] = action.payload;
        }
        if (state.currentTier?.id === action.payload.id) {
          state.currentTier = action.payload;
        }
      })
      // Delete Success
      .addCase(deleteTasTier.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.tiers = state.tiers.filter((tier: TasTier) => tier.id !== action.payload);
        if (state.currentTier?.id === action.payload) {
          state.currentTier = null;
        }
      })
      // Toggle Status Success
      .addCase(toggleTasTierStatus.fulfilled, (state, action: PayloadAction<TasTier>) => {
        state.loading = false;
        const index = state.tiers.findIndex((tier: TasTier) => tier.id === action.payload.id);
        if (index !== -1) {
          state.tiers[index] = action.payload;
        }
        if (state.currentTier?.id === action.payload.id) {
          state.currentTier = action.payload;
        }
      })

      // 2. Generic Matchers must link at the bottom
      // Unified Loading Handler
      .addMatcher(
        (action) => typeof action.type === "string" && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      // Unified Error Handler
      .addMatcher(
        (action) => typeof action.type === "string" && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || "An unexpected error occurred";
        }
      );
  },
});

export const { clearTasError, clearCurrentTier } = tasSlice.actions;
export default tasSlice.reducer;