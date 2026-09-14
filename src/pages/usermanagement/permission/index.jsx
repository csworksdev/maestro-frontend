import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import {
  createPermission,
  deletePermission,
  getAppRolePermissionsByRoleId,
  getAppRoles,
  getAccessRoles,
  getPermissionCatalog,
  getRolePermissionsByRoleId,
  syncRolePermissionsByRoleId,
  updatePermission,
} from "@/axios/userManagement/access";
import { useAuthStore } from "@/redux/slicers/authSlice";
import {
  extractList,
  hasAnyPermission,
} from "@/utils/accessControl";
import { isSuperuserRole } from "@/utils/sidebarPreviewMenu";

const LIST_PARAMS = {
  page: 1,
  page_size: 100,
};
const PERMISSION_LIST_PARAMS = {
  page: 1,
  page_size: 10,
};
const PERMISSION_ACTIONS = [
  { key: "view", label: "View", icon: "heroicons-outline:eye" },
  { key: "add", label: "Add", icon: "heroicons-outline:plus" },
  { key: "change", label: "Edit", icon: "heroicons-outline:pencil-square" },
  { key: "delete", label: "Delete", icon: "heroicons-outline:trash" },
];

const PERMISSION_BUILDER_PERMISSIONS = {
  change: ["change_group", "change_permission"],
};

const stringifyErrorData = (data) => {
  if (!data || typeof data !== "object") return "";

  return Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: ${value.join(", ")}`;
      if (value && typeof value === "object") {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    })
    .join("\n");
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.detail ||
  stringifyErrorData(error?.response?.data) ||
  error?.message ||
  fallback;

const getResponsePayload = (response) => response?.data ?? response;

const getResponseHeader = (response, headerName) => {
  const headers = response?.headers;
  return (
    headers?.[headerName] ||
    headers?.[headerName.toLowerCase()] ||
    headers?.get?.(headerName) ||
    ""
  );
};

const assertJsonResponse = (response, resourceName) => {
  const payload = getResponsePayload(response);
  const contentType = String(getResponseHeader(response, "content-type")).toLowerCase();
  const ngrokErrorCode = getResponseHeader(response, "ngrok-error-code");

  if (
    typeof payload === "string" ||
    contentType.includes("text/html") ||
    ngrokErrorCode
  ) {
    throw new Error(
      ngrokErrorCode
        ? `${resourceName} mengembalikan HTML dari ngrok (${ngrokErrorCode}), bukan JSON.`
        : `${resourceName} mengembalikan HTML, bukan JSON.`,
    );
  }
};

const getNextPage = (response) => {
  const payload = getResponsePayload(response);
  return (
    payload?.next ??
    payload?.data?.next ??
    payload?.pagination?.next ??
    payload?.data?.pagination?.next ??
    null
  );
};

const extractResponseList = (response, resourceKey) => {
  const payload = getResponsePayload(response);

  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data?.data?.results)) return payload.data.data.results;
  if (resourceKey && Array.isArray(payload?.[resourceKey])) {
    return payload[resourceKey];
  }
  if (resourceKey && Array.isArray(payload?.data?.[resourceKey])) {
    return payload.data[resourceKey];
  }
  if (resourceKey && Array.isArray(payload?.data?.data?.[resourceKey])) {
    return payload.data.data[resourceKey];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload)) return payload;

  return extractList(payload);
};

const formatModuleName = (value) =>
  String(value || "other")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeRoleId = (role) => String(role?.id ?? role?.role_id ?? "");
const getRoleName = (role) => role?.name || role?.role_name || "Role";

const getPermissionRawCode = (permission) =>
  permission?.codename ||
  permission?.permission ||
  permission?.permission_code ||
  permission?.code ||
  "";

const getPermissionCode = (permission) => {
  const rawCode = String(getPermissionRawCode(permission)).trim();
  const parts = rawCode.split(".");
  return parts[parts.length - 1] || rawCode || String(permission?.name || "");
};

const getPermissionAction = (permission) => {
  const code = getPermissionCode(permission).toLowerCase();
  return (
    PERMISSION_ACTIONS.find((action) => code.startsWith(`${action.key}_`))?.key ||
    "other"
  );
};

const getPermissionModule = (permission) => {
  const explicitModel =
    permission?.content_type_model ||
    permission?.content_type ||
    permission?.model ||
    permission?.content_type_app_label ||
    permission?.app_label ||
    "";

  if (explicitModel) return String(explicitModel).toLowerCase();

  const rawCode = String(getPermissionRawCode(permission)).trim();
  const namespace = rawCode.includes(".") ? rawCode.split(".")[0] : "";
  if (namespace) return namespace.toLowerCase();

  const code = getPermissionCode(permission).toLowerCase();
  const action = getPermissionAction(permission);
  return action === "other" ? "other" : code.replace(`${action}_`, "") || "other";
};

const getPermissionKey = (permission) =>
  String(permission?.id ?? getPermissionRawCode(permission) ?? permission?.name);

const normalizePermissionItem = (permission) => {
  const code = getPermissionCode(permission);
  const module = getPermissionModule(permission);
  const action = getPermissionAction(permission);
  const id = getPermissionKey(permission);

  return {
    ...permission,
    content_type: permission?.content_type || permission?.content_type_model || module,
    id,
    code,
    action,
    module,
    name: permission?.name || formatModuleName(code),
  };
};

const uniq = (items = []) => [...new Set(items.map(String).filter(Boolean))];

const normalizePermissionIdForPayload = (id) => {
  const value = String(id ?? "").trim();
  if (!value) return null;
  return /^\d+$/.test(value) ? Number(value) : value;
};

const requestRoles = async () => {
  let primaryError;

  try {
    const response = await getAccessRoles(LIST_PARAMS);
    assertJsonResponse(response, "Role");
    return response;
  } catch (error) {
    primaryError = error;
  }

  try {
    const response = await getAppRoles(LIST_PARAMS);
    assertJsonResponse(response, "Role");
    return response;
  } catch {
    throw primaryError;
  }
};

const requestPermissionPage = async (page) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await getPermissionCatalog({ ...PERMISSION_LIST_PARAMS, page });
      assertJsonResponse(response, "Katalog permission");
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
  }
  throw lastError;
};

const requestRolePermissionPage = async (roleId, page) => {
  let primaryError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await getRolePermissionsByRoleId(roleId, {
        ...PERMISSION_LIST_PARAMS,
        page,
      });
      assertJsonResponse(response, "Permission role");
      return response;
    } catch (error) {
      primaryError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
  }

  const fallbackResponse = await getAppRolePermissionsByRoleId(roleId, {
    ...PERMISSION_LIST_PARAMS,
    page,
  });
  assertJsonResponse(fallbackResponse, "Permission role");
  return fallbackResponse;
};

const loadAllPermissionCatalog = async ({ startPage = 1, initialItems = [] } = {}) => {
  const items = [...initialItems];
  let page = startPage;
  let failedPage = null;

  while (page <= 100) {
    let response;
    try {
      response = await requestPermissionPage(page);
      assertJsonResponse(response, "Katalog permission");
    } catch {
      failedPage = page;
      break;
    }
    const pageItems = extractResponseList(response, "permissions");
    items.push(...pageItems);
    if (!pageItems.length) break;
    if (!getNextPage(response)) break;
    page += 1;
  }

  return { items, failedPage };
};

const loadAllRolePermissions = async (roleId) => {
  const items = [];
  let page = PERMISSION_LIST_PARAMS.page;

  while (page <= 100) {
    const response = await requestRolePermissionPage(roleId, page);
    const pageItems = extractResponseList(response, "permissions");
    items.push(...pageItems);
    if (!pageItems.length || !getNextPage(response)) break;
    page += 1;
  }

  return items;
};

const buildModuleGroups = (permissions = []) => {
  const groups = new Map();

  permissions.forEach((permission) => {
    if (!groups.has(permission.module)) {
      groups.set(permission.module, {
        key: permission.module,
        label: formatModuleName(permission.module),
        permissions: [],
        actions: {},
      });
    }

    const group = groups.get(permission.module);
    group.permissions.push(permission);
    if (permission.action !== "other" && !group.actions[permission.action]) {
      group.actions[permission.action] = permission;
    }
  });

  return [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const getPermissionReferenceId = (permission) => {
  if (typeof permission === "string" || typeof permission === "number") {
    return permission;
  }

  return (
    permission?.permission_id ??
    permission?.permission?.id ??
    permission?.permission?.permission_id ??
    permission?.id ??
    permission?.pk ??
    ""
  );
};

const PermissionToggle = ({
  checked,
  disabled,
  label,
  icon,
  onChange,
  onEdit,
  onDelete,
}) => {
  const canToggle = Boolean(onChange) && !disabled;

  const handleKeyDown = (event) => {
    if (!canToggle) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onChange();
    }
  };

  const handleActionClick = (event, callback) => {
    event.stopPropagation();
    if (!disabled && callback) callback();
  };

  return (
    <div
      role={canToggle ? "button" : undefined}
      tabIndex={canToggle ? 0 : -1}
      aria-pressed={canToggle ? checked : undefined}
      onClick={canToggle ? onChange : undefined}
      onKeyDown={handleKeyDown}
      title={label}
      className={`group relative flex min-h-[116px] w-full flex-col justify-between overflow-hidden rounded border p-3 text-left text-sm transition ${
        checked
          ? "border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-500/10 dark:text-primary-200"
          : "border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      } ${
        disabled
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-50 dark:bg-slate-900 ${
            checked ? "text-primary-600 dark:text-primary-200" : "text-slate-400"
          }`}
        >
          <Icon icon={icon} className="text-lg" />
        </span>
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            checked
              ? "border-primary-500 bg-primary-500"
              : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900"
          }`}
        >
          {checked && (
            <Icon icon="heroicons-outline:check" className="text-white" />
          )}
        </span>
      </div>

      <div className="mt-3 min-w-0">
        <div className="truncate font-semibold leading-5 text-current">
          {label}
        </div>
        <div className="mt-1 text-[11px] uppercase tracking-normal text-slate-400">
          {checked ? "Active" : "Inactive"}
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
          <button
            type="button"
            disabled={disabled || !onEdit}
            onClick={(event) => handleActionClick(event, onEdit)}
            title="Edit permission"
            className="inline-flex h-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 transition hover:border-primary-300 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
          >
            <Icon icon="heroicons-outline:pencil-square" />
          </button>
          <button
            type="button"
            disabled={disabled || !onDelete}
            onClick={(event) => handleActionClick(event, onDelete)}
            title="Delete permission"
            className="inline-flex h-8 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 transition hover:border-danger-300 hover:text-danger-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900"
          >
            <Icon icon="heroicons-outline:trash" />
          </button>
        </div>
      )}
    </div>
  );
};

const Permissions = () => {
  const userData = useAuthStore((state) => state.data);
  const rolesValue = useAuthStore((state) => state.data?.roles);
  const rawRolesValue = useAuthStore((state) => state.data?.raw_roles);
  const userRoleIds = useAuthStore((state) => state.data?.role_ids);
  const roleIds = useAuthStore((state) => state.roleIds);
  const permissionCodes = useAuthStore((state) => state.permissionCodes);
  const accessLoaded = useAuthStore((state) => state.accessLoaded);
  const accessError = useAuthStore((state) => state.accessError);
  const roleMenuPreviewRoleId = useAuthStore(
    (state) => state.roleMenuPreviewRoleId,
  );

  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCatalogLoadingMore, setIsCatalogLoadingMore] = useState(false);
  const [isRolePermissionsLoading, setIsRolePermissionsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [permissionForm, setPermissionForm] = useState({
    name: "",
    codename: "",
    content_type: "",
  });
  const [editingPermissionId, setEditingPermissionId] = useState("");
  const rolePermissionRequestRef = useRef(0);
  const lastLoadedRoleIdRef = useRef("");
  const isDirtyRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  const selectedRole = useMemo(
    () =>
      roles.find((role) => normalizeRoleId(role) === String(selectedRoleId)) || {
        id: selectedRoleId,
        name: Array.isArray(rolesValue) ? rolesValue[0] : rolesValue || "Role",
      },
    [roles, rolesValue, selectedRoleId],
  );

  const shouldEnforcePermissions =
    accessLoaded && !accessError && permissionCodes.length > 0;
  const currentUserRoleIds = uniq([].concat(roleIds || [], userRoleIds || []));
  const isSuperuser = isSuperuserRole(
    rawRolesValue ?? userData?.raw_roles ?? rolesValue,
    currentUserRoleIds,
  );
  const canChangePermission =
    isSuperuser ||
    !shouldEnforcePermissions ||
    hasAnyPermission(permissionCodes, PERMISSION_BUILDER_PERMISSIONS.change);
  const isPermissionInteractionDisabled =
    isRolePermissionsLoading || !canChangePermission;

  const allPermissions = useMemo(
    () =>
      catalog
        .map(normalizePermissionItem)
        .filter((permission, index, list) => {
          const code = getPermissionCode(permission);
          return list.findIndex((item) => getPermissionCode(item) === code) === index;
        }),
    [catalog],
  );

  const selectedSet = useMemo(
    () => new Set(selectedIds.map(String)),
    [selectedIds],
  );
  const moduleGroups = useMemo(
    () => buildModuleGroups(allPermissions),
    [allPermissions],
  );
  const moduleOptions = useMemo(
    () => moduleGroups.map((group) => ({ value: group.key, label: group.label })),
    [moduleGroups],
  );

  const visibleGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return moduleGroups
      .filter((group) => moduleFilter === "all" || group.key === moduleFilter)
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => {
          if (!query) return true;
          return [
            permission.name,
            permission.code,
            permission.module,
            permission.action,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);
        }),
      }))
      .filter((group) => group.permissions.length);
  }, [moduleGroups, moduleFilter, searchQuery]);

  const resolveRolePermissionIds = useCallback(async (roleId, normalizedCatalog) => {
    if (!roleId) {
      return [];
    }

    const rolePermissions = await loadAllRolePermissions(roleId);
    const catalogByCode = new Map(
      normalizedCatalog.map((permission) => [
        getPermissionCode(permission).toLowerCase(),
        permission,
      ]),
    );
    const catalogById = new Map(
      normalizedCatalog.map((permission) => [String(permission.id), permission]),
    );
    const nextIds = rolePermissions
      .map((permission) => {
        const permissionData =
          permission?.permission && typeof permission.permission === "object"
            ? permission.permission
            : permission;
        const normalizedPermission = normalizePermissionItem(permissionData);
        const code = getPermissionCode(normalizedPermission).toLowerCase();
        const matchByCode = code ? catalogByCode.get(code) : null;
        if (matchByCode) return matchByCode.id;

        const referenceId = String(getPermissionReferenceId(permission));
        return catalogById.get(referenceId)?.id;
      })
      .filter(Boolean);
    return uniq(nextIds);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const [rolesResponse, firstPermissionResponse] = await Promise.all([
          requestRoles(),
          requestPermissionPage(PERMISSION_LIST_PARAMS.page),
        ]);

        if (!isMounted) return;

        assertJsonResponse(rolesResponse, "Role");
        assertJsonResponse(firstPermissionResponse, "Katalog permission");
        const nextRoles = extractResponseList(rolesResponse, "roles");
        const firstPageItems = extractResponseList(
          firstPermissionResponse,
          "permissions",
        );
        const nextCatalog = firstPageItems.map(normalizePermissionItem);

        setRoles(nextRoles);
        setCatalog(nextCatalog);
        setIsLoading(false);
        setIsCatalogLoadingMore(true);

        loadAllPermissionCatalog({
          startPage: PERMISSION_LIST_PARAMS.page + 1,
          initialItems: firstPageItems,
        })
          .then((catalogResult) => {
            if (!isMounted) return;
            const completeCatalog = catalogResult.items.map(normalizePermissionItem);
            setCatalog(completeCatalog);
            if (catalogResult.failedPage) {
              setLoadError(
                `Sebagian katalog permission gagal dimuat dari backend (halaman ${catalogResult.failedPage}). Data yang berhasil tetap ditampilkan.`,
              );
            }
          })
          .catch((error) => {
            if (!isMounted) return;
            setLoadError(
              getErrorMessage(
                error,
                "Sebagian katalog permission gagal dimuat dari backend.",
              ),
            );
          })
          .finally(() => {
            if (isMounted) setIsCatalogLoadingMore(false);
          });
      } catch (error) {
        if (isMounted) {
          setLoadError(getErrorMessage(error, "Gagal mengambil data permission dari backend."));
          setRoles([]);
          setCatalog([]);
          setSelectedIds([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsDirty(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!roles.length) return;

    const preferredRoleIds = uniq([
      roleMenuPreviewRoleId,
      ...(roleIds || []),
      ...(userRoleIds || []),
    ]);
    setSelectedRoleId((currentRoleId) => {
      if (currentRoleId && roles.some((role) => normalizeRoleId(role) === currentRoleId)) {
        return currentRoleId;
      }
      const preferredRoleId = preferredRoleIds.find((roleId) =>
        roles.some((role) => normalizeRoleId(role) === String(roleId)),
      );
      return preferredRoleId || normalizeRoleId(roles[0]);
    });
  }, [roleIds, roleMenuPreviewRoleId, roles, userRoleIds]);

  useEffect(() => {
    if (!selectedRoleId) {
      setSelectedIds([]);
      isDirtyRef.current = false;
      setIsDirty(false);
      lastLoadedRoleIdRef.current = "";
      return undefined;
    }

    if (!catalog.length) {
      return undefined;
    }

    let isMounted = true;
    const requestId = rolePermissionRequestRef.current + 1;
    rolePermissionRequestRef.current = requestId;
    const isRoleChanged = lastLoadedRoleIdRef.current !== selectedRoleId;

    if (isRoleChanged) {
      lastLoadedRoleIdRef.current = selectedRoleId;
      setSelectedIds([]);
      isDirtyRef.current = false;
      setIsDirty(false);
    } else if (isDirtyRef.current) {
      return undefined;
    }

    setIsRolePermissionsLoading(true);
    setLoadError("");

    resolveRolePermissionIds(selectedRoleId, catalog)
      .then((nextIds) => {
        if (!isMounted || rolePermissionRequestRef.current !== requestId) return;
        if (!isRoleChanged && isDirtyRef.current) return;
        setSelectedIds(nextIds);
        isDirtyRef.current = false;
        setIsDirty(false);
      })
      .catch((error) => {
        if (!isMounted || rolePermissionRequestRef.current !== requestId) return;
        console.error("Failed to load role permissions:", error);
        setSelectedIds([]);
        isDirtyRef.current = false;
        setIsDirty(false);
        setLoadError(
          getErrorMessage(
            error,
            "Gagal mengambil permission untuk role yang dipilih dari backend.",
          ),
        );
      })
      .finally(() => {
        if (isMounted && rolePermissionRequestRef.current === requestId) {
          setIsRolePermissionsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [catalog, resolveRolePermissionIds, selectedRoleId]);

  const updateSelectedIds = (updater) => {
    setSelectedIds((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return uniq(next);
    });
    isDirtyRef.current = true;
    setIsDirty(true);
  };

  const resetPermissionForm = () => {
    setPermissionForm({ name: "", codename: "", content_type: "" });
    setEditingPermissionId("");
  };

  const refreshPermissionCatalog = async () => {
    const catalogResult = await loadAllPermissionCatalog();
    const nextCatalog = catalogResult.items.map(normalizePermissionItem);
    setCatalog(nextCatalog);
    return nextCatalog;
  };

  const refreshRolePermissions = useCallback(
    async (roleId = selectedRoleId, normalizedCatalog = catalog) => {
      if (!roleId) {
        setSelectedIds([]);
        isDirtyRef.current = false;
        setIsDirty(false);
        return [];
      }

      const requestId = rolePermissionRequestRef.current + 1;
      rolePermissionRequestRef.current = requestId;
      setIsRolePermissionsLoading(true);

      try {
        const nextIds = await resolveRolePermissionIds(roleId, normalizedCatalog);
        if (rolePermissionRequestRef.current === requestId) {
          setSelectedIds(nextIds);
          isDirtyRef.current = false;
          setIsDirty(false);
          setLoadError("");
        }
        return nextIds;
      } finally {
        if (rolePermissionRequestRef.current === requestId) {
          setIsRolePermissionsLoading(false);
        }
      }
    },
    [catalog, resolveRolePermissionIds, selectedRoleId],
  );

  const handlePermissionEdit = (permission) => {
    setEditingPermissionId(String(permission.id));
    setPermissionForm({
      name: permission.name || "",
      codename: permission.codename || permission.code || "",
      content_type:
        permission.content_type || permission.content_type_model || permission.module || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePermissionSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const payload = {
      name: permissionForm.name.trim(),
      codename: permissionForm.codename.trim(),
      content_type: permissionForm.content_type.trim(),
    };
    if (!payload.name || !payload.codename || !payload.content_type) {
      Swal.fire("Data belum lengkap", "Name, codename, dan content_type wajib diisi.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      if (editingPermissionId) {
        await updatePermission(editingPermissionId, payload);
        Swal.fire("Updated!", "Permission berhasil diperbarui di backend.", "success");
      } else {
        await createPermission(payload);
        Swal.fire("Created!", "Permission berhasil dibuat di backend.", "success");
      }
      const nextCatalog = await refreshPermissionCatalog();
      await refreshRolePermissions(selectedRoleId, nextCatalog);
      resetPermissionForm();
    } catch (error) {
      Swal.fire(
        "Error!",
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Gagal menyimpan permission ke backend.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionDelete = async (permission) => {
    const permissionId = permission?.id;
    if (!permissionId || isSaving) return;

    const result = await Swal.fire({
      title: "Delete permission?",
      text: `${permission.name || permission.code} akan dihapus dari backend.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;

    setIsSaving(true);
    try {
      await deletePermission(permissionId);
      const nextCatalog = await refreshPermissionCatalog();
      await refreshRolePermissions(selectedRoleId, nextCatalog);
      setSelectedIds((current) =>
        current.filter((id) => String(id) !== String(permissionId)),
      );
      if (String(editingPermissionId) === String(permissionId)) resetPermissionForm();
      Swal.fire("Deleted!", "Permission berhasil dihapus dari backend.", "success");
    } catch (error) {
      Swal.fire(
        "Error!",
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Gagal menghapus permission dari backend.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePermission = (permissionId) => {
    updateSelectedIds((current) => {
      const key = String(permissionId);
      return current.map(String).includes(key)
        ? current.filter((item) => String(item) !== key)
        : [...current, key];
    });
  };

  const handleToggleModule = (group, checked) => {
    const ids = group.permissions.map((permission) => String(permission.id));
    updateSelectedIds((current) => {
      const currentSet = new Set(current.map(String));
      ids.forEach((id) => {
        if (checked) currentSet.add(id);
        else currentSet.delete(id);
      });
      return [...currentSet];
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;

    setIsSaving(true);
    try {
      await syncRolePermissionsByRoleId(
        selectedRoleId,
        selectedIds.map(normalizePermissionIdForPayload).filter((id) => id !== null),
      );
      await refreshRolePermissions(selectedRoleId, catalog);
      setIsDirty(false);
      Swal.fire("Saved!", "Permission berhasil disimpan ke backend.", "success");
    } catch (error) {
      console.error("Failed to sync role permissions:", error);
      isDirtyRef.current = true;
      setIsDirty(true);
      Swal.fire(
        "Error!",
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Gagal menyimpan permission ke backend.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPermissions = () => {
    setIsRolePermissionsLoading(true);
    refreshRolePermissions(selectedRoleId, catalog)
      .then(() => {
        setIsDirty(false);
        setLoadError("");
      })
      .catch((error) => {
        console.error("Failed to reset role permissions:", error);
        setLoadError(
          getErrorMessage(
            error,
            "Gagal mengambil ulang permission untuk role yang dipilih dari backend.",
          ),
        );
      })
      .finally(() => setIsRolePermissionsLoading(false));
  };

  return (
    <div className="grid grid-cols-1">
      <Card
        bodyClass="overflow-hidden p-0"
        title="User Permission Builder"
        subtitle={
          "Atur permission per role langsung dari data backend."
        }
        headerslot={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              text="Reset"
              icon="heroicons-outline:arrow-path"
              className="btn-outline-secondary"
              disabled={isLoading || isRolePermissionsLoading}
              onClick={handleResetPermissions}
            />
            <Button
              text={isDirty ? "Sync Permission" : "Synced"}
              icon="heroicons-outline:check"
              className="btn-primary"
              isLoading={isSaving}
              disabled={
                isLoading ||
                isRolePermissionsLoading ||
                isSaving ||
                !canChangePermission
              }
              onClick={handleSavePermissions}
            />
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-0 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="min-w-0 border-b border-slate-200 p-4 dark:border-slate-700 sm:p-5 xl:border-b-0 xl:border-r">
            <form
              onSubmit={handlePermissionSubmit}
              className="rounded border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {editingPermissionId ? "Edit Permission" : "Create Permission"}
                </div>
                {editingPermissionId && <button type="button" onClick={resetPermissionForm} className="text-xs text-slate-500 hover:text-primary-500">Cancel</button>}
              </div>
              <div className="space-y-3">
                {[
                  ["name", "Name", "Can Edit"],
                  ["codename", "Codename", "change_example"],
                  ["content_type", "Content Type", "example"],
                ].map(([field, label, placeholder]) => (
                  <label key={field} className="block">
                    <span className="mb-1 block text-xs font-medium uppercase text-slate-500">{label}</span>
                    <input
                      className="form-control w-full"
                      value={permissionForm[field]}
                      placeholder={placeholder}
                      onChange={(event) => setPermissionForm((current) => ({ ...current, [field]: event.target.value }))}
                    />
                  </label>
                ))}
                <Button
                  type="submit"
                  text={editingPermissionId ? "Update Permission" : "Create Permission"}
                  icon={editingPermissionId ? "heroicons-outline:pencil-square" : "heroicons-outline:plus"}
                  className="btn-dark w-full"
                  isLoading={isSaving}
                  disabled={isPermissionInteractionDisabled}
                />
              </div>
            </form>

            <div className="mt-5 rounded border border-slate-200 p-4 dark:border-slate-700">
              <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                Role Aktif
              </label>
              <select
                className="form-control w-full"
                value={selectedRoleId}
                disabled={isLoading || !roles.length}
                onChange={(event) => setSelectedRoleId(event.target.value)}
              >
                {!roles.length && <option value="">Tidak ada role</option>}
                {roles.map((role) => (
                  <option key={normalizeRoleId(role)} value={normalizeRoleId(role)}>
                    {getRoleName(role)}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Role ini menjadi dasar data permission yang diambil dari backend.
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded bg-slate-50 p-4 dark:bg-slate-900">
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {selectedIds.length}
                </div>
                <div className="mt-1 text-xs uppercase text-slate-500">
                  Assigned
                </div>
              </div>
              <div className="rounded bg-slate-50 p-4 dark:bg-slate-900">
                <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {allPermissions.length}
                </div>
                <div className="mt-1 text-xs uppercase text-slate-500">
                  Catalog
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                  Search
                </label>
                <input
                  className="form-control w-full"
                  placeholder="Cari permission atau module"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                  Module
                </label>
                <select
                  className="form-control w-full"
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                >
                  <option value="all">All modules</option>
                  {moduleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {shouldEnforcePermissions && !canChangePermission && (
              <div className="mt-5 rounded bg-danger-50 px-3 py-2 text-xs text-danger-600 dark:bg-danger-500/10 dark:text-danger-300">
                Akun ini belum memiliki permission untuk mengubah permission
                role.
              </div>
            )}
          </aside>

          <section className="min-w-0 overflow-hidden p-4 sm:p-5">
            {loadError && (
              <div className="mb-4 rounded border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-300">
                {loadError}
              </div>
            )}

            {isLoading ? (
              <Loading />
            ) : (
              <>
                <div className="mb-4 flex flex-col gap-2 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-700 dark:text-slate-100">
                      {getRoleName(selectedRole)}
                    </span>
                    <span className="ml-2">
                      {selectedIds.length}/{allPermissions.length} permission aktif
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isCatalogLoadingMore && (
                      <span className="rounded bg-primary-50 px-2 py-1 text-primary-600 dark:bg-primary-500/10 dark:text-primary-200">
                        Memuat katalog lengkap
                      </span>
                    )}
                    {isRolePermissionsLoading && (
                      <span className="rounded bg-warning-50 px-2 py-1 text-warning-600 dark:bg-warning-500/10 dark:text-warning-200">
                        Memuat role permission
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {PERMISSION_ACTIONS.map((action) => {
                    const actionIds = allPermissions
                      .filter((permission) => permission.action === action.key)
                      .map((permission) => String(permission.id));
                    const checkedCount = actionIds.filter((id) =>
                      selectedSet.has(id),
                    ).length;
                    const allChecked =
                      actionIds.length > 0 && checkedCount === actionIds.length;

                    return (
                      <button
                        key={action.key}
                        type="button"
                        disabled={isPermissionInteractionDisabled}
                        onClick={() =>
                          updateSelectedIds((current) => {
                            const currentSet = new Set(current.map(String));
                            actionIds.forEach((id) => {
                              if (allChecked) currentSet.delete(id);
                              else currentSet.add(id);
                            });
                            return [...currentSet];
                          })
                        }
                        className="min-h-[92px] rounded border border-slate-200 bg-white p-4 text-left transition hover:border-primary-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="flex items-center justify-between">
                          <Icon
                            icon={action.icon}
                            className="text-xl text-primary-500"
                          />
                          <span className="text-xs text-slate-500">
                            {checkedCount}/{actionIds.length}
                          </span>
                        </div>
                        <div className="mt-3 font-semibold text-slate-900 dark:text-white">
                          {action.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
                  {visibleGroups.map((group) => {
                    const groupIds = group.permissions.map((permission) =>
                      String(permission.id),
                    );
                    const checkedCount = groupIds.filter((id) =>
                      selectedSet.has(id),
                    ).length;
                    const allChecked =
                      groupIds.length > 0 && checkedCount === groupIds.length;
                    return (
                      <div
                        key={group.key}
                        className="min-w-0 overflow-hidden rounded border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-slate-900 dark:text-white">
                              {group.label}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {checkedCount} dari {groupIds.length} permission
                              aktif
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={isPermissionInteractionDisabled}
                            onClick={() => handleToggleModule(group, !allChecked)}
                            className={`h-10 shrink-0 rounded px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              allChecked
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
                                : "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-200"
                            }`}
                          >
                            {allChecked ? "Clear Module" : "Select Module"}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 min-[1500px]:grid-cols-4">
                          {PERMISSION_ACTIONS.map((action) => {
                            const permission = group.actions[action.key];
                            return (
                              <PermissionToggle
                                key={action.key}
                                label={action.label}
                                icon={action.icon}
                                disabled={
                                  !permission || isPermissionInteractionDisabled
                                }
                                checked={
                                  permission
                                    ? selectedSet.has(String(permission.id))
                                    : false
                                }
                                onChange={() =>
                                  permission &&
                                  handleTogglePermission(permission.id)
                                }
                                onEdit={
                                  permission
                                    ? () => handlePermissionEdit(permission)
                                    : undefined
                                }
                                onDelete={
                                  permission
                                    ? () => handlePermissionDelete(permission)
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>

                        {group.permissions.some(
                          (permission) => permission.action === "other",
                        ) && (
                          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
                            <div className="mb-2 text-xs font-medium uppercase text-slate-500">
                              Other Permissions
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {group.permissions
                                .filter(
                                  (permission) => permission.action === "other",
                                )
                                .map((permission) => (
                                  <PermissionToggle
                                    key={permission.id}
                                    label={permission.name}
                                    icon="heroicons-outline:shield-check"
                                    disabled={isPermissionInteractionDisabled}
                                    checked={selectedSet.has(
                                      String(permission.id),
                                    )}
                                    onChange={() =>
                                      handleTogglePermission(permission.id)
                                    }
                                    onEdit={() => handlePermissionEdit(permission)}
                                    onDelete={() => handlePermissionDelete(permission)}
                                  />
                                ))}
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {!visibleGroups.length && (
                  <div className="flex min-h-[260px] items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                    Tidak ada permission yang sesuai filter.
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
};

export default Permissions;
