import { createSlice } from "@reduxjs/toolkit";
import themeConfig from "@/configs/themeConfig";

const getItem = (key, fallback) => {
  const item = window.localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

const initialState = {
  isRTL: getItem("direction", themeConfig.layout.isRTL),
  darkMode: getItem("darkMode", themeConfig.layout.darkMode),
  isCollapsed: getItem("sidebarCollapsed", themeConfig.layout.menu.isCollapsed),
  customizer: themeConfig.layout.customizer,
  semiDarkMode: getItem("semiDarkMode", themeConfig.layout.semiDarkMode),
  skin: getItem("skin", themeConfig.layout.skin),
  contentWidth: themeConfig.layout.contentWidth,
  type: getItem("type", themeConfig.layout.type),
  menuHidden: themeConfig.layout.menu.isHidden,
  navBarType: themeConfig.layout.navBarType,
  footerType: themeConfig.layout.footerType,
  mobileMenu: themeConfig.layout.mobileMenu,
  isMonochrome: getItem("monochrome", themeConfig.layout.isMonochrome),
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    handleSetting: (state, action) => {
      const { key, value } = action.payload;
      state[key] = value;
      window.localStorage.setItem(key, JSON.stringify(value));
    },
  },
});

export const { handleSetting } = layoutSlice.actions;
export default layoutSlice.reducer;
