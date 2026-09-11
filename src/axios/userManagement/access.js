import { axiosAccessMutationConfig, axiosConfig } from "../config";

export const getAccessRoles = async (params) => {
  const response = await axiosAccessMutationConfig.get("/auth/roles/", {
    params,
  });
  return response;
};

export const getAppRoles = async (params) => {
  const response = await axiosConfig.get("/auth/roles/", {
    params,
  });
  return response;
};

export const getAuthenticatedMenus = async (params) => {
  const response = await axiosConfig.get("/auth/users/menus/", {
    params,
  });
  return response;
};

export const getAuthenticatedPermissions = async (params) => {
  const response = await axiosConfig.get("/auth/users/permissions/", {
    params,
  });
  return response;
};

export const getRoleMenusByRoleId = async (roleId, params) => {
  const response = await axiosAccessMutationConfig.get(
    `/auth/roles/${roleId}/menus/`,
    {
      params,
    },
  );
  return response;
};

export const getAppRoleMenusByRoleId = async (roleId, params) => {
  const response = await axiosConfig.get(`/auth/roles/${roleId}/menus/`, {
    params,
  });
  return response;
};

export const getRolePermissionsByRoleId = async (roleId, params) => {
  const response = await axiosAccessMutationConfig.get(
    `/auth/roles/${roleId}/permissions/`,
    {
      params,
    },
  );
  return response;
};

export const getAppRolePermissionsByRoleId = async (roleId, params) => {
  const response = await axiosConfig.get(
    `/auth/roles/${roleId}/permissions/`,
    {
      params,
    },
  );
  return response;
};

export const getMenuCatalog = async (params) => {
  const response = await axiosAccessMutationConfig.get("/auth/menus/", {
    params,
  });
  return response;
};

export const getPermissionCatalog = async (params) => {
  const response = await axiosAccessMutationConfig.get("/auth/permissions/", {
    params,
  });
  return response;
};

export const createPermission = async (data) => {
  const response = await axiosAccessMutationConfig.post("/auth/permissions/", data);
  return response;
};

export const updatePermission = async (permissionId, data) => {
  const response = await axiosAccessMutationConfig.put(
    `/auth/permissions/${permissionId}/`,
    data,
  );
  return response;
};

export const deletePermission = async (permissionId) => {
  const response = await axiosAccessMutationConfig.delete(
    `/auth/permissions/${permissionId}/`,
  );
  return response;
};

export const createMenuCatalog = async (data) => {
  const response = await axiosAccessMutationConfig.post("/auth/menus/", data);
  return response;
};

export const updateMenuCatalog = async (menuId, data) => {
  const response = await axiosAccessMutationConfig.put(
    `/auth/menus/${menuId}/`,
    data,
  );
  return response;
};

export const deleteMenuCatalog = async (menuId) => {
  const response = await axiosAccessMutationConfig.delete(`/auth/menus/${menuId}/`);
  return response;
};

export const addRoleMenuByRoleId = async (roleId, data) => {
  const response = await axiosAccessMutationConfig.post(
    `/auth/roles/${roleId}/menus/`,
    data,
  );
  return response;
};

export const updateRoleMenuByRoleId = async (roleId, groupMenuId, data) => {
  const response = await axiosAccessMutationConfig.put(
    `/auth/roles/${roleId}/menus/${groupMenuId}/`,
    data,
  );
  return response;
};

export const deleteRoleMenuByRoleId = async (roleId, groupMenuId) => {
  const response = await axiosAccessMutationConfig.delete(
    `/auth/roles/${roleId}/menus/${groupMenuId}/`,
  );
  return response;
};

export const reorderRoleMenusByRoleId = async (roleId, items) => {
  const response = await axiosAccessMutationConfig.post(
    `/auth/roles/${roleId}/menus/reorder/`,
    items,
  );
  return response;
};

export const syncRolePermissionsByRoleId = async (roleId, permissionIds) => {
  const response = await axiosAccessMutationConfig.post(
    `/auth/roles/${roleId}/permissions/sync/`,
    {
      permission_ids: permissionIds,
    },
  );
  return response;
};
