export const ACCESS_CACHE_KEY = "maestro_access";

const DEFAULT_ICON = "heroicons-outline:squares-2x2";

const ICON_MAP = {
  add: "heroicons-outline:plus-circle",
  dashboard: "heroicons-outline:home",
  home: "heroicons-outline:home",
  menu: "heroicons-outline:bars-3",
  "master-data": "heroicons-outline:circle-stack",
  database: "heroicons-outline:circle-stack",
  data: "heroicons-outline:circle-stack",
  order: "heroicons-outline:shopping-cart",
  orders: "heroicons-outline:shopping-cart",
  pool: "heroicons-outline:building-office-2",
  pools: "heroicons-outline:building-office-2",
  branch: "heroicons-outline:building-office",
  branches: "heroicons-outline:building-office",
  building: "heroicons-outline:building-office",
  bank: "heroicons-outline:banknotes",
  people: "heroicons-outline:users",
  person: "heroicons-outline:user",
  user: "heroicons-outline:users",
  users: "heroicons-outline:users",
  student: "heroicons-outline:academic-cap",
  students: "heroicons-outline:academic-cap",
  trainer: "heroicons-outline:user-group",
  coach: "heroicons-outline:user-group",
  superuser: "heroicons-outline:shield-check",
  role: "heroicons-outline:key",
  roles: "heroicons-outline:key",
  "role-menu": "heroicons-outline:adjustments-horizontal",
  permission: "heroicons-outline:shield-check",
  permissions: "heroicons-outline:shield-check",
  finance: "heroicons-outline:banknotes",
  money: "heroicons-outline:banknotes",
  payment: "heroicons-outline:credit-card",
  notification: "heroicons-outline:bell",
  notifications: "heroicons-outline:bell",
  report: "heroicons-outline:chart-bar",
  progress: "heroicons-outline:chart-bar",
  job: "heroicons-outline:briefcase",
  jobs: "heroicons-outline:briefcase",
  loker: "heroicons-outline:briefcase",
  application: "heroicons-outline:clipboard-document-check",
  applications: "heroicons-outline:clipboard-document-check",
  recruitment: "heroicons-outline:clipboard-document-check",
  rekruitmen: "heroicons-outline:clipboard-document-check",
};

const ICON_KEYWORDS = [
  "master-data",
  "role-menu",
  "dashboard",
  "notification",
  "permission",
  "superuser",
  "student",
  "trainer",
  "finance",
  "payment",
  "people",
  "branch",
  "building",
  "report",
  "progress",
  "application",
  "applications",
  "recruitment",
  "rekruitmen",
  "database",
  "jobs",
  "job",
  "loker",
  "order",
  "coach",
  "money",
  "users",
  "user",
  "roles",
  "role",
  "pool",
  "bank",
  "home",
  "menu",
  "data",
  "add",
];

const ROUTE_ALIAS_MAP = {
  branches: "cabang",
  branch: "cabang",
  pools: "kolam",
  pool: "kolam",
  jobs: "loker",
  job: "loker",
  "career/jobs": "loker",
  "api/career/jobs": "loker",
  applications: "rekruitmen",
  application: "rekruitmen",
  recruitment: "rekruitmen",
  "career/applications": "rekruitmen",
  "api/career/applications": "rekruitmen",
};

const getBrowserStorage = (type) => {
  if (typeof window === "undefined") return null;
  try {
    const storage = window[type];
    const testKey = "__access_storage_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
};

const parseStorageValue = (storage) => {
  if (!storage) return null;
  try {
    const rawValue = storage.getItem(ACCESS_CACHE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error("Failed to parse access cache:", error);
    storage.removeItem(ACCESS_CACHE_KEY);
    return null;
  }
};

export const getAccessCache = () => {
  const localCache = parseStorageValue(getBrowserStorage("localStorage"));
  if (localCache) return localCache;
  return parseStorageValue(getBrowserStorage("sessionStorage"));
};

export const setAccessCache = (accessData, remember = true) => {
  const localStorage = getBrowserStorage("localStorage");
  const sessionStorage = getBrowserStorage("sessionStorage");
  const targetStorage = remember ? localStorage : sessionStorage;
  const fallbackStorage = remember ? sessionStorage : localStorage;

  if (!targetStorage) return;

  try {
    targetStorage.setItem(
      ACCESS_CACHE_KEY,
      JSON.stringify({
        ...accessData,
        cached_at: new Date().toISOString(),
      }),
    );
    fallbackStorage?.removeItem(ACCESS_CACHE_KEY);
  } catch (error) {
    console.error("Failed to persist access cache:", error);
  }
};

export const clearAccessCache = () => {
  try {
    getBrowserStorage("localStorage")?.removeItem(ACCESS_CACHE_KEY);
    getBrowserStorage("sessionStorage")?.removeItem(ACCESS_CACHE_KEY);
    getBrowserStorage("localStorage")?.removeItem("menuItems");
  } catch (error) {
    console.error("Failed to clear access cache:", error);
  }
};

export const extractList = (payload) => {
  const seen = new Set();
  const listKeys = [
    "results",
    "data",
    "items",
    "menus",
    "roles",
    "permissions",
  ];

  const findList = (value, depth = 0) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object" || depth > 6) return [];
    if (seen.has(value)) return [];
    seen.add(value);

    for (const key of listKeys) {
      if (Array.isArray(value[key])) return value[key];
    }

    for (const key of listKeys) {
      const nestedList = findList(value[key], depth + 1);
      if (nestedList.length) return nestedList;
    }

    return [];
  };

  return findList(payload);
};

const toArray = (value) => {
  if (value == null || value === "") return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeId = (value) => {
  if (value == null || value === "") return "";
  return String(value);
};

const uniqueByValue = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const value = normalizeId(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
};

export const getRoleName = (role) => {
  if (typeof role === "string") return role.trim();
  if (!role || typeof role !== "object") return "";

  return (
    role.name ||
    role.role_name ||
    role.codename ||
    role.code ||
    role.label ||
    ""
  ).trim();
};

export const getRoleId = (role) => {
  if (!role || typeof role !== "object") return "";
  return normalizeId(role.id ?? role.role_id ?? role.pk ?? role.value);
};

export const extractRoleIds = (userData = {}) => {
  const directIds = [
    ...toArray(userData.role_id),
    ...toArray(userData.role_ids),
    ...toArray(userData.group_id),
    ...toArray(userData.group_ids),
  ];

  const objectIds = [
    ...toArray(userData.role),
    ...toArray(userData.roles),
    ...toArray(userData.user_roles),
    ...toArray(userData.groups),
  ].map(getRoleId);

  return uniqueByValue([...directIds, ...objectIds]);
};

export const extractRoleNames = (userData = {}) => {
  const names = [
    ...toArray(userData.role),
    ...toArray(userData.roles),
    ...toArray(userData.user_roles),
    ...toArray(userData.groups),
  ].map(getRoleName);

  return uniqueByValue(names);
};

const normalizeRoute = (route, fallback = "") => {
  const value = route || fallback;
  if (!value || value === "#") return "";
  const normalized = String(value).replace(/^\/+/, "");
  return ROUTE_ALIAS_MAP[normalized] || normalized;
};

const normalizeIconKey = (value) =>
  String(value || "")
    .trim()
    .replace(/^icon-/, "")
    .toLowerCase();

const resolveIconKey = (key) => {
  if (!key) return "";
  if (ICON_MAP[key]) return ICON_MAP[key];

  const matchingKeyword = ICON_KEYWORDS.find((keyword) =>
    key.includes(keyword),
  );
  return matchingKeyword ? ICON_MAP[matchingKeyword] : "";
};

const normalizeIcon = (icon, code = "", name = "") => {
  const iconValue = String(icon || "").trim();
  if (iconValue.includes(":")) return iconValue;

  const values = [iconValue, code, name];
  for (const value of values) {
    const resolvedIcon = resolveIconKey(normalizeIconKey(value));
    if (resolvedIcon) return resolvedIcon;
  }

  return DEFAULT_ICON;
};

const isVisibleMenu = (item) =>
  item?.is_visible !== false && item?.is_active !== false;

const getBackendMenuType = (item = {}) => {
  const menuType = String(item?.menu_type || "").toUpperCase();
  if (item?.is_header || item?.isHeadr || menuType === "DIVIDER") {
    return "DIVIDER";
  }
  if (menuType === "GROUP" || (!menuType && toArray(item?.children).length)) {
    return "GROUP";
  }
  return "LINK";
};

const sortMenus = (items) =>
  [...items].sort((a, b) => {
    const first = Number(a?.sort_order ?? a?.order ?? 0);
    const second = Number(b?.sort_order ?? b?.order ?? 0);
    return first - second;
  });

const mapGrandChildMenu = (item) => {
  const menuType = getBackendMenuType(item);

  return {
    multiTitle: item.name || item.title || item.code || "Menu",
    multiLink:
      menuType === "DIVIDER" ? "" : normalizeRoute(item.route, item.code),
    originalMultiLink:
      menuType === "DIVIDER"
        ? ""
        : normalizeRoute(item.original_route, item.route || item.code),
    menu_type: menuType,
    isHeadr: menuType === "DIVIDER",
    isGroup: menuType === "GROUP",
    badge: item.badge,
  };
};

const mapChildMenu = (item) => {
  const menuType = getBackendMenuType(item);
  const children = sortMenus(toArray(item.children).filter(isVisibleMenu));
  const baseItem = {
    childtitle: item.name || item.title || item.code || "Menu",
    childlink:
      menuType === "DIVIDER" ? "" : normalizeRoute(item.route, item.code),
    original_childlink:
      menuType === "DIVIDER"
        ? ""
        : normalizeRoute(item.original_route, item.route || item.code),
    childicon: normalizeIcon(item.icon, item.code, item.name || item.title),
    menu_type: menuType,
    isHeadr: menuType === "DIVIDER",
    isGroup: menuType === "GROUP",
  };

  if (children.length || menuType === "GROUP") {
    return {
      ...baseItem,
      multi_menu: children.map(mapGrandChildMenu),
    };
  }

  return baseItem;
};

export const mapBackendMenuToSidebar = (items = []) =>
  sortMenus(toArray(items).filter(isVisibleMenu)).map((item) => {
    const menuType = getBackendMenuType(item);
    const children = sortMenus(toArray(item.children).filter(isVisibleMenu));
    const baseItem = {
      title: item.name || item.title || item.code || "Menu",
      icon: normalizeIcon(item.icon, item.code, item.name || item.title),
      isHide: item.isHide ?? false,
      menu_type: menuType,
      isGroup: menuType === "GROUP",
    };

    if (menuType === "DIVIDER") {
      return {
        ...baseItem,
        icon: null,
        isHeadr: true,
        isHide: false,
      };
    }

    if (children.length || menuType === "GROUP") {
      return {
        ...baseItem,
        isOpen: true,
        isHide: true,
        child: children.map(mapChildMenu),
      };
    }

    return {
      ...baseItem,
      link: normalizeRoute(item.route, item.code),
      originalLink: normalizeRoute(item.original_route, item.route || item.code),
    };
  });

const mergeChildren = (existing = [], incoming = []) => {
  const map = new Map();

  [...existing, ...incoming].forEach((item) => {
    const key = item.childlink || item.childtitle;
    if (!key) return;

    const previous = map.get(key);
    if (!previous) {
      map.set(key, item);
      return;
    }

    map.set(key, {
      ...previous,
      ...item,
      multi_menu: mergeMultiMenus(previous.multi_menu, item.multi_menu),
    });
  });

  return [...map.values()];
};

const mergeMultiMenus = (existing = [], incoming = []) => {
  const map = new Map();

  [...existing, ...incoming].forEach((item) => {
    const key = item.multiLink || item.multiTitle;
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...item });
  });

  return [...map.values()];
};

export const mergeSidebarMenus = (menuGroups = []) => {
  const map = new Map();

  menuGroups.flat().forEach((item) => {
    const key = item.link || item.title;
    if (!key) return;

    const previous = map.get(key);
    if (!previous) {
      map.set(key, item);
      return;
    }

    map.set(key, {
      ...previous,
      ...item,
      child: mergeChildren(previous.child, item.child),
    });
  });

  return [...map.values()];
};

export const normalizePermissions = (items = []) => {
  const map = new Map();

  toArray(items).forEach((item) => {
    const code =
      item?.codename ||
      item?.code ||
      item?.permission ||
      item?.permission_code ||
      item?.name ||
      "";
    if (!code) return;
    map.set(code, item);
  });

  return [...map.values()];
};

const normalizePermissionCode = (value) => {
  const code = String(value || "").trim().toLowerCase();
  if (!code) return [];

  const parts = code.split(".");
  const shortCode = parts[parts.length - 1];

  return shortCode && shortCode !== code ? [code, shortCode] : [code];
};

export const getPermissionCodes = (items = []) => [
  ...new Set(
    normalizePermissions(items).flatMap((item) =>
      normalizePermissionCode(
        item.codename ||
          item.code ||
          item.permission ||
          item.permission_code ||
          item.name ||
          "",
      ),
    ),
  ),
];

export const hasPermission = (permissionCodes = [], permission) => {
  if (!permission) return true;
  const requiredPermissions = toArray(permission)
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
  const grantedPermissions = new Set(
    toArray(permissionCodes).map((item) => String(item).trim().toLowerCase()),
  );
  return requiredPermissions.every((item) => grantedPermissions.has(item));
};

export const hasAnyPermission = (permissionCodes = [], permissions = []) => {
  const requiredPermissions = toArray(permissions)
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);

  if (!requiredPermissions.length) return true;

  const grantedPermissions = new Set(
    toArray(permissionCodes).map((item) => String(item).trim().toLowerCase()),
  );

  return requiredPermissions.some((item) => grantedPermissions.has(item));
};
