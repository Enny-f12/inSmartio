import { configureStore } from "@reduxjs/toolkit";
import counterReducer             from "./counterSlice";
import authReducer                from "./authSlice";
import usersReducer               from "./usersSlice";
import categoriesReducer          from "./categoriesSlice";
import jobsReducer                from "./jobSlice";
import adminReducer               from "./adminSlice";
import disputeReducer             from "./disputeSlice";
import bannerReducer              from "./bannerSlice";
import announcementReducer        from "./announcementSlice";
import verificationReducer        from "./verificationSlice";         // old — keep for other pages
import tasReducer                 from "./tasSlice";                  // old — keep for other pages
import paymentReducer             from "./paymentSlice";
import reportReducer              from "./reportSlice";
import faqReducer                 from "./faqSlice";
import notificationReducer        from "./notificationtemplateSlice";
import commissionReducer          from "./commissionSlice";
import notificationsReducer       from "./notificationSlice";
import tastierReducer             from "./tastierSlice";              // new TAS tier settings
import verificationsettingsReducer from "./verificationSettingsSlice"; // new verification settings
import dashboardReducer           from "./dashboardSlice";
import scheduledReportsReducer    from "./schedduleReportSlice";
import reportTemplatesReducer     from "./reportTemplatesSlice";

export const store = configureStore({
  reducer: {
    counter:               counterReducer,
    auth:                  authReducer,
    users:                 usersReducer,
    categories:            categoriesReducer,
    jobs:                  jobsReducer,
    admin:                 adminReducer,
    disputes:              disputeReducer,
    banners:               bannerReducer,
    announcements:         announcementReducer,
    verifications:         verificationReducer,        // old slice — other pages use s.verifications
    tas:                   tasReducer,                 // old slice — other pages use s.tas
    payments:              paymentReducer,
    report:                reportReducer,
    faq:                   faqReducer,
    notificationTemplates: notificationReducer,
    commission:            commissionReducer,
    notifications:         notificationsReducer,
    tastier:               tastierReducer,             // new TAS tier settings slice
    verificationSettings:  verificationsettingsReducer, // new verification settings slice  ← renamed from 'verification'
    dashboard:             dashboardReducer,
    scheduledReports:      scheduledReportsReducer,
    reportTemplates:       reportTemplatesReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;