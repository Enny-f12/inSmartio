import { configureStore } from "@reduxjs/toolkit";
import counterReducer      from "./counterSlice";
import authReducer         from "./authSlice";
import usersReducer        from "./usersSlice";
import categoriesReducer   from "./categoriesSlice";
import jobsReducer         from "./jobSlice";
import adminReducer        from "./adminSlice";
import disputeReducer      from "./disputeSlice";
import bannerReducer       from "./bannerSlice";
import announcementReducer from "./announcementSlice";

export const store = configureStore({
  reducer: {
    counter:       counterReducer,
    auth:          authReducer,
    users:         usersReducer,
    categories:    categoriesReducer,
    jobs:          jobsReducer,
    admin:         adminReducer,
    disputes:      disputeReducer,
    banners:       bannerReducer,
    announcements: announcementReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;