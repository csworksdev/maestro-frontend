import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    refresh: "",
    access: "",
    data: {
      user_id: "",
      user_name: "",
      roles: "",
    },
    isAuth: false,
  },
  reducers: {
    setUser: (state, action) => {
      return {
        ...state, // Spread the current state
        refresh: action.payload.refresh,
        access: action.payload.access,
        data: action.payload.data,
        isAuth: true,
      };
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
      localStorage.removeItem("darkMode");
      localStorage.removeItem("menuItems");
      localStorage.removeItem("mobileMenu");
      localStorage.removeItem("persist:auth");
      localStorage.removeItem("persist:layout");
      localStorage.removeItem("persist:root");
      localStorage.removeItem("sidebarCollapsed");
      localStorage.removeItem("activeSubmenu");
      localStorage.removeItem("activeMultiMenu");
    },
  },
});

export const { setUser, logOut } = authSlice.actions;
export default authSlice.reducer;
