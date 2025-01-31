import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Default is localStorage
import { combineReducers } from "redux";
import authReducer from "@/redux/slicers/authSlice";
import layoutReducer from "@/redux/slicers/layoutSlice";
import loadingReducer from "@/redux/slicers/loadingSlice";

const authPersistConfig = {
  key: "auth",
  storage,
};

const layoutPersistConfig = {
  key: "layout",
  storage,
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  layout: persistReducer(layoutPersistConfig, layoutReducer),
  loading: persistReducer({ key: "loading", storage }, loadingReducer),
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Create persistor
export const persistor = persistStore(store);
export default store;
