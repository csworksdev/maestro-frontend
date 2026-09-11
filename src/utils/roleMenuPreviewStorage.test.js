import { describe, expect, it } from "vitest";
import {
  createDefaultRoleMenuPreviewState,
  getRoleMenuRouteAlias,
  getStoredRoleSidebarMenus,
  ROLE_MENU_PREVIEW_STORAGE_KEY,
  roleMenuTreeToSidebarMenus,
  resolveRoleMenuRouteAlias,
  writeRoleMenuPreviewState,
} from "@/utils/roleMenuPreviewStorage";

describe("roleMenuPreviewStorage", () => {
  it("builds Opx preview defaults from the real sidebar menu", () => {
    const previewState = createDefaultRoleMenuPreviewState();
    const opxMenus = roleMenuTreeToSidebarMenus(previewState.roleMenus["7"]);
    const dashboardDivider = previewState.menus.find(
      (menu) => menu.name === "Dashboard" && menu.is_header,
    );

    expect(opxMenus).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isHeadr: true, title: "Dashboard" }),
        expect.objectContaining({ title: "Daily", link: "daily" }),
        expect.objectContaining({ title: "Order", link: "order" }),
      ]),
    );
    expect(dashboardDivider).toMatchObject({ menu_type: "DIVIDER" });
  });

  it("tags master menu catalog entries with their source role", () => {
    const previewState = createDefaultRoleMenuPreviewState();
    const opxDailyMenu = previewState.menus.find(
      (menu) => menu.name === "Daily" && menu.role_id === "7",
    );
    const adminMenus = previewState.menus.filter((menu) => menu.role_id === "1");

    expect(opxDailyMenu).toBeTruthy();
    expect(adminMenus.some((menu) => menu.name === "Daily")).toBe(false);
  });

  it("resolves nested preview menu routes back to their original page routes", () => {
    window.localStorage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    writeRoleMenuPreviewState({
      menus: [],
      roleMenus: {
        7: [
          {
            id: "branch",
            name: "Cabang",
            route: "/cabang",
            original_route: "/cabang",
            children: [
              {
                id: "pool",
                name: "Kolam",
                route: "/cabang/kolam",
                original_route: "/kolam",
                children: [],
              },
            ],
          },
        ],
      },
    });

    expect(getRoleMenuRouteAlias("/cabang/kolam", "Opx")).toBe("/kolam");
    expect(getRoleMenuRouteAlias("/cabang/kolam/add", "Opx")).toBe("/kolam/add");
    expect(getRoleMenuRouteAlias("/cabang", "Opx")).toBe("");
    expect(
      roleMenuTreeToSidebarMenus(
        JSON.parse(
          window.localStorage.getItem(ROLE_MENU_PREVIEW_STORAGE_KEY),
        ).roleMenus["7"],
      )[0].child[0],
    ).toMatchObject({
      childlink: "cabang/kolam",
      original_childlink: "kolam",
    });
  });

  it("resolves stale nested menu routes from known app routes when original_route is missing", () => {
    window.localStorage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    writeRoleMenuPreviewState({
      menus: [],
      roleMenus: {
        7: [
          {
            id: "branch",
            name: "Cabang",
            code: "cabang",
            route: "/cabang",
            children: [
              {
                id: "pool",
                name: "Kolam",
                code: "kolam",
                route: "/cabang/kolam",
                children: [],
              },
            ],
          },
        ],
      },
    });

    expect(getRoleMenuRouteAlias("/cabang/kolam", "Opx")).toBe("");
    expect(resolveRoleMenuRouteAlias("/cabang/kolam", "Opx")).toBe("/kolam");
    expect(resolveRoleMenuRouteAlias("/cabang/kolam/add", "Opx")).toBe(
      "/kolam/add",
    );
  });

  it("rebuilds sidebar links for stored groups without explicit routes", () => {
    window.localStorage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    writeRoleMenuPreviewState({
      menus: [],
      roleMenus: {
        7: [
          {
            id: "progress",
            name: "Progress",
            code: "progress",
            menu_type: "GROUP",
            route: null,
            children: [
              {
                id: "user",
                name: "User",
                code: "user",
                menu_type: "LINK",
                route: "/user",
                original_route: "/user",
                children: [],
              },
            ],
          },
        ],
      },
    });

    expect(getStoredRoleSidebarMenus("Opx")[0].child[0]).toMatchObject({
      childtitle: "User",
      childlink: "progress/user",
      original_childlink: "user",
    });
    expect(getRoleMenuRouteAlias("/progress/user", "Opx")).toBe("/user");
  });

  it("keeps empty groups as containers and dividers as sidebar labels", () => {
    expect(
      roleMenuTreeToSidebarMenus([
        {
          id: "group",
          name: "Management",
          code: "management",
          menu_type: "GROUP",
          route: null,
          children: [],
        },
        {
          id: "divider",
          name: "Reports",
          menu_type: "DIVIDER",
          route: "/reports",
          children: [],
        },
      ]),
    ).toMatchObject([
      {
        title: "Management",
        menu_type: "GROUP",
        isGroup: true,
        child: [],
      },
      {
        title: "Reports",
        menu_type: "DIVIDER",
        isHeadr: true,
      },
    ]);
  });

  it("keeps recursive sidebar children and resolves deep nested route aliases", () => {
    window.localStorage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    writeRoleMenuPreviewState({
      menus: [
        {
          menu_id: "progress-menu",
          name: "Progress",
          route: "/progress",
        },
        {
          menu_id: "user-menu",
          name: "User",
          route: "/user",
        },
        {
          menu_id: "trainer-menu",
          name: "Pelatih",
          route: "/pelatih",
        },
      ],
      roleMenus: {
        7: [
          {
            id: "progress",
            menu_id: "progress-menu",
            name: "Progress",
            code: "progress",
            menu_type: "GROUP",
            route: "/progress",
            original_route: "/progress",
            children: [
              {
                id: "user",
                menu_id: "user-menu",
                name: "User",
                code: "user",
                menu_type: "GROUP",
                route: "/progress/user",
                original_route: "/user",
                children: [
                  {
                    id: "trainer",
                    menu_id: "trainer-menu",
                    name: "Pelatih",
                    code: "pelatih",
                    menu_type: "LINK",
                    route: "/progress/user/pelatih",
                    original_route: "/pelatih",
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const sidebarMenus = getStoredRoleSidebarMenus("Opx");

    expect(sidebarMenus[0].child[0]).toMatchObject({
      childtitle: "User",
      childlink: "progress/user",
      original_childlink: "user",
    });
    expect(sidebarMenus[0].child[0].child[0]).toMatchObject({
      childtitle: "Pelatih",
      childlink: "progress/user/pelatih",
      original_childlink: "pelatih",
    });
    expect(getRoleMenuRouteAlias("/progress/user/pelatih", "Opx")).toBe(
      "/pelatih",
    );
    expect(getRoleMenuRouteAlias("/progress/user/pelatih/add", "Opx")).toBe(
      "/pelatih/add",
    );
  });

  it("hydrates stale submenu original routes from the preview menu catalog", () => {
    window.localStorage.removeItem(ROLE_MENU_PREVIEW_STORAGE_KEY);
    writeRoleMenuPreviewState({
      menus: [
        {
          menu_id: "branch-menu",
          name: "Cabang",
          route: "/cabang",
        },
        {
          menu_id: "pool-menu",
          name: "Kolam",
          route: "/kolam",
        },
      ],
      roleMenus: {
        7: [
          {
            id: "branch",
            menu_id: "branch-menu",
            name: "Cabang",
            route: "/cabang",
            children: [
              {
                id: "pool",
                menu_id: "pool-menu",
                name: "Kolam",
                route: "/cabang/kolam",
                children: [],
              },
            ],
          },
        ],
      },
    });

    expect(getStoredRoleSidebarMenus("Opx")[0].child[0]).toMatchObject({
      childtitle: "Kolam",
      childlink: "cabang/kolam",
      original_childlink: "kolam",
    });
    expect(getRoleMenuRouteAlias("/cabang/kolam", "Opx")).toBe("/kolam");
    expect(getRoleMenuRouteAlias("/cabang/kolam/add", "Opx")).toBe(
      "/kolam/add",
    );
  });
});
