import { create } from "zustand";
import {
  clearAuthCookies,
  getAuthCookies,
  getRememberMeCookie,
  setAuthCookies,
  setRememberMeCookie,
} from "@/utils/authCookies";
import {
  clearAccessCache,
  extractRoleIds,
  getAccessCache,
  hasAnyPermission,
  hasPermission,
  setAccessCache,
} from "@/utils/accessControl";
import { normalizeUserRoles } from "@/utils/authRoles";
import { useSubdomainStore } from "./subdomainSlice";

const defaultUserData = {
  user_id: "",
  user_name: "",
  roles: "",
  raw_roles: "",
};

const ROLE_MENU_PREVIEW_KEY = "maestro_selected_role_menu_preview";

const getStoredRoleMenuPreview = () => {
  if (typeof window === "undefined") {
    return { menus: null, roleId: "" };
  }

  try {
    const rawValue = window.localStorage.getItem(ROLE_MENU_PREVIEW_KEY);
    if (!rawValue) return { menus: null, roleId: "" };
    const parsedValue = JSON.parse(rawValue);
    return {
      menus: Array.isArray(parsedValue?.menus) ? parsedValue.menus : null,
      roleId: parsedValue?.roleId ? String(parsedValue.roleId) : "",
    };
  } catch (error) {
    console.error("Failed to parse selected role menu preview:", error);
    window.localStorage.removeItem(ROLE_MENU_PREVIEW_KEY);
    return { menus: null, roleId: "" };
  }
};

const persistRoleMenuPreview = (menus = null, roleId = "") => {
  if (typeof window === "undefined") return;

  try {
    if (!Array.isArray(menus) || !roleId) {
      window.localStorage.removeItem(ROLE_MENU_PREVIEW_KEY);
      return;
    }

    window.localStorage.setItem(
      ROLE_MENU_PREVIEW_KEY,
      JSON.stringify({
        menus,
        roleId: String(roleId),
        updated_at: new Date().toISOString(),
      }),
    );
  } catch (error) {
    console.error("Failed to persist selected role menu preview:", error);
  }
};

const loadInitialState = () => {
  const { access = "", refresh = "", data } = getAuthCookies();
  const rememberFromCookie = getRememberMeCookie();
  const subdomain = useSubdomainStore.getState().subdomain;
  const accessCache = getAccessCache();
  const storedRoleMenuPreview = getStoredRoleMenuPreview();
  const rawRoles = data?.raw_roles ?? data?.roles;
  const normalizedData = data
    ? {
        ...data,
        role_ids: data.role_ids || extractRoleIds(data),
        raw_roles: rawRoles,
        roles: normalizeUserRoles(rawRoles, subdomain),
      }
    : { ...defaultUserData };

  return {
    access,
    refresh,
    data: normalizedData,
    isAuth: !!access,
    rememberMe: rememberFromCookie ?? (!!access || false),
    roleIds: accessCache?.roleIds || [],
    menus: accessCache?.menus || [],
    roleMenuPreview: storedRoleMenuPreview.menus,
    roleMenuPreviewRoleId: storedRoleMenuPreview.roleId,
    permissions: accessCache?.permissions || [],
    permissionCodes: accessCache?.permissionCodes || [],
    accessLoading: false,
    accessLoaded: Boolean(accessCache),
    accessError: null,
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
    "user",
    "maestro_access",
    ROLE_MENU_PREVIEW_KEY,
  ];

  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
  });
};

export const useAuthStore = create((set, get) => ({
  ...loadInitialState(),
  setUser: (payload = {}) => {
    const rememberPreference = payload.rememberMe ?? get().rememberMe ?? true;
    const subdomain = useSubdomainStore.getState().subdomain;
    const currentState = get();
    const access = payload.access ?? currentState.access ?? "";
    const refresh = payload.refresh ?? currentState.refresh ?? "";
    const extractedRoleIds = extractRoleIds(payload.data);
    const rawRoles =
      payload.data?.raw_roles ??
      payload.data?.roles ??
      currentState.data?.raw_roles ??
      currentState.data?.roles;
    const normalizedData = {
      ...(payload.data || currentState.data || {}),
      role_ids:
        payload.data?.role_ids ||
        (extractedRoleIds.length ? extractedRoleIds : currentState.data?.role_ids),
      raw_roles: rawRoles,
      roles: normalizeUserRoles(rawRoles, subdomain),
    };

    if (access || refresh || payload.data) {
      setAuthCookies(
        {
          access,
          refresh,
          data: normalizedData,
        },
        rememberPreference ? {} : { days: null },
      );
      setRememberMeCookie(rememberPreference);
    }

    set((state) => ({
      ...state,
      refresh,
      access,
      data: normalizedData,
      isAuth: Boolean(access),
      rememberMe: rememberPreference,
    }));
  },
  setAccessLoading: (accessLoading) => {
    set({ accessLoading });
  },
  setAccessError: (error) => {
    set({
      accessError: error,
      accessLoaded: false,
    });
  },
  setAccessData: ({
    roleIds = [],
    menus = [],
    permissions = [],
    permissionCodes = [],
    accessError = null,
  } = {}) => {
    const { rememberMe, data } = get();
    const accessData = {
      user_id: data?.user_id,
      roleIds,
      menus,
      permissions,
      permissionCodes,
    };

    setAccessCache(accessData, rememberMe);

    if (typeof window !== "undefined") {
      if (menus.length) {
        window.localStorage.setItem("menuItems", JSON.stringify(menus));
      } else {
        window.localStorage.removeItem("menuItems");
      }
    }

    set({
      roleIds,
      menus,
      permissions,
      permissionCodes,
      accessLoaded: true,
      accessError,
    });
  },
  setRoleMenuPreview: (menus = null, roleId = "") => {
    persistRoleMenuPreview(menus, roleId);
    const hasPreviewRole = Array.isArray(menus) && Boolean(roleId);
    set({
      roleMenuPreview: hasPreviewRole ? menus : null,
      roleMenuPreviewRoleId: hasPreviewRole ? String(roleId || "") : "",
    });
  },
  clearAccessData: () => {
    clearAccessCache();
    set({
      roleIds: [],
      menus: [],
      roleMenuPreview: null,
      roleMenuPreviewRoleId: "",
      permissions: [],
      permissionCodes: [],
      accessLoading: false,
      accessLoaded: false,
      accessError: null,
    });
  },
  can: (permission) => hasPermission(get().permissionCodes, permission),
  canAny: (permissions) => hasAnyPermission(get().permissionCodes, permissions),
  logOut: () => {
    clearAuthCookies();
    clearAccessCache();
    clearClientStorage();

    set({
      refresh: "",
      access: "",
      data: { ...defaultUserData },
      isAuth: false,
      rememberMe: false,
      roleIds: [],
      menus: [],
      roleMenuPreview: null,
      roleMenuPreviewRoleId: "",
      permissions: [],
      permissionCodes: [],
      accessLoading: false,
      accessLoaded: false,
      accessError: null,
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

export const useAuthData = () => useAuthStore((state) => state.data);

export const useIsAuthenticated = () => useAuthStore((state) => state.isAuth);

export const useAuthMenus = () => useAuthStore((state) => state.menus);

export const useAuthPermissions = () =>
  useAuthStore((state) => state.permissions);

export const usePermissionCodes = () =>
  useAuthStore((state) => state.permissionCodes);

export const useCan = (permission) =>
  useAuthStore((state) => hasPermission(state.permissionCodes, permission));

export const useCanAny = (permissions) =>
  useAuthStore((state) => hasAnyPermission(state.permissionCodes, permissions));
