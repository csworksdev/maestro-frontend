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
    handleDarkMode: (state, action) => {
      state.darkMode = action.payload;
      window.localStorage.setItem("darkMode", JSON.stringify(action.payload));
    },
    handleSidebarCollapsed: (state, action) => {
      state.isCollapsed = action.payload;
      window.localStorage.setItem(
        "sidebarCollapsed",
        JSON.stringify(action.payload)
      );
    },
    handleCustomizer: (state, action) => {
      state.customizer = action.payload;
    },
    handleSemiDarkMode: (state, action) => {
      state.semiDarkMode = action.payload;
      window.localStorage.setItem(
        "semiDarkMode",
        JSON.stringify(action.payload)
      );
    },
    handleRtl: (state, action) => {
      state.isRTL = action.payload;
      window.localStorage.setItem("direction", JSON.stringify(action.payload));
    },
    handleSkin: (state, action) => {
      state.skin = action.payload;
      window.localStorage.setItem("skin", JSON.stringify(action.payload));
    },
    handleContentWidth: (state, action) => {
      state.contentWidth = action.payload;
    },
    handleType: (state, action) => {
      state.type = action.payload;
      window.localStorage.setItem("type", JSON.stringify(action.payload));
    },
    handleMenuHidden: (state, action) => {
      state.menuHidden = action.payload;
    },
    handleNavBarType: (state, action) => {
      state.navBarType = action.payload;
    },
    handleFooterType: (state, action) => {
      state.footerType = action.payload;
    },
    handleMobileMenu: (state, action) => {
      state.mobileMenu = action.payload;
    },
    handleMonoChrome: (state, action) => {
      state.isMonochrome = action.payload;
      window.localStorage.setItem("monochrome", JSON.stringify(action.payload));
    },
  },
});

export const {
  handleDarkMode,
  handleSidebarCollapsed,
  handleCustomizer,
  handleSemiDarkMode,
  handleRtl,
  handleSkin,
  handleContentWidth,
  handleType,
  handleMenuHidden,
  handleNavBarType,
  handleFooterType,
  handleMobileMenu,
  handleMonoChrome,
} = layoutSlice.actions;

export default layoutSlice.reducer;
