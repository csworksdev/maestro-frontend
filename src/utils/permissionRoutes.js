import { hasAnyPermission } from "@/utils/accessControl";

const ALWAYS_ALLOWED_PATHS = new Set([
  "",
  "dashboard",
  "notifications",
]);

const ROUTE_MODELS = [
  { path: "role-menu", permissions: ["change_group", "change_menu"] },
  { path: "user", model: "user" },
  { path: "role", model: "group" },
  { path: "role-user", model: "group" },
  { path: "permissions", model: "permission" },
  { path: "departments", model: "department" },
  {
    path: "loker",
    models: ["job", "jobs", "loker", "careerjob", "career_job"],
  },
  {
    path: "jobs",
    models: ["job", "jobs", "loker", "careerjob", "career_job"],
  },
  {
    path: "career/jobs",
    models: ["job", "jobs", "loker", "careerjob", "career_job"],
  },
  {
    path: "api/career/jobs",
    models: ["job", "jobs", "loker", "careerjob", "career_job"],
  },
  {
    path: "rekruitmen",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "applications",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "career/applications",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "api/career/applications",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "tahapan",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "stage",
      "stages",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "cek-cv",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "stage",
      "stages",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "interview-user",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "stage",
      "stages",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "validasi-video-renang",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "stage",
      "stages",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "interview-owner",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "stage",
      "stages",
      "careerapplication",
      "career_application",
    ],
  },
  {
    path: "kontrak",
    models: [
      "application",
      "applications",
      "recruitment",
      "rekruitmen",
      "stage",
      "stages",
      "careerapplication",
      "career_application",
    ],
  },
  { path: "order", model: "order" },
  { path: "finishedorder", model: "order" },
  { path: "cek-jadwal", model: "order" },
  { path: "rekap-bulanan", model: "order" },
  { path: "rekap-pelatih", model: "order" },
  { path: "siswa", model: "student" },
  { path: "student", model: "student" },
  { path: "trainer", model: "trainer" },
  { path: "produk", model: "product" },
  { path: "paket", model: "package" },
  { path: "periodisasi", model: "periodisasi" },
  { path: "cabang", model: "branch" },
  { path: "kolam", model: "pool" },
  { path: "pool", model: "pool" },
  { path: "spesialisasi", model: "specialization" },
  { path: "promo", model: "promo" },
  { path: "broadcast", model: "broadcast" },
  { path: "kontakwati", model: "contact" },
  { path: "list-izin", model: "leave" },
  { path: "reschedule", model: "reschedule" },
  { path: "finance/expense", model: "expense" },
  { path: "xendit/transaction", model: "transaction" },
  { path: "xendit/invoice-history", model: "invoice" },
  { path: "xendit/balance", model: "balance" },
  { path: "invoices", model: "invoice" },
  { path: "daily", model: "dashboard" },
  { path: "chart", model: "dashboard" },
];

const normalizePath = (value = "") =>
  String(value)
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+|\/+$/g, "")
    .toLowerCase();

const getActionFromPath = (path) => {
  const segments = normalizePath(path).split("/");
  const lastSegment = segments[segments.length - 1];

  if (lastSegment === "add") return "add";
  if (lastSegment === "edit") return "change";
  return "view";
};

const getRouteRule = (path) => {
  const normalizedPath = normalizePath(path);
  return ROUTE_MODELS.find(
    (rule) =>
      normalizedPath === rule.path || normalizedPath.startsWith(`${rule.path}/`),
  );
};

export const getRoutePermissionCandidates = (path) => {
  const rule = getRouteRule(path);
  if (!rule) return [];
  if (rule.permissions) return rule.permissions;

  const action = getActionFromPath(path);
  if (Array.isArray(rule.models)) {
    return rule.models.map((model) => `${action}_${model}`);
  }

  return [`${action}_${rule.model}`];
};

const getMenuChildren = (item) => [
  ...(Array.isArray(item?.child) ? item.child : []),
  ...(Array.isArray(item?.multi_menu) ? item.multi_menu : []),
];

const collectMenuPaths = (menus = []) =>
  menus.flatMap((item) => {
    const paths = [
      item?.link,
      item?.originalLink,
      item?.childlink,
      item?.original_childlink,
      item?.multiLink,
      item?.originalMultiLink,
    ].filter(Boolean);

    return [...paths, ...collectMenuPaths(getMenuChildren(item))];
  });

export const canAccessPath = ({
  pathname = "",
  menus = [],
  permissionCodes = [],
  accessLoaded = false,
  accessError = null,
  allowMenuAccessOnly = false,
} = {}) => {
  const normalizedPath = normalizePath(pathname);
  const firstSegment = normalizedPath.split("/")[0] || "";

  if (ALWAYS_ALLOWED_PATHS.has(normalizedPath) || ALWAYS_ALLOWED_PATHS.has(firstSegment)) {
    return true;
  }

  if (!accessLoaded || accessError) {
    return true;
  }

  const menuPaths = collectMenuPaths(menus).map(normalizePath).filter(Boolean);
  const hasMenuAccess = menuPaths.some(
    (menuPath) =>
      normalizedPath === menuPath || normalizedPath.startsWith(`${menuPath}/`),
  );
  const permissionCandidates = getRoutePermissionCandidates(normalizedPath);
  const hasPermissionData = permissionCodes.length > 0;
  const hasPermissionAccess =
    hasPermissionData && hasAnyPermission(permissionCodes, permissionCandidates);

  if (hasMenuAccess) {
    if (allowMenuAccessOnly) return true;
    return !hasPermissionData || !permissionCandidates.length || hasPermissionAccess;
  }

  if (permissionCandidates.length) {
    return hasPermissionAccess;
  }

  return !menuPaths.length;
};
