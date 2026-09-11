export const ROLE_MENU_API_ENABLED =
  import.meta.env.VITE_ROLE_MENU_API_ENABLED === "true";

export const PREVIEW_ROLES = [
  { id: "1", name: "Admin" },
  { id: "2", name: "Finance" },
  { id: "3", name: "Coach" },
  { id: "4", name: "Hydro" },
  { id: "5", name: "Chief" },
  { id: "6", name: "Superuser" },
  { id: "7", name: "Opx" },
];

export const PREVIEW_MENUS = [
  {
    menu_id: "preview-dashboard",
    name: "Dashboard",
    code: "dashboard",
    route: "/dashboard",
    icon: "heroicons-outline:chart-pie",
  },
  {
    menu_id: "preview-daily",
    name: "Daily",
    code: "daily",
    route: "/daily",
    icon: "heroicons-outline:calendar-days",
  },
  {
    menu_id: "preview-order",
    name: "Order",
    code: "order",
    route: "/order",
    icon: "heroicons-outline:shopping-bag",
  },
  {
    menu_id: "preview-student",
    name: "Siswa",
    code: "siswa",
    route: "/siswa",
    icon: "heroicons-outline:users",
  },
  {
    menu_id: "preview-trainer",
    name: "Pelatih",
    code: "trainer",
    route: "/trainer",
    icon: "heroicons-outline:users",
  },
  {
    menu_id: "preview-pool",
    name: "Kolam",
    code: "kolam",
    route: "/kolam",
    icon: "heroicons-outline:home",
  },
  {
    menu_id: "preview-finance",
    name: "Finance",
    code: "finance",
    route: null,
    icon: "heroicons-outline:banknotes",
  },
  {
    menu_id: "preview-hydro-chart",
    name: "Hydro Chart",
    code: "chart",
    route: "/chart",
    icon: "heroicons-outline:chart-bar",
  },
  {
    menu_id: "preview-user-management",
    name: "User Management",
    code: "user-management",
    route: null,
    icon: "heroicons-outline:users",
  },
  {
    menu_id: "preview-role-menu",
    name: "Role Menu",
    code: "role-menu",
    route: "/role-menu",
    icon: "heroicons-outline:adjustments-horizontal",
  },
  {
    menu_id: "preview-permissions",
    name: "User Permission",
    code: "permissions",
    route: "/permissions",
    icon: "heroicons-outline:shield-check",
  },
  {
    menu_id: "preview-departments",
    name: "Department",
    code: "departments",
    route: "/departments",
    icon: "heroicons-outline:building-office-2",
  },
  {
    menu_id: "preview-loker",
    name: "Loker",
    code: "loker",
    route: "/loker",
    icon: "heroicons-outline:briefcase",
  },
  {
    menu_id: "preview-rekruitmen",
    name: "Rekruitmen",
    code: "rekruitmen",
    route: "/rekruitmen",
    icon: "heroicons-outline:clipboard-document-check",
  },
  {
    menu_id: "preview-tahapan",
    name: "Tahapan",
    code: "tahapan",
    route: null,
    icon: "heroicons-outline:list-bullet",
  },
  {
    menu_id: "preview-cek-cv",
    name: "Cek CV",
    code: "cek-cv",
    route: "/cek-cv",
    icon: "heroicons-outline:document-magnifying-glass",
  },
  {
    menu_id: "preview-interview-user",
    name: "Interview User",
    code: "interview-user",
    route: "/interview-user",
    icon: "heroicons-outline:user-group",
  },
  {
    menu_id: "preview-validasi-video-renang",
    name: "Validasi Video Renang",
    code: "validasi-video-renang",
    route: "/validasi-video-renang",
    icon: "heroicons-outline:video-camera",
  },
  {
    menu_id: "preview-interview-owner",
    name: "Interview Owner",
    code: "interview-owner",
    route: "/interview-owner",
    icon: "heroicons-outline:user-circle",
  },
  {
    menu_id: "preview-kontrak",
    name: "Kontrak",
    code: "kontrak",
    route: "/kontrak",
    icon: "heroicons-outline:document-check",
  },
];

const node = (menuId, id, sortOrder, children = []) => {
  const menu = PREVIEW_MENUS.find((item) => item.menu_id === menuId);

  return {
    id,
    group_menu_id: id,
    menu_id: menuId,
    name: menu?.name,
    code: menu?.code,
    route: menu?.route,
    icon: menu?.icon,
    parent_id: null,
    sort_order: sortOrder,
    is_visible: true,
    children,
  };
};

export const PREVIEW_ROLE_MENU_TREES = {
  1: [
    node("preview-dashboard", "admin-dashboard", 1),
    node("preview-order", "admin-order", 2),
    node("preview-user-management", "admin-user-management", 3, [
      node("preview-role-menu", "admin-role-menu", 1),
    ]),
  ],
  2: [
    node("preview-dashboard", "finance-dashboard", 1),
    node("preview-finance", "finance-root", 2),
    node("preview-role-menu", "finance-role-menu", 3),
  ],
  3: [
    node("preview-dashboard", "coach-dashboard", 1),
    node("preview-daily", "coach-daily", 2),
    node("preview-role-menu", "coach-role-menu", 3),
  ],
  4: [
    node("preview-dashboard", "hydro-dashboard", 1),
    node("preview-hydro-chart", "hydro-chart", 2),
    node("preview-role-menu", "hydro-role-menu", 3),
  ],
  5: [
    node("preview-dashboard", "chief-dashboard", 1),
    node("preview-finance", "chief-finance", 2),
    node("preview-role-menu", "chief-role-menu", 3),
  ],
  6: [
    node("preview-dashboard", "superuser-dashboard", 1),
    node("preview-user-management", "superuser-user-management", 2, [
      node("preview-role-menu", "superuser-role-menu", 1),
      node("preview-permissions", "superuser-permissions", 2),
      node("preview-departments", "superuser-departments", 3),
      node("preview-loker", "superuser-loker", 4),
      node("preview-rekruitmen", "superuser-rekruitmen", 5),
      node("preview-tahapan", "superuser-tahapan", 6, [
        node("preview-cek-cv", "superuser-cek-cv", 1),
        node("preview-interview-user", "superuser-interview-user", 2),
        node(
          "preview-validasi-video-renang",
          "superuser-validasi-video-renang",
          3,
        ),
        node("preview-interview-owner", "superuser-interview-owner", 4),
        node("preview-kontrak", "superuser-kontrak", 5),
      ]),
    ]),
  ],
  7: [
    node("preview-dashboard", "opx-dashboard", 1),
    node("preview-daily", "opx-daily", 2),
    node("preview-order", "opx-order", 3),
    node("preview-role-menu", "opx-role-menu", 4),
  ],
};
