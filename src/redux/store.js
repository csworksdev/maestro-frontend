import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { apiSlice } from "@/store/api/apiSlice";

const store = configureStore({
  reducer: {
    ...rootReducer,
  },
});

export default store;
