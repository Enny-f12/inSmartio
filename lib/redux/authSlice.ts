import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import axios from "axios";
import { adminLogin, type LoginPayload, type Admin } from "@/lib/api/authApi";

// ── Parse JWT payload without a library ──────────────────
const parseJwt = (token: string): Record<string, unknown> => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json   = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
};

interface AuthState {
  token:  string | null;
  admin:  Admin  | null;
  role:   string | null;   // parsed from JWT — more reliable than data.role
  status: "idle" | "loading" | "succeeded" | "failed";
  error:  string | null;
}

const storedToken = Cookies.get("token") ?? null;
const storedRole  = storedToken ? (parseJwt(storedToken).role as string ?? null) : null;

const initialState: AuthState = {
  token:  storedToken,
  admin:  null,
  role:   storedRole,
  status: "idle",
  error:  null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const data = await adminLogin(payload);
      Cookies.set("token", data.token, {
        expires:  7,
        path:     "/",
        sameSite: "Lax",
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
      state.token  = null;
      state.admin  = null;
      state.role   = null;
      state.status = "idle";
      state.error  = null;
      Cookies.remove("token", { path: "/" });
    },
    resetAuthStatus: (state) => {
      state.status = "idle";
      state.error  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending,   (state) => { state.status = "loading"; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        const claims = parseJwt(action.payload.token);
        state.status = "succeeded";
        state.token  = action.payload.token;
        // Prefer JWT claim role over data.role (data.role is "" but JWT has "admin")
        state.role   = (claims.role as string) || action.payload.data.role || null;
        state.admin  = {
          ...action.payload.data,
          role: (claims.role as string) || action.payload.data.role || "",
        };
        // Log so you can confirm what the JWT contains
        console.log("🔑 JWT claims:", claims);
        console.log("👤 Admin role from JWT:", claims.role);
        console.log("👤 Admin role from data:", action.payload.data.role);
      })
      .addCase(login.rejected,  (state, action) => {
        state.status = "failed";
        state.error  = action.payload as string;
      });
  },
});

export const { logout, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;