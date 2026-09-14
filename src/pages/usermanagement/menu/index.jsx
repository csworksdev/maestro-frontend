import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import Swal from "sweetalert2";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Loading from "@/components/Loading";
import {
  createMenuCatalog,
  deleteMenuCatalog,
  getMenuCatalog,
  updateMenuCatalog,
} from "@/axios/userManagement/access";
import { extractList } from "@/utils/accessControl";

const LIST_PARAMS = { page: 1, page_size: 500, search: "" };

const EMPTY_FORM = {
  name: "",
  code: "",
  route: "",
  icon: "",
  menu_type: "LINK",
  parent_id: "",
  is_active: true,
};

const toArray = (value) => (Array.isArray(value) ? value : []);

const getMenuId = (menu) => String(menu?.menu_id ?? menu?.id ?? "");
const getMenuName = (menu) =>
  menu?.name || menu?.menu_name || menu?.code || "Menu";
const getParentId = (menu) => {
  const parentId = menu?.parent_id ?? menu?.parent ?? "";
  return parentId == null || parentId === "" ? null : String(parentId);
};

const slugifyMenuCode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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

const getResponseHeader = (response, headerName) => {
  const headers = response?.headers;
  return (
    headers?.[headerName] ||
    headers?.[headerName.toLowerCase()] ||
    headers?.get?.(headerName) ||
    ""
  );
};

const assertMenuCatalogJsonResponse = (response) => {
  const payload = response?.data ?? response;
  const contentType = String(getResponseHeader(response, "content-type")).toLowerCase();
  const ngrokErrorCode = getResponseHeader(response, "ngrok-error-code");

  if (
    typeof payload === "string" ||
    contentType.includes("text/html") ||
    ngrokErrorCode
  ) {
    throw new Error(
      ngrokErrorCode
        ? `Backend/ngrok mengembalikan HTML (${ngrokErrorCode}), bukan JSON menu.`
        : "Backend mengembalikan HTML, bukan JSON menu.",
    );
  }
};

const extractMenuCatalogItems = (response) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data?.results)) return payload.data.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.menus)) return payload.menus;
  if (Array.isArray(payload)) return payload;

  return extractList(payload);
};

const getMenuCatalogMeta = (response) => {
  const payload = response?.data ?? response;
  return {
    count: Number(payload?.count ?? payload?.data?.count ?? 0),
    next: payload?.next ?? payload?.data?.next ?? null,
  };
};

const isDividerMenu = (menu) =>
  menu?.is_header || menu?.isHeadr || menu?.menu_type === "DIVIDER";

const sortByOrder = (items) =>
  [...toArray(items)].sort((a, b) => {
    const first = Number(a?.sort_order ?? a?.order ?? 0);
    const second = Number(b?.sort_order ?? b?.order ?? 0);
    return first - second;
  });

const applyMenuTreeOrder = (items = [], parentId = null) =>
  toArray(items).map((item, index) => ({
    ...item,
    id: getMenuId(item),
    parent_id: parentId,
    sort_order: index + 1,
    children: applyMenuTreeOrder(item.children || [], getMenuId(item)),
  }));

const normalizeNestedMenus = (items = []) =>
  applyMenuTreeOrder(
    sortByOrder(items).map((item) => ({
      ...item,
      id: getMenuId(item),
      parent_id: getParentId(item),
      children: normalizeNestedMenus(item.children || []),
    })),
  );

const normalizeFlatMenus = (items = []) => {
  const sourceItems = toArray(items);
  if (sourceItems.some((item) => toArray(item.children).length)) {
    return normalizeNestedMenus(sourceItems);
  }

  const map = new Map();
  sourceItems.forEach((item, index) => {
    const id = getMenuId(item);
    if (!id) return;

    map.set(id, {
      ...item,
      id,
      parent_id: getParentId(item),
      sort_order: Number(item?.sort_order ?? item?.order ?? index + 1),
      children: [],
    });
  });

  const roots = [];
  map.forEach((item) => {
    const parentId = getParentId(item);
    const parent = parentId && parentId !== item.id ? map.get(parentId) : null;
    if (parent) {
      parent.children.push(item);
    } else {
      roots.push({ ...item, parent_id: null });
    }
  });

  const sortTree = (tree) =>
    sortByOrder(tree).map((item) => ({
      ...item,
      children: sortTree(item.children || []),
    }));

  return applyMenuTreeOrder(sortTree(roots));
};

const flattenMenuTree = (items = [], parentId = null) =>
  toArray(items).flatMap((item, index) => {
    const id = getMenuId(item);
    const row = {
      ...item,
      id,
      menu_id: item.menu_id ?? id,
      parent_id: parentId,
      sort_order: index + 1,
    };

    return [row, ...flattenMenuTree(item.children || [], id)];
  });

const findMenuNode = (items = [], targetId) => {
  for (const item of toArray(items)) {
    if (getMenuId(item) === String(targetId)) return item;

    const child = findMenuNode(item.children || [], targetId);
    if (child) return child;
  }

  return null;
};

const removeMenuNode = (items = [], targetId) => {
  let removed = null;

  const nextItems = toArray(items).reduce((acc, item) => {
    if (getMenuId(item) === String(targetId)) {
      removed = item;
      return acc;
    }

    const result = removeMenuNode(item.children || [], targetId);
    if (result.removed) {
      removed = result.removed;
      acc.push({ ...item, children: result.items });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);

  return { items: nextItems, removed };
};

const insertMenuNode = (items = [], droppableId, index, node) => {
  if (droppableId === "root") {
    const nextItems = [...toArray(items)];
    nextItems.splice(index, 0, { ...node, parent_id: null });
    return nextItems;
  }

  const parentId = droppableId.replace("children:", "");

  return toArray(items).map((item) => {
    if (getMenuId(item) === parentId) {
      const children = [...toArray(item.children)];
      children.splice(index, 0, { ...node, parent_id: parentId });
      return { ...item, children };
    }

    return {
      ...item,
      children: insertMenuNode(item.children || [], droppableId, index, node),
    };
  });
};

const getDroppableItems = (items = [], droppableId) => {
  if (droppableId === "root") return toArray(items);

  const parentId = droppableId.replace("children:", "");
  return toArray(findMenuNode(items, parentId)?.children);
};

const moveMenuNode = (items = [], source, destination) => {
  if (!destination) return items;

  const sourceList = getDroppableItems(items, source.droppableId);
  const movingNode = sourceList[Number(source.index)];
  if (!movingNode) return items;

  const { items: withoutNode } = removeMenuNode(items, getMenuId(movingNode));
  return applyMenuTreeOrder(
    insertMenuNode(withoutNode, destination.droppableId, destination.index, movingNode),
  );
};

const moveMenuNodeIntoParent = (items = [], source, targetParentId) => {
  const sourceList = getDroppableItems(items, source.droppableId);
  const movingNode = sourceList[Number(source.index)];
  if (!movingNode || !targetParentId) return items;

  const targetParent = findMenuNode(items, targetParentId);
  if (!targetParent || isDividerMenu(targetParent)) return items;

  const { items: withoutNode } = removeMenuNode(items, getMenuId(movingNode));
  return applyMenuTreeOrder(
    insertMenuNode(
      withoutNode,
      `children:${targetParentId}`,
      targetParent.children?.length || 0,
      movingNode,
    ),
  );
};

const containsNodeId = (item, targetId) =>
  toArray(item?.children).some(
    (child) => getMenuId(child) === String(targetId) || containsNodeId(child, targetId),
  );

const flattenParentOptions = (
  items = [],
  { depth = 0, excludeId = "", excludeChildrenOf = null } = {},
) =>
  toArray(items).flatMap((item) => {
    const id = getMenuId(item);
    const isExcluded =
      id === String(excludeId) ||
      (excludeChildrenOf && containsNodeId(excludeChildrenOf, id));

    return [
      ...(!isDividerMenu(item) && !isExcluded
        ? [{ id, label: `${"- ".repeat(depth)}${getMenuName(item)}` }]
        : []),
      ...flattenParentOptions(item.children || [], {
        depth: depth + 1,
        excludeId,
        excludeChildrenOf,
      }),
    ];
  });

const normalizeMenuForm = (menu = EMPTY_FORM) => ({
  name: menu?.name || menu?.menu_name || "",
  code: menu?.code || slugifyMenuCode(menu?.name || menu?.menu_name),
  route: menu?.route || "",
  icon: menu?.icon || "",
  menu_type: menu?.menu_type || (menu?.is_header ? "DIVIDER" : "LINK"),
  parent_id: getParentId(menu) || "",
  is_active: menu?.is_active !== false,
});

const buildMenuPayload = (form, overrides = {}) => {
  const menuType = form.menu_type || "LINK";
  const code = slugifyMenuCode(form.code || form.name);
  const route = String(form.route || "").trim();
  const parentId =
    menuType === "DIVIDER"
      ? null
      : overrides.parent_id ?? form.parent_id ?? null;

  return {
    name: String(form.name || "").trim(),
    code,
    menu_type: menuType,
    route: menuType === "DIVIDER" ? null : route || null,
    icon: menuType === "DIVIDER" ? null : String(form.icon || "").trim() || null,
    is_active: Boolean(form.is_active),
    parent_id: parentId,
    sort_order: Number(overrides.sort_order ?? form.sort_order ?? 1),
  };
};

const MenuNode = ({ item, index, isSaving, onEdit, onDelete }) => {
  const id = getMenuId(item);
  const children = toArray(item.children);
  const isDivider = isDividerMenu(item);
  const isInactive = item.is_active === false;

  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps}>
          <div
            className={`mb-3 rounded border bg-white transition dark:bg-slate-800 ${
              snapshot.isDragging
                ? "border-primary-500 shadow-lg"
                : "border-slate-200 dark:border-slate-700"
            } ${isInactive ? "opacity-60" : ""}`}
          >
            <div
              className={`flex items-center gap-3 px-3 py-3 ${
                isDivider ? "bg-slate-100 dark:bg-slate-900" : ""
              }`}
            >
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-300"
                {...provided.dragHandleProps}
              >
                <Icon icon="heroicons-outline:bars-3" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {getMenuName(item)}
                </div>
                <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                  {item.menu_type || "LINK"} - {item.route || item.code || "no route"} - #
                  {item.sort_order}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
                  disabled={isSaving}
                  onClick={() => onEdit(item)}
                  title="Edit menu"
                >
                  <Icon icon="heroicons-outline:pencil-square" />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-danger-200 text-danger-500 hover:bg-danger-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-danger-500/40"
                  disabled={isSaving}
                  onClick={() => onDelete(item)}
                  title="Delete menu"
                >
                  <Icon icon="heroicons-outline:trash" />
                </button>
              </div>
            </div>

            {!isDivider && (
              <Droppable droppableId={`children:${id}`} type="MENU" isCombineEnabled>
                {(dropProvided, dropSnapshot) => (
                  <div
                    ref={dropProvided.innerRef}
                    {...dropProvided.droppableProps}
                    className={`mx-3 mb-3 min-h-[42px] rounded border border-dashed p-2 transition ${
                      dropSnapshot.isDraggingOver
                        ? "border-primary-500 bg-primary-50 dark:bg-slate-700"
                        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                    }`}
                  >
                    {children.length ? (
                      children.map((child, childIndex) => (
                        <MenuNode
                          key={getMenuId(child)}
                          item={child}
                          index={childIndex}
                          isSaving={isSaving}
                          onEdit={onEdit}
                          onDelete={onDelete}
                        />
                      ))
                    ) : (
                      <div className="px-2 py-1 text-xs text-slate-400">
                        Drag menu ke area ini untuk membuat submenu.
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

const Menus = () => {
  const [menuTree, setMenuTree] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingMenuId, setEditingMenuId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loadError, setLoadError] = useState("");

  const flatMenus = useMemo(() => flattenMenuTree(menuTree), [menuTree]);
  const editingNode = useMemo(
    () => (editingMenuId ? findMenuNode(menuTree, editingMenuId) : null),
    [editingMenuId, menuTree],
  );
  const parentOptions = useMemo(
    () =>
      flattenParentOptions(menuTree, {
        excludeId: editingMenuId,
        excludeChildrenOf: editingNode,
      }),
    [editingMenuId, editingNode, menuTree],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const pages = [];
      let page = LIST_PARAMS.page;
      let shouldLoadNextPage = true;

      while (shouldLoadNextPage) {
        const response = await getMenuCatalog({ ...LIST_PARAMS, page });
        assertMenuCatalogJsonResponse(response);
        const items = extractMenuCatalogItems(response);
        const meta = getMenuCatalogMeta(response);

        pages.push(...items);

        const hasNextUrl = Boolean(meta.next);
        const hasKnownRemainingItems = meta.count > pages.length;
        shouldLoadNextPage = hasNextUrl && hasKnownRemainingItems;
        page += 1;
      }

      setMenuTree(normalizeFlatMenus(pages));
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to load menus:", error);
      const message = getErrorMessage(error, "Gagal mengambil menu dari backend.");
      setLoadError(message);
      setMenuTree([]);
      Swal.fire("Error!", message, "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingMenuId("");
    setIsFormOpen(true);
  };

  const openCreateForm = () => {
    resetForm();
  };

  const openEditForm = (menu) => {
    setEditingMenuId(getMenuId(menu));
    setForm(normalizeMenuForm(menu));
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const currentNode = editingMenuId ? findMenuNode(menuTree, editingMenuId) : null;
    const sortOrder =
      currentNode?.sort_order ||
      (form.parent_id
        ? toArray(findMenuNode(menuTree, form.parent_id)?.children).length + 1
        : menuTree.length + 1);
    const payload = buildMenuPayload(form, { sort_order: sortOrder });

    if (!payload.name || !payload.code) {
      Swal.fire("Invalid", "Nama dan code menu wajib diisi.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      if (editingMenuId) {
        await updateMenuCatalog(editingMenuId, payload);
        Swal.fire("Saved!", "Menu berhasil diperbarui di backend.", "success");
      } else {
        await createMenuCatalog(payload);
        Swal.fire("Saved!", "Menu berhasil dibuat di backend.", "success");
      }

      resetForm();
      await fetchData();
    } catch (error) {
      console.error("Failed to save menu:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menyimpan menu ke backend."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (menu) => {
    if (isSaving) return;

    const menuId = getMenuId(menu);
    if (!menuId) return;

    const result = await Swal.fire({
      title: "Delete menu?",
      text: `${getMenuName(menu)} akan dihapus dari backend.`,
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
      Swal.fire("Deleted!", "Menu berhasil dihapus dari backend.", "success");
      await fetchData();
    } catch (error) {
      console.error("Failed to delete menu:", error);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menghapus menu dari backend."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (result) => {
    if (isSaving) return;

    const draggedId = result.draggableId;
    const draggedNode = findMenuNode(menuTree, draggedId);
    if (!draggedNode) return;

    if (result.combine) {
      const targetParentId = result.combine.draggableId;
      if (draggedId === targetParentId || containsNodeId(draggedNode, targetParentId)) {
        return;
      }

      setMenuTree((items) =>
        moveMenuNodeIntoParent(items, result.source, targetParentId),
      );
      setIsDirty(true);
      return;
    }

    if (!result.destination) return;

    const targetParentId = result.destination.droppableId.replace("children:", "");
    if (
      result.destination.droppableId !== "root" &&
      (draggedId === targetParentId || containsNodeId(draggedNode, targetParentId))
    ) {
      return;
    }

    setMenuTree((items) => moveMenuNode(items, result.source, result.destination));
    setIsDirty(true);
  };

  const handleSaveOrder = async () => {
    if (isSaving) return;

    const orderedTree = applyMenuTreeOrder(menuTree);
    const orderedItems = flattenMenuTree(orderedTree);

    setIsSaving(true);
    setMenuTree(orderedTree);

    try {
      for (const item of orderedItems) {
        await updateMenuCatalog(
          getMenuId(item),
          buildMenuPayload(normalizeMenuForm(item), {
            parent_id: item.parent_id,
            sort_order: item.sort_order,
          }),
        );
      }

      setIsDirty(false);
      Swal.fire("Saved!", "Urutan menu berhasil disimpan ke backend.", "success");
      await fetchData();
    } catch (error) {
      console.error("Failed to save menu order:", error);
      setIsDirty(true);
      Swal.fire(
        "Error!",
        getErrorMessage(error, "Gagal menyimpan urutan menu ke backend."),
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card
        title="Menu"
        subtitle="CRUD master menu dan susun struktur menu langsung ke backend."
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
              disabled={isSaving || isLoading}
              onClick={fetchData}
            />
            <Button
              text="Save Order"
              icon="heroicons-outline:check"
              className="btn-dark"
              disabled={!isDirty || isSaving}
              isLoading={isSaving && isDirty}
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

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5 border-b border-slate-200 pb-5 dark:border-slate-700 xl:border-b-0 xl:border-r xl:pr-6">
            <Button
              text="New Menu"
              icon="heroicons-outline:plus"
              className="btn-primary w-full"
              disabled={isSaving}
              onClick={openCreateForm}
            />

            {isFormOpen && (
              <form
                onSubmit={handleSubmit}
                className="space-y-4 rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {editingMenuId ? "Edit Menu" : "Create Menu"}
                  </div>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    onClick={resetForm}
                  >
                    <Icon icon="heroicons-outline:x-mark" />
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                    Name
                  </label>
                  <input
                    className="form-control w-full"
                    value={form.name}
                    onChange={(event) => handleFormChange("name", event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                    Code
                  </label>
                  <input
                    className="form-control w-full"
                    value={form.code}
                    placeholder="auto dari name jika kosong"
                    onChange={(event) => handleFormChange("code", event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                    Type
                  </label>
                  <select
                    className="form-control w-full"
                    value={form.menu_type}
                    onChange={(event) =>
                      handleFormChange("menu_type", event.target.value)
                    }
                  >
                    <option value="LINK">LINK</option>
                    <option value="GROUP">GROUP</option>
                    <option value="DIVIDER">DIVIDER</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                    Parent
                  </label>
                  <select
                    className="form-control w-full"
                    value={form.parent_id}
                    disabled={form.menu_type === "DIVIDER"}
                    onChange={(event) =>
                      handleFormChange("parent_id", event.target.value)
                    }
                  >
                    <option value="">Root menu</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                    Route
                  </label>
                  <input
                    className="form-control w-full"
                    value={form.route}
                    placeholder="/dashboard atau kosong"
                    disabled={form.menu_type === "DIVIDER"}
                    onChange={(event) => handleFormChange("route", event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-500">
                    Icon
                  </label>
                  <input
                    className="form-control w-full"
                    value={form.icon}
                    placeholder="heroicons-outline:home"
                    disabled={form.menu_type === "DIVIDER"}
                    onChange={(event) => handleFormChange("icon", event.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      handleFormChange("is_active", event.target.checked)
                    }
                  />
                  Active
                </label>

                <Button
                  text={editingMenuId ? "Update Menu" : "Create Menu"}
                  icon={
                    editingMenuId
                      ? "heroicons-outline:pencil-square"
                      : "heroicons-outline:plus"
                  }
                  className="btn-dark w-full"
                  type="submit"
                  isLoading={isSaving}
                />
              </form>
            )}

            <div className="rounded bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <div className="font-medium text-slate-900 dark:text-white">
                Master Menu
              </div>
              <div className="mt-1">{flatMenus.length} menu dari backend.</div>
            </div>
          </aside>

          <section className="min-w-0">
            {isLoading ? (
              <Loading />
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="root" type="MENU" isCombineEnabled>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[420px] rounded border border-dashed p-3 transition ${
                        snapshot.isDraggingOver
                          ? "border-primary-500 bg-primary-50 dark:bg-slate-700"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                      }`}
                    >
                      {menuTree.length ? (
                        menuTree.map((item, index) => (
                          <MenuNode
                            key={getMenuId(item)}
                            item={item}
                            index={index}
                            isSaving={isSaving}
                            onEdit={openEditForm}
                            onDelete={handleDelete}
                          />
                        ))
                      ) : (
                        <div className="flex min-h-[360px] items-center justify-center rounded bg-white text-sm text-slate-400 dark:bg-slate-800">
                          Tidak ada menu dari backend.
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
};

export default Menus;
