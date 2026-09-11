const toArray = (value) => (Array.isArray(value) ? value : []);

export const getRoleMenuAssignmentId = (item) => {
  const candidates = [
    item?.group_menu_id,
    item?.role_menu_id,
    item?.roleMenuId,
    item?.id,
  ];
  const rawValue = candidates.find((candidate) => {
    const value = String(candidate ?? "").trim();
    return value && !value.startsWith("temp-");
  });
  const value = String(rawValue ?? "").trim();
  if (!value) return "";

  const menuId = String(
    item?.menu_id ??
      item?.menu?.menu_id ??
      item?.menu?.id ??
      item?.menuId ??
      item?.menu_uuid ??
      "",
  ).trim();

  if (
    menuId &&
    value === menuId &&
    item?.group_menu_id == null &&
    item?.role_menu_id == null &&
    item?.roleMenuId == null
  ) {
    return "";
  }

  return value;
};

export const getRoleMenuNodeId = (item) =>
  String(
    [
      item?.group_menu_id,
      item?.role_menu_id,
      item?.roleMenuId,
      item?.id,
      item?.menu_id,
      item?.code,
    ].find((candidate) => {
      const value = String(candidate ?? "").trim();
      return value && !value.startsWith("temp-");
    }) ??
      item?.group_menu_id ??
      item?.id ??
      item?.menu_id ??
      item?.code ??
      "",
  );

const sortByOrder = (items) =>
  [...toArray(items)].sort((a, b) => {
    const first = Number(a?.sort_order ?? a?.order ?? 0);
    const second = Number(b?.sort_order ?? b?.order ?? 0);
    return first - second;
  });

const getNestedMenu = (item = {}) =>
  item?.menu && typeof item.menu === "object" ? item.menu : {};

const getNodeValueFromSources = (source = [], keys = []) => {
  for (const object of source) {
    for (const key of keys) {
      const value = object?.[key];
      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }
  }

  return undefined;
};

const getNodeValue = (item = {}, ...keys) =>
  getNodeValueFromSources([item, getNestedMenu(item)], keys);

const getMenuId = (item = {}) =>
  getNodeValue(item, "menu_id", "menuId", "menu_uuid") ??
  getNestedMenu(item)?.id;

const getMenuCatalogKey = (menu = {}) =>
  String(menu?.menu_id ?? menu?.id ?? menu?.menuId ?? menu?.menu_uuid ?? "");

const createMenuCatalogMap = (menus = []) => {
  if (menus instanceof Map) return menus;

  const catalogMap = new Map();
  toArray(menus).forEach((menu) => {
    const key = getMenuCatalogKey(menu);
    if (key) catalogMap.set(key, menu);
  });
  return catalogMap;
};

const getCatalogMenu = (item = {}, catalogMap = new Map()) => {
  const menuId = String(getMenuId(item) ?? "");
  return menuId ? catalogMap.get(menuId) || {} : {};
};

const getCatalogNodeValue = (item = {}, catalogMenu = {}, ...keys) =>
  getNodeValueFromSources([item, getNestedMenu(item), catalogMenu], keys);

const hydrateRoleMenuNode = (item = {}, catalogMap = new Map()) => {
  const catalogMenu = getCatalogMenu(item, catalogMap);
  const menuType = getRoleMenuType(item, catalogMenu);
  const menuId =
    getMenuId(item) ??
    catalogMenu?.menu_id ??
    catalogMenu?.id ??
    item?.menu_id;

  return {
    ...item,
    menu_id: menuId,
    name: getCatalogNodeValue(item, catalogMenu, "name", "menu_name"),
    code: getCatalogNodeValue(item, catalogMenu, "code", "menu_code"),
    route:
      menuType === "DIVIDER"
        ? null
        : getCatalogNodeValue(item, catalogMenu, "route", "menu_route"),
    original_route:
      menuType === "DIVIDER"
        ? null
        : getCatalogNodeValue(item, catalogMenu, "original_route") ??
          catalogMenu?.route ??
          item?.route,
    icon:
      menuType === "DIVIDER"
        ? null
        : getCatalogNodeValue(item, catalogMenu, "icon", "menu_icon"),
    menu_type: menuType,
    is_header: menuType === "DIVIDER",
    isHeadr: menuType === "DIVIDER",
  };
};

export const getRoleMenuType = (item = {}, catalogMenu = {}) => {
  const nestedMenu = getNestedMenu(item);
  const menuType = String(
    item?.menu_type || nestedMenu?.menu_type || catalogMenu?.menu_type || "",
  )
    .toUpperCase()
    .trim();
  if (
    item?.is_header ||
    item?.isHeadr ||
    nestedMenu?.is_header ||
    nestedMenu?.isHeadr ||
    catalogMenu?.is_header ||
    catalogMenu?.isHeadr ||
    menuType === "DIVIDER"
  ) {
    return "DIVIDER";
  }
  if (menuType === "GROUP" || (!menuType && toArray(item?.children).length)) {
    return "GROUP";
  }
  return "LINK";
};

export const isRoleMenuDividerNode = (item) =>
  getRoleMenuType(item) === "DIVIDER";

export const isRoleMenuGroupNode = (item) =>
  getRoleMenuType(item) === "GROUP";

const normalizeRoutePath = (route) => {
  const value = String(route || "").trim();
  if (!value || value === "#") return null;
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
};

const getRouteSegment = (item) => {
  const source =
    item?.route_segment ||
    item?.original_route ||
    item?.route ||
    item?.menu?.original_route ||
    item?.menu?.route ||
    item?.code ||
    item?.menu?.code ||
    item?.name;
  const cleanValue = String(source || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");

  if (!cleanValue) return "";

  const parts = cleanValue.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
};

const joinRoutePath = (parentRoute, segment) => {
  const parent = normalizeRoutePath(parentRoute);
  const child = String(segment || "").trim().replace(/^\/+|\/+$/g, "");

  if (!child) return parent;
  if (!parent) return normalizeRoutePath(child);

  return `${parent}/${child}`;
};

const getOriginalRoute = (item) => {
  if (isRoleMenuDividerNode(item)) return null;

  const explicitRoute = normalizeRoutePath(
    item?.original_route ||
      item?.menu?.original_route ||
      item?.route ||
      item?.menu?.route,
  );
  if (explicitRoute) return explicitRoute;

  const routeSegment = getRouteSegment(item);
  return routeSegment ? normalizeRoutePath(routeSegment) : null;
};

const resolveNodeRoute = (item, parentRoute) => {
  if (isRoleMenuDividerNode(item)) return null;

  const routeSegment = getRouteSegment(item);
  if (parentRoute) {
    return joinRoutePath(parentRoute, routeSegment);
  }

  return getOriginalRoute(item);
};

export const normalizeRoleMenuTree = (items = [], menuCatalog = []) => {
  const catalogMap = createMenuCatalogMap(menuCatalog);

  return sortByOrder(items).map((item, index) => {
    const hydratedItem = hydrateRoleMenuNode(item, catalogMap);
    const id = getRoleMenuNodeId(hydratedItem);
    const originalRoute = getOriginalRoute(hydratedItem);
    return {
      ...hydratedItem,
      id,
      menu_type: getRoleMenuType(hydratedItem),
      parent_id: hydratedItem?.parent_id ?? null,
      sort_order: Number(hydratedItem?.sort_order ?? index + 1),
      original_route: originalRoute,
      route_segment: getRouteSegment(hydratedItem),
      children: normalizeRoleMenuTree(hydratedItem?.children || [], catalogMap),
    };
  });
};

export const applyRoleMenuTreeOrder = (
  items = [],
  parentId = null,
  parentRoute = null,
) =>
  toArray(items).map((item, index) => {
    const hydratedItem = hydrateRoleMenuNode(item);
    const id = getRoleMenuNodeId(hydratedItem);
    const originalRoute = getOriginalRoute(hydratedItem);
    const routeSegment = getRouteSegment(hydratedItem);
    const route = resolveNodeRoute(
      {
        ...hydratedItem,
        original_route: originalRoute,
        route_segment: routeSegment,
      },
      parentRoute,
    );

    return {
      ...hydratedItem,
      id,
      menu_type: getRoleMenuType(hydratedItem),
      group_menu_id: hydratedItem.group_menu_id ?? id,
      parent_id: parentId,
      sort_order: index + 1,
      original_route: originalRoute,
      route_segment: routeSegment,
      route,
      children: applyRoleMenuTreeOrder(item.children || [], id, route),
    };
  });

export const flattenRoleMenuTree = (items = [], parentId = null) =>
  toArray(items).flatMap((item, index) => {
    const id = getRoleMenuNodeId(item);
    const row = {
      id,
      group_menu_id: id,
      menu_id:
        item.menu_id ??
        item.menu?.menu_id ??
        item.menu?.id ??
        item.menuId ??
        item.menu_uuid,
      parent_id: parentId,
      sort_order: index + 1,
    };

    return [row, ...flattenRoleMenuTree(item.children, id)];
  });

export const findRoleMenuNode = (items = [], targetId) => {
  for (const item of toArray(items)) {
    if (getRoleMenuNodeId(item) === String(targetId)) {
      return item;
    }

    const child = findRoleMenuNode(item.children, targetId);
    if (child) return child;
  }

  return null;
};

export const removeRoleMenuNode = (items = [], targetId) => {
  let removed = null;

  const nextItems = toArray(items).reduce((acc, item) => {
    if (getRoleMenuNodeId(item) === String(targetId)) {
      removed = item;
      return acc;
    }

    const result = removeRoleMenuNode(item.children, targetId);
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

const insertRoleMenuNode = (items = [], droppableId, index, node) => {
  if (droppableId === "root") {
    const nextItems = [...toArray(items)];
    nextItems.splice(index, 0, { ...node, parent_id: null });
    return nextItems;
  }

  const parentId = droppableId.replace("children:", "");

  return toArray(items).map((item) => {
    if (getRoleMenuNodeId(item) === parentId) {
      const children = [...toArray(item.children)];
      children.splice(index, 0, { ...node, parent_id: parentId });
      return { ...item, children };
    }

    return {
      ...item,
      children: insertRoleMenuNode(item.children, droppableId, index, node),
    };
  });
};

export const moveRoleMenuNode = (items = [], source, destination) => {
  if (!destination) return items;

  const sourceIndex = Number(source.index);
  const destinationIndex = Number(destination.index);

  if (
    source.droppableId === destination.droppableId &&
    sourceIndex === destinationIndex
  ) {
    return items;
  }

  const sourceList = getDroppableItems(items, source.droppableId);
  const movingNode = sourceList[sourceIndex];

  if (!movingNode) {
    return items;
  }

  const { items: withoutNode } = removeRoleMenuNode(
    items,
    getRoleMenuNodeId(movingNode),
  );

  return applyRoleMenuTreeOrder(
    insertRoleMenuNode(
      withoutNode,
      destination.droppableId,
      destinationIndex,
      movingNode,
    ),
  );
};

export const moveRoleMenuNodeIntoParent = (
  items = [],
  source,
  targetParentId,
) => {
  if (!targetParentId) return items;

  const sourceList = getDroppableItems(items, source.droppableId);
  const movingNode = sourceList[Number(source.index)];
  const targetParent = findRoleMenuNode(items, targetParentId);

  if (!movingNode || !targetParent) {
    return items;
  }

  const { items: withoutNode } = removeRoleMenuNode(
    items,
    getRoleMenuNodeId(movingNode),
  );

  return applyRoleMenuTreeOrder(
    insertRoleMenuNode(
      withoutNode,
      `children:${targetParentId}`,
      targetParent.children?.length || 0,
      movingNode,
    ),
  );
};

const moveNodeInList = (items = [], targetId, offset) => {
  const list = toArray(items);
  const index = list.findIndex(
    (item) => getRoleMenuNodeId(item) === String(targetId),
  );
  if (index < 0) return list;

  const nextIndex = Math.max(0, Math.min(list.length - 1, index + offset));
  if (nextIndex === index) return list;

  const nextItems = [...list];
  const [movingNode] = nextItems.splice(index, 1);
  nextItems.splice(nextIndex, 0, movingNode);
  return nextItems;
};

export const moveRoleMenuNodeByOffset = (items = [], targetId, offset) => {
  const target = findRoleMenuNode(items, targetId);
  if (!target) return items;

  const moveAtCurrentLevel = (nodes = []) => {
    if (nodes.some((item) => getRoleMenuNodeId(item) === String(targetId))) {
      return moveNodeInList(nodes, targetId, offset);
    }

    return nodes.map((item) => ({
      ...item,
      children: moveAtCurrentLevel(item.children || []),
    }));
  };

  return applyRoleMenuTreeOrder(moveAtCurrentLevel(items));
};

export const promoteRoleMenuNode = (items = [], targetId) => {
  const target = findRoleMenuNode(items, targetId);
  if (!target) return items;

  const promoteFromChildren = (nodes = []) => {
    const result = [];
    nodes.forEach((item) => {
      const children = toArray(item.children);
      const targetIndex = children.findIndex(
        (child) => getRoleMenuNodeId(child) === String(targetId),
      );

      if (targetIndex >= 0) {
        const nextChildren = [...children];
        const [movingNode] = nextChildren.splice(targetIndex, 1);
        result.push({
          ...item,
          children: nextChildren,
          __promotedNode: movingNode,
        });
        return;
      }

      const nested = promoteFromChildren(children);
      result.push({
        ...item,
        children: nested.items,
      });
      if (nested.promotedNode) {
        result[result.length - 1].__promotedNode = nested.promotedNode;
      }
    });

    return {
      items: result.map(({ __promotedNode, ...item }) => item),
      promotedNode: result.find((item) => item.__promotedNode)?.__promotedNode,
    };
  };

  const parent = findParent(items, targetId);
  if (!parent) return items;

  const removeResult = removeRoleMenuNode(items, targetId);
  const nextItems = removeResult.items;
  const parentOfParent = findParent(nextItems, getRoleMenuNodeId(parent));
  const targetParentId = parentOfParent
    ? getRoleMenuNodeId(parentOfParent)
    : null;

  return applyRoleMenuTreeOrder(
    insertRoleMenuNode(
      nextItems,
      targetParentId ? `children:${targetParentId}` : "root",
      targetParentId
        ? toArray(findRoleMenuNode(nextItems, targetParentId)?.children).length
        : nextItems.length,
      target,
    ),
  );
};

const findParent = (items = [], targetId, parent = null) => {
  for (const item of toArray(items)) {
    if (getRoleMenuNodeId(item) === String(targetId)) return parent;
    const found = findParent(item.children, targetId, item);
    if (found) return found;
  }
  return null;
};

export const getDroppableItems = (items = [], droppableId) => {
  if (droppableId === "root") return toArray(items);

  const parentId = droppableId.replace("children:", "");
  const parent = findRoleMenuNode(items, parentId);
  return toArray(parent?.children);
};

export const collectRoleMenuIds = (items = []) =>
  flattenRoleMenuTree(items).map((item) => String(item.menu_id || item.id));
