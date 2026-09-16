import { axiosConfig, axiosAccessMutationConfig } from "../config";
import {
  AddMenus,
  DeleteMenus,
  EditMenus,
  getMenusAll,
} from "./menu";
import {
  AddPermissions,
  DeletePermissions,
  EditPermissions,
  getPermissionsAll,
} from "./permission";
import { getRolesAll } from "./role";

export const getMenuCatalog = getMenusAll;
export const createMenuCatalog = AddMenus;
export const updateMenuCatalog = EditMenus;
export const deleteMenuCatalog = DeleteMenus;

export const getPermissionCatalog = getPermissionsAll;
export const createPermission = AddPermissions;
export const updatePermission = EditPermissions;
export const deletePermission = DeletePermissions;

export const getAppRoles = getRolesAll;

export const getAccessRoles = async (params, config = {}) => {
  const response = await axiosAccessMutationConfig.get("/api/roles/", {
    params,
    ...config,
  });
  return response;
};

export const getRolePermissionsByRoleId = async (
  roleId,
  params,
  config = {},
) => {
  const response = await axiosConfig.get(`/auth/roles/${roleId}/permissions/`, {
    params,
    ...config,
  });
  return response;
};

export const getAppRolePermissionsByRoleId = async (
  roleId,
  params,
  config = {},
) => {
  const response = await axiosAccessMutationConfig.get(
    `/api/roles/${roleId}/permissions/`,
    {
      params,
      ...config,
    },
  );
  return response;
};

export const syncRolePermissionsByRoleId = async (roleId, permissions) => {
  const response = await axiosConfig.put(`/auth/roles/${roleId}/permissions/`, {
    permissions,
  });
  return response;
};
