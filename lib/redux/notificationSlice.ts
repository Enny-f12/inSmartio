// lib/redux/notificationSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllTemplates,
  createTemplate,
  type ApiNotificationTemplate,
  type CreateTemplatePayload,
} from "@/lib/api/notificationApi";

interface NotificationState {
  templates:      ApiNotificationTemplate[];
  templateStatus: "idle" | "loading" | "succeeded" | "failed";
  templateError:  string | null;
  saveStatus:     "idle" | "loading" | "succeeded" | "failed";
  saveError:      string | null;
}

const initialState: NotificationState = {
  templates:      [],
  templateStatus: "idle",
  templateError:  null,
  saveStatus:     "idle",
  saveError:      null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// GET /api/notifications/templates
export const fetchTemplates = createAsyncThunk(
  "notifications/fetchTemplates",
  async (_, { rejectWithValue }) => {
    try { return await getAllTemplates(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch templates")); }
  }
);

// POST /api/notifications/templates/create
export const saveTemplate = createAsyncThunk(
  "notifications/saveTemplate",
  async (payload: CreateTemplatePayload, { rejectWithValue }) => {
    try { return await createTemplate(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to save template")); }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    resetSaveStatus: (state) => {
      state.saveStatus = "idle";
      state.saveError  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending,   (s) => { s.templateStatus = "loading"; s.templateError = null; })
      .addCase(fetchTemplates.fulfilled, (s, a) => { s.templateStatus = "succeeded"; s.templates = a.payload; })
      .addCase(fetchTemplates.rejected,  (s, a) => { s.templateStatus = "failed"; s.templateError = a.payload as string; });

    builder
      .addCase(saveTemplate.pending,   (s) => { s.saveStatus = "loading"; s.saveError = null; })
      .addCase(saveTemplate.fulfilled, (s, a) => {
        s.saveStatus = "succeeded";
        // Update the template in the list if it already exists, else add it
        const idx = s.templates.findIndex((t) => t.name === a.payload.name);
        if (idx !== -1) s.templates[idx] = a.payload;
        else s.templates.push(a.payload);
      })
      .addCase(saveTemplate.rejected,  (s, a) => { s.saveStatus = "failed"; s.saveError = a.payload as string; });
  },
});

export const { resetSaveStatus } = notificationSlice.actions;
export default notificationSlice.reducer;