// lib/redux/announcementSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllAnnouncements, getAnnouncementById,
  createAnnouncement, updateAnnouncement, deleteAnnouncement,
  type ApiAnnouncement, type CreateAnnouncementPayload, type UpdateAnnouncementPayload,
} from "@/lib/api/announcementApi";

interface AnnouncementState {
  list:           ApiAnnouncement[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiAnnouncement | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
}

const initialState: AnnouncementState = {
  list:           [],
  listStatus:     "idle",
  listError:      null,
  selected:       null,
  selectedStatus: "idle",
  mutateStatus:   "idle",
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

export const fetchAnnouncements = createAsyncThunk(
  "announcements/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllAnnouncements(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch announcements")); }
  }
);

export const fetchAnnouncementById = createAsyncThunk(
  "announcements/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getAnnouncementById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch announcement")); }
  }
);

export const addAnnouncement = createAsyncThunk(
  "announcements/add",
  async (payload: CreateAnnouncementPayload, { rejectWithValue }) => {
    try { return await createAnnouncement(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to create announcement")); }
  }
);

export const editAnnouncement = createAsyncThunk(
  "announcements/edit",
  async ({ id, payload }: { id: string; payload: UpdateAnnouncementPayload }, { rejectWithValue }) => {
    try { return await updateAnnouncement(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update announcement")); }
  }
);

export const removeAnnouncement = createAsyncThunk(
  "announcements/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteAnnouncement(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete announcement")); }
  }
);

const announcementSlice = createSlice({
  name: "announcements",
  initialState,
  reducers: {
    clearSelectedAnnouncement: (state) => {
      state.selected       = null;
      state.selectedStatus = "idle";
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchAnnouncements.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(fetchAnnouncementById.pending,   (state) => { state.selectedStatus = "loading"; })
      .addCase(fetchAnnouncementById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchAnnouncementById.rejected,  (state) => { state.selectedStatus = "failed"; });

    builder
      .addCase(addAnnouncement.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(addAnnouncement.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list.unshift(action.payload);
      })
      .addCase(addAnnouncement.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(editAnnouncement.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(editAnnouncement.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(editAnnouncement.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(removeAnnouncement.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(removeAnnouncement.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((a) => a.id !== action.payload);
      })
      .addCase(removeAnnouncement.rejected,  (state) => { state.mutateStatus = "failed"; });
  },
});

export const { clearSelectedAnnouncement, resetMutateStatus } = announcementSlice.actions;
export default announcementSlice.reducer;