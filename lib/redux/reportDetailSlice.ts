// lib/redux/reportDetailSlice.ts
//
// Drives the Reports feature (ReportPicker + each report screen + the
// dashboard) against the live endpoints in lib/api/detailedReportApi.ts.
//
// Named `reportDetail` (not `report`) because a `reportSlice` already exists
// in the store for other pages — this is a separate, new slice.
//
// Follows the same shape as lib/redux/adminSlice.ts: try/catch thunks with
// axios.isAxiosError error extraction, no extra hook layer — components
// dispatch these directly via useAppDispatch/useAppSelector.

import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getDetailedReport,
  downloadDetailedReport,
  getReportsDashboard,
  getReportTrend,
  type ReportType,
  type ReportFormat,
  type DetailedReportQuery,
  type ReportSummary,
  type DetailedReportPagination,
  type GetDashboardParams,
  type ReportsDashboardData,
  type GetReportTrendParams,
  type ReportTrendPoint,
} from "@/lib/api/detailedReportApi";

type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";

export type ReportDetailFilters = DetailedReportQuery;

interface ReportDetailState {
  reportType: ReportType;
  filters:    ReportDetailFilters;

  summary:    ReportSummary;
  rows:       Record<string, unknown>[];
  pagination: DetailedReportPagination | null;

  listStatus: AsyncStatus;
  listError:  string | null;

  downloadStatus: AsyncStatus;
  downloadError:  string | null;
  downloadUrl:    string | null;

  dashboard:       ReportsDashboardData | null;
  dashboardStatus: AsyncStatus;
  dashboardError:  string | null;

  trend:       ReportTrendPoint[];
  trendStatus: AsyncStatus;
  trendError:  string | null;
}

const DEFAULT_FILTERS: ReportDetailFilters = {
  page:  1,
  limit: 20,
};

const initialState: ReportDetailState = {
  reportType: "transactions",
  filters:    { ...DEFAULT_FILTERS },

  summary:    {},
  rows:       [],
  pagination: null,

  listStatus: "idle",
  listError:  null,

  downloadStatus: "idle",
  downloadError:  null,
  downloadUrl:    null,

  dashboard:       null,
  dashboardStatus: "idle",
  dashboardError:  null,

  trend:       [],
  trendStatus: "idle",
  trendError:  null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ────────────────────────────────────────────────

export const fetchDetailedReport = createAsyncThunk(
  "reportDetail/fetchDetailedReport",
  async (
    params: { reportType: ReportType } & Partial<ReportDetailFilters>,
    { rejectWithValue }
  ) => {
    try { return await getDetailedReport(params); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to load report")); }
  }
);

export const downloadReport = createAsyncThunk(
  "reportDetail/downloadReport",
  async (
    params: { reportType: ReportType; format: ReportFormat } & Partial<ReportDetailFilters>,
    { rejectWithValue }
  ) => {
    try { return await downloadDetailedReport(params); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to download report")); }
  }
);

export const fetchDashboard = createAsyncThunk(
  "reportDetail/fetchDashboard",
  async (params: GetDashboardParams, { rejectWithValue }) => {
    try { return await getReportsDashboard(params); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to load dashboard")); }
  }
);

export const fetchReportTrend = createAsyncThunk(
  "reportDetail/fetchReportTrend",
  async (params: GetReportTrendParams, { rejectWithValue }) => {
    try { return await getReportTrend(params); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to load trend")); }
  }
);

// ── Slice ─────────────────────────────────────────────────

const reportDetailSlice = createSlice({
  name: "reportDetail",
  initialState,
  reducers: {
    setReportType: (state, action: PayloadAction<ReportType>) => {
      state.reportType = action.payload;
      state.filters = { ...DEFAULT_FILTERS };
      state.summary = {};
      state.rows = [];
      state.pagination = null;
      state.listStatus = "idle";
      state.listError = null;
    },
    setFilters: (state, action: PayloadAction<Partial<ReportDetailFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.filters.page = action.payload;
    },
    resetFilters: (state) => {
      state.filters = { ...DEFAULT_FILTERS };
    },
    clearDownloadUrl: (state) => {
      if (state.downloadUrl) URL.revokeObjectURL(state.downloadUrl);
      state.downloadUrl = null;
      state.downloadStatus = "idle";
      state.downloadError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchDetailedReport
    builder
      .addCase(fetchDetailedReport.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchDetailedReport.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.summary = action.payload.summary ?? {};
        state.rows = (action.payload.rows ?? []) as Record<string, unknown>[];
        state.pagination = action.payload.pagination ?? null;
      })
      .addCase(fetchDetailedReport.rejected,  (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload as string;
      });

    // downloadReport
    builder
      .addCase(downloadReport.pending,   (state) => { state.downloadStatus = "loading"; state.downloadError = null; })
      .addCase(downloadReport.fulfilled, (state, action) => { state.downloadStatus = "succeeded"; state.downloadUrl = action.payload; })
      .addCase(downloadReport.rejected,  (state, action) => { state.downloadStatus = "failed"; state.downloadError = action.payload as string; });

    // fetchDashboard
    builder
      .addCase(fetchDashboard.pending,   (state) => { state.dashboardStatus = "loading"; state.dashboardError = null; })
      .addCase(fetchDashboard.fulfilled, (state, action) => { state.dashboardStatus = "succeeded"; state.dashboard = action.payload; })
      .addCase(fetchDashboard.rejected,  (state, action) => { state.dashboardStatus = "failed"; state.dashboardError = action.payload as string; });

    // fetchReportTrend
    builder
      .addCase(fetchReportTrend.pending,   (state) => { state.trendStatus = "loading"; state.trendError = null; })
      .addCase(fetchReportTrend.fulfilled, (state, action) => { state.trendStatus = "succeeded"; state.trend = action.payload; })
      .addCase(fetchReportTrend.rejected,  (state, action) => { state.trendStatus = "failed"; state.trendError = action.payload as string; });
  },
});

export const {
  setReportType,
  setFilters,
  setPage,
  resetFilters,
  clearDownloadUrl,
} = reportDetailSlice.actions;

export default reportDetailSlice.reducer;