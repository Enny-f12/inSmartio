import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counterSlice";
import authReducer from "./authSlice";
import usersReducer from "./usersSlice";
import categoriesReducer from "./categoriesSlice";
import jobsReducer from "./jobSlice";
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    users: usersReducer,
    categories: categoriesReducer,
    jobs: jobsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;