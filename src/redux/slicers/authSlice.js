import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  refresh: "",
  access: "",
  data: {
    user_id: "",
    user_name: "",
    roles: "",
  },
  isAuth: false, // Initialize to false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { refresh, access, data } = action.payload;
      state.refresh = refresh;
      state.access = access;
      state.data = data;
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

export const { setUser, logOut } = authSlice.actions;
export default authSlice.reducer;
