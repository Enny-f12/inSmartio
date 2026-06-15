// lib/redux/appVersionSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  getLatestAppVersion,
  getAllAppVersions,
  uploadAppVersion,
  deleteAppVersion,
} from "@/lib/api/appversionApi";
import type { AppVersion, UploadAppVersionPayload } from "@/lib/api/appversionApi";
import { AxiosError } from "axios";

// ── STATE 
interface AppVersionState {
  latest:         AppVersion | null;
  history:        AppVersion[];
  fetchStatus:    "idle" | "loading" | "succeeded" | "failed";
  uploadStatus:   "idle" | "uploading" | "succeeded" | "failed";
  deleteStatus:   "idle" | "loading" | "succeeded" | "failed";
  uploadProgress: number;
  error:          string | null;
}

const initialState: AppVersionState = {
  latest:         null,
  history:        [],
  fetchStatus:    "idle",
  uploadStatus:   "idle",
  deleteStatus:   "idle",
  uploadProgress: 0,
  error:          null,
};

// ── HELPERS 
const extractError = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message || error.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

// ── THUNKS 

export const fetchLatestVersion = createAsyncThunk<AppVersion | null, void, { rejectValue: string }>(
  "appVersion/fetchLatest",
  async (_, { rejectWithValue }) => {
    try { return await getLatestAppVersion(); }
    catch (e) { return rejectWithValue(extractError(e, "Failed to fetch latest version")); }
  }
);

export const fetchAllVersions = createAsyncThunk<AppVersion[], void, { rejectValue: string }>(
  "appVersion/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllAppVersions(); }
    catch (e) { return rejectWithValue(extractError(e, "Failed to fetch versions")); }
  }
);

export const uploadVersionThunk = createAsyncThunk<
  AppVersion,
  { payload: UploadAppVersionPayload; onProgress: (pct: number) => void },
  { rejectValue: string }
>(
  "appVersion/upload",
  async ({ payload, onProgress }, { rejectWithValue }) => {
    try { return await uploadAppVersion(payload, onProgress); }
    catch (e) { return rejectWithValue(extractError(e, "Upload failed")); }
  }
);

export const deleteVersionThunk = createAsyncThunk<string, string, { rejectValue: string }>(
  "appVersion/delete",
  async (id, { rejectWithValue }) => {
    try { await deleteAppVersion(id); return id; }
    catch (e) { return rejectWithValue(extractError(e, "Delete failed")); }
  }
);

// ── SLICE 
const appVersionSlice = createSlice({
  name: "appVersion",
  initialState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    resetUploadStatus: (state) => {
      state.uploadStatus   = "idle";
      state.uploadProgress = 0;
      state.error          = null;
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // fetchLatest
      .addCase(fetchLatestVersion.pending,   (s) => { s.fetchStatus = "loading"; s.error = null; })
      .addCase(fetchLatestVersion.fulfilled, (s, a) => { s.fetchStatus = "succeeded"; s.latest = a.payload; })
      .addCase(fetchLatestVersion.rejected,  (s, a) => { s.fetchStatus = "failed"; s.error = a.payload ?? null; })

      // fetchAll
      .addCase(fetchAllVersions.pending,   (s) => { s.fetchStatus = "loading"; })
      .addCase(fetchAllVersions.fulfilled, (s, a) => { s.fetchStatus = "succeeded"; s.history = a.payload; })
      .addCase(fetchAllVersions.rejected,  (s, a) => { s.fetchStatus = "failed"; s.error = a.payload ?? null; })

      // upload
      .addCase(uploadVersionThunk.pending,   (s) => { s.uploadStatus = "uploading"; s.uploadProgress = 0; s.error = null; })
      .addCase(uploadVersionThunk.fulfilled, (s, a) => {
        s.uploadStatus   = "succeeded";
        s.uploadProgress = 100;
        s.latest         = a.payload;
        s.history        = [a.payload, ...s.history];
      })
      .addCase(uploadVersionThunk.rejected,  (s, a) => { s.uploadStatus = "failed"; s.error = a.payload ?? null; })

      // delete
      .addCase(deleteVersionThunk.pending,   (s) => { s.deleteStatus = "loading"; })
      .addCase(deleteVersionThunk.fulfilled, (s, a) => {
        s.deleteStatus = "succeeded";
        s.history      = s.history.filter((v) => v.id !== a.payload);
        if (s.latest?.id === a.payload) s.latest = s.history[0] ?? null;
      })
      .addCase(deleteVersionThunk.rejected,  (s, a) => { s.deleteStatus = "failed"; s.error = a.payload ?? null; });
  },
});

export const { setUploadProgress, resetUploadStatus, clearError } = appVersionSlice.actions;
export default appVersionSlice.reducer;