import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/api/axiosInstance";

export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// 1. Update state interface to track pagination metadata
interface WaitlistState {
  entries: WaitlistEntry[];
  loading: boolean;       // list fetch
  actionLoading: boolean; // delete / single fetch
  exportLoading: boolean; // CSV export
  error: string | null;
  // Pagination State
  page: number;
  limit: number;
  totalEntries: number;
  totalPages: number;
}

const initialState: WaitlistState = {
  entries: [],
  loading: false,
  actionLoading: false,
  exportLoading: false,
  error: null,
  page: 1,
  limit: 10,
  totalEntries: 0,
  totalPages: 1,
};

// Interface for what our paginated API endpoint returns
interface PaginatedResponse {
  data: WaitlistEntry[];
  meta: {
    page: number;
    limit: number;
    totalEntries: number;
    totalPages: number;
  };
}

// Interface for the thunk input arguments
interface FetchAllArgs {
  page: number;
  limit?: number;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { message?: string } | undefined)?.message ?? err.message ?? fallback;
  }
  return fallback;
}

// ── Thunks ────────────────────────────────────────────────────────────────────

// 2. Updated to accept { page, limit } arguments
export const fetchAllWaitlist = createAsyncThunk<PaginatedResponse, FetchAllArgs, { rejectValue: string }>(
  "waitlist/fetchAll",
  async ({ page, limit = 10 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/waitlist", {
        params: { page, limit },
      });
      
      // Normalizing format assuming your backend returns structured paginated data.
      // Adjust the fallback mapping below if your backend payload matches a different pattern.
      return {
        data: data.data ?? data.entries ?? [],
        meta: {
          page: data.meta?.page ?? page,
          limit: data.meta?.limit ?? limit,
          totalEntries: data.meta?.totalEntries ?? data.meta?.total ?? 0,
          totalPages: data.meta?.totalPages ?? 1,
        },
      };
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

export const exportWaitlist = createAsyncThunk<Blob, void, { rejectValue: string }>(
  "waitlist/export",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/waitlist/export", {
        responseType: "blob",
        headers: { Accept: "text/csv" },
      });
      return response.data as Blob;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err, "Failed to export waitlist entries."));
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
      // 3. Update fetchAll handlers to save paginated data structure
      .addCase(fetchAllWaitlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllWaitlist.fulfilled, (state, action: PayloadAction<PaginatedResponse>) => {
        state.loading = false;
        state.entries = action.payload.data;
        state.page = action.payload.meta.page;
        state.limit = action.payload.meta.limit;
        state.totalEntries = action.payload.meta.totalEntries;
        state.totalPages = action.payload.meta.totalPages;
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
        // Note: Depending on UI preference, deleting an item might mean you want to decrement totalEntries
        if (state.totalEntries > 0) state.totalEntries -= 1;
      })
      .addCase(deleteWaitlistEntry.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload ?? "Failed to remove waitlist entry.";
      })

      // export
      .addCase(exportWaitlist.pending, (state) => {
        state.exportLoading = true;
        state.error = null;
      })
      .addCase(exportWaitlist.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportWaitlist.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.payload ?? "Failed to export waitlist entries.";
      });
  },
});

export const { clearError } = waitlistSlice.actions;
export default waitlistSlice.reducer;