// lib/redux/notificationSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type ApiNotification,
} from "@/lib/api/notificationApi"; // adjust path as needed

/* ── Helper ──────────────────────────────────────────────── */
const isRead = (n: ApiNotification) => n.read === true || n.isRead === true;

const countUnread = (list: ApiNotification[]) =>
  list.filter((n) => !isRead(n)).length;

/* ── State ───────────────────────────────────────────────── */
interface NotificationState {
  list: ApiNotification[];
  listStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  unreadCount: number;
}

const initialState: NotificationState = {
  list: [],
  listStatus: "idle",
  error: null,
  unreadCount: 0,
};

/* ── Thunks ──────────────────────────────────────────────── */

/** Fetch all notifications (admin or user — token decides) */
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      return await getNotifications();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch notifications";
      return rejectWithValue(msg);
    }
  }
);

/** Mark a single notification as read */
export const markReadThunk = createAsyncThunk(
  "notifications/markRead",
  async (id: string, { rejectWithValue }) => {
    try {
      await markNotificationRead(id);
      return id;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to mark notification read";
      return rejectWithValue(msg);
    }
  }
);

/** Mark all notifications as read */
export const markAllReadThunk = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await markAllNotificationsRead();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to mark all notifications read";
      return rejectWithValue(msg);
    }
  }
);

/** Delete a single notification */
export const deleteNotificationThunk = createAsyncThunk(
  "notifications/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return id;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete notification";
      return rejectWithValue(msg);
    }
  }
);

/* ── Slice ───────────────────────────────────────────────── */
const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    /** Reset slice — call on logout */
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    /* fetchNotifications */
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.listStatus = "loading";
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.listStatus = "succeeded";
        state.list = action.payload;
        state.unreadCount = countUnread(action.payload);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.listStatus = "failed";
        state.error = action.payload as string;
      });

    /* markReadThunk — optimistic update */
    builder.addCase(markReadThunk.fulfilled, (state, action) => {
      const id = action.payload;
      state.list = state.list.map((n) =>
        n.id === id ? { ...n, read: true, isRead: true } : n
      );
      state.unreadCount = countUnread(state.list);
    });

    /* markAllReadThunk — optimistic update */
    builder.addCase(markAllReadThunk.fulfilled, (state) => {
      state.list = state.list.map((n) => ({ ...n, read: true, isRead: true }));
      state.unreadCount = 0;
    });

    /* deleteNotificationThunk — remove from list */
    builder.addCase(deleteNotificationThunk.fulfilled, (state, action) => {
      const id = action.payload;
      state.list = state.list.filter((n) => n.id !== id);
      state.unreadCount = countUnread(state.list);
    });
  },
});

export const { resetNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;