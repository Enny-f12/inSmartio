// lib/redux/verificationSettingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { verificationSettingsApi, VerificationSettings, VerificationSettingsData } from "../api/verificationSettingsApi";
import { AxiosError } from "axios";

interface VerificationSettingsState {
  settings:        VerificationSettings[];
  currentSettings: VerificationSettings | null;
  loading:         boolean;
  error:           string | null;
}

const initialState: VerificationSettingsState = {
  settings:        [],
  currentSettings: null,
  loading:         false,
  error:           null,
};

interface ApiErrorResponse { message?: string; }

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
    try { return await verificationSettingsApi.fetchAll(); }
    catch (error) { return rejectWithValue(extractErrorMessage(error, "Failed to fetch verification settings")); }
  }
);

export const fetchVerificationSettingsById = createAsyncThunk<VerificationSettings, string, { rejectValue: string }>(
  "verificationSettings/fetchById",
  async (id, { rejectWithValue }) => {
    try { return await verificationSettingsApi.fetchById(id); }
    catch (error) { return rejectWithValue(extractErrorMessage(error, "Failed to fetch verification setting")); }
  }
);

export const createVerificationSettings = createAsyncThunk<VerificationSettings, VerificationSettingsData, { rejectValue: string }>(
  "verificationSettings/create",
  async (data, { rejectWithValue }) => {
    try { return await verificationSettingsApi.create(data); }
    catch (error) { return rejectWithValue(extractErrorMessage(error, "Failed to create verification settings")); }
  }
);

export const updateVerificationSettings = createAsyncThunk<VerificationSettings, { id: string; data: VerificationSettingsData }, { rejectValue: string }>(
  "verificationSettings/update",
  async ({ id, data }, { rejectWithValue }) => {
    try { return await verificationSettingsApi.update(id, data); }
    catch (error) { return rejectWithValue(extractErrorMessage(error, "Failed to update verification settings")); }
  }
);

export const deleteVerificationSettings = createAsyncThunk<string, string, { rejectValue: string }>(
  "verificationSettings/delete",
  async (id, { rejectWithValue }) => {
    try { return await verificationSettingsApi.delete(id); }
    catch (error) { return rejectWithValue(extractErrorMessage(error, "Failed to delete verification settings")); }
  }
);

export const toggleVerificationSettingsStatus = createAsyncThunk<VerificationSettings, string, { rejectValue: string }>(
  "verificationSettings/toggleStatus",
  async (id, { rejectWithValue }) => {
    try { return await verificationSettingsApi.toggleStatus(id); }
    catch (error) { return rejectWithValue(extractErrorMessage(error, "Failed to toggle status")); }
  }
);

// ── THE SLICE ────────────────────────────────────────────────────────────────
const verificationSettingsSlice = createSlice({
  name: "verificationSettings",
  initialState,
  reducers: {
    clearVerificationError:           (state) => { state.error = null; },
    clearCurrentVerificationSettings: (state) => { state.currentSettings = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVerificationSettings.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchVerificationSettings.fulfilled, (state, action: PayloadAction<VerificationSettings[]>) => {
        state.loading  = false;
        state.settings = action.payload;
      })
      .addCase(fetchVerificationSettings.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to fetch verification settings";
      })

      .addCase(fetchVerificationSettingsById.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchVerificationSettingsById.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading         = false;
        state.currentSettings = action.payload;
      })
      .addCase(fetchVerificationSettingsById.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to fetch verification setting";
      })

      .addCase(createVerificationSettings.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(createVerificationSettings.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        state.settings.push(action.payload);
      })
      .addCase(createVerificationSettings.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to create verification settings";
      })

      .addCase(updateVerificationSettings.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(updateVerificationSettings.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        const idx = state.settings.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.settings[idx] = action.payload;
        if (state.currentSettings?.id === action.payload.id) state.currentSettings = action.payload;
      })
      .addCase(updateVerificationSettings.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to update verification settings";
      })

      .addCase(deleteVerificationSettings.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(deleteVerificationSettings.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading  = false;
        state.settings = state.settings.filter((s) => s.id !== action.payload);
        if (state.currentSettings?.id === action.payload) state.currentSettings = null;
      })
      .addCase(deleteVerificationSettings.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to delete verification settings";
      })

      .addCase(toggleVerificationSettingsStatus.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(toggleVerificationSettingsStatus.fulfilled, (state, action: PayloadAction<VerificationSettings>) => {
        state.loading = false;
        const idx = state.settings.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.settings[idx] = action.payload;
        if (state.currentSettings?.id === action.payload.id) state.currentSettings = action.payload;
      })
      .addCase(toggleVerificationSettingsStatus.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to toggle verification settings status";
      });
  },
});

export const { clearVerificationError, clearCurrentVerificationSettings } = verificationSettingsSlice.actions;
export default verificationSettingsSlice.reducer;