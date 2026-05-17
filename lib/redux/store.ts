import { configureStore } from "@reduxjs/toolkit";
import counterReducer    from "./counterSlice";
import authReducer       from "./authSlice";
import usersReducer      from "./usersSlice";
import categoriesReducer from "./categoriesSlice";
import jobsReducer       from "./jobSlice";
import adminReducer      from "./adminSlice";

export const store = configureStore({
  reducer: {
    counter:    counterReducer,
    auth:       authReducer,
    users:      usersReducer,
    categories: categoriesReducer,
    jobs:       jobsReducer,
    admin:      adminReducer,
  },
});

export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;