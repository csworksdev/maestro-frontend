import {
  getAuthenticatedMenus,
  getAuthenticatedPermissions,
} from "@/axios/userManagement/access";
import { useAuthStore } from "@/redux/slicers/authSlice";
import {
  extractList,
  extractRoleIds,
  getPermissionCodes,
  mapBackendMenuToSidebar,
  mergeSidebarMenus,
  normalizePermissions,
} from "@/utils/accessControl";

let accessLoadPromise = null;

const DEFAULT_LIST_PARAMS = {
  page: 1,
  page_size: 100,
};

const ACCESS_RESOURCES = {
  menus: "GET /auth/users/menus/",
  permissions: "GET /auth/users/permissions/",
};

const extractNestedList = (payload, key) => {
  const data = payload?.data ?? payload;
  const topLevelList = extractList(payload);
  const resourceList = extractList(data?.[key]);

  if (resourceList.length || Array.isArray(data?.[key])) {
    return resourceList;
  }

  const nestedList = topLevelList.flatMap((item) => extractList(item?.[key]));
  if (nestedList.length) {
    return nestedList;
  }

  return topLevelList;
};

const mapAuthenticatedMenus = (payload) => {
  const data = payload?.data ?? payload;
  const topLevelList = extractList(payload);
  const directMenus = extractList(data?.menus);

  if (directMenus.length || Array.isArray(data?.menus)) {
    return mapBackendMenuToSidebar(directMenus);
  }

  const hasRoleMenuShape = topLevelList.some(
    (item) =>
      item &&
      typeof item === "object" &&
      (Array.isArray(item.menus) ||
        item.role_id !== undefined ||
        item.role_name !== undefined),
  );

  if (hasRoleMenuShape) {
    const roleMenuGroups = topLevelList.map((item) =>
      extractList(item?.menus),
    );

    return mergeSidebarMenus(roleMenuGroups.map(mapBackendMenuToSidebar));
  }

  return mapBackendMenuToSidebar(topLevelList);
};

const mapAuthenticatedPermissions = (payload) => {
  const data = payload?.data ?? payload;
  const topLevelList = extractList(payload);
  const permissionGroups = topLevelList.filter(
    (item) => item && typeof item === "object" && Array.isArray(item.permissions),
  );

  if (permissionGroups.length) {
    return normalizePermissions(
      permissionGroups.flatMap((group) => group.permissions),
    );
  }

  return normalizePermissions(extractNestedList(data, "permissions"));
};

const extractRoleIdsFromMenuPayload = (payload, fallbackUserData = {}) => {
  const menuRoleIds = extractList(payload)
    .map((item) => item?.role_id)
    .filter((roleId) => roleId != null && roleId !== "")
    .map(String);

  if (menuRoleIds.length) return [...new Set(menuRoleIds)];

  return extractRoleIds(fallbackUserData);
};

const loadAuthenticatedAccessByUser = async (userData) => {
  const [menusResult, permissionsResult] = await Promise.allSettled([
    getAuthenticatedMenus(DEFAULT_LIST_PARAMS),
    getAuthenticatedPermissions(DEFAULT_LIST_PARAMS),
  ]);
  const failedResources = [
    menusResult.status === "rejected" ? ACCESS_RESOURCES.menus : null,
    permissionsResult.status === "rejected"
      ? ACCESS_RESOURCES.permissions
      : null,
  ].filter(Boolean);

  const roleIds =
    menusResult.status === "fulfilled"
      ? extractRoleIdsFromMenuPayload(menusResult.value, userData)
      : extractRoleIdsFromMenuPayload(null, userData);
  const menus =
    menusResult.status === "fulfilled"
      ? mapAuthenticatedMenus(menusResult.value)
      : [];
  const permissions =
    permissionsResult.status === "fulfilled"
      ? mapAuthenticatedPermissions(permissionsResult.value)
      : [];

  return {
    roleIds,
    menus,
    permissions,
    permissionCodes: getPermissionCodes(permissions),
    accessError: failedResources.length > 0,
    accessErrorMessage: failedResources.length
      ? `Gagal memuat akses dari backend: ${failedResources.join(", ")}`
      : "",
    failedResources,
  };
};

export const loadAuthenticatedAccess = async ({ force = false } = {}) => {
  if (accessLoadPromise && !force) {
    return accessLoadPromise;
  }

  accessLoadPromise = (async () => {
    const authState = useAuthStore.getState();

    if (!authState.isAuth || !authState.access) {
      return null;
    }

    useAuthStore.getState().setAccessLoading(true);

    try {
      const authenticatedAccess = await loadAuthenticatedAccessByUser(
        authState.data,
      );

      useAuthStore.getState().setAccessData(authenticatedAccess);
      return authenticatedAccess;
    } catch (error) {
      console.error("Failed to load authenticated access:", error);
      useAuthStore.getState().setAccessError(error);
      return null;
    } finally {
      useAuthStore.getState().setAccessLoading(false);
      accessLoadPromise = null;
    }
  })();

  return accessLoadPromise;
};
