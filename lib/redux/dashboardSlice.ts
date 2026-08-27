import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getRecentActivity,
  getAlerts,
  type RecentActivityItem,
  type AlertsSummary,
} from "@/lib/api/dashboardApi";

interface DashboardState {
  recentActivity:       RecentActivityItem[];
  recentActivityStatus: "idle" | "loading" | "succeeded" | "failed";
  alerts:                AlertsSummary | null;
  alertsStatus:          "idle" | "loading" | "succeeded" | "failed";
}

const initialState: DashboardState = {
  recentActivity:       [],
  recentActivityStatus: "idle",
  alerts:                null,
  alertsStatus:          "idle",
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

export const fetchAlertsThunk = createAsyncThunk(
  "dashboard/fetchAlerts",
  async (_, { rejectWithValue }) => {
    try {
      return await getAlerts();
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

      .addCase(fetchAlertsThunk.pending,   (s) => { s.alertsStatus = "loading"; })
      .addCase(fetchAlertsThunk.fulfilled, (s, a) => {
        s.alertsStatus = "succeeded";
        s.alerts       = a.payload;
      })
      .addCase(fetchAlertsThunk.rejected,  (s) => { s.alertsStatus = "failed"; });
  },
});

export default dashboardSlice.reducer;