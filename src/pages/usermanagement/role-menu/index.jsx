import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import {
  addRoleMenuByRoleId,
  createMenuCatalog,
  deleteMenuCatalog,
  deleteRoleMenuByRoleId,
  getAccessRoles,
  getAppRoles,
  getMenuCatalog,
  getRoleMenusByRoleId,
  reorderRoleMenusByRoleId,
  updateMenuCatalog,
  updateRoleMenuByRoleId,
} from "@/axios/userManagement/access";
import { extractList, mapBackendMenuToSidebar } from "@/utils/accessControl";
import { useAuthStore } from "@/redux/slicers/authSlice";
import {
  applyRoleMenuTreeOrder,
  findRoleMenuNode,
  flattenRoleMenuTree,
  getRoleMenuType,
  getRoleMenuAssignmentId,
  getRoleMenuNodeId,
  isRoleMenuDividerNode,
  isRoleMenuGroupNode,
  moveRoleMenuNode,
  moveRoleMenuNodeByOffset,
  moveRoleMenuNodeIntoParent,
  normalizeRoleMenuTree,
  promoteRoleMenuNode,
  removeRoleMenuNode,
} from "@/utils/roleMenuTree";
import { loadAuthenticatedAccess } from "@/services/authAccess";

const LIST_PARAMS = { page: 1, page_size: 100 };

const EMPTY_MENU_FORM = {
  name: "",
  code: "",
  route: "",
  icon: "",
  menu_type: "LINK",
  is_active: true,
};

const EMPTY_ROLE_MENU_FORM = {
  id: "",
  parent_id: "",
  is_visible: true,
};

const getRoleId = (role) => String(role?.id ?? role?.role_id ?? "");
const getRoleName = (role) => role?.name || role?.role_name || "Role";
const getMenuId = (menu) => String(menu?.menu_id ?? menu?.id ?? "");
const getMenuName = (menu) =>
  menu?.name || menu?.menu_name || menu?.code || "Menu";

const normalizeRoleItem = (role) => ({
  ...role,
  id: role?.id ?? role?.role_id,
  name: role?.name || role?.role_name || "Role",
});

const slugifyMenuCode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildMenuIconName = (value) => {
  const slug = slugifyMenuCode(value);
  return slug ? `icon-${slug}` : "";
};

const getCatalogMenuType = (item = {}) => {
  const nestedMenu = item?.menu && typeof item.menu === "object" ? item.menu : {};
  const menuType = String(item?.menu_type || nestedMenu?.menu_type || "")
    .toUpperCase()
    .trim();
  if (
    item?.is_header ||
    item?.isHeadr ||
    nestedMenu?.is_header ||
    nestedMenu?.isHeadr ||
    menuType === "DIVIDER"
  ) {
    return "DIVIDER";
  }
  if (menuType === "GROUP") return "GROUP";
  return "LINK";
};

const isRoleMenuDivider = isRoleMenuDividerNode;
const isMenuDivider = (item) => getCatalogMenuType(item) === "DIVIDER";
const isMenuGroup = (item) => getCatalogMenuType(item) === "GROUP";

const getErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  const apiError =
    Array.isArray(data?.error) && data.error.length
      ? data.error.filter(Boolean).join(" ")
      : "";

  return (
    data?.message ||
    data?.detail ||
    apiError ||
    error?.message ||
    fallback
  );
};

const isDuplicateRoleMenuApiError = (error) =>
  /sudah dimiliki group|already.*group|duplicate/i.test(
    getErrorMessage(error, ""),
  );

const getAddRoleMenuErrorMessage = (error) => {
  const message = getErrorMessage(error, "Gagal menambahkan menu ke role.");

  if (!isDuplicateRoleMenuApiError(error)) return message;

  return `${message} Frontend tetap mengirim request add menu ke backend, tetapi API masih menolak menu yang sama pada role/group tersebut.`;
};

const hasMenuResponseShape = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  [
    "id",
    "menu_id",
    "group_menu_id",
    "name",
    "code",
    "route",
    "menu_type",
  ].some((key) => value[key] !== undefined);

const extractMutationItem = (response, fallback = {}) => {
  const data = response?.data ?? response;
  const candidates = [
    data?.data,
    data?.result,
    data?.menu,
    data?.role_menu,
    data,
  ];
  const item = candidates.find(hasMenuResponseShape) || {};
  return { ...fallback, ...item };
};

const upsertByMenuId = (items = [], menu) => {
  const menuId = getMenuId(menu);
  if (!menuId) return items;
  const exists = items.some((item) => getMenuId(item) === menuId);
  if (!exists) return [...items, menu];
  return items.map((item) =>
    getMenuId(item) === menuId ? { ...item, ...menu } : item,
  );
};

const buildMenuPayload = (form) => {
  const menuType = form.menu_type || "LINK";
  const code = slugifyMenuCode(form.code || form.name);
  const route = String(form.route || "").trim();

  return {
    name: form.name.trim(),
    code,
    menu_type: menuType,
    route:
      menuType === "DIVIDER"
        ? null
        : route || null,
    icon: menuType === "DIVIDER" ? null : form.icon.trim() || null,
    is_active: Boolean(form.is_active),
    is_header: menuType === "DIVIDER",
    isHeadr: menuType === "DIVIDER",
  };
};

const buildRoleMenuPayload = (node) => ({
  menu_id: String(node?.menu_id ?? ""),
  parent_id: node?.parent_id || null,
  sort_order: Number(node?.sort_order || 1),
  is_visible: node?.is_visible !== false,
});

const buildAddRoleMenuPayload = ({ menuId, parentId, sortOrder }) => ({
  menu_id: String(menuId || ""),
  parent_id: normalizeReorderId(parentId),
  sort_order: Number(sortOrder || 1),
  is_visible: true,
});

const normalizeReorderId = (value) => {
  if (value == null || value === "") return null;
  const normalized = String(value).trim();
  return /^\d+$/.test(normalized) ? Number(normalized) : normalized;
};

const buildReorderRows = (items = [], parentAssignmentId = null) =>
  items.reduce(
    (result, item, index) => {
      const assignmentId = getRoleMenuAssignmentId(item);
      const label = item?.name || item?.menu_name || item?.code || "Menu";

      if (!assignmentId) {
        return {
          rows: result.rows,
          invalidItems: [...result.invalidItems, label],
        };
      }

      const childResult = buildReorderRows(item.children || [], assignmentId);

      return {
        rows: [
          ...result.rows,
          {
            id: normalizeReorderId(assignmentId),
            parent_id: normalizeReorderId(parentAssignmentId),
            sort_order: index + 1,
          },
          ...childResult.rows,
        ],
        invalidItems: [...result.invalidItems, ...childResult.invalidItems],
      };
    },
    { rows: [], invalidItems: [] },
  );

const buildReorderPayload = (tree) => {
  const result = buildReorderRows(tree);
  return {
    payload: {
      items: result.rows,
    },
    invalidItems: result.invalidItems,
  };
};

const appendNodeToTree = (items = [], parentId, node) => {
  if (!parentId) return [...items, { ...node, parent_id: null }];

  return items.map((item) => {
    if (getRoleMenuNodeId(item) === String(parentId)) {
      return {
        ...item,
        children: [...(item.children || []), { ...node, parent_id: parentId }],
      };
    }

    return {
      ...item,
      children: appendNodeToTree(item.children || [], parentId, node),
    };
  });
};

const replaceRoleMenuNodeById = (items = [], targetId, replacement) =>
  items.map((item) => {
    if (getRoleMenuNodeId(item) === String(targetId)) {
      return {
        ...item,
        ...replacement,
        children: replacement.children || item.children || [],
      };
    }

    return {
      ...item,
      children: replaceRoleMenuNodeById(
        item.children || [],
        targetId,
        replacement,
      ),
    };
  });

const updateRoleMenuNodeById = (items = [], targetId, patch) =>
  items.map((item) => {
    if (getRoleMenuNodeId(item) === String(targetId)) {
      return { ...item, ...patch };
    }

    return {
      ...item,
      children: updateRoleMenuNodeById(item.children || [], targetId, patch),
    };
  });

const removeMenuIdFromTree = (items = [], menuId) =>
  items.reduce((nextItems, item) => {
    if (String(item.menu_id) === String(menuId)) return nextItems;

    nextItems.push({
      ...item,
      children: removeMenuIdFromTree(item.children || [], menuId),
    });
    return nextItems;
  }, []);

const updateMenuDetailsInTree = (items = [], menuId, payload) =>
  items.map((item) => ({
    ...item,
    ...(String(item.menu_id) === String(menuId) ? payload : {}),
    children: updateMenuDetailsInTree(item.children || [], menuId, payload),
  }));

const createOptimisticRoleMenuNode = (menu, parentId, sortOrder) => {
  const menuId = getMenuId(menu);
  const id = `temp-${menuId}-${Date.now()}`;
  const menuType = getCatalogMenuType(menu);

  return {
    ...menu,
    id,
    group_menu_id: id,
    menu_id: menuId,
    name: getMenuName(menu),
    menu_type: menuType,
    route: menuType === "DIVIDER" ? null : menu.route || null,
    icon: menuType === "DIVIDER" ? null : menu.icon || null,
    is_header: menuType === "DIVIDER",
    isHeadr: menuType === "DIVIDER",
    parent_id: parentId || null,
    sort_order: sortOrder,
    is_visible: true,
    children: [],
  };
};

const containsNodeId = (item, targetId) =>
  (item?.children || []).some(
    (child) =>
      getRoleMenuNodeId(child) === String(targetId) ||
      containsNodeId(child, targetId),
  );

const flattenParentOptions = (
  items = [],
  { depth = 0, excludeId = "", excludeChildrenOf = null } = {},
) =>
  items.flatMap((item) => {
    const nodeId = getRoleMenuNodeId(item);
    const isExcluded =
      nodeId === String(excludeId) ||
      (excludeChildrenOf && containsNodeId(excludeChildrenOf, nodeId));

    return [
      ...(isRoleMenuGroupNode(item) && !isExcluded
        ? [
            {
              id: nodeId,
              label: `${"- ".repeat(depth)}${
                item.name || item.menu_name || item.code
              }`,
            },
          ]
        : []),
      ...flattenParentOptions(item.children || [], {
        depth: depth + 1,
        excludeId,
        excludeChildrenOf,
      }),
    ];
  });

const RoleMenuNode = ({
  item,
  index,
  onEdit,
  onToggleVisible,
  onRemove,
  onMove,
  onPromote,
  isSaving,
}) => {
  const nodeId = getRoleMenuNodeId(item);
  const children = item.children || [];
  const menuType = getRoleMenuType(item);
  const isDivider = menuType === "DIVIDER";
  const isGroup = menuType === "GROUP";
  const canRenderChildren = isGroup || children.length > 0;
  const isHidden = item.is_visible === false;

  return (
    <Draggable draggableId={nodeId} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <div
            className={`mb-3 rounded border bg-white transition dark:bg-slate-800 ${
              snapshot.isDragging
                ? "border-primary-500 shadow-lg"
                : "border-slate-200 dark:border-slate-700"
            } ${isHidden ? "opacity-60" : ""}`}
          >
            <div
              className={`flex min-h-[54px] items-center gap-2 px-3 py-2 ${
                isDivider ? "bg-slate-100 dark:bg-slate-900" : ""
              }`}
            >
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-500 hover:border-primary-400 hover:bg-primary-50 active:cursor-grabbing dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-400 dark:hover:bg-slate-800"
                {...provided.dragHandleProps}
                title="Drag untuk memindahkan menu"
                onKeyDown={(event) => {
                  provided.dragHandleProps.onKeyDown(event);
                  if (event.defaultPrevented) return;

                  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                    event.preventDefault();
                    onMove(item, event.key === "ArrowUp" ? -1 : 1);
                  }
                  if (event.key === "Tab" && event.shiftKey && !isDivider) {
                    event.preventDefault();
                    onPromote(item);
                  }
                }}
              >
                <Icon icon="heroicons-outline:bars-3" />
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                  onClick={() => onMove(item, -1)}
                  disabled={isSaving}
                  title="Pindah ke atas"
                  aria-label="Pindah menu ke atas"
                >
                  <Icon icon="heroicons-outline:chevron-up" />
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                  onClick={() => onMove(item, 1)}
                  disabled={isSaving}
                  title="Pindah ke bawah"
                  aria-label="Pindah menu ke bawah"
                >
                  <Icon icon="heroicons-outline:chevron-down" />
                </button>
                {!isDivider && (
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700"
                    onClick={() => onPromote(item)}
                    disabled={isSaving}
                    title="Keluar dari submenu"
                    aria-label="Pindah menu ke level parent"
                  >
                    <Icon icon="heroicons-outline:arrow-up-left" />
                  </button>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {item.name || item.menu_name || item.code}
                </div>
                <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  {menuType}
                  {!isDivider && ` - ${item.route || item.code || "no route"}`} - #
                  {item.sort_order}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  onClick={() => onToggleVisible(item)}
                  disabled={isSaving}
                  title={isHidden ? "Show menu" : "Hide menu"}
                >
                  <Icon
                    icon={
                      isHidden
                        ? "heroicons-outline:eye-slash"
                        : "heroicons-outline:eye"
                    }
                  />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  onClick={() => onEdit(item)}
                  disabled={isSaving}
                  title="Edit assignment"
                >
                  <Icon icon="heroicons-outline:pencil-square" />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-danger-200 text-danger-500 hover:bg-danger-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-danger-500/40"
                  onClick={() => onRemove(item)}
                  disabled={isSaving}
                  title="Remove from role"
                >
                  <Icon icon="heroicons-outline:trash" />
                </button>
              </div>
            </div>

            {!isDivider && canRenderChildren && (
              <Droppable
                droppableId={`children:${nodeId}`}
                type="ROLE_MENU"
                isCombineEnabled
                isDropDisabled={!isGroup || isSaving}
              >
                {(dropProvided, dropSnapshot) => (
                  <div
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    className={`mx-3 mb-3 min-h-[46px] rounded border border-dashed p-2 transition ${
                      dropSnapshot.isDraggingOver
                        ? "border-primary-500 bg-primary-50 dark:bg-slate-700"
                        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    {children.length ? (
                      children.map((child, childIndex) => (
                        <RoleMenuNode
                          key={getRoleMenuNodeId(child)}
                          item={child}
                          index={childIndex}
                          onEdit={onEdit}
                          onToggleVisible={onToggleVisible}
                          onRemove={onRemove}
                          onMove={onMove}
                          onPromote={onPromote}
                          isSaving={isSaving}
                        />
                      ))
                    ) : (
                      <div className="flex min-h-[28px] items-center justify-center px-2 py-1 text-center text-[11px] text-slate-400">
                        {isGroup
                          ? "Lepaskan di area ini untuk menjadikan menu sebagai child."
                          : "LINK tidak menerima submenu baru."}
                      </div>
                    )}
                    {dropProvided.placeholder}
                  </div>
                )}
              </Droppable>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const RoleMenuBuilder = () => {
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [roleMenuTree, setRoleMenuTree] = useState([]);
  const [menuForm, setMenuForm] = useState(EMPTY_MENU_FORM);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [isMenuCrudOpen, setIsMenuCrudOpen] = useState(false);
  const [roleMenuForm, setRoleMenuForm] = useState(EMPTY_ROLE_MENU_FORM);
  const [isRoleMenuEditOpen, setIsRoleMenuEditOpen] = useState(false);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isRoleMenuLoading, setIsRoleMenuLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");
  const setRoleMenuPreview = useAuthStore((state) => state.setRoleMenuPreview);
  const roleMenuPreviewRoleId = useAuthStore(
    (state) => state.roleMenuPreviewRoleId,
  );

  const syncRoleMenuTreePreview = useCallback(
    (nextTree, roleId = selectedRoleId) => {
      const orderedTree = applyRoleMenuTreeOrder(nextTree);
      setRoleMenuTree(orderedTree);
      setRoleMenuPreview(mapBackendMenuToSidebar(orderedTree), roleId);
      return orderedTree;
    },
    [selectedRoleId, setRoleMenuPreview],
  );

  const selectedRole = useMemo(
    () => roles.find((role) => getRoleId(role) === selectedRoleId),
    [roles, selectedRoleId],
  );
  const menuOptionIds = useMemo(
    () => new Set(menus.map(getMenuId).filter(Boolean)),
    [menus],
  );
  const selectedMenu = useMemo(
    () => menus.find((menu) => getMenuId(menu) === selectedMenuId),
    [menus, selectedMenuId],
  );
  const selectedMenuIsDivider = isMenuDivider(selectedMenu);
  const selectedMenuIsGroup = isMenuGroup(selectedMenu);
  const addParentOptions = useMemo(
    () => flattenParentOptions(roleMenuTree),
    [roleMenuTree],
  );
  const editedNode = useMemo(
    () =>
      roleMenuForm.id ? findRoleMenuNode(roleMenuTree, roleMenuForm.id) : null,
    [roleMenuForm.id, roleMenuTree],
  );
  const editParentOptions = useMemo(
    () =>
      flattenParentOptions(roleMenuTree, {
        excludeId: roleMenuForm.id,
        excludeChildrenOf: editedNode,
      }),
    [editedNode, roleMenuForm.id, roleMenuTree],
  );

  const loadMenuCatalog = useCallback(async () => {
    const response = await getMenuCatalog(LIST_PARAMS);
    const nextMenus = extractList(response);
    setMenus(nextMenus);
    return nextMenus;
  }, []);

  const loadRoles = useCallback(async () => {
    let lastError = null;

    for (const requestRoles of [getAccessRoles, getAppRoles]) {
      try {
        const response = await requestRoles(LIST_PARAMS);
        const nextRoles = extractList(response).map(normalizeRoleItem);
        if (nextRoles.length) {
          setRoles(nextRoles);
          return nextRoles;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Response role kosong dari GET /auth/roles/.");
  }, []);

  const loadRoleMenus = useCallback(
    async (roleId, menuCatalog = menus) => {
      if (!roleId) {
        setRoleMenuTree([]);
        setRoleMenuPreview(null);
        return;
      }

      setIsRoleMenuLoading(true);
      setLoadError("");
      try {
        const response = await getRoleMenusByRoleId(roleId, LIST_PARAMS);
        syncRoleMenuTreePreview(
          normalizeRoleMenuTree(extractList(response), menuCatalog),
          roleId,
        );
        setIsDirty(false);
      } catch (error) {
        console.error("Failed to load role menus:", error);
        setRoleMenuTree([]);
        setRoleMenuPreview(null);
        setLoadError(
          getErrorMessage(error, "Gagal mengambil role menu dari backend."),
        );
        Swal.fire("Error!", "Gagal mengambil role menu.", "error");
      } finally {
        setIsRoleMenuLoading(false);
      }
    },
    [menus, setRoleMenuPreview, syncRoleMenuTreePreview],
  );

  const loadInitialData = useCallback(async () => {
    setIsBootLoading(true);
    setLoadError("");
    let nextRoles = [];
    let nextLoadError = "";

    try {
      nextRoles = await loadRoles();
    } catch (error) {
      console.error("Failed to load roles:", error);
      nextLoadError = getErrorMessage(error, "Gagal mengambil data role.");
      setRoles([]);
      Swal.fire("Error!", "Gagal mengambil data role.", "error");
    }

    try {
      await loadMenuCatalog();
    } catch (error) {
      console.error("Failed to load master menu:", error);
      const message = getErrorMessage(error, "Gagal mengambil master menu.");
      nextLoadError = nextLoadError ? `${nextLoadError} ${message}` : message;
      setMenus([]);
      Swal.fire("Error!", "Gagal mengambil master menu.", "error");
    } finally {
      setSelectedRoleId((currentRoleId) => {
        if (
          currentRoleId &&
          nextRoles.some((role) => getRoleId(role) === currentRoleId)
        ) {
          return currentRoleId;
        }
        if (
          roleMenuPreviewRoleId &&
          nextRoles.some((role) => getRoleId(role) === roleMenuPreviewRoleId)
        ) {
          return roleMenuPreviewRoleId;
        }
        return getRoleId(nextRoles[0]) || "";
      });
      setLoadError(nextLoadError);
      setIsBootLoading(false);
    }
  }, [loadMenuCatalog, loadRoles, roleMenuPreviewRoleId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (isBootLoading) return;

    loadRoleMenus(selectedRoleId);
    setSelectedParentId("");
    setSelectedMenuId("");
    setRoleMenuForm(EMPTY_ROLE_MENU_FORM);
    setIsRoleMenuEditOpen(false);
  }, [isBootLoading, loadRoleMenus, selectedRoleId]);

  useEffect(() => {
    if (!selectedRoleId || isRoleMenuLoading || !menus.length) {
      setSelectedMenuId("");
      return;
    }

    if (selectedMenuId && menuOptionIds.has(selectedMenuId)) return;

    if (menus.length) {
      setSelectedMenuId(getMenuId(menus[0]));
      return;
    }

    setSelectedMenuId("");
  }, [
    isRoleMenuLoading,
    menuOptionIds,
    menus,
    menus.length,
    selectedMenuId,
    selectedRoleId,
  ]);

  const resetMenuForm = () => {
    setMenuForm(EMPTY_MENU_FORM);
    setEditingMenuId("");
  };

  const handleMenuFormChange = (field, value) => {
    setMenuForm((current) => {
      const nextForm = { ...current, [field]: value };

      if (field === "name") {
        const currentAutoIcon = buildMenuIconName(current.name);
        const shouldSyncIcon =
          current.menu_type !== "DIVIDER" &&
          (!current.icon || current.icon === currentAutoIcon);

        if (shouldSyncIcon) {
          nextForm.icon = buildMenuIconName(value);
        }
      }

      if (field === "menu_type") {
        if (value === "DIVIDER") {
          nextForm.icon = "";
        } else if (!current.icon) {
          nextForm.icon = buildMenuIconName(current.name);
        }
      }

      return nextForm;
    });
  };

  const handleCreateMenuClick = () => {
    resetMenuForm();
    setIsMenuCrudOpen(true);
  };

  const handleEditMenuClick = () => {
    if (!selectedMenu) return;
    setEditingMenuId(getMenuId(selectedMenu));
    setMenuForm({
      name: selectedMenu.name || selectedMenu.menu_name || "",
      code: selectedMenu.code || "",
      route: selectedMenu.route || "",
      icon: selectedMenu.icon || "",
      menu_type:
        selectedMenu.menu_type || (selectedMenu.is_header ? "DIVIDER" : "LINK"),
      is_active: selectedMenu.is_active !== false,
    });
    setIsMenuCrudOpen(true);
  };

  const handleSaveMasterMenu = async () => {
    const payload = buildMenuPayload(menuForm);
    if (!payload.name || !payload.code) {
      Swal.fire("Invalid", "Nama dan code menu wajib diisi.", "warning");
      return;
    }
    if (payload.menu_type === "LINK" && !payload.route) {
      Swal.fire("Invalid", "Route wajib diisi untuk menu bertipe LINK.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const response = editingMenuId
        ? await updateMenuCatalog(editingMenuId, payload)
        : await createMenuCatalog(payload);
      const savedMenu = extractMutationItem(response, {
        ...payload,
        menu_id: editingMenuId,
      });
      const savedMenuId = getMenuId(savedMenu);
      setMenus((currentMenus) => upsertByMenuId(currentMenus, savedMenu));
      if (editingMenuId) {
        syncRoleMenuTreePreview(
          updateMenuDetailsInTree(roleMenuTree, editingMenuId, savedMenu),
        );
      }
      if (savedMenuId) setSelectedMenuId(savedMenuId);
      await loadMenuCatalog();
      resetMenuForm();
      setIsMenuCrudOpen(false);
      Swal.fire("Saved!", "Master menu berhasil disimpan.", "success");
    } catch (error) {
      console.error("Failed to save master menu:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menyimpan master menu."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMasterMenu = async () => {
    if (!selectedMenu) return;
    const menuId = getMenuId(selectedMenu);
    const result = await Swal.fire({
      title: "Delete master menu?",
      text: "Menu akan dihapus dari master menu backend.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
    });
    if (!result.isConfirmed) return;

    setIsSaving(true);
    try {
      await deleteMenuCatalog(menuId);
      setMenus((currentMenus) =>
        currentMenus.filter((item) => getMenuId(item) !== menuId),
      );
      syncRoleMenuTreePreview(removeMenuIdFromTree(roleMenuTree, menuId));
      setSelectedMenuId("");
      resetMenuForm();
      Swal.fire("Deleted!", "Master menu berhasil dihapus.", "success");
    } catch (error) {
      console.error("Failed to delete master menu:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menghapus master menu."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMenu = async () => {
    if (!selectedRoleId || !selectedMenuId) return;
    const menu = menus.find((item) => getMenuId(item) === selectedMenuId);
    if (!menu) return;

    const nextParentId = isMenuDivider(menu) ? "" : selectedParentId;
    const nextParent = nextParentId
      ? findRoleMenuNode(roleMenuTree, nextParentId)
      : null;

    if (nextParentId && !isRoleMenuGroupNode(nextParent)) {
      Swal.fire(
        "Invalid",
        "Hanya menu bertipe GROUP yang bisa menjadi parent submenu.",
        "warning",
      );
      return;
    }

    const optimisticNode = createOptimisticRoleMenuNode(
      menu,
      nextParentId,
      flattenRoleMenuTree(roleMenuTree).length + 1,
    );
    const optimisticTree = applyRoleMenuTreeOrder(
      appendNodeToTree(roleMenuTree, nextParentId, optimisticNode),
    );

    setIsSaving(true);
    syncRoleMenuTreePreview(optimisticTree);
    try {
      const response = await addRoleMenuByRoleId(
        selectedRoleId,
        buildAddRoleMenuPayload({
          menuId: selectedMenuId,
          parentId: nextParentId,
          sortOrder: flattenRoleMenuTree(optimisticTree).length,
        }),
      );
      const savedRoleMenu = extractMutationItem(response, optimisticNode);
      const syncedMenuType = getCatalogMenuType({
        ...menu,
        ...savedRoleMenu,
      });
      const syncedNode = {
        ...optimisticNode,
        ...savedRoleMenu,
        menu_id: selectedMenuId,
        name: savedRoleMenu.name || getMenuName(menu),
        code: savedRoleMenu.code || menu.code,
        menu_type: syncedMenuType,
        route:
          syncedMenuType === "DIVIDER"
            ? null
            : savedRoleMenu.route || menu.route || optimisticNode.route,
        icon: syncedMenuType === "DIVIDER" ? null : savedRoleMenu.icon || menu.icon,
        is_header: syncedMenuType === "DIVIDER",
        isHeadr: syncedMenuType === "DIVIDER",
        parent_id: nextParentId || null,
        children: savedRoleMenu.children || [],
      };
      const nextTree = applyRoleMenuTreeOrder(
        replaceRoleMenuNodeById(
          optimisticTree,
          getRoleMenuNodeId(optimisticNode),
          syncedNode,
        ),
      );
      syncRoleMenuTreePreview(nextTree);
      setIsDirty(false);
      Swal.fire("Added!", "Menu berhasil ditambahkan ke role.", "success");
    } catch (error) {
      console.error("Failed to add role menu:", error);
      syncRoleMenuTreePreview(roleMenuTree);
      await loadRoleMenus(selectedRoleId);
      Swal.fire(
        "Error!",
        getAddRoleMenuErrorMessage(error),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openRoleMenuEdit = (item) => {
    setRoleMenuForm({
      id: getRoleMenuNodeId(item),
      parent_id: item.parent_id || "",
      is_visible: item.is_visible !== false,
    });
    setIsRoleMenuEditOpen(true);
  };

  const handleUpdateRoleMenu = async () => {
    if (!selectedRoleId || !roleMenuForm.id) return;
    const currentNode = findRoleMenuNode(roleMenuTree, roleMenuForm.id);
    if (!currentNode) return;
    const assignmentId = getRoleMenuAssignmentId(currentNode);

    if (!assignmentId) {
      Swal.fire(
        "Reload diperlukan",
        "Menu ini belum memiliki ID assignment role dari backend.",
        "warning",
      );
      return;
    }

    const patch = {
      parent_id: roleMenuForm.parent_id || null,
      is_visible: Boolean(roleMenuForm.is_visible),
    };
    const updatedNode = {
      ...currentNode,
      ...patch,
    };

    setIsSaving(true);
    try {
      await updateRoleMenuByRoleId(
        selectedRoleId,
        assignmentId,
        buildRoleMenuPayload(updatedNode),
      );
      await loadRoleMenus(selectedRoleId);
      setIsRoleMenuEditOpen(false);
      setRoleMenuForm(EMPTY_ROLE_MENU_FORM);
      Swal.fire("Updated!", "Role menu berhasil diperbarui.", "success");
    } catch (error) {
      console.error("Failed to update role menu:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal memperbarui role menu."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisible = async (item) => {
    const nodeId = getRoleMenuNodeId(item);
    const assignmentId = getRoleMenuAssignmentId(item);
    if (!assignmentId) {
      Swal.fire(
        "Reload diperlukan",
        "Menu ini belum memiliki ID assignment role dari backend.",
        "warning",
      );
      return;
    }
    const nextVisible = item.is_visible === false;
    const nextTree = applyRoleMenuTreeOrder(
      updateRoleMenuNodeById(roleMenuTree, nodeId, { is_visible: nextVisible }),
    );
    const updatedNode = findRoleMenuNode(nextTree, nodeId) || {
      ...item,
      is_visible: nextVisible,
    };

    setIsSaving(true);
    try {
      await updateRoleMenuByRoleId(
        selectedRoleId,
        assignmentId,
        buildRoleMenuPayload(updatedNode),
      );
      syncRoleMenuTreePreview(nextTree);
    } catch (error) {
      console.error("Failed to update role menu visibility:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal memperbarui visibilitas menu."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMenu = async (item) => {
    if (!selectedRoleId) return;
    const result = await Swal.fire({
      title: "Remove menu?",
      text: "Menu ini akan dihapus dari role terpilih.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Remove",
    });
    if (!result.isConfirmed) return;

    const nodeId = getRoleMenuNodeId(item);
    const assignmentId = getRoleMenuAssignmentId(item);
    if (!assignmentId) {
      Swal.fire(
        "Reload diperlukan",
        "Menu ini belum memiliki ID assignment role dari backend.",
        "warning",
      );
      return;
    }
    const removedResult = removeRoleMenuNode(roleMenuTree, nodeId);
    const nextTree = applyRoleMenuTreeOrder(removedResult.items);
    setIsSaving(true);
    try {
      await deleteRoleMenuByRoleId(selectedRoleId, assignmentId);
      syncRoleMenuTreePreview(nextTree);
      Swal.fire("Removed!", "Menu berhasil dihapus dari role.", "success");
    } catch (error) {
      console.error("Failed to remove role menu:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menghapus menu dari role."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (result) => {
    if (isSaving) return;
    const draggedId = result.draggableId;
    const draggedNode = findRoleMenuNode(roleMenuTree, draggedId);
    if (!draggedNode) return;

    if (result.combine) {
      const targetParentId = result.combine.draggableId;
      const targetParent = findRoleMenuNode(roleMenuTree, targetParentId);
      if (
        !targetParent ||
        isRoleMenuDivider(targetParent) ||
        !isRoleMenuGroupNode(targetParent) ||
        draggedId === targetParentId ||
        containsNodeId(draggedNode, targetParentId)
      ) {
        return;
      }

      syncRoleMenuTreePreview(
        moveRoleMenuNodeIntoParent(roleMenuTree, result.source, targetParentId),
      );
      setIsDirty(true);
      return;
    }

    if (!result.destination) return;
    const targetParentId = result.destination.droppableId.replace(
      "children:",
      "",
    );
    const targetParent =
      result.destination.droppableId === "root"
        ? null
        : findRoleMenuNode(roleMenuTree, targetParentId);
    if (
      result.destination.droppableId !== "root" &&
      (!isRoleMenuGroupNode(targetParent) ||
        draggedId === targetParentId ||
        containsNodeId(draggedNode, targetParentId))
    ) {
      return;
    }

    syncRoleMenuTreePreview(
      moveRoleMenuNode(roleMenuTree, result.source, result.destination),
    );
    setIsDirty(true);
  };

  const handleKeyboardMove = (item, offset) => {
    if (isSaving) return;
    syncRoleMenuTreePreview(
      moveRoleMenuNodeByOffset(roleMenuTree, getRoleMenuNodeId(item), offset),
    );
    setIsDirty(true);
  };

  const handlePromote = (item) => {
    if (isSaving) return;
    syncRoleMenuTreePreview(
      promoteRoleMenuNode(roleMenuTree, getRoleMenuNodeId(item)),
    );
    setIsDirty(true);
  };

  const handleSaveOrder = async () => {
    if (!selectedRoleId) return;
    const nextTree = applyRoleMenuTreeOrder(roleMenuTree);
    const reorderData = buildReorderPayload(nextTree);

    if (reorderData.invalidItems.length) {
      await Swal.fire({
        icon: "warning",
        title: "Data menu belum valid",
        text: `${reorderData.invalidItems
          .slice(0, 3)
          .join(", ")} belum memiliki ID assignment role dari backend. Reload role menu lalu coba simpan lagi.`,
      });
      await loadRoleMenus(selectedRoleId);
      setIsDirty(false);
      return;
    }

    syncRoleMenuTreePreview(nextTree);
    setIsSaving(true);
    try {
      await reorderRoleMenusByRoleId(selectedRoleId, reorderData.payload);
      await Promise.all([
        loadRoleMenus(selectedRoleId),
        loadAuthenticatedAccess({ force: true }),
      ]);
      setIsDirty(false);
      Swal.fire("Saved!", "Urutan menu berhasil disimpan.", "success");
    } catch (error) {
      console.error("Failed to reorder role menus:", error);
      setIsDirty(true);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menyimpan urutan role menu."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isBootLoading) return <Loading />;

  return (
    <div className="space-y-5">
      <Card
        title="Role Menu Builder"
        subtitle="Kelola menu sidebar per role langsung ke backend."
        headerslot={
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-xs font-medium text-warning-500">
                Unsaved order
              </span>
            )}
            <Button
              text="Reload"
              icon="heroicons-outline:arrow-path"
              className="btn-outline-dark"
              disabled={isSaving}
              onClick={() => {
                loadMenuCatalog().then((nextMenus) =>
                  loadRoleMenus(selectedRoleId, nextMenus),
                );
              }}
            />
            <Button
              text="Save Order"
              icon="heroicons-outline:check"
              className="btn-dark"
              isLoading={isSaving}
              disabled={!selectedRoleId || !isDirty || isSaving}
              onClick={handleSaveOrder}
            />
          </div>
        }
      >

        {loadError && (
          <div className="mb-5 rounded border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 dark:border-danger-500/30 dark:bg-danger-500/10 dark:text-danger-300">
            {loadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-5 border-b border-slate-200 pb-5 dark:border-slate-700 xl:border-b-0 xl:border-r xl:pr-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                Role
              </label>
              <select
                className="form-control w-full"
                value={selectedRoleId}
                disabled={isSaving || isRoleMenuLoading}
                onChange={(event) => setSelectedRoleId(event.target.value)}
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={getRoleId(role)} value={getRoleId(role)}>
                    {getRoleName(role)}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {selectedRole
                  ? `Mengatur menu untuk role ${getRoleName(selectedRole)}.`
                  : "Pilih role untuk memuat menu backend."}
              </div>
            </div>

            <div className="rounded border border-slate-200 p-4 dark:border-slate-700">
              <div className="mb-4 flex items-center gap-2">
                <Icon icon="heroicons-outline:plus-circle" />
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Add Menu to Role
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                    Master Menu
                  </label>
                  <select
                    className="form-control w-full"
                    value={selectedMenuId}
                    disabled={!selectedRoleId || isRoleMenuLoading || isSaving}
                    onChange={(event) => {
                      const nextMenuId = event.target.value;
                      const nextMenu = menus.find(
                        (menu) => getMenuId(menu) === nextMenuId,
                      );
                      setSelectedMenuId(nextMenuId);
                      if (isMenuDivider(nextMenu)) setSelectedParentId("");
                    }}
                  >
                    <option value="">Select menu</option>
                    {menus.map((menu) => {
                      const menuId = getMenuId(menu);
                      return (
                        <option key={menuId} value={menuId}>
                          [{getCatalogMenuType(menu)}] {getMenuName(menu)}
                        </option>
                      );
                    })}
                  </select>
                  {!menus.length && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Belum ada master menu dari backend.
                    </div>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={handleCreateMenuClick}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      onClick={handleEditMenuClick}
                      disabled={!selectedMenu}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-danger-200 px-2 py-2 text-xs font-medium text-danger-500 hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-danger-500/40 dark:hover:bg-danger-500/10"
                      onClick={handleDeleteMasterMenu}
                      disabled={!selectedMenu || isSaving}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isMenuCrudOpen && (
                  <div className="space-y-3 rounded border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase text-slate-500">
                        {editingMenuId ? "Edit master menu" : "New master menu"}
                      </div>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        onClick={() => {
                          resetMenuForm();
                          setIsMenuCrudOpen(false);
                        }}
                      >
                        <Icon icon="heroicons-outline:x-mark" />
                      </button>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Name
                      </label>
                      <input
                        className="form-control w-full"
                        value={menuForm.name}
                        onChange={(event) =>
                          handleMenuFormChange("name", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Code
                      </label>
                      <input
                        className="form-control w-full"
                        value={menuForm.code}
                        placeholder="auto dari name jika kosong"
                        onChange={(event) =>
                          handleMenuFormChange("code", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Route
                      </label>
                      <input
                        className="form-control w-full"
                        value={menuForm.route}
                        placeholder={
                          menuForm.menu_type === "GROUP"
                            ? "opsional untuk group"
                            : "/order"
                        }
                        disabled={menuForm.menu_type === "DIVIDER"}
                        onChange={(event) =>
                          handleMenuFormChange("route", event.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Icon
                      </label>
                      <input
                        className="form-control w-full"
                        value={menuForm.icon}
                        placeholder="auto dari name, contoh icon-people"
                        disabled={menuForm.menu_type === "DIVIDER"}
                        onChange={(event) =>
                          handleMenuFormChange("icon", event.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Type
                        </label>
                        <select
                          className="form-control w-full"
                          value={menuForm.menu_type}
                          onChange={(event) =>
                            handleMenuFormChange("menu_type", event.target.value)
                          }
                        >
                          <option value="LINK">LINK</option>
                          <option value="GROUP">GROUP</option>
                          <option value="DIVIDER">DIVIDER</option>
                        </select>
                      </div>
                      <label className="mt-5 flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={menuForm.is_active}
                          onChange={(event) =>
                            handleMenuFormChange("is_active", event.target.checked)
                          }
                        />
                        Active
                      </label>
                    </div>
                    <Button
                      text={editingMenuId ? "Update Menu" : "Create Menu"}
                      icon={
                        editingMenuId
                          ? "heroicons-outline:pencil-square"
                          : "heroicons-outline:plus"
                      }
                      className="btn-dark w-full"
                      isLoading={isSaving}
                      onClick={handleSaveMasterMenu}
                    />
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                    Parent
                  </label>
                  <select
                    className="form-control w-full"
                    value={selectedParentId}
                    disabled={selectedMenuIsDivider || isSaving}
                    onChange={(event) => setSelectedParentId(event.target.value)}
                  >
                    <option value="">Root menu</option>
                    {addParentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedMenuIsDivider && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Divider selalu diletakkan di root sidebar.
                    </div>
                  )}
                  {selectedMenuIsGroup && (
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      GROUP bisa menjadi parent untuk submenu.
                    </div>
                  )}
                </div>
                <Button
                  text="Add to Role"
                  icon="heroicons-outline:plus"
                  className="btn-primary w-full"
                  disabled={!selectedRoleId || !selectedMenuId || isSaving}
                  isLoading={isSaving}
                  onClick={handleAddMenu}
                />
              </div>
            </div>

            {isRoleMenuEditOpen && editedNode && (
              <div className="rounded border border-slate-200 p-4 dark:border-slate-700">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Edit Assignment
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={() => {
                      setRoleMenuForm(EMPTY_ROLE_MENU_FORM);
                      setIsRoleMenuEditOpen(false);
                    }}
                  >
                    <Icon icon="heroicons-outline:x-mark" />
                  </button>
                </div>
                <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                  {editedNode.name || editedNode.code}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase text-slate-500">
                      Parent
                    </label>
                    <select
                      className="form-control w-full"
                      value={roleMenuForm.parent_id}
                      disabled={isRoleMenuDivider(editedNode) || isSaving}
                      onChange={(event) =>
                        setRoleMenuForm((current) => ({
                          ...current,
                          parent_id: event.target.value,
                        }))
                      }
                    >
                      <option value="">Root menu</option>
                      {editParentOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={roleMenuForm.is_visible}
                      onChange={(event) =>
                        setRoleMenuForm((current) => ({
                          ...current,
                          is_visible: event.target.checked,
                        }))
                      }
                    />
                    Visible in sidebar
                  </label>
                  <Button
                    text="Update Assignment"
                    icon="heroicons-outline:pencil-square"
                    className="btn-dark w-full"
                    isLoading={isSaving}
                    onClick={handleUpdateRoleMenu}
                  />
                </div>
              </div>
            )}

            <div className="rounded bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <div className="font-medium text-slate-900 dark:text-white">
                {selectedRole ? getRoleName(selectedRole) : "No role selected"}
              </div>
              <div className="mt-1">
                {flattenRoleMenuTree(roleMenuTree).length} menu assigned,{" "}
                {menus.length} master menu available.
              </div>
            </div>
          </aside>

          <section className="min-w-0">
            {isRoleMenuLoading ? (
              <Loading />
            ) : (
              <div className="p-3">
                <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="root" type="ROLE_MENU" isCombineEnabled>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[320px] rounded border border-dashed p-2 transition ${
                        snapshot.isDraggingOver
                          ? "border-primary-500 bg-primary-50 dark:bg-slate-700"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                      }`}
                    >
                      {roleMenuTree.length ? (
                        roleMenuTree.map((item, index) => (
                          <RoleMenuNode
                            key={getRoleMenuNodeId(item)}
                            item={item}
                            index={index}
                            onEdit={openRoleMenuEdit}
                            onToggleVisible={handleToggleVisible}
                            onRemove={handleRemoveMenu}
                            onMove={handleKeyboardMove}
                            onPromote={handlePromote}
                            isSaving={isSaving}
                          />
                        ))
                      ) : (
                        <div className="flex min-h-[280px] items-center justify-center rounded bg-white text-sm text-slate-400 dark:bg-slate-800">
                          Tidak ada menu untuk role ini.
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
                </DragDropContext>
              </div>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
};

export default RoleMenuBuilder;
