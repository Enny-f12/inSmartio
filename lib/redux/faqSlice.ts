// lib/redux/faqSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllFaqs, createFaq, updateFaq, deleteFaq,
  type ApiFaq, type FaqPayload,
} from "@/lib/api/faqApi";

interface FaqState {
  list:         ApiFaq[];
  listStatus:   "idle" | "loading" | "succeeded" | "failed";
  listError:    string | null;
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateError:  string | null;
}

const initialState: FaqState = {
  list:         [],
  listStatus:   "idle",
  listError:    null,
  mutateStatus: "idle",
  mutateError:  null,
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// GET /api/faq
export const fetchFaqs = createAsyncThunk(
  "faq/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllFaqs(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch FAQs")); }
  }
);

// POST /api/faq
export const addFaq = createAsyncThunk(
  "faq/add",
  async (payload: FaqPayload, { rejectWithValue }) => {
    try { return await createFaq(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to create FAQ")); }
  }
);

// PUT /api/faq/{id}
export const editFaq = createAsyncThunk(
  "faq/edit",
  async ({ id, payload }: { id: string; payload: Partial<FaqPayload> }, { rejectWithValue }) => {
    try { return await updateFaq(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update FAQ")); }
  }
);

// DELETE /api/faq/{id}
export const removeFaq = createAsyncThunk(
  "faq/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteFaq(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete FAQ")); }
  }
);

const faqSlice = createSlice({
  name: "faq",
  initialState,
  reducers: {
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
      state.mutateError  = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchFaqs.pending,   (s) => { s.listStatus = "loading"; s.listError = null; })
      .addCase(fetchFaqs.fulfilled, (s, a) => { s.listStatus = "succeeded"; s.list = a.payload; })
      .addCase(fetchFaqs.rejected,  (s, a) => { s.listStatus = "failed"; s.listError = a.payload as string; });

    // add
    builder
      .addCase(addFaq.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(addFaq.fulfilled, (s, a) => { s.mutateStatus = "succeeded"; s.list.unshift(a.payload); })
      .addCase(addFaq.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // edit
    builder
      .addCase(editFaq.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(editFaq.fulfilled, (s, a) => {
        s.mutateStatus = "succeeded";
        const idx = s.list.findIndex((f) => f.id === a.payload.id);
        if (idx !== -1) s.list[idx] = a.payload;
      })
      .addCase(editFaq.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });

    // remove
    builder
      .addCase(removeFaq.pending,   (s) => { s.mutateStatus = "loading"; s.mutateError = null; })
      .addCase(removeFaq.fulfilled, (s, a) => { s.mutateStatus = "succeeded"; s.list = s.list.filter((f) => f.id !== a.payload); })
      .addCase(removeFaq.rejected,  (s, a) => { s.mutateStatus = "failed"; s.mutateError = a.payload as string; });
  },
});

export const { resetMutateStatus } = faqSlice.actions;
export default faqSlice.reducer;