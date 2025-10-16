import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    refresh: localStorage.getItem("refresh_token") || "",
    access: localStorage.getItem("access_token") || "",
    data: JSON.parse(localStorage.getItem("user_data")) || {
      user_id: "",
      user_name: "",
      roles: "",
    },
    isAuth: !!localStorage.getItem("access_token"),
  },
  reducers: {
    setUser: (state, action) => {
      localStorage.setItem("access_token", action.payload.access);
      localStorage.setItem("refresh_token", action.payload.refresh);
      localStorage.setItem("user_data", JSON.stringify(action.payload.data));

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
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    },
  },
});

export const { setUser, logOut } = authSlice.actions;

export const performLogout = () => async (dispatch) => {
  let logout;
  try {
    ({ logout } = await import("@/axios/auth/auth"));
    await logout();
  } catch (error) {
    console.error("Failed to logout:", error);
  } finally {
    dispatch(logOut());
  }
};

export default authSlice.reducer;
