// lib/redux/bannerSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllBanners, createBanner, updateBanner, deleteBanner, recordBannerClick,
  type ApiBanner, type CreateBannerPayload, type UpdateBannerPayload,
} from "@/lib/api/bannerApi";

interface BannerState {
  list:         ApiBanner[];
  listStatus:   "idle" | "loading" | "succeeded" | "failed";
  listError:    string | null;
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: BannerState = {
  list:         [],
  listStatus:   "idle",
  listError:    null,
  mutateStatus: "idle",
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

export const fetchBanners = createAsyncThunk(
  "banners/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllBanners(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch banners")); }
  }
);

export const addBanner = createAsyncThunk(
  "banners/add",
  // Allow Blob in image so the file passes through to the API untouched
  async (payload: Omit<CreateBannerPayload, "image"> & { image: string | Blob }, { rejectWithValue }) => {
    try { return await createBanner(payload as CreateBannerPayload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to create banner")); }
  }
);

export const editBanner = createAsyncThunk(
  "banners/edit",
  async ({ id, payload }: { id: string; payload: UpdateBannerPayload }, { rejectWithValue }) => {
    try { return await updateBanner(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update banner")); }
  }
);

export const removeBanner = createAsyncThunk(
  "banners/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteBanner(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete banner")); }
  }
);

export const clickBanner = createAsyncThunk(
  "banners/click",
  async (id: string, { rejectWithValue }) => {
    try { return await recordBannerClick(id); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to record click")); }
  }
);

const bannerSlice = createSlice({
  name: "banners",
  initialState,
  reducers: {
    resetMutateStatus: (state) => { state.mutateStatus = "idle"; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchBanners.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchBanners.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(addBanner.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(addBanner.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; state.list.unshift(action.payload); })
      .addCase(addBanner.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(editBanner.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(editBanner.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(editBanner.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(removeBanner.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(removeBanner.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((b) => b.id !== action.payload);
      })
      .addCase(removeBanner.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(clickBanner.fulfilled, (state, action) => {
        const idx = state.list.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export const { resetMutateStatus } = bannerSlice.actions;
export default bannerSlice.reducer;