import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getAllJobs, getJobById, type ApiJob } from "@/lib/api/jobApi";

interface JobsState {
  list: ApiJob[];
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  listError: string | null;
  selected: ApiJob | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: JobsState = {
  list: [],
  listStatus: "idle",
  listError: null,
  selected: null,
  selectedStatus: "idle",
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

export const fetchJobs = createAsyncThunk(
  "jobs/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllJobs(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch jobs")); }
  }
);

export const fetchJobById = createAsyncThunk(
  "jobs/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getJobById(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch job")); }
  }
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    clearSelectedJob: (state) => {
      state.selected = null;
      state.selectedStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchJobs.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchJobs.rejected, (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(fetchJobById.pending, (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchJobById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchJobById.rejected, (state) => { state.selectedStatus = "failed"; });
  },
});

export const { clearSelectedJob } = jobsSlice.actions;
export default jobsSlice.reducer;