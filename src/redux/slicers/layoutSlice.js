import { create } from "zustand";
import themeConfig from "@/configs/themeConfig";

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const readFromStorage = (key, fallback) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const item = window.localStorage.getItem(key);
  if (item === null || item === undefined) {
    return fallback;
  }

  return safeParse(item, fallback);
};

const persistValue = (key, value) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `Unable to persist layout key "${key}" to localStorage`,
        error
      );
    }
  }
};

const initialState = {
  isRTL: readFromStorage("direction", themeConfig.layout.isRTL),
  darkMode: readFromStorage("darkMode", themeConfig.layout.darkMode),
  isCollapsed: readFromStorage(
    "sidebarCollapsed",
    themeConfig.layout.menu.isCollapsed
  ),
  customizer: themeConfig.layout.customizer,
  semiDarkMode: readFromStorage(
    "semiDarkMode",
    themeConfig.layout.semiDarkMode
  ),
  skin: readFromStorage("skin", themeConfig.layout.skin),
  contentWidth: themeConfig.layout.contentWidth,
  type: readFromStorage("type", themeConfig.layout.type),
  menuHidden: themeConfig.layout.menu.isHidden,
  navBarType: themeConfig.layout.navBarType,
  footerType: themeConfig.layout.footerType,
  mobileMenu: themeConfig.layout.mobileMenu,
  isMonochrome: readFromStorage(
    "monochrome",
    themeConfig.layout.isMonochrome
  ),
};

export const useLayoutStore = create((set) => ({
  ...initialState,
  setSetting: ({ key, value, persist = true, storageKey }) => {
    set((state) => ({
      ...state,
      [key]: value,
    }));

    if (persist) {
      persistValue(storageKey ?? key, value);
    }
  },
  setMany: (entries = []) => {
    if (!Array.isArray(entries) || !entries.length) {
      return;
    }

    set((state) => {
      const nextState = { ...state };
      entries.forEach(({ key, value, persist = true, storageKey }) => {
        nextState[key] = value;
        if (persist) {
          persistValue(storageKey ?? key, value);
        }
      });
      return nextState;
    });
  },
}));

export const handleSetting = (payload) => {
  useLayoutStore.getState().setSetting(payload);
};

export const useLayoutValue = (selector) => useLayoutStore(selector);
