import React from "react";
import { Collapse } from "react-collapse";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";

const normalizePath = (value = "") =>
  String(value || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

const toNavPath = (value = "") => {
  const path = String(value || "").trim();
  if (!path || path === "#") return "#";
  if (/^(https?:|mailto:|tel:)/i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const isSidebarLinkActive = (pathname, ...targets) => {
  const current = normalizePath(pathname);
  if (!current) return false;

  return targets.some((target) => {
    const normalizedTarget = normalizePath(target);
    if (!normalizedTarget) return false;

    return (
      current === normalizedTarget ||
      current.startsWith(`${normalizedTarget}/`)
    );
  });
};

const getNestedChildren = (item) => {
  if (Array.isArray(item?.child) && item.child.length) return item.child;
  if (Array.isArray(item?.multi_menu) && item.multi_menu.length) {
    return item.multi_menu;
  }
  return [];
};

const getItemTitle = (item) =>
  item?.childtitle || item?.multiTitle || item?.title || item?.name || "Menu";

const getItemLink = (item) =>
  item?.childlink || item?.multiLink || item?.link || "";

const getOriginalItemLink = (item) =>
  item?.original_childlink || item?.originalMultiLink || item?.originalLink || "";
const isDividerItem = (item) =>
  item?.isHeadr || item?.is_header || item?.menu_type === "DIVIDER";
const isGroupItem = (item) => item?.isGroup || item?.menu_type === "GROUP";

const isNestedOpen = (activeMultiMenu, key) => {
  if (Array.isArray(activeMultiMenu)) {
    return activeMultiMenu.includes(key);
  }

  return activeMultiMenu === key;
};

const NestedMenuList = ({
  isOpened,
  items = [],
  parentKey,
  depth = 0,
  activeMultiMenu,
  toggleMultiMenu,
  getChildMenuKey,
}) => {
  const location = useLocation();

  return (
    <Collapse isOpened={isOpened}>
      <ul
        className={`${depth === 0 ? "sub-menu space-y-4" : "space-y-[14px]"} ${
          depth > 0 ? "pl-4" : ""
        }`}
      >
        {items.map((subItem, index) => {
          const childKey = getChildMenuKey(subItem, parentKey, index);
          const nestedChildren = getNestedChildren(subItem);
          const hasChildren = nestedChildren.length > 0;
          const isDivider = isDividerItem(subItem);
          const isGroup = isGroupItem(subItem);
          const isParentItem = hasChildren || isGroup;
          const isOpen = isNestedOpen(activeMultiMenu, childKey);
          const link = getItemLink(subItem);
          const originalLink = getOriginalItemLink(subItem);
          const isActive = isSidebarLinkActive(
            location.pathname,
            link,
            originalLink,
          );

          return (
            <li
              key={childKey}
              className={`block pr-1 ${depth === 0 ? "pl-4 first:pt-4 last:pb-4" : "first:pt-[14px]"}`}
            >
              {isDivider ? (
                <div className="px-1 py-1 text-[11px] font-semibold uppercase tracking-normal text-slate-400 dark:text-slate-500">
                  {getItemTitle(subItem)}
                </div>
              ) : isParentItem ? (
                <div>
                  <button
                    type="button"
                    onClick={() => hasChildren && toggleMultiMenu(childKey)}
                    className={`${
                      isOpen || isActive
                        ? "text-black dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-300"
                    } text-sm flex w-full space-x-3 items-center transition-all duration-150 cursor-pointer rtl:space-x-reverse`}
                    aria-expanded={isOpen}
                  >
                    <span
                      className={`${
                        isOpen || isActive
                          ? "bg-slate-900 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-black-500 dark:ring-slate-300 dark:ring-opacity-20"
                          : ""
                      } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                    ></span>
                    <span className="flex-1 text-left">
                      {getItemTitle(subItem)}
                    </span>
                    {hasChildren && (
                      <span className="flex-none">
                        <span
                          className={`menu-arrow transform transition-all duration-300 ${
                            isOpen ? "rotate-90" : ""
                          }`}
                        >
                          <Icon icon="ph:caret-right" />
                        </span>
                      </span>
                    )}
                  </button>
                  {hasChildren && (
                    <NestedMenuList
                      isOpened={isOpen}
                      items={nestedChildren}
                      parentKey={childKey}
                      depth={depth + 1}
                      activeMultiMenu={activeMultiMenu}
                      toggleMultiMenu={toggleMultiMenu}
                      getChildMenuKey={getChildMenuKey}
                    />
                  )}
                </div>
              ) : (
                <NavLink to={toNavPath(link)}>
                  {({ isActive: isNavActive }) => {
                    const isItemActive = isNavActive || isActive;

                    return (
                      <span
                        className={`${
                          isItemActive
                            ? "text-black dark:text-white font-medium"
                            : "text-slate-600 dark:text-slate-300"
                        } text-sm flex space-x-3 items-center transition-all duration-150 rtl:space-x-reverse`}
                      >
                        <span
                          className={`${
                            isItemActive
                              ? "bg-slate-900 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-black-500 dark:ring-slate-300 dark:ring-opacity-20"
                              : ""
                          } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                        ></span>
                        <span className="flex-1">{getItemTitle(subItem)}</span>
                      </span>
                    );
                  }}
                </NavLink>
              )}
            </li>
          );
        })}
      </ul>
    </Collapse>
  );
};

const Submenu = ({
  activeSubmenu,
  item,
  i,
  toggleMultiMenu,
  activeMultiMenu,
  getChildMenuKey,
}) => {
  return (
    <NestedMenuList
      isOpened={activeSubmenu === i}
      items={item.child || []}
      parentKey={i}
      activeMultiMenu={activeMultiMenu}
      toggleMultiMenu={toggleMultiMenu}
      getChildMenuKey={getChildMenuKey}
    />
  );
};

export default Submenu;
