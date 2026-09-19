import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getAllJobs, type ApiJob, type GetJobsParams } from "@/lib/api/jobApi";

interface JobsState {
  list: ApiJob[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  listError: string | null;
}

const initialState: JobsState = {
  list: [],
  total: 0,
  page: 1,
  limit: 10,
  pages: 0,
  listStatus: "idle",
  listError: null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

export const fetchJobs = createAsyncThunk(
  "jobs/fetchAll",
  async (params: GetJobsParams | undefined, { rejectWithValue }) => {
    try {
      return await getAllJobs(params);
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch jobs"));
    }
  }
);

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.listStatus = "loading";
        state.listError = null;
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.list = action.payload.jobs;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.pages = action.payload.pages;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.listStatus = "failed";
        state.listError = action.payload as string;
      });
  },
});

export default jobsSlice.reducer;