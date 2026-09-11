import { describe, expect, it } from "vitest";
import { ensureRoleMenuPreviewItem } from "@/utils/sidebarPreviewMenu";

describe("sidebarPreviewMenu", () => {
  it("adds builder menus only for Superuser", () => {
    expect(ensureRoleMenuPreviewItem([], "Superuser")).toEqual([
      {
        title: "Role Menu",
        icon: "heroicons-outline:adjustments-horizontal",
        link: "role-menu",
      },
      {
        title: "User Permission",
        icon: "heroicons-outline:shield-check",
        link: "permissions",
      },
      {
        title: "Department",
        icon: "heroicons-outline:building-office-2",
        link: "departments",
      },
      {
        title: "Loker",
        icon: "heroicons-outline:briefcase",
        link: "loker",
      },
      {
        title: "Rekruitmen",
        icon: "heroicons-outline:clipboard-document-check",
        link: "rekruitmen",
      },
      {
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
      },
    ]);

    expect(ensureRoleMenuPreviewItem([], "Hydro")).toEqual([]);
  });

  it("adds builder menus for Superuser role id", () => {
    expect(ensureRoleMenuPreviewItem([], "", ["6"])).toHaveLength(6);
  });

  it("does not duplicate builder menus when they already exist", () => {
    const menus = [
      { title: "Role Menu", link: "role-menu" },
      { title: "User Permission", link: "permissions" },
      { title: "Department", link: "departments" },
      { title: "Loker", link: "loker" },
      { title: "Rekruitmen", link: "rekruitmen" },
      {
        title: "Tahapan",
        child: [{ childtitle: "Cek CV", childlink: "cek-cv" }],
      },
    ];

    expect(ensureRoleMenuPreviewItem(menus, ["Superuser"])).toEqual(menus);
  });

  it("removes builder menus for non-Superuser even when they exist in menus", () => {
    expect(
      ensureRoleMenuPreviewItem(
        [
          {
            title: "User Management",
            icon: "heroicons-outline:users",
            child: [
              { childtitle: "Role Menu", childlink: "role-menu" },
              { childtitle: "User Permission", childlink: "permissions" },
              { childtitle: "Department", childlink: "departments" },
              { childtitle: "Loker", childlink: "loker" },
              { childtitle: "Rekruitmen", childlink: "rekruitmen" },
              { childtitle: "Cek CV", childlink: "cek-cv" },
            ],
          },
          { title: "Order", link: "order" },
        ],
        "Admin",
      ),
    ).toEqual([{ title: "Order", link: "order" }]);
  });
});
