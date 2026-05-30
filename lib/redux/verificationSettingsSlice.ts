import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { verificationSettingsApi, VerificationSettings, VerificationSettingsData } from "../api/verificationSettingsApi";
import { AxiosError } from "axios";

// ── CUSTOM STATE INTERFACE ──────────────────────────────────────────────────
interface VerificationSettingsState {
  settings: VerificationSettings[];
  currentSettings: VerificationSettings | null;
  loading: boolean;
  error: string | null;
}

const initialState: VerificationSettingsState = {
  settings: [],
  currentSettings: null,
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

export const fetchVerificationSettings = createAsyncThunk<VerificationSettings[], void, { rejectValue: string }>(
  "verificationSettings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await verificationSettingsApi.fetchAll();
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to fetch verification settings"));
    }
  }
);

export const fetchVerificationSettingsById = createAsyncThunk<VerificationSettings, string, { rejectValue: string }>(
  "verificationSettings/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      return await verificationSettingsApi.fetchById(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to fetch verification setting details"));
    }
  }
);

export const createVerificationSettings = createAsyncThunk<VerificationSettings, VerificationSettingsData, { rejectValue: string }>(
  "verificationSettings/create",
  async (data, { rejectWithValue }) => {
    try {
      return await verificationSettingsApi.create(data);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to create verification settings"));
    }
  }
);

export const updateVerificationSettings = createAsyncThunk<VerificationSettings, { id: string; data: VerificationSettingsData }, { rejectValue: string }>(
  "verificationSettings/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await verificationSettingsApi.update(id, data);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to update verification settings"));
    }
  }
);

export const deleteVerificationSettings = createAsyncThunk<string, string, { rejectValue: string }>(
  "verificationSettings/delete",
  async (id, { rejectWithValue }) => {
    try {
      return await verificationSettingsApi.delete(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to delete verification settings"));
    }
  }
);

export const toggleVerificationSettingsStatus = createAsyncThunk<VerificationSettings, string, { rejectValue: string }>(
  "verificationSettings/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      return await verificationSettingsApi.toggleStatus(id);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to toggle status"));
    }
  }
);

// ── THE SLICE ────────────────────────────────────────────────────────────────
const verificationSettingsSlice = createSlice({
  name: "verificationSettings",
  initialState,
  reducers: {
    clearVerificationError: (state) => {
      state.error = null;
    },
    clearCurrentVerificationSettings: (state) => {
      state.currentSettings = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 1. Explicit Case Handlers run first to keep TypeScript builder chaining stable
      // Fetch All Success
      .addCase(fetchVerificationSettings.fulfilled, (state, action: PayloadAction<VerificationSettings[]>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      // Fetch By ID Success
      .addCase(fetchVerificationSettingsById.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        state.currentSettings = action.payload;
      })
      // Create Success
      .addCase(createVerificationSettings.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        state.settings.push(action.payload);
      })
      // Update Success
      .addCase(updateVerificationSettings.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        const index = state.settings.findIndex((item: VerificationSettings) => item.id === action.payload.id);
        if (index !== -1) {
          state.settings[index] = action.payload;
        }
        if (state.currentSettings?.id === action.payload.id) {
          state.currentSettings = action.payload;
        }
      })
      // Delete Success
      .addCase(deleteVerificationSettings.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.settings = state.settings.filter((item: VerificationSettings) => item.id !== action.payload);
        if (state.currentSettings?.id === action.payload) {
          state.currentSettings = null;
        }
      })
      // Toggle Status Success
      .addCase(toggleVerificationSettingsStatus.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        const index = state.settings.findIndex((item: VerificationSettings) => item.id === action.payload.id);
        if (index !== -1) {
          state.settings[index] = action.payload;
        }
        if (state.currentSettings?.id === action.payload.id) {
          state.currentSettings = action.payload;
        }
      })

      // 2. Matchers at the tail end
      // Unified Loading Matcher
      .addMatcher(
        (action) => typeof action.type === "string" && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      // Unified Error Matcher
      .addMatcher(
        (action) => typeof action.type === "string" && action.type.endsWith("/rejected"),
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error = action.payload || "An unexpected error occurred";
        }
      );
  },
});

export const { clearVerificationError, clearCurrentVerificationSettings } = verificationSettingsSlice.actions;
export default verificationSettingsSlice.reducer;