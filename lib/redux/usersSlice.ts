import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { getAllUsers, getUserById, deleteUser, registerUser, type ApiUser, type RegisterUserPayload } from "@/lib/api/usersApi";

interface UsersState {
  list: ApiUser[];
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  listError: string | null;
  selected: ApiUser | null;
  selectedStatus: "idle" | "loading" | "succeeded" | "failed";
  deleteStatus: "idle" | "loading" | "succeeded" | "failed";
  deleteError: string | null;
}

const initialState: UsersState = {
  list: [],
  listStatus: "idle",
  listError: null,
  selected: null,
  selectedStatus: "idle",
  deleteStatus: "idle",
  deleteError: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchAll",
  async (_, { rejectWithValue }) => {
    try { return await getAllUsers(); }
    catch (err) {
      return rejectWithValue(axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Failed to fetch users"
        : "Failed to fetch users");
    }
  }
);

export const fetchUserById = createAsyncThunk(
  "users/fetchById",
  async (id: string, { rejectWithValue }) => {
    try { return await getUserById(id); }
    catch (err) {
      return rejectWithValue(axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Failed to fetch user"
        : "Failed to fetch user");
    }
  }
);

export const addUser = createAsyncThunk(
  "users/add",
  async (payload: RegisterUserPayload, { rejectWithValue }) => {
    try { return await registerUser(payload); }
    catch (err) {
      return rejectWithValue(axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Failed to add user"
        : "Failed to add user");
    }
  }
);

export const removeUser = createAsyncThunk(
  "users/delete",
  async (id: string, { rejectWithValue }) => {
    try { await deleteUser(id); return id; }
    catch (err) {
      return rejectWithValue(axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Failed to delete user"
        : "Failed to delete user");
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
      state.selectedStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => { state.listStatus = "loading"; state.listError = null; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.listStatus = "succeeded"; state.list = action.payload; })
      .addCase(fetchUsers.rejected, (state, action) => { state.listStatus = "failed"; state.listError = action.payload as string; });

    builder
      .addCase(fetchUserById.pending, (state) => { state.selectedStatus = "loading"; state.selected = null; })
      .addCase(fetchUserById.fulfilled, (state, action) => { state.selectedStatus = "succeeded"; state.selected = action.payload; })
      .addCase(fetchUserById.rejected, (state) => { state.selectedStatus = "failed"; });

    builder
      .addCase(addUser.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      });

    builder
      .addCase(removeUser.fulfilled, (state, action) => {
        state.list = state.list.filter((u) => u.id !== action.payload);
        if (state.selected?.id === action.payload) { state.selected = null; state.selectedStatus = "idle"; }
      });
  },
});

export const { clearSelected } = usersSlice.actions;
export default usersSlice.reducer;