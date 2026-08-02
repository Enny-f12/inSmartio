// lib/redux/auditlogSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAuditLogs, getRecentAuditLogs, getAuditLogStats, exportAuditLogs,
  type AuditLog, type AuditLogPagination, type AuditLogStats, type AuditLogsParams,
} from "@/lib/api/auditlogApi";

// ── State ────────────────────────

interface AuditLogsState {
  logs:           AuditLog[];
  pagination:     AuditLogPagination | null;
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  recentLogs:     AuditLog[];
  recentStatus:   "idle" | "loading" | "succeeded" | "failed";
  stats:          AuditLogStats | null;
  statsStatus:    "idle" | "loading" | "succeeded" | "failed";
  exportStatus:   "idle" | "loading" | "succeeded" | "failed";
  activeFilters:  AuditLogsParams;
}

const initialFilters: AuditLogsParams = {
  page: 1, limit: 20, action: "", adminId: "", fromDate: "", toDate: "", search: "",
};

const initialState: AuditLogsState = {
  logs:          [],
  pagination:    null,
  listStatus:    "idle",
  listError:     null,
  recentLogs:    [],
  recentStatus:  "idle",
  stats:         null,
  statsStatus:   "idle",
  exportStatus:  "idle",
  activeFilters: initialFilters,
};

// ── Helpers ───────────────────────────────────────────────

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? (err.response?.data?.message ?? fallback) : fallback;

// ── Thunks ────────────────────────────────────────────────

export const fetchAuditLogs = createAsyncThunk(
  "auditLogs/fetchAll",
  async (params: AuditLogsParams, { rejectWithValue }) => {
    try { return await getAuditLogs(params); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch audit logs")); }
  },
);

export const fetchRecentAuditLogs = createAsyncThunk(
  "auditLogs/fetchRecent",
  async (_, { rejectWithValue }) => {
    try { return await getRecentAuditLogs(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch recent logs")); }
  },
);

export const fetchAuditLogStats = createAsyncThunk(
  "auditLogs/fetchStats",
  async (_, { rejectWithValue }) => {
    try { return await getAuditLogStats(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch audit stats")); }
  },
);

export const exportAuditLogsThunk = createAsyncThunk(
  "auditLogs/export",
  async (params: AuditLogsParams & { format: "csv" | "pdf" }, { rejectWithValue }) => {
    try { return await exportAuditLogs(params); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to export audit logs")); }
  },
);

// ── Slice ─────────────────────────────────────────────────

const auditLogsSlice = createSlice({
  name: "auditLogs",
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.activeFilters = { ...state.activeFilters, ...action.payload, page: 1 };
    },
    setPage: (state, action) => {
      state.activeFilters.page = action.payload;
    },
    resetFilters: (state) => {
      state.activeFilters = initialFilters;
    },
    resetExportStatus: (state) => {
      state.exportStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    // ── fetchAuditLogs ──────────────────────────────────
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.listStatus = "loading";
        state.listError  = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.listStatus = "succeeded";

        // FIX: API may return data: null or a different shape — guard every field
        const payload = action.payload;
        state.logs       = payload?.logs       ?? [];
        state.pagination = payload?.pagination ?? null;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError  = action.payload as string;
        state.logs       = [];       // clear stale data on error
        state.pagination = null;
      });

    // ── fetchRecentAuditLogs ────────────────────────────
    builder
      .addCase(fetchRecentAuditLogs.pending,   (state) => { state.recentStatus = "loading"; })
      .addCase(fetchRecentAuditLogs.fulfilled, (state, action) => {
        state.recentStatus = "succeeded";
        state.recentLogs   = action.payload ?? [];
      })
      .addCase(fetchRecentAuditLogs.rejected,  (state) => { state.recentStatus = "failed"; });

    // ── fetchAuditLogStats ──────────────────────────────
    builder
      .addCase(fetchAuditLogStats.pending,   (state) => { state.statsStatus = "loading"; })
      .addCase(fetchAuditLogStats.fulfilled, (state, action) => {
        state.statsStatus = "succeeded";
        state.stats       = action.payload ?? null;
      })
      .addCase(fetchAuditLogStats.rejected,  (state) => { state.statsStatus = "failed"; });

    // ── exportAuditLogsThunk ────────────────────────────
    builder
      .addCase(exportAuditLogsThunk.pending,   (state) => { state.exportStatus = "loading"; })
      .addCase(exportAuditLogsThunk.fulfilled, (state) => { state.exportStatus = "succeeded"; })
      .addCase(exportAuditLogsThunk.rejected,  (state) => { state.exportStatus = "failed"; });
  },
});

export const { setFilters, setPage, resetFilters, resetExportStatus } = auditLogsSlice.actions;
export default auditLogsSlice.reducer;