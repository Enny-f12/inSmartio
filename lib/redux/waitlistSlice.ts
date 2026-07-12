import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/api/axiosInstance";

// ── Types ─────────────────────────────────────────────────────────────────────
// NOTE: field names assumed as { id, name, email, createdAt } — the Swagger
// "Example Value" for /api/waitlist wasn't expanded. Adjust this interface
// (and the two `data?.data ?? data` normalizations below) if the real
// response shape differs.

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface WaitlistState {
  entries: WaitlistEntry[];
  loading: boolean;       // list fetch
  actionLoading: boolean; // delete / single fetch
  error: string | null;
}

const initialState: WaitlistState = {
  entries: [],
  loading: false,
  actionLoading: false,
  error: null,
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message ?? err.message ?? fallback;
  }
  return fallback;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAllWaitlist = createAsyncThunk<WaitlistEntry[], void, { rejectValue: string }>(
  "waitlist/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/waitlist");
      // Some endpoints in this API return a raw array, others wrap in { data }.
      return Array.isArray(data) ? data : (data?.data ?? []);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load waitlist entries."));
    }
  }
);

export const fetchWaitlistById = createAsyncThunk<WaitlistEntry, string, { rejectValue: string }>(
  "waitlist/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/waitlist/${id}`);
      return data?.data ?? data;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to load that waitlist entry."));
    }
  }
);

export const deleteWaitlistEntry = createAsyncThunk<string, string, { rejectValue: string }>(
  "waitlist/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/waitlist/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to remove waitlist entry."));
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const waitlistSlice = createSlice({
  name: "waitlist",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchAllWaitlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWaitlist.fulfilled, (state, action: PayloadAction<WaitlistEntry[]>) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchAllWaitlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load waitlist entries.";
      })

      // fetchOne — patches a single entry into the list if it's already there
      .addCase(fetchWaitlistById.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(fetchWaitlistById.fulfilled, (state, action: PayloadAction<WaitlistEntry>) => {
        state.actionLoading = false;
        const idx = state.entries.findIndex((e) => e.id === action.payload.id);
        if (idx !== -1) state.entries[idx] = action.payload;
      })
      .addCase(fetchWaitlistById.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? "Failed to load that waitlist entry.";
      })

      // delete
      .addCase(deleteWaitlistEntry.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteWaitlistEntry.fulfilled, (state, action: PayloadAction<string>) => {
        state.actionLoading = false;
        state.entries = state.entries.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteWaitlistEntry.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? "Failed to remove waitlist entry.";
      });
  },
});

export const { clearError } = waitlistSlice.actions;
export default waitlistSlice.reducer;