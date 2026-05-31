// lib/redux/reportSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  fetchUserGrowth, fetchRevenueTrend, fetchTopServiceCategory, fetchTopCities,
  fetchTasPerformance, fetchExpertPerformance,
  fetchJobCompletion, fetchDisputeAnalysis,
  downloadReport,
  type MonthlyUserGrowthItem, type RevenueTrendItem,
  type TopServiceCategoryData, type TopCitiesData,
  type TasPerformanceItem, type ExpertPerformanceItem,
  type JobCompletionData, type DisputeAnalysisData,
  type ReportQuery, type DownloadReportPayload,
} from "@/lib/api/reportApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface ReportState {
  userGrowth:               MonthlyUserGrowthItem[];
  userGrowthStatus:         Status;
  revenueTrend:             RevenueTrendItem[];
  revenueTrendStatus:       Status;
  topCategories:            TopServiceCategoryData | null;
  topCategoriesStatus:      Status;
  topCitiesData:            TopCitiesData | null;
  topCitiesStatus:          Status;
  tasPerformance:           TasPerformanceItem[];
  tasPerformanceStatus:     Status;
  expertPerformance:        ExpertPerformanceItem[];
  expertPerformanceStatus:  Status;
  jobCompletion:            JobCompletionData | null;
  jobCompletionStatus:      Status;
  disputeAnalysis:          DisputeAnalysisData | null;
  disputeAnalysisStatus:    Status;
  downloadStatus:           Status;
  error:                    string | null;
}

const initialState: ReportState = {
  userGrowth:               [],
  userGrowthStatus:         "idle",
  revenueTrend:             [],
  revenueTrendStatus:       "idle",
  topCategories:            null,
  topCategoriesStatus:      "idle",
  topCitiesData:            null,
  topCitiesStatus:          "idle",
  tasPerformance:           [],
  tasPerformanceStatus:     "idle",
  expertPerformance:        [],
  expertPerformanceStatus:  "idle",
  jobCompletion:            null,
  jobCompletionStatus:      "idle",
  disputeAnalysis:          null,
  disputeAnalysisStatus:    "idle",
  downloadStatus:           "idle",
  error:                    null,
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

export const fetchTasPerformanceThunk = createAsyncThunk(
  "report/tasPerformance",
  async ({ limit }: { limit?: number }, { rejectWithValue }) => {
    try { return await fetchTasPerformance(limit); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch TAS performance")); }
  }
);

export const fetchExpertPerformanceThunk = createAsyncThunk(
  "report/expertPerformance",
  async ({ limit }: { limit?: number }, { rejectWithValue }) => {
    try { return await fetchExpertPerformance(limit); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch expert performance")); }
  }
);

export const fetchJobCompletionThunk = createAsyncThunk(
  "report/jobCompletion",
  async (q: ReportQuery, { rejectWithValue }) => {
    try { return await fetchJobCompletion(q); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch job completion")); }
  }
);

export const fetchDisputeAnalysisThunk = createAsyncThunk(
  "report/disputeAnalysis",
  async (q: ReportQuery, { rejectWithValue }) => {
    try { return await fetchDisputeAnalysis(q); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch dispute analysis")); }
  }
);

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
      .addCase(fetchTasPerformanceThunk.pending,   (s) => { s.tasPerformanceStatus = "loading"; s.error = null; })
      .addCase(fetchTasPerformanceThunk.fulfilled, (s, a) => { s.tasPerformanceStatus = "succeeded"; s.tasPerformance = a.payload; })
      .addCase(fetchTasPerformanceThunk.rejected,  (s, a) => { s.tasPerformanceStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(fetchExpertPerformanceThunk.pending,   (s) => { s.expertPerformanceStatus = "loading"; s.error = null; })
      .addCase(fetchExpertPerformanceThunk.fulfilled, (s, a) => { s.expertPerformanceStatus = "succeeded"; s.expertPerformance = a.payload; })
      .addCase(fetchExpertPerformanceThunk.rejected,  (s, a) => { s.expertPerformanceStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(fetchJobCompletionThunk.pending,   (s) => { s.jobCompletionStatus = "loading"; s.error = null; })
      .addCase(fetchJobCompletionThunk.fulfilled, (s, a) => { s.jobCompletionStatus = "succeeded"; s.jobCompletion = a.payload; })
      .addCase(fetchJobCompletionThunk.rejected,  (s, a) => { s.jobCompletionStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(fetchDisputeAnalysisThunk.pending,   (s) => { s.disputeAnalysisStatus = "loading"; s.error = null; })
      .addCase(fetchDisputeAnalysisThunk.fulfilled, (s, a) => { s.disputeAnalysisStatus = "succeeded"; s.disputeAnalysis = a.payload; })
      .addCase(fetchDisputeAnalysisThunk.rejected,  (s, a) => { s.disputeAnalysisStatus = "failed"; s.error = a.payload as string; });

    builder
      .addCase(downloadReportThunk.pending,   (s) => { s.downloadStatus = "loading"; })
      .addCase(downloadReportThunk.fulfilled, (s) => { s.downloadStatus = "succeeded"; })
      .addCase(downloadReportThunk.rejected,  (s) => { s.downloadStatus = "failed"; });
  },
});

export const { resetReports } = reportSlice.actions;
export default reportSlice.reducer;