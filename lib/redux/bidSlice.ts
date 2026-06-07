import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { bidService } from "@/lib/api/bidApi";
import {
  MOCK_BIDS_RESPONSE,
  MOCK_KPI,
} from "@/components/bid/MockData";
import type {
  Bid,
  BidFilters,
  BidKPISummary,
  PaginatedResponse,
} from "@/components/bid/types";

// ─── Client-side filter helper (used when API is not ready) ───────────────────

function applyFilters(filters: BidFilters): PaginatedResponse<Bid> {
  let data = [...MOCK_BIDS_RESPONSE.data];

  // Step filter
  if (filters.step && filters.step !== "all") {
    data = data.filter((b) => String(b.step) === String(filters.step));
  }

  // Search — ID, jobId, expert name, client name
  if (filters.search && filters.search.trim() !== "") {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        b.jobId.toLowerCase().includes(q) ||
        b.expert.name.toLowerCase().includes(q) ||
        b.client.name.toLowerCase().includes(q)
    );
  }

  // Pagination
  const page       = filters.page  ?? 1;
  const limit      = filters.limit ?? 20;
  const total      = data.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated  = data.slice((page - 1) * limit, page * limit);

  return { data: paginated, total, page, limit, totalPages };
}

// ─── State ────────────────────────────────────────────────────────────────────

interface BidsState {
  bids: Bid[];
  total: number;
  page: number;
  totalPages: number;
  filters: BidFilters;
  listLoading: boolean;
  listError: string | null;

  kpi: BidKPISummary | null;
  kpiLoading: boolean;
  kpiError: string | null;

  selectedBid: Bid | null;
  detailLoading: boolean;
  detailError: string | null;

  flagging: boolean;
  flagError: string | null;
}

const initialState: BidsState = {
  bids: [],
  total: 0,
  page: 1,
  totalPages: 1,
  filters: { step: "all", status: "all", search: "", page: 1, limit: 20 },
  listLoading: false,
  listError: null,

  kpi: null,
  kpiLoading: false,
  kpiError: null,

  selectedBid: null,
  detailLoading: false,
  detailError: null,

  flagging: false,
  flagError: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchBids = createAsyncThunk(
  "bids/fetchBids",
  async (filters: BidFilters) => {
    try {
      return await bidService.getBids(filters);
    } catch {
      return applyFilters(filters);
    }
  }
);

export const fetchBidKPISummary = createAsyncThunk(
  "bids/fetchKPI",
  async () => {
    try {
      return await bidService.getKPISummary();
    } catch {
      return MOCK_KPI;
    }
  }
);

export const fetchBidDetail = createAsyncThunk(
  "bids/fetchDetail",
  async (bidId: string, { rejectWithValue }) => {
    try {
      return await bidService.getBidDetail(bidId);
    } catch {
      const found = MOCK_BIDS_RESPONSE.data.find((b) => b.id === bidId);
      if (found) return found;
      return rejectWithValue("Bid not found");
    }
  }
);

export const flagBidThunk = createAsyncThunk(
  "bids/flagBid",
  async (
    { bidId, reason, priority }: { bidId: string; reason: string; priority: "HIGH" | "MEDIUM" | "LOW" },
    { rejectWithValue }
  ) => {
    try {
      await bidService.flagBid(bidId, reason, priority);
      return bidId;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message ?? "Failed to flag bid");
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const bidsSlice = createSlice({
  name: "bids",
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<Partial<BidFilters>>) {
      state.filters = { ...state.filters, ...action.payload, page: 1 };
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload;
      state.page = action.payload;
    },
    clearSelectedBid(state) {
      state.selectedBid = null;
      state.detailError = null;
    },
    clearBidErrors(state) {
      state.listError = null;
      state.detailError = null;
      state.flagError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBids.pending, (state) => { state.listLoading = true; state.listError = null; })
      .addCase(fetchBids.fulfilled, (state, action: PayloadAction<PaginatedResponse<Bid>>) => {
        state.listLoading = false;
        state.bids       = action.payload.data;
        state.total      = action.payload.total;
        state.page       = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchBids.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      });

    builder
      .addCase(fetchBidKPISummary.pending, (state) => { state.kpiLoading = true; state.kpiError = null; })
      .addCase(fetchBidKPISummary.fulfilled, (state, action: PayloadAction<BidKPISummary>) => {
        state.kpiLoading = false;
        state.kpi = action.payload;
      })
      .addCase(fetchBidKPISummary.rejected, (state, action) => {
        state.kpiLoading = false;
        state.kpiError = action.payload as string;
      });

    builder
      .addCase(fetchBidDetail.pending, (state) => { state.detailLoading = true; state.detailError = null; })
      .addCase(fetchBidDetail.fulfilled, (state, action: PayloadAction<Bid>) => {
        state.detailLoading = false;
        state.selectedBid = action.payload;
      })
      .addCase(fetchBidDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload as string;
      });

    builder
      .addCase(flagBidThunk.pending, (state) => { state.flagging = true; state.flagError = null; })
      .addCase(flagBidThunk.fulfilled, (state) => { state.flagging = false; })
      .addCase(flagBidThunk.rejected, (state, action) => {
        state.flagging = false;
        state.flagError = action.payload as string;
      });
  },
});

export const { setFilters, setPage, clearSelectedBid, clearBidErrors } = bidsSlice.actions;
export default bidsSlice.reducer;