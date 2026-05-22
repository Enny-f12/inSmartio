// lib/redux/reportSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  fetchUserGrowth, fetchRevenueTrend, fetchTopServiceCategory, fetchTopCities,
  downloadReportPdf,
  type MonthlyUserGrowthItem, type RevenueTrendItem,
  type TopServiceCategoryData, type TopCityItem,
  type ReportQuery, type ApiReportType,
} from "@/lib/api/reportApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface ReportState {
  userGrowth:        MonthlyUserGrowthItem[];
  userGrowthStatus:  Status;

  revenueTrend:       RevenueTrendItem[];
  revenueTrendStatus: Status;

  topCategories:       TopServiceCategoryData | null;
  topCategoriesStatus: Status;

  topCities:       TopCityItem[];
  topCitiesStatus: Status;

  downloadStatus: Status;
  error:          string | null;
}

const initialState: ReportState = {
  userGrowth:          [],
  userGrowthStatus:    "idle",
  revenueTrend:        [],
  revenueTrendStatus:  "idle",
  topCategories:       null,
  topCategoriesStatus: "idle",
  topCities:           [],
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

// Downloads PDF and triggers browser download
export const downloadReportThunk = createAsyncThunk(
  "report/download",
  async ({ reportType, query, filename }: { reportType: ApiReportType; query: ReportQuery; filename: string }, { rejectWithValue }) => {
    try {
      const url = await downloadReportPdf(reportType, query);
      const a   = document.createElement("a");
      a.href    = url;
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
      .addCase(fetchUserGrowthThunk.pending,   (state) => { state.userGrowthStatus = "loading"; state.error = null; })
      .addCase(fetchUserGrowthThunk.fulfilled, (state, action) => { state.userGrowthStatus = "succeeded"; state.userGrowth = action.payload; })
      .addCase(fetchUserGrowthThunk.rejected,  (state, action) => { state.userGrowthStatus = "failed"; state.error = action.payload as string; });

    builder
      .addCase(fetchRevenueTrendThunk.pending,   (state) => { state.revenueTrendStatus = "loading"; state.error = null; })
      .addCase(fetchRevenueTrendThunk.fulfilled, (state, action) => { state.revenueTrendStatus = "succeeded"; state.revenueTrend = action.payload; })
      .addCase(fetchRevenueTrendThunk.rejected,  (state, action) => { state.revenueTrendStatus = "failed"; state.error = action.payload as string; });

    builder
      .addCase(fetchTopCategoriesThunk.pending,   (state) => { state.topCategoriesStatus = "loading"; state.error = null; })
      .addCase(fetchTopCategoriesThunk.fulfilled, (state, action) => { state.topCategoriesStatus = "succeeded"; state.topCategories = action.payload; })
      .addCase(fetchTopCategoriesThunk.rejected,  (state, action) => { state.topCategoriesStatus = "failed"; state.error = action.payload as string; });

    builder
      .addCase(fetchTopCitiesThunk.pending,   (state) => { state.topCitiesStatus = "loading"; state.error = null; })
      .addCase(fetchTopCitiesThunk.fulfilled, (state, action) => { state.topCitiesStatus = "succeeded"; state.topCities = action.payload; })
      .addCase(fetchTopCitiesThunk.rejected,  (state, action) => { state.topCitiesStatus = "failed"; state.error = action.payload as string; });

    builder
      .addCase(downloadReportThunk.pending,   (state) => { state.downloadStatus = "loading"; })
      .addCase(downloadReportThunk.fulfilled, (state) => { state.downloadStatus = "succeeded"; })
      .addCase(downloadReportThunk.rejected,  (state) => { state.downloadStatus = "failed"; });
  },
});

export const { resetReports } = reportSlice.actions;
export default reportSlice.reducer;