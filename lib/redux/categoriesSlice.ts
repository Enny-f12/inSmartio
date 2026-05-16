import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllCategories, createCategory, updateCategory,
  deleteCategory, uploadManyCategories,
  type ApiCategory, type CreateCategoryPayload, type UpdateCategoryPayload,
} from "@/lib/api/categoriesApi";

interface CategoriesState {
  list: ApiCategory[];
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  listError: string | null;
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateError: string | null;
}

const initialState: CategoriesState = {
  list: [],
  listStatus: "idle",
  listError: null,
  mutateStatus: "idle",
  mutateError: null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ──────────────────────────────────────────────────

export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllCategories(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch categories")); }
  }
);

export const addCategory = createAsyncThunk(
  "categories/add",
  async (payload: CreateCategoryPayload, { rejectWithValue }) => {
    try { return await createCategory(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to create category")); }
  }
);

export const editCategory = createAsyncThunk(
  "categories/edit",
  async ({ id, payload }: { id: string; payload: UpdateCategoryPayload }, { rejectWithValue }) => {
    try { return await updateCategory(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update category")); }
  }
);

export const removeCategory = createAsyncThunk(
  "categories/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteCategory(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete category")); }
  }
);

export const bulkUploadCategories = createAsyncThunk(
  "categories/bulkUpload",
  async (file: File, { rejectWithValue }) => {
    try { return await uploadManyCategories(file); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to upload categories")); }
  }
);

// ── Slice ────────────────────────────────────────────────────

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchCategories
    builder
      .addCase(fetchCategories.pending, (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchCategories.rejected, (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // addCategory
    builder
      .addCase(addCategory.pending, (state) => { state.mutateStatus = "loading"; })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list.unshift(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    // editCategory
    builder
      .addCase(editCategory.pending, (state) => { state.mutateStatus = "loading"; })
      .addCase(editCategory.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((c) => c.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(editCategory.rejected, (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    // removeCategory
    builder
      .addCase(removeCategory.pending, (state) => { state.mutateStatus = "loading"; })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((c) => c.id !== action.payload);
      })
      .addCase(removeCategory.rejected, (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });

    // bulkUploadCategories
    builder
      .addCase(bulkUploadCategories.pending, (state) => { state.mutateStatus = "loading"; })
      .addCase(bulkUploadCategories.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = [...action.payload, ...state.list];
      })
      .addCase(bulkUploadCategories.rejected, (state, action) => { state.mutateStatus = "failed"; state.mutateError = action.payload as string; });
  },
});

export const { resetMutateStatus } = categoriesSlice.actions;
export default categoriesSlice.reducer;