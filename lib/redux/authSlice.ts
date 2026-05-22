import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import axios from "axios";
import { adminLogin, type LoginPayload, type Admin } from "@/lib/api/authApi";

interface AuthState {
  token: string | null;
  admin: Admin | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  token: Cookies.get("token") ?? null,
  admin: null,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const data = await adminLogin(payload);
      // ── path: "/" ensures cookie is readable on ALL routes ──
      Cookies.set("token", data.token, {
        expires:  7,
        path:     "/",          // ← critical fix
        sameSite: "strict",
        secure:   process.env.NODE_ENV === "production",
      });
      return data;
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Login failed"
        : "Login failed";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.admin = null;
      state.status = "idle";
      state.error = null;
      Cookies.remove("token", { path: "/" }); // ← match path on remove
    },
    resetAuthStatus: (state) => {
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status  = "loading";
        state.error   = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token  = action.payload.token;
        state.admin  = action.payload.data;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error  = action.payload as string;
      });
  },
});

export const { logout, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;