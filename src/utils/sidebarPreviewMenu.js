export const ROLE_MENU_PREVIEW_ITEM = {
  title: "Role Menu",
  icon: "heroicons-outline:adjustments-horizontal",
  link: "role-menu",
};

export const USER_PERMISSION_PREVIEW_ITEM = {
  title: "User Permission",
  icon: "heroicons-outline:shield-check",
  link: "permissions",
};

export const DEPARTMENT_PREVIEW_ITEM = {
  title: "Department",
  icon: "heroicons-outline:building-office-2",
  link: "departments",
};

export const LOKER_PREVIEW_ITEM = {
  title: "Loker",
  icon: "heroicons-outline:briefcase",
  link: "loker",
};

export const REKRUITMEN_PREVIEW_ITEM = {
  title: "Rekruitmen",
  icon: "heroicons-outline:clipboard-document-check",
  link: "rekruitmen",
};

export const TAHAPAN_PREVIEW_ITEM = {
  title: "Tahapan",
  icon: "heroicons-outline:list-bullet",
  isOpen: true,
  isHide: true,
  child: [
    { childtitle: "Cek CV", childlink: "cek-cv" },
    { childtitle: "Interview User", childlink: "interview-user" },
    {
      childtitle: "Validasi Video Renang",
      childlink: "validasi-video-renang",
    },
    { childtitle: "Interview Owner", childlink: "interview-owner" },
    { childtitle: "Kontrak", childlink: "kontrak" },
  ],
};

const SUPERUSER_MENU_LINKS = new Set([
  ROLE_MENU_PREVIEW_ITEM.link,
  USER_PERMISSION_PREVIEW_ITEM.link,
  DEPARTMENT_PREVIEW_ITEM.link,
  LOKER_PREVIEW_ITEM.link,
  REKRUITMEN_PREVIEW_ITEM.link,
  "cek-cv",
  "interview-user",
  "validasi-video-renang",
  "interview-owner",
  "kontrak",
  "tahapan",
]);

const hasSpecialMenuLink = (menus = [], link) =>
  menus.some((item) => {
    if (item?.link === link) return true;

    return (item?.child || []).some((child) => {
      if (child?.childlink === link) return true;

      return (child?.multi_menu || []).some(
        (multi) => multi?.multiLink === link,
      );
    });
  });

const hasPreviewItem = (menus = [], item = {}) => {
  if (item.link && hasSpecialMenuLink(menus, item.link)) return true;
  if (item.title && menus.some((menu) => menu?.title === item.title)) return true;

  return (item.child || []).some((child) =>
    hasSpecialMenuLink(menus, child.childlink),
  );
};

const hasMenuChildren = (item) =>
  Array.isArray(item?.child) && item.child.length > 0;

const isSuperuserMenuLink = (link) => SUPERUSER_MENU_LINKS.has(link);

const filterRoleMenuChildren = (children = []) =>
  children.reduce((items, child) => {
    if (isSuperuserMenuLink(child?.childlink)) return items;

    const multiMenu = (child?.multi_menu || []).filter(
      (multi) => !isSuperuserMenuLink(multi?.multiLink),
    );

    items.push({
      ...child,
      ...(child?.multi_menu ? { multi_menu: multiMenu } : {}),
    });
    return items;
  }, []);

export const removeRoleMenuPreviewItem = (menus = []) =>
  menus.reduce((items, item) => {
    if (isSuperuserMenuLink(item?.link)) return items;

    const child = filterRoleMenuChildren(item?.child || []);
    const nextItem = {
      ...item,
      ...(hasMenuChildren(item) ? { child } : {}),
    };

    if (hasMenuChildren(item) && !child.length && !item?.link) {
      return items;
    }

    items.push(nextItem);
    return items;
  }, []);

export const isSuperuserRole = (roles, roleIds = []) => {
  const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
  if (ids.some((id) => String(id) === "6")) return true;

  const values = Array.isArray(roles) ? roles : [roles];
  return values.some((role) => {
    if (role && typeof role === "object") {
      return (
        role.name ||
        role.role_name ||
        role.codename ||
        role.code ||
        role.label ||
        ""
      ).toLowerCase() === "superuser";
    }

    return String(role || "").toLowerCase() === "superuser";
  });
};

export const ensureRoleMenuPreviewItem = (menus = [], roles, roleIds = []) => {
  if (!isSuperuserRole(roles, roleIds)) return removeRoleMenuPreviewItem(menus);

  return [
    ...menus,
    ...[
      ROLE_MENU_PREVIEW_ITEM,
      USER_PERMISSION_PREVIEW_ITEM,
      DEPARTMENT_PREVIEW_ITEM,
      LOKER_PREVIEW_ITEM,
      REKRUITMEN_PREVIEW_ITEM,
      TAHAPAN_PREVIEW_ITEM,
    ].filter((item) => !hasPreviewItem(menus, item)),
  ];
};
