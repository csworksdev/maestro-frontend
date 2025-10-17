import { create } from "zustand";
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

const loadInitialState = () => {
  const { access = "", refresh = "", data } = getAuthCookies();
  const rememberFromCookie = getRememberMeCookie();

  return {
    access,
    refresh,
    data: data || { ...defaultUserData },
    isAuth: !!access,
    rememberMe: rememberFromCookie ?? (!!access || false),
  };
};

const clearClientStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  const keysToRemove = [
    "darkMode",
    "menuItems",
    "mobileMenu",
    "persist:auth",
    "persist:layout",
    "persist:root",
    "sidebarCollapsed",
    "activeSubmenu",
    "activeMultiMenu",
  ];

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const useAuthStore = create((set, get) => ({
  ...loadInitialState(),
  setUser: (payload = {}) => {
    const rememberPreference =
      payload.rememberMe ?? get().rememberMe ?? true;

    if (payload.access || payload.refresh || payload.data) {
      setAuthCookies(
        {
          access: payload.access,
          refresh: payload.refresh,
          data: payload.data,
        },
        rememberPreference ? {} : { days: null }
      );
      setRememberMeCookie(rememberPreference);
    }

    set((state) => ({
      ...state,
      refresh: payload.refresh,
      access: payload.access,
      data: payload.data || state.data,
      isAuth: true,
      rememberMe: rememberPreference,
    }));
  },
  logOut: () => {
    clearAuthCookies();
    clearClientStorage();

    set({
      refresh: "",
      access: "",
      data: { ...defaultUserData },
      isAuth: false,
      rememberMe: false,
    });
  },
}));

export const setUser = (payload) => {
  useAuthStore.getState().setUser(payload);
};

export const logOut = () => {
  useAuthStore.getState().logOut();
};

export const performLogout = async () => {
  let logout;
  try {
    ({ logout } = await import("@/axios/auth/auth"));
    await logout();
  } catch (error) {
    console.error("Failed to logout:", error);
  } finally {
    useAuthStore.getState().logOut();
  }
};

export const useAuthData = () =>
  useAuthStore((state) => state.data);

export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuth);
