import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllAppVersions, getLatestAppVersion, uploadAppVersion, deleteAppVersion,
  type AppVersion, type UploadAppVersionPayload,
} from "@/lib/api/appversionApi";

interface AppVersionState {
  latest:       AppVersion | null;
  history:      AppVersion[];
  fetchStatus:  "idle" | "loading" | "succeeded" | "failed";
  uploadStatus: "idle" | "uploading" | "succeeded" | "failed";
  deleteStatus: "idle" | "loading" | "succeeded" | "failed";
  error:        string | null;
}

const initialState: AppVersionState = {
  latest:       null,
  history:      [],
  fetchStatus:  "idle",
  uploadStatus: "idle",
  deleteStatus: "idle",
  error:        null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ────────────────────────────────────────────────

export const fetchLatestVersion = createAsyncThunk(
  "appVersion/fetchLatest",
  async (_, { rejectWithValue }) => {
    try { return await getLatestAppVersion(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch latest app version")); }
  }
);

export const fetchAllVersions = createAsyncThunk(
  "appVersion/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllAppVersions(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch app versions")); }
  }
);

export const uploadVersionThunk = createAsyncThunk(
  "appVersion/upload",
  async (
    { payload, onProgress }: { payload: UploadAppVersionPayload; onProgress?: (pct: number) => void },
    { rejectWithValue }
  ) => {
    try { return await uploadAppVersion(payload, onProgress); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to upload app version")); }
  }
);

export const deleteVersionThunk = createAsyncThunk(
  "appVersion/delete",
  async (id: string, { rejectWithValue }) => {
    try { await deleteAppVersion(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete app version")); }
  }
);

// ── Slice ─────────────────────────────────────────────────

const appVersionSlice = createSlice({
  name: "appVersion",
  initialState,
  reducers: {
    resetUploadStatus: (state) => { state.uploadStatus = "idle"; },
  },
  extraReducers: (builder) => {
    // fetchLatestVersion
    builder
      .addCase(fetchLatestVersion.pending,   (state) => { state.error = null; })
      .addCase(fetchLatestVersion.fulfilled, (state, action) => { state.latest = action.payload; })
      .addCase(fetchLatestVersion.rejected,  (state, action) => { state.error = action.payload as string; });

    // fetchAllVersions
    builder
      .addCase(fetchAllVersions.pending,   (state) => { state.fetchStatus = "loading"; state.error = null; })
      .addCase(fetchAllVersions.fulfilled, (state, action) => { state.fetchStatus = "succeeded"; state.history = action.payload; })
      .addCase(fetchAllVersions.rejected,  (state, action) => { state.fetchStatus = "failed"; state.error = action.payload as string; });

    // uploadVersionThunk
    builder
      .addCase(uploadVersionThunk.pending,   (state) => { state.uploadStatus = "uploading"; state.error = null; })
      .addCase(uploadVersionThunk.fulfilled, (state, action) => {
        state.uploadStatus = "succeeded";
        state.history.unshift(action.payload);
        state.latest = action.payload;
      })
      .addCase(uploadVersionThunk.rejected,  (state, action) => {
        state.uploadStatus = "failed";
        state.error = action.payload as string;
      });

    // deleteVersionThunk
    builder
      .addCase(deleteVersionThunk.pending,   (state) => { state.deleteStatus = "loading"; state.error = null; })
      .addCase(deleteVersionThunk.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        state.history = state.history.filter((v) => v.id !== action.payload);
        if (state.latest?.id === action.payload) state.latest = null;
      })
      .addCase(deleteVersionThunk.rejected,  (state, action) => {
        state.deleteStatus = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetUploadStatus } = appVersionSlice.actions;
export default appVersionSlice.reducer;