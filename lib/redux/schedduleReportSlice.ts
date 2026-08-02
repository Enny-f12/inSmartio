import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  type ScheduledReport,
  type ScheduledReportPayload,
} from "@/lib/api/scheduledReportApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface ScheduledReportsState {
  list:   ScheduledReport[];
  status: Status;
  error:  string | null;
}

const initialState: ScheduledReportsState = {
  list:   [],
  status: "idle",
  error:  null,
};

export const fetchScheduledReportsThunk = createAsyncThunk(
  "scheduledReports/fetch",
  async (_, { rejectWithValue }) => {
    try { return await getScheduledReports(); }
    catch { return rejectWithValue("Failed to fetch scheduled reports"); }
  }
);

export const createScheduledReportThunk = createAsyncThunk(
  "scheduledReports/create",
  async (payload: ScheduledReportPayload, { rejectWithValue }) => {
    try { return await createScheduledReport(payload); }
    catch { return rejectWithValue("Failed to create scheduled report"); }
  }
);

export const updateScheduledReportThunk = createAsyncThunk(
  "scheduledReports/update",
  async (
    { id, payload }: { id: string; payload: Partial<ScheduledReportPayload> },
    { rejectWithValue }
  ) => {
    try { return await updateScheduledReport(id, payload); }
    catch { return rejectWithValue("Failed to update scheduled report"); }
  }
);

export const deleteScheduledReportThunk = createAsyncThunk(
  "scheduledReports/delete",
  async (id: string, { rejectWithValue }) => {
    try { await deleteScheduledReport(id); return id; }
    catch { return rejectWithValue("Failed to delete scheduled report"); }
  }
);

const scheduledReportsSlice = createSlice({
  name: "scheduledReports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchScheduledReportsThunk.pending,   (s) => { s.status = "loading"; s.error = null; })
      .addCase(fetchScheduledReportsThunk.fulfilled, (s, a) => { s.status = "succeeded"; s.list = a.payload; })
      .addCase(fetchScheduledReportsThunk.rejected,  (s, a) => { s.status = "failed"; s.error = a.payload as string; })

      .addCase(createScheduledReportThunk.fulfilled, (s, a) => { s.list.push(a.payload); })

      .addCase(updateScheduledReportThunk.fulfilled, (s, a) => {
        const idx = s.list.findIndex((r) => r.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })

      .addCase(deleteScheduledReportThunk.fulfilled, (s, a) => {
        s.list = s.list.filter((r) => r.id !== a.payload);
      });
  },
});

export default scheduledReportsSlice.reducer;