import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "@/lib/api/axiosInstance";
import {
  getAllUsers, getUserById, registerUser,
  suspendUser, activateUser, getAdminStats,
  type ApiUser, type RegisterUserPayload, type AdminStats,
} from "@/lib/api/usersApi";

interface UsersState {
  list:           ApiUser[];
  listStatus:     "idle" | "loading" | "succeeded" | "failed";
  listError:      string | null;
  selected:       ApiUser | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  mutateStatus:   "idle" | "loading" | "succeeded" | "failed";
  adminStats:     AdminStats | null;
  statsStatus:    "idle" | "loading" | "succeeded" | "failed";
}

const initialState: UsersState = {
  list:           [],
  listStatus:     "idle",
  listError:      null,
  selected:       null,
  selectedStatus: "idle",
  mutateStatus:   "idle",
  adminStats:     null,
  statsStatus:    "idle",
};

const errMsg = (err: unknown, fallback: string) =>
  axios.isAxiosError(err) ? err.response?.data?.message ?? fallback : fallback;

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllUsers(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch users")); }
  }
);

export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async ({ id, type }: { id: string; type?: string }, { rejectWithValue }) => {
    try { return await getUserById(id, type); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch user")); }
  }
);

export const addUser = createAsyncThunk(
  "users/add",
  async (payload: RegisterUserPayload, { rejectWithValue }) => {
    try { return await registerUser(payload); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to register user")); }
  }
);

export const removeUser = createAsyncThunk(
  "users/remove",
  async ({ type, id }: { type: string; id: string }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/users/${type}/${id}`);
      return id;
    }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to delete user")); }
  }
);

export const suspendUserThunk = createAsyncThunk(
  "users/suspend",
  async ({ type, id }: { type: string; id: string }, { rejectWithValue }) => {
    try { await suspendUser(type, id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to suspend user")); }
  }
);

export const activateUserThunk = createAsyncThunk(
  "users/activate",
  async ({ type, id }: { type: string; id: string }, { rejectWithValue }) => {
    try { await activateUser(type, id); return id; }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to activate user")); }
  }
);

export const fetchAdminStats = createAsyncThunk(
  "users/adminStats",
  async (_, { rejectWithValue }) => {
    try { return await getAdminStats(); }
    catch (err) { return rejectWithValue(errMsg(err, "Failed to fetch stats")); }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSelected: (state) => {
      state.selected       = null;
      state.selectedStatus = "idle";
    },
    resetMutateStatus: (state) => {
      state.mutateStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,   (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchUsers.rejected,  (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(fetchUserById.pending,   (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchUserById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchUserById.rejected,  (state) => { state.selectedStatus = "failed"; });

    builder
      .addCase(addUser.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(addUser.fulfilled, (state, action) => { state.mutateStatus = "succeeded"; state.list.unshift(action.payload); })
      .addCase(addUser.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(removeUser.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(removeUser.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        state.list = state.list.filter((u) => u.id !== action.payload);
      })
      .addCase(removeUser.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(suspendUserThunk.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(suspendUserThunk.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const user = state.list.find((u) => u.id === action.payload);
        if (user) user.status = "suspended";
      })
      .addCase(suspendUserThunk.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(activateUserThunk.pending,   (state) => { state.mutateStatus = "loading"; })
      .addCase(activateUserThunk.fulfilled, (state, action) => {
        state.mutateStatus = "succeeded";
        const user = state.list.find((u) => u.id === action.payload);
        if (user) user.status = "active";
      })
      .addCase(activateUserThunk.rejected,  (state) => { state.mutateStatus = "failed"; });

    builder
      .addCase(fetchAdminStats.pending,   (state) => { state.statsStatus = "loading"; })
      .addCase(fetchAdminStats.fulfilled, (state, action) => { state.statsStatus = "succeeded"; state.adminStats = action.payload; })
      .addCase(fetchAdminStats.rejected,  (state) => { state.statsStatus = "failed"; });
  },
});

export const { clearSelected, resetMutateStatus } = usersSlice.actions;
export default usersSlice.reducer;