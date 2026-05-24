// lib/redux/reportSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  fetchUserGrowth, fetchRevenueTrend, fetchTopServiceCategory, fetchTopCities,
  downloadReport,
  type MonthlyUserGrowthItem, type RevenueTrendItem,
  type TopServiceCategoryData, type TopCitiesData,
  type ReportQuery, type DownloadReportPayload,
} from "@/lib/api/reportApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface ReportState {
  userGrowth:          MonthlyUserGrowthItem[];
  userGrowthStatus:    Status;
  revenueTrend:        RevenueTrendItem[];
  revenueTrendStatus:  Status;
  topCategories:       TopServiceCategoryData | null;
  topCategoriesStatus: Status;
  topCitiesData:       TopCitiesData | null;
  topCitiesStatus:     Status;
  downloadStatus:      Status;
  error:               string | null;
}

const initialState: ReportState = {
  userGrowth:          [],
  userGrowthStatus:    "idle",
  revenueTrend:        [],
  revenueTrendStatus:  "idle",
  topCategories:       null,
  topCategoriesStatus: "idle",
  topCitiesData:       null,
  topCitiesStatus:     "idle",
  downloadStatus:      "idle",
  error:               null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

export const fetchUserGrowthThunk = createAsyncThunk(
  "report/userGrowth",
  async (q: ReportQuery, { rejectWithValue }) => {
    try { return await fetchUserGrowth(q); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch user growth")); }
  }
);

export const fetchRevenueTrendThunk = createAsyncThunk(
  "report/revenueTrend",
  async (q: ReportQuery, { rejectWithValue }) => {
    try { return await fetchRevenueTrend(q); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch revenue trend")); }
  }
);

export const fetchTopCategoriesThunk = createAsyncThunk(
  "report/topCategories",
  async (q: ReportQuery, { rejectWithValue }) => {
    try { return await fetchTopServiceCategory(q); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch top categories")); }
  }
);

export const fetchTopCitiesThunk = createAsyncThunk(
  "report/topCities",
  async (q: ReportQuery, { rejectWithValue }) => {
    try { return await fetchTopCities(q); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch top cities")); }
  }
);

// POST /report/download — body: { reportType, type, fromDate, toDate }
export const downloadReportThunk = createAsyncThunk(
  "report/download",
  async (
    { payload, filename }: { payload: DownloadReportPayload; filename: string },
    { rejectWithValue }
  ) => {
    try {
      const url  = await downloadReport(payload);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to download report"));
    }
  }
);

const reportSlice = createSlice({
  name: "report",
  initialState,
  reducers: {
    resetReports: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserGrowthThunk.pending,   (s) => { s.userGrowthStatus = "loading"; s.error = null; })
      .addCase(fetchUserGrowthThunk.fulfilled, (s, a) => { s.userGrowthStatus = "succeeded"; s.userGrowth = a.payload; })
      .addCase(fetchUserGrowthThunk.rejected,  (s, a) => { s.userGrowthStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(fetchRevenueTrendThunk.pending,   (s) => { s.revenueTrendStatus = "loading"; s.error = null; })
      .addCase(fetchRevenueTrendThunk.fulfilled, (s, a) => { s.revenueTrendStatus = "succeeded"; s.revenueTrend = a.payload; })
      .addCase(fetchRevenueTrendThunk.rejected,  (s, a) => { s.revenueTrendStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(fetchTopCategoriesThunk.pending,   (s) => { s.topCategoriesStatus = "loading"; s.error = null; })
      .addCase(fetchTopCategoriesThunk.fulfilled, (s, a) => { s.topCategoriesStatus = "succeeded"; s.topCategories = a.payload; })
      .addCase(fetchTopCategoriesThunk.rejected,  (s, a) => { s.topCategoriesStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(fetchTopCitiesThunk.pending,   (s) => { s.topCitiesStatus = "loading"; s.error = null; })
      .addCase(fetchTopCitiesThunk.fulfilled, (s, a) => { s.topCitiesStatus = "succeeded"; s.topCitiesData = a.payload; })
      .addCase(fetchTopCitiesThunk.rejected,  (s, a) => { s.topCitiesStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(downloadReportThunk.pending,   (s) => { s.downloadStatus = "loading"; })
      .addCase(downloadReportThunk.fulfilled, (s) => { s.downloadStatus = "succeeded"; })
      .addCase(downloadReportThunk.rejected,  (s) => { s.downloadStatus = "failed"; });
  },
});

export const { resetReports } = reportSlice.actions;
export default reportSlice.reducer;