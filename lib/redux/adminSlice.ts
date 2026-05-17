// lib/redux/adminSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import {
  getAllAdmins, registerAdmin, updateAdmin, deleteAdmin, toggle2FA,
  type Admin, type RegisterAdminPayload, type UpdateAdminPayload,
} from "@/lib/api/adminApi";

interface AdminState {
  list:         Admin[];
  listStatus:   "idle" | "loading" | "succeeded" | "failed";
  listError:    string | null;
  mutateStatus: "idle" | "loading" | "succeeded" | "failed";
}

const initialState: AdminState = {
  list:         [],
  listStatus:   "idle",
  listError:    null,
  mutateStatus: "idle",
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

// ── Thunks ────────────────────────────────────────────────

export const fetchAdmins = createAsyncThunk(
  "admin/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllAdmins(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch admins")); }
  }
);

export const addAdmin = createAsyncThunk(
  "admin/add",
  async (payload: RegisterAdminPayload, { rejectWithValue }) => {
    try { return await registerAdmin(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to add admin")); }
  }
);

export const editAdmin = createAsyncThunk(
  "admin/edit",
  async ({ id, payload }: { id: string; payload: UpdateAdminPayload }, { rejectWithValue }) => {
    try { return await updateAdmin(id, payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to update admin")); }
  }
);

export const removeAdmin = createAsyncThunk(
  "admin/remove",
  async (id: string, { rejectWithValue }) => {
    try { await deleteAdmin(id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete admin")); }
  }
);

export const toggleAdmin2FA = createAsyncThunk(
  "admin/toggle2fa",
  async (id: string, { rejectWithValue }) => {
    try { return await toggle2FA(id); }  // returns updated Admin
    catch (err) { return rejectWithValue(errMsg(err, "Failed to toggle 2FA")); }
  }
);

// ── Slice ─────────────────────────────────────────────────

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    resetMutateStatus: (state) => { state.mutateStatus = "idle"; },
  },
  extraReducers: (builder) => {
    // fetchAdmins
    builder
      .addCase(fetchAdmins.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchAdmins.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchAdmins.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    // addAdmin
    builder
      .addCase(addAdmin.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(addAdmin.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; state.list.unshift(action.payload); })
      .addCase(addAdmin.rejected,  (state) => { state.mutateStatus = "failed"; });

    // editAdmin
    builder
      .addCase(editAdmin.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(editAdmin.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(editAdmin.rejected,  (state) => { state.mutateStatus = "failed"; });

    // removeAdmin
    builder
      .addCase(removeAdmin.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(removeAdmin.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((a) => a.id !== action.payload);
      })
      .addCase(removeAdmin.rejected,  (state) => { state.mutateStatus = "failed"; });

    // toggleAdmin2FA — use real updated admin from API response
    builder
      .addCase(toggleAdmin2FA.fulfilled, (state, action) => {
        const idx = state.list.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      });
  },
});

export const { resetMutateStatus } = adminSlice.actions;
export default adminSlice.reducer;