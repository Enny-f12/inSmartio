// lib/redux/notificationSettingsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getNotificationSettings,
  createNotificationSettings,
  updateNotificationSettings,
} from "../api/notificationSettingsApi";
import type {
  NotificationSettingsPayload,
  NotificationSettingsResponse,
} from "../api/notificationSettingsApi";
import { AxiosError } from "axios";

// ── STATE ─────────────────────────────────────────────────────────────────────
interface NotificationSettingsState {
  settings: NotificationSettingsResponse | null;
  loading:  boolean;
  saving:   boolean;
  error:    string | null;
}

const initialState: NotificationSettingsState = {
  settings: null,
  loading:  false,
  saving:   false,
  error:    null,
};

// ── HELPERS ───────────────────────────────────────────────────────────────────
interface ApiErrorResponse { message?: string; }

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    return data?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

// ── THUNKS ────────────────────────────────────────────────────────────────────

// Fetch by adminId using GET /api/notification-settings/admin/{adminId}
export const fetchNotificationSettings = createAsyncThunk<
  NotificationSettingsResponse | null, string, { rejectValue: string }
>(
  "notificationSettings/fetch",
  async (adminId, { rejectWithValue }) => {
    try {
      return await getNotificationSettings(adminId);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to fetch notification settings"));
    }
  }
);

export const saveNotificationSettings = createAsyncThunk<
  NotificationSettingsResponse,
  { id: string | null; payload: NotificationSettingsPayload },
  { rejectValue: string }
>(
  "notificationSettings/save",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      if (id) {
        return await updateNotificationSettings(id, payload);
      }
      return await createNotificationSettings(payload);
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, "Failed to save notification settings"));
    }
  }
);

// ── SLICE ─────────────────────────────────────────────────────────────────────
const notificationSettingsSlice = createSlice({
  name: "notificationSettings",
  initialState,
  reducers: {
    clearNotificationSettingsError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationSettings.pending,   (state) => { state.loading = true;  state.error = null; })
      .addCase(fetchNotificationSettings.fulfilled, (state, action: PayloadAction<NotificationSettingsResponse | null>) => {
        state.loading  = false;
        state.settings = action.payload;
      })
      .addCase(fetchNotificationSettings.rejected,  (state, action) => {
        state.loading = false;
        state.error   = action.payload ?? "Failed to fetch notification settings";
      })

      .addCase(saveNotificationSettings.pending,   (state) => { state.saving = true;  state.error = null; })
      .addCase(saveNotificationSettings.fulfilled, (state, action: PayloadAction<NotificationSettingsResponse>) => {
        state.saving   = false;
        state.settings = action.payload;
      })
      .addCase(saveNotificationSettings.rejected,  (state, action) => {
        state.saving = false;
        state.error  = action.payload ?? "Failed to save notification settings";
      });
  },
});

export const { clearNotificationSettingsError } = notificationSettingsSlice.actions;
export default notificationSettingsSlice.reducer;