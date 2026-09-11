import { describe, expect, it } from "vitest";
import {
  applyRoleMenuTreeOrder,
  collectRoleMenuIds,
  flattenRoleMenuTree,
  getRoleMenuAssignmentId,
  getRoleMenuNodeId,
  moveRoleMenuNode,
  moveRoleMenuNodeIntoParent,
  normalizeRoleMenuTree,
} from "./roleMenuTree";

describe("roleMenuTree", () => {
  it("normalizes nested backend role menus with stable string ids", () => {
    const tree = normalizeRoleMenuTree([
      {
        id: 1,
        name: "Master Data",
        sort_order: 2,
        children: [{ id: 2, name: "Pool", sort_order: 1 }],
      },
      {
        id: 3,
        name: "Dashboard",
        sort_order: 1,
      },
    ]);

    expect(tree.map((item) => item.id)).toEqual(["3", "1"]);
    expect(tree[1].children[0].id).toBe("2");
  });

  it("moves a root menu into another menu children", () => {
    const tree = normalizeRoleMenuTree([
      { id: 1, name: "Trainer", route: "/trainer", children: [] },
      { id: 2, name: "Progress", route: "/progress", children: [] },
    ]);

    const nextTree = moveRoleMenuNode(
      tree,
      { droppableId: "root", index: 1 },
      { droppableId: "children:1", index: 0 },
    );

    expect(nextTree).toHaveLength(1);
    expect(nextTree[0].children.map((item) => item.name)).toEqual(["Progress"]);
    expect(nextTree[0].children[0].route).toBe("/trainer/progress");
    expect(nextTree[0].children[0].original_route).toBe("/progress");
  });

  it("combines a dragged menu into another menu as submenu", () => {
    const tree = normalizeRoleMenuTree([
      { id: 1, name: "Dashboard", children: [] },
      { id: 2, name: "Order", children: [] },
      { id: 3, name: "Student", children: [] },
    ]);

    const nextTree = moveRoleMenuNodeIntoParent(
      tree,
      { droppableId: "root", index: 2 },
      "2",
    );

    expect(nextTree.map((item) => item.name)).toEqual(["Dashboard", "Order"]);
    expect(nextTree[1].children.map((item) => item.name)).toEqual(["Student"]);
    expect(nextTree[1].children[0].parent_id).toBe("2");
  });

  it("restores the original route when a submenu is moved back to root", () => {
    const tree = normalizeRoleMenuTree([
      {
        id: 1,
        name: "Trainer",
        route: "/trainer",
        children: [
          {
            id: 2,
            name: "Progress",
            route: "/trainer/progress",
            original_route: "/progress",
            route_segment: "progress",
          },
        ],
      },
    ]);

    const nextTree = moveRoleMenuNode(
      tree,
      { droppableId: "children:1", index: 0 },
      { droppableId: "root", index: 1 },
    );

    expect(nextTree.map((item) => item.name)).toEqual(["Trainer", "Progress"]);
    expect(nextTree[1].route).toBe("/progress");
  });

  it("derives group routes from code when a group has no explicit route", () => {
    const tree = applyRoleMenuTreeOrder([
      {
        id: 1,
        name: "Progress",
        code: "progress",
        menu_type: "GROUP",
        route: null,
        children: [
          {
            id: 2,
            name: "User",
            code: "user",
            route: "/user",
            original_route: "/user",
            children: [],
          },
        ],
      },
    ]);

    expect(tree[0].route).toBe("/progress");
    expect(tree[0].original_route).toBe("/progress");
    expect(tree[0].children[0].route).toBe("/progress/user");
    expect(tree[0].children[0].original_route).toBe("/user");
  });

  it("keeps dragged root menu order when saved", () => {
    const tree = normalizeRoleMenuTree([
      { id: 1, name: "Dashboard", sort_order: 1, children: [] },
      { id: 2, name: "Order", sort_order: 2, children: [] },
    ]);

    const nextTree = moveRoleMenuNode(
      tree,
      { droppableId: "root", index: 1 },
      { droppableId: "root", index: 0 },
    );
    const savedTree = applyRoleMenuTreeOrder(nextTree);

    expect(savedTree.map((item) => item.name)).toEqual(["Order", "Dashboard"]);
    expect(savedTree.map((item) => item.sort_order)).toEqual([1, 2]);
  });

  it("flattens tree into reorder payload order", () => {
    const tree = normalizeRoleMenuTree([
      {
        id: 1,
        menu_id: "menu-a",
        name: "Master Data",
        children: [{ id: 2, menu_id: "menu-b", name: "Pool" }],
      },
    ]);

    expect(flattenRoleMenuTree(tree)).toEqual([
      {
        id: "1",
        group_menu_id: "1",
        menu_id: "menu-a",
        parent_id: null,
        sort_order: 1,
      },
      {
        id: "2",
        group_menu_id: "2",
        menu_id: "menu-b",
        parent_id: "1",
        sort_order: 1,
      },
    ]);
  });

  it("collects menu ids from nested menu payloads", () => {
    const tree = normalizeRoleMenuTree([
      {
        id: 1,
        menu: { menu_id: "menu-a" },
        name: "Master Data",
        children: [{ id: 2, menu: { id: "menu-b" }, name: "Pool" }],
      },
    ]);

    expect(collectRoleMenuIds(tree)).toEqual(["menu-a", "menu-b"]);
  });

  it("prefers backend assignment ids over stale optimistic temp ids", () => {
    const node = {
      group_menu_id: "temp-menu-a-1",
      id: 42,
      menu_id: "menu-a",
      name: "Dashboard",
    };

    expect(getRoleMenuAssignmentId(node)).toBe("42");
    expect(getRoleMenuNodeId(node)).toBe("42");
  });

  it("keeps divider and group types from nested backend menu payloads after reorder", () => {
    const tree = normalizeRoleMenuTree([
      {
        id: 10,
        sort_order: 2,
        menu: {
          menu_id: "divider-menu",
          name: "Reports",
          code: "reports",
          menu_type: "DIVIDER",
          route: "/reports",
          icon: "icon-report",
        },
      },
      {
        id: 11,
        sort_order: 1,
        menu: {
          menu_id: "group-menu",
          name: "Management",
          code: "management",
          menu_type: "GROUP",
          route: null,
        },
        children: [
          {
            id: 12,
            menu: {
              menu_id: "order-menu",
              name: "Order",
              code: "order",
              menu_type: "LINK",
              route: "/order",
            },
          },
        ],
      },
    ]);
    const reorderedTree = applyRoleMenuTreeOrder(tree);

    expect(reorderedTree[0]).toMatchObject({
      id: "11",
      menu_id: "group-menu",
      name: "Management",
      menu_type: "GROUP",
      route: "/management",
    });
    expect(reorderedTree[0].children[0]).toMatchObject({
      id: "12",
      menu_id: "order-menu",
      name: "Order",
      menu_type: "LINK",
      route: "/management/order",
      original_route: "/order",
    });
    expect(reorderedTree[1]).toMatchObject({
      id: "10",
      menu_id: "divider-menu",
      name: "Reports",
      menu_type: "DIVIDER",
      route: null,
      icon: null,
    });
  });

  it("hydrates role-menu reorder responses from master menu catalog when menu_type is omitted", () => {
    const tree = normalizeRoleMenuTree(
      [
        {
          id: 43,
          menu_id: "divider-menu",
          name: "Administrasi",
          code: "administrasi",
          route: null,
          icon: null,
          parent_id: null,
          sort_order: 1,
          is_visible: true,
          children: [],
        },
        {
          id: 1,
          menu_id: "master-menu",
          name: "Master Data",
          code: "master-data",
          route: null,
          icon: "database",
          parent_id: null,
          sort_order: 2,
          is_visible: true,
          children: [
            {
              id: 2,
              menu_id: "pool-menu",
              name: "Pool",
              code: "pool",
              route: "/pools",
              icon: "icon-pool",
              parent_id: 1,
              sort_order: 1,
              is_visible: true,
              children: [],
            },
          ],
        },
      ],
      [
        {
          menu_id: "divider-menu",
          name: "Administrasi",
          code: "administrasi",
          menu_type: "DIVIDER",
          route: null,
          icon: null,
        },
        {
          menu_id: "master-menu",
          name: "Master Data",
          code: "master-data",
          menu_type: "GROUP",
          route: null,
          icon: "database",
        },
        {
          menu_id: "pool-menu",
          name: "Pool",
          code: "pool",
          menu_type: "LINK",
          route: "/pools",
          icon: "icon-pool",
        },
      ],
    );
    const reorderedTree = applyRoleMenuTreeOrder(tree);

    expect(reorderedTree[0]).toMatchObject({
      id: "43",
      menu_type: "DIVIDER",
      route: null,
      icon: null,
      is_header: true,
    });
    expect(reorderedTree[1]).toMatchObject({
      id: "1",
      menu_type: "GROUP",
      route: "/master-data",
    });
    expect(reorderedTree[1].children[0]).toMatchObject({
      id: "2",
      menu_type: "LINK",
      route: "/master-data/pools",
      original_route: "/pools",
    });
  });
});
