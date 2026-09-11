import { describe, expect, it } from "vitest";
import {
  extractList,
  getPermissionCodes,
  mapBackendMenuToSidebar,
} from "@/utils/accessControl";

describe("accessControl", () => {
  it("extracts paginated lists from nested API response wrappers", () => {
    expect(
      extractList({
        data: {
          status: true,
          data: {
            count: 1,
            results: [{ id: 1, name: "Admin" }],
          },
        },
      }),
    ).toEqual([{ id: 1, name: "Admin" }]);
  });

  it("extracts role permission codes from Apidog role-permission payload", () => {
    expect(
      getPermissionCodes([
        {
          id: 1,
          name: "Can change group",
          permission: "auth.change_group",
        },
      ]),
    ).toEqual(["auth.change_group", "change_group"]);
  });

  it("maps backend menu routes to existing frontend route aliases", () => {
    expect(
      mapBackendMenuToSidebar([
        {
          id: 1,
          name: "Master Data",
          code: "master-data",
          icon: "database",
          is_visible: true,
          children: [
            {
              id: 2,
              name: "Pool",
              code: "pool",
              route: "/pools",
              icon: "icon-pool",
              is_visible: true,
              children: [],
            },
          ],
        },
      ]),
    ).toMatchObject([
      {
        title: "Master Data",
        child: [
          {
            childtitle: "Pool",
            childlink: "kolam",
          },
        ],
      },
    ]);
  });

  it("keeps backend original routes for nested sidebar menu aliases", () => {
    expect(
      mapBackendMenuToSidebar([
        {
          id: 1,
          name: "Custom Parent",
          code: "custom-parent",
          route: "/custom-parent",
          is_visible: true,
          children: [
            {
              id: 2,
              name: "Order",
              code: "order",
              route: "/custom-parent/order",
              original_route: "/order",
              is_visible: true,
            },
          ],
        },
      ]),
    ).toMatchObject([
      {
        title: "Custom Parent",
        child: [
          {
            childtitle: "Order",
            childlink: "custom-parent/order",
            original_childlink: "order",
          },
        ],
      },
    ]);
  });

  it("maps group and divider menu types without turning them into page links", () => {
    expect(
      mapBackendMenuToSidebar([
        {
          id: 1,
          name: "Management",
          code: "management",
          menu_type: "GROUP",
          route: null,
          is_visible: true,
          children: [],
        },
        {
          id: 2,
          name: "Reports",
          code: "reports",
          menu_type: "DIVIDER",
          route: "/reports",
          icon: "icon-report",
          is_visible: true,
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
        icon: null,
      },
    ]);
  });

  it("maps backend icon-* values to renderable sidebar icons", () => {
    expect(
      mapBackendMenuToSidebar([
        {
          id: 1,
          name: "People",
          code: "people",
          icon: "icon-people",
          is_visible: true,
        },
        {
          id: 2,
          name: "Bank BRI",
          code: "bank-bri",
          icon: "icon-bank-bri",
          is_visible: true,
        },
      ]),
    ).toMatchObject([
      { icon: "heroicons-outline:users" },
      { icon: "heroicons-outline:banknotes" },
    ]);
  });
});
