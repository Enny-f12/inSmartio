import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getRecentActivity,
  getPendingAlerts,
  type RecentActivityItem,
  type PendingAlerts,
} from "@/lib/api/dashboardApi";

interface DashboardState {
  recentActivity:       RecentActivityItem[];
  recentActivityStatus: "idle" | "loading" | "succeeded" | "failed";
  pendingAlerts:        PendingAlerts | null;
  pendingAlertsStatus:  "idle" | "loading" | "succeeded" | "failed";
}

const initialState: DashboardState = {
  recentActivity:       [],
  recentActivityStatus: "idle",
  pendingAlerts:        null,
  pendingAlertsStatus:  "idle",
};

export const fetchRecentActivityThunk = createAsyncThunk(
  "dashboard/fetchRecentActivity",
  async (_, { rejectWithValue }) => {
    try {
      return await getRecentActivity();
    } catch {
      return rejectWithValue("failed");
    }
  }
);

export const fetchPendingAlertsThunk = createAsyncThunk(
  "dashboard/fetchPendingAlerts",
  async (_, { rejectWithValue }) => {
    try {
      return await getPendingAlerts();
    } catch {
      return rejectWithValue("failed");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentActivityThunk.pending,   (s) => { s.recentActivityStatus = "loading"; })
      .addCase(fetchRecentActivityThunk.fulfilled, (s, a) => {
        s.recentActivityStatus = "succeeded";
        s.recentActivity       = a.payload;
      })
      .addCase(fetchRecentActivityThunk.rejected,  (s) => { s.recentActivityStatus = "failed"; })

      .addCase(fetchPendingAlertsThunk.pending,   (s) => { s.pendingAlertsStatus = "loading"; })
      .addCase(fetchPendingAlertsThunk.fulfilled, (s, a) => {
        s.pendingAlertsStatus = "succeeded";
        s.pendingAlerts       = a.payload;
      })
      .addCase(fetchPendingAlertsThunk.rejected,  (s) => { s.pendingAlertsStatus = "failed"; });
  },
});

export default dashboardSlice.reducer;