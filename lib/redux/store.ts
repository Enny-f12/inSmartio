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
import verificationReducer from "./verificationSlice";
import tasReducer          from "./tasSlice";
import paymentReducer      from "./paymentSlice";
import reportReducer  from "./reportSlice";
import faqReducer     from "./faqSlice";
import notificationReducer from "./notificationSlice";
import commissionReducer from "./commissionSlice"
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
    verifications: verificationReducer,
    tas:           tasReducer,
    payments:      paymentReducer,
    report: reportReducer,
    faq:    faqReducer,
    notifications: notificationReducer,
    commission: commissionReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;