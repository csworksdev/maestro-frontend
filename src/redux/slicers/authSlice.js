import { createSlice } from "@reduxjs/toolkit";
import {
  clearAuthCookies,
  getAuthCookies,
  getRememberMeCookie,
  setAuthCookies,
  setRememberMeCookie,
} from "@/utils/authCookies";

const defaultUserData = {
  user_id: "",
  user_name: "",
  roles: "",
};

const { access: initialAccess, refresh: initialRefresh, data: initialData } =
  getAuthCookies();
const initialRememberMe =
  getRememberMeCookie() ?? (initialAccess ? true : false);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    refresh: initialRefresh,
    access: initialAccess,
    data: initialData || { ...defaultUserData },
    isAuth: !!initialAccess,
    rememberMe: initialRememberMe,
  },
  reducers: {
    setUser: (state, action) => {
      const rememberPreference =
        action.payload.rememberMe ?? state.rememberMe ?? true;

      if (
        action.payload.access ||
        action.payload.refresh ||
        action.payload.data
      ) {
        setAuthCookies(
          {
            access: action.payload.access,
            refresh: action.payload.refresh,
            data: action.payload.data,
          },
          rememberPreference ? {} : { days: null }
        );
        setRememberMeCookie(rememberPreference);
      }

      return {
        ...state, // Spread the current state
        refresh: action.payload.refresh,
        access: action.payload.access,
        data: action.payload.data || state.data,
        isAuth: true,
        rememberMe: rememberPreference,
      };
    },
    logOut: (state) => {
      state.refresh = "";
      state.access = "";
      state.data = { ...defaultUserData };
      state.isAuth = false;
      state.rememberMe = false;
      clearAuthCookies();
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
