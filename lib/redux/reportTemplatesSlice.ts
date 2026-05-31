import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getReportTemplates, createReportTemplate,
  updateReportTemplate, deleteReportTemplate,
  type ReportTemplate, type ReportTemplatePayload,
} from "@/lib/api/reportTemplateApi";

type Status = "idle" | "loading" | "succeeded" | "failed";

interface ReportTemplatesState {
  list:   ReportTemplate[];
  status: Status;
  error:  string | null;
}

const initialState: ReportTemplatesState = {
  list:   [],
  status: "idle",
  error:  null,
};

export const fetchReportTemplatesThunk = createAsyncThunk(
  "reportTemplates/fetch",
  async (_, { rejectWithValue }) => {
    try { return await getReportTemplates(); }
    catch { return rejectWithValue("Failed to fetch report templates"); }
  }
);

export const createReportTemplateThunk = createAsyncThunk(
  "reportTemplates/create",
  async (payload: ReportTemplatePayload, { rejectWithValue }) => {
    try { return await createReportTemplate(payload); }
    catch { return rejectWithValue("Failed to create report template"); }
  }
);

export const updateReportTemplateThunk = createAsyncThunk(
  "reportTemplates/update",
  async ({ id, payload }: { id: string; payload: Partial<ReportTemplatePayload> }, { rejectWithValue }) => {
    try { return await updateReportTemplate(id, payload); }
    catch { return rejectWithValue("Failed to update report template"); }
  }
);

export const deleteReportTemplateThunk = createAsyncThunk(
  "reportTemplates/delete",
  async (id: string, { rejectWithValue }) => {
    try { await deleteReportTemplate(id); return id; }
    catch { return rejectWithValue("Failed to delete report template"); }
  }
);

const reportTemplatesSlice = createSlice({
  name: "reportTemplates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportTemplatesThunk.pending,   (s) => { s.status = "loading"; s.error = null; })
      .addCase(fetchReportTemplatesThunk.fulfilled, (s, a) => { s.status = "succeeded"; s.list = a.payload; })
      .addCase(fetchReportTemplatesThunk.rejected,  (s, a) => { s.status = "failed"; s.error = a.payload as string; })

      .addCase(createReportTemplateThunk.fulfilled, (s, a) => { s.list.push(a.payload); })

      .addCase(updateReportTemplateThunk.fulfilled, (s, a) => {
        const idx = s.list.findIndex((t) => t.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })

      .addCase(deleteReportTemplateThunk.fulfilled, (s, a) => {
        s.list = s.list.filter((t) => t.id !== a.payload);
      });
  },
});

export default reportTemplatesSlice.reducer;