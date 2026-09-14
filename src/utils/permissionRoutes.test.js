import { describe, expect, it } from "vitest";
import {
  canAccessPath,
  getRoutePermissionCandidates,
} from "@/utils/permissionRoutes";

describe("permissionRoutes", () => {
  it("maps CRUD route paths to Django-style permission codenames", () => {
    expect(getRoutePermissionCandidates("/order")).toEqual(["view_order"]);
    expect(getRoutePermissionCandidates("/order/add")).toEqual(["add_order"]);
    expect(getRoutePermissionCandidates("/order/Edit")).toEqual([
      "change_order",
    ]);
  });

  it("allows child routes when the parent backend menu is available", () => {
    expect(
      canAccessPath({
        pathname: "/order/detail",
        menus: [{ title: "Order", link: "order" }],
        permissionCodes: ["view_order"],
        accessLoaded: true,
      }),
    ).toBe(true);
  });

  it("allows preview submenu routes by their original route alias", () => {
    expect(
      canAccessPath({
        pathname: "/user",
        menus: [
          {
            title: "Progress",
            child: [
              {
                childtitle: "User",
                childlink: "progress/user",
                original_childlink: "user",
              },
            ],
          },
        ],
        permissionCodes: [],
        accessLoaded: true,
      }),
    ).toBe(true);
  });

  it("allows backend menu access from deeper nested menu trees", () => {
    expect(
      canAccessPath({
        pathname: "/custom-parent/order",
        menus: [
          {
            title: "Custom Parent",
            child: [
              {
                childtitle: "Nested",
                child: [
                  {
                    childtitle: "Order",
                    childlink: "custom-parent/order",
                    original_childlink: "order",
                  },
                ],
              },
            ],
          },
        ],
        permissionCodes: [],
        accessLoaded: true,
      }),
    ).toBe(true);
  });

  it("allows local preview menu access even when backend permissions are stale", () => {
    expect(
      canAccessPath({
        pathname: "/kolam",
        menus: [
          {
            title: "Cabang",
            child: [
              {
                childtitle: "Kolam",
                childlink: "cabang/kolam",
                original_childlink: "kolam",
              },
            ],
          },
        ],
        permissionCodes: ["view_branch"],
        accessLoaded: true,
        allowMenuAccessOnly: true,
      }),
    ).toBe(true);
  });

  it("blocks known routes when neither menu nor permission allows them", () => {
    expect(
      canAccessPath({
        pathname: "/order",
        menus: [{ title: "Student", link: "siswa" }],
        permissionCodes: ["view_student"],
        accessLoaded: true,
      }),
    ).toBe(false);
  });

  it("blocks role-menu when neither menu nor permission allows it", () => {
    expect(
      canAccessPath({
        pathname: "/role-menu",
        menus: [],
        permissionCodes: [],
        accessLoaded: true,
      }),
    ).toBe(false);
  });
});
