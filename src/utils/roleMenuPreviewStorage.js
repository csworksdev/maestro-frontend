import Menu from "@/constant/menu";
import { applyRoleMenuTreeOrder } from "@/utils/roleMenuTree";

export const ROLE_MENU_PREVIEW_STORAGE_KEY = "maestro_role_menu_preview";
export const ROLE_MENU_PREVIEW_STORAGE_EVENT = "maestro-role-menu-preview-updated";
const ROLE_MENU_PREVIEW_STORAGE_VERSION = 4;

const ROLE_NAME_TO_ID = {
  Admin: "1",
  Finance: "2",
  Coach: "3",
  Trainer: "3",
  Hydro: "4",
  Chief: "5",
  Superuser: "6",
  Opx: "7",
};

export const ROLE_MENU_PREVIEW_ROLES = [
  { id: "1", name: "Admin" },
  { id: "2", name: "Finance" },
  { id: "3", name: "Coach" },
  { id: "4", name: "Hydro" },
  { id: "5", name: "Chief" },
  { id: "6", name: "Superuser" },
  { id: "7", name: "Opx" },
];

const cloneValue = (value) => JSON.parse(JSON.stringify(value || null));

const slugify = (value) =>
  String(value || "menu")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "menu";

const normalizeRouteForTree = (route) => {
  if (!route) return null;
  const value = String(route).trim();
  if (!value) return null;
  return value.startsWith("/") ? value : `/${value}`;
};

const normalizeRouteForSidebar = (route, fallback = "") => {
  const value = route || fallback;
  if (!value || value === "#") return "";
  const normalized = String(value).replace(/^\/+/, "");
  const aliases = {
    jobs: "loker",
    job: "loker",
    "career/jobs": "loker",
    "api/career/jobs": "loker",
    applications: "rekruitmen",
    application: "rekruitmen",
    recruitment: "rekruitmen",
    "career/applications": "rekruitmen",
    "api/career/applications": "rekruitmen",
    stages: "tahapan",
    stage: "tahapan",
    "career/stages": "tahapan",
    "api/career/stages": "tahapan",
  };
  return aliases[normalized] || normalized;
};

const isDividerMenu = (item) =>
  item?.is_header || item?.isHeadr || item?.menu_type === "DIVIDER";

const getRoleMenuType = (item = {}) => {
  const menuType = String(item?.menu_type || "").toUpperCase();
  if (isDividerMenu(item)) return "DIVIDER";
  if (menuType === "GROUP" || (!menuType && item?.children?.length)) {
    return "GROUP";
  }
  return "LINK";
};

const normalizeComparableRoute = (route) =>
  String(route || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

const getSidebarChildren = (item) => [
  ...(Array.isArray(item?.child) ? item.child : []),
  ...(Array.isArray(item?.multi_menu) ? item.multi_menu : []),
];

const collectSidebarRoutePaths = (items = []) =>
  (items || []).flatMap((item) => {
    const paths = [
      item?.link,
      item?.originalLink,
      item?.childlink,
      item?.original_childlink,
      item?.multiLink,
      item?.originalMultiLink,
    ]
      .map(normalizeComparableRoute)
      .filter(Boolean);

    return [...paths, ...collectSidebarRoutePaths(getSidebarChildren(item))];
  });

const getDefaultKnownRoutePaths = () =>
  ROLE_MENU_PREVIEW_ROLES.flatMap((role) =>
    collectSidebarRoutePaths(Menu(role.name)),
  );

const getNodeId = (roleId, type, value, indexPath) =>
  `${roleId}-${type}-${slugify(value)}-${indexPath}`;

const sidebarMultiToNode = (item, roleId, parentId, index, indexPath) => {
  const title = item.multiTitle || item.title || item.code || "Menu";
  const link = item.multiLink || item.link || item.route || "";
  const menuType =
    item.menu_type || (item.isHeadr || item.is_header ? "DIVIDER" : "LINK");

  return {
    id: getNodeId(roleId, "multi", link || title, indexPath),
    group_menu_id: getNodeId(roleId, "multi", link || title, indexPath),
    menu_id: getNodeId(roleId, "multi-menu", link || title, indexPath),
    name: title,
    code: slugify(link || title),
    menu_type: menuType,
    route: menuType === "DIVIDER" ? null : normalizeRouteForTree(link),
    icon: item.icon || item.childicon || null,
    parent_id: parentId,
    sort_order: index + 1,
    is_visible: item.is_visible !== false,
    is_header: menuType === "DIVIDER",
    isHeadr: menuType === "DIVIDER",
    children: [],
  };
};

const sidebarChildToNode = (item, roleId, parentId, index, indexPath) => {
  const title = item.childtitle || item.title || item.code || "Menu";
  const link = item.childlink || item.link || item.route || "";
  const id = getNodeId(roleId, "child", link || title, indexPath);
  const menuType =
    item.menu_type ||
    (item.isHeadr || item.is_header
      ? "DIVIDER"
      : item.isGroup || item.child?.length || item.multi_menu?.length
        ? "GROUP"
        : "LINK");
  const childItems = [
    ...(item.child || []).map((child, childIndex) =>
      sidebarChildToNode(
        child,
        roleId,
        id,
        childIndex,
        `${indexPath}-${childIndex}`,
      ),
    ),
    ...(item.multi_menu || []).map((multi, multiIndex) =>
      sidebarMultiToNode(
        multi,
        roleId,
        id,
        multiIndex,
        `${indexPath}-multi-${multiIndex}`,
      ),
    ),
  ];

  return {
    id,
    group_menu_id: id,
    menu_id: getNodeId(roleId, "child-menu", link || title, indexPath),
    name: title,
    code: slugify(link || title),
    menu_type: menuType,
    route: menuType === "DIVIDER" ? null : normalizeRouteForTree(link),
    icon: item.childicon || item.icon || null,
    parent_id: parentId,
    sort_order: index + 1,
    is_visible: item.is_visible !== false,
    is_header: menuType === "DIVIDER",
    isHeadr: menuType === "DIVIDER",
    children: childItems,
  };
};

const sidebarItemToNode = (item, roleId, index) => {
  const title = item.title || item.name || "Menu";
  const link = item.link || item.route || "";
  const type = item.isHeadr ? "header" : "root";
  const id = getNodeId(roleId, type, link || title, String(index));

  if (item.isHeadr) {
    return {
      id,
      group_menu_id: id,
      menu_id: id,
      name: title,
      code: slugify(title),
      route: null,
      icon: null,
      parent_id: null,
      sort_order: index + 1,
      is_visible: true,
      is_header: true,
      isHeadr: true,
      children: [],
    };
  }

  return {
    id,
    group_menu_id: id,
    menu_id: getNodeId(roleId, "root-menu", link || title, String(index)),
    name: title,
    code: slugify(link || title),
    menu_type:
      item.menu_type ||
      (item.isGroup || item.child?.length ? "GROUP" : "LINK"),
    route: normalizeRouteForTree(link),
    icon: item.icon || null,
    parent_id: null,
    sort_order: index + 1,
    is_visible: item.is_visible !== false,
    children: (item.child || []).map((child, childIndex) =>
      sidebarChildToNode(child, roleId, id, childIndex, `${index}-${childIndex}`),
    ),
  };
};

export const sidebarMenusToRoleMenuTree = (menus = [], roleId = "preview") =>
  cloneValue(menus)
    .filter((item) => item && typeof item === "object")
    .map((item, index) => sidebarItemToNode(item, roleId, index));

const roleMenuChildToSidebar = (item) => {
  const menuType = getRoleMenuType(item);
  if (menuType === "DIVIDER") {
    return {
      childtitle: item.name || item.title || "Menu",
      childlink: "",
      menu_type: "DIVIDER",
      isHeadr: true,
    };
  }

  const children = (item.children || []).filter(
    (child) => child?.is_visible !== false,
  );
  const baseItem = {
    childtitle: item.name || item.title || item.code || "Menu",
    childlink: normalizeRouteForSidebar(item.route, item.code),
    original_childlink: normalizeRouteForSidebar(
      item.original_route,
      item.route || item.code,
    ),
    childicon: item.icon || "heroicons-outline:squares-2x2",
    menu_type: menuType,
    isGroup: menuType === "GROUP",
  };

  if (children.length || menuType === "GROUP") {
    return {
      ...baseItem,
      child: children.map(roleMenuChildToSidebar),
      multi_menu: children.map(roleMenuChildToSidebar),
    };
  }

  return baseItem;
};

export const roleMenuTreeToSidebarMenus = (items = []) =>
  [...(items || [])]
    .filter((item) => item?.is_visible !== false)
    .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0))
    .map((item) => {
      const menuType = getRoleMenuType(item);

      if (menuType === "DIVIDER") {
        return {
          isHeadr: true,
          menu_type: "DIVIDER",
          title: item.name || item.title || "Menu",
        };
      }

      const children = [...(item.children || [])]
        .filter((child) => child?.is_visible !== false)
        .sort((a, b) => Number(a?.sort_order ?? 0) - Number(b?.sort_order ?? 0));
      const baseItem = {
        title: item.name || item.title || item.code || "Menu",
        icon: item.icon || "heroicons-outline:squares-2x2",
        menu_type: menuType,
        isGroup: menuType === "GROUP",
      };

      if (children.length || menuType === "GROUP") {
        return {
          ...baseItem,
          isOpen: true,
          isHide: true,
          child: children.map(roleMenuChildToSidebar),
        };
      }

      return {
        ...baseItem,
        link: normalizeRouteForSidebar(item.route, item.code),
        originalLink: normalizeRouteForSidebar(
          item.original_route,
          item.route || item.code,
        ),
      };
    });

const createMenuRouteMap = (menus = []) => {
  const routeMap = new Map();

  menus.forEach((menu) => {
    const menuId = String(menu?.menu_id || menu?.id || "");
    const route = normalizeRouteForTree(menu?.route);

    if (menuId && route) {
      routeMap.set(menuId, route);
    }
  });

  return routeMap;
};

const createKnownRouteSet = (menus = []) =>
  new Set([
    ...getDefaultKnownRoutePaths(),
    ...menus
      .map((menu) => normalizeComparableRoute(menu?.route))
      .filter(Boolean),
  ]);

const findKnownNestedRouteAlias = (path = "", knownRoutes = new Set()) => {
  const pathParts = normalizeComparableRoute(path).split("/").filter(Boolean);

  for (let index = 1; index < pathParts.length; index += 1) {
    const candidate = pathParts.slice(index).join("/");
    const matchedRoute = [...knownRoutes]
      .filter(
        (route) => candidate === route || candidate.startsWith(`${route}/`),
      )
      .sort((first, second) => second.length - first.length)[0];

    if (matchedRoute) {
      return `/${candidate}`;
    }
  }

  return "";
};

const hydrateOriginalRoutesFromCatalog = (items = [], menuRouteMap = new Map()) =>
  (items || []).map((item) => {
    if (!item || typeof item !== "object") return item;

    const menuId = String(item.menu_id || item.id || "");
    const catalogRoute = menuRouteMap.get(menuId);
    const currentRoute = normalizeRouteForTree(item.route);
    const currentOriginalRoute = normalizeRouteForTree(item.original_route);
    const shouldUseCatalogRoute =
      !isDividerMenu(item) &&
      catalogRoute &&
      (!currentOriginalRoute ||
        normalizeComparableRoute(currentOriginalRoute) ===
          normalizeComparableRoute(currentRoute));

    return {
      ...item,
      original_route: shouldUseCatalogRoute ? catalogRoute : item.original_route,
      children: hydrateOriginalRoutesFromCatalog(item.children || [], menuRouteMap),
    };
  });

const normalizeStoredRoleMenuTree = (tree = [], menus = []) =>
  applyRoleMenuTreeOrder(
    hydrateOriginalRoutesFromCatalog(tree, createMenuRouteMap(menus)),
  );

const collectSidebarMenus = (items = [], roleId = "") => {
  const menuMap = new Map();

  const collect = (item) => {
    if (!item) return;

    const menuId = String(item.menu_id || item.id || "");
    if (menuId) {
      menuMap.set(menuId, {
        menu_id: menuId,
        role_id: roleId,
        name: item.name || item.title || item.code || "Menu",
        code: item.code || slugify(item.route || item.name),
        menu_type: isDividerMenu(item)
          ? "DIVIDER"
          : item.children?.length
            ? "GROUP"
            : "LINK",
        route: item.route || null,
        icon: item.icon || null,
        is_active: item.is_visible !== false,
        is_header: isDividerMenu(item),
      });
    }

    (item.children || []).forEach(collect);
  };

  items.forEach(collect);
  return [...menuMap.values()];
};

export const createDefaultRoleMenuPreviewState = () => {
  const roleMenus = Object.fromEntries(
    ROLE_MENU_PREVIEW_ROLES.map((role) => [
      role.id,
      sidebarMenusToRoleMenuTree(Menu(role.name), role.id),
    ]),
  );

  return createRoleMenuPreviewState({
    menus: Object.entries(roleMenus).flatMap(([roleId, tree]) =>
      collectSidebarMenus(tree, roleId),
    ),
    roleMenus,
  });
};

const getStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    const testKey = "__role_menu_preview_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
};

const normalizeRoleName = (role) => {
  if (role && typeof role === "object") {
    return (
      role.name ||
      role.role_name ||
      role.codename ||
      role.code ||
      role.label ||
      ""
    ).trim();
  }

  return String(role || "").trim();
};

export const getRoleMenuPreviewRoleId = (roles) => {
  const values = Array.isArray(roles) ? roles : [roles];
  const roleName = values.map(normalizeRoleName).find((item) => item);
  return ROLE_NAME_TO_ID[roleName] || "";
};

export const createRoleMenuPreviewState = ({ menus = [], roleMenus = {} }) => ({
  version: ROLE_MENU_PREVIEW_STORAGE_VERSION,
  menus: cloneValue(menus) || [],
  roleMenus: cloneValue(roleMenus) || {},
});

const getMenuCatalogKey = (menu) =>
  String(
    menu?.menu_id ||
      menu?.id ||
      `${menu?.code || ""}:${normalizeRouteForTree(menu?.route) || ""}`,
  );

const mergeMenuCatalog = (storedMenus = [], fallbackMenus = []) => {
  const menuMap = new Map();

  [...storedMenus, ...fallbackMenus].forEach((menu) => {
    const key = getMenuCatalogKey(menu);
    if (key && !menuMap.has(key)) {
      menuMap.set(key, menu);
    }
  });

  return [...menuMap.values()];
};

export const readRoleMenuPreviewState = (fallbackState = null) => {
  const storage = getStorage();
  if (!storage) return fallbackState;

  try {
    const rawValue = storage.getItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    if (!rawValue) return fallbackState;

    const parsedValue = JSON.parse(rawValue);
    if (parsedValue?.version !== ROLE_MENU_PREVIEW_STORAGE_VERSION) {
      storage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
      return fallbackState;
    }

    return {
      ...createRoleMenuPreviewState(fallbackState || {}),
      ...parsedValue,
      menus: Array.isArray(parsedValue?.menus)
        ? mergeMenuCatalog(parsedValue.menus, fallbackState?.menus || [])
        : fallbackState?.menus || [],
      roleMenus:
        parsedValue?.roleMenus && typeof parsedValue.roleMenus === "object"
          ? parsedValue.roleMenus
          : fallbackState?.roleMenus || {},
    };
  } catch (error) {
    console.error("Failed to parse role-menu preview storage:", error);
    storage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    return fallbackState;
  }
};

export const writeRoleMenuPreviewState = (state) => {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      ROLE_MENU_PREVIEW_STORAGE_KEY,
      JSON.stringify({
        ...createRoleMenuPreviewState(state),
        updated_at: new Date().toISOString(),
      }),
    );
    window.dispatchEvent(new Event(ROLE_MENU_PREVIEW_STORAGE_EVENT));
  } catch (error) {
    console.error("Failed to persist role-menu preview storage:", error);
  }
};

export const getStoredRoleSidebarMenus = (roles) => {
  const roleId = getRoleMenuPreviewRoleId(roles);
  if (!roleId) return [];

  const previewState = readRoleMenuPreviewState();
  const tree = previewState?.roleMenus?.[roleId];
  if (!Array.isArray(tree) || !tree.length) return [];

  return roleMenuTreeToSidebarMenus(
    normalizeStoredRoleMenuTree(tree, previewState?.menus || []),
  );
};

const normalizeAliasPath = (value = "") =>
  String(value || "")
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "");

const flattenRoleMenuNodes = (items = []) =>
  (items || []).flatMap((item) => [
    item,
    ...flattenRoleMenuNodes(item?.children || []),
  ]);

export const getRoleMenuRouteAlias = (pathname = "", roles) => {
  const roleId = getRoleMenuPreviewRoleId(roles);
  if (!roleId) return "";

  const previewState = readRoleMenuPreviewState();
  const tree = normalizeStoredRoleMenuTree(
    previewState?.roleMenus?.[roleId] || [],
    previewState?.menus || [],
  );
  if (!Array.isArray(tree) || !tree.length) return "";

  const normalizedPath = normalizeAliasPath(pathname);
  if (!normalizedPath) return "";

  const aliases = flattenRoleMenuNodes(tree)
    .map((item) => {
      const route = normalizeAliasPath(item?.route);
      const originalRoute = normalizeAliasPath(item?.original_route);

      if (!route || !originalRoute || route === originalRoute) {
        return null;
      }

      return { route, originalRoute };
    })
    .filter(Boolean)
    .sort((first, second) => second.route.length - first.route.length);

  const alias = aliases.find(
    (item) =>
      normalizedPath === item.route ||
      normalizedPath.startsWith(`${item.route}/`),
  );

  if (!alias) return "";

  const suffix = normalizedPath.slice(alias.route.length).replace(/^\/+/, "");
  const target = suffix
    ? `${alias.originalRoute}/${suffix}`
    : alias.originalRoute;

  return `/${target.replace(/^\/+/, "")}`;
};

export const getRoleMenuKnownNestedRouteAlias = (pathname = "", roles) => {
  const roleId = getRoleMenuPreviewRoleId(roles);
  if (!roleId) return "";

  const previewState = readRoleMenuPreviewState();
  const tree = normalizeStoredRoleMenuTree(
    previewState?.roleMenus?.[roleId] || [],
    previewState?.menus || [],
  );
  if (!Array.isArray(tree) || !tree.length) return "";

  const normalizedPath = normalizeAliasPath(pathname);
  if (!normalizedPath) return "";

  const currentNode = flattenRoleMenuNodes(tree)
    .filter((item) => {
      const route = normalizeAliasPath(item?.route);
      return (
        route &&
        (normalizedPath === route || normalizedPath.startsWith(`${route}/`))
      );
    })
    .sort(
      (first, second) =>
        normalizeAliasPath(second?.route).length -
        normalizeAliasPath(first?.route).length,
    )[0];

  if (!currentNode || !currentNode.parent_id) {
    return "";
  }

  return findKnownNestedRouteAlias(
    normalizedPath,
    createKnownRouteSet(previewState?.menus || []),
  );
};

export const resolveRoleMenuRouteAlias = (pathname = "", roles) => {
  const directAlias = getRoleMenuRouteAlias(pathname, roles);
  if (directAlias) return directAlias;

  return getRoleMenuKnownNestedRouteAlias(pathname, roles);
};
