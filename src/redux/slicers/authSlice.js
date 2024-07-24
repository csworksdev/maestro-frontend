import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user"));

const initialState = {
  refresh: "",
  access: "",
  data: {
    user_id: "",
    user_name: "",
    roles: "",
  },
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.refresh = action.payload.refresh;
      state.access = action.payload.access;
      state.data = action.payload.data;
      state.isAuth = true;
    },
    logOut: (state) => {
      state.refresh = "";
      state.access = "";
      state.data = {
        user_id: "",
        user_name: "",
        roles: "",
      };
      state.isAuth = false;
    },
  },
});

export const { setAuthData, clearAuthData } = authSlice.actions;
export default authSlice.reducer;
