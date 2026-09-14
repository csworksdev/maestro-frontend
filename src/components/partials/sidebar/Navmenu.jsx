import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Icon from "@/components/ui/Icon";
import { toggleActiveChat } from "@/pages/app/chat/store";
import { useDispatch } from "react-redux";
import Submenu from "./Submenu";

const STORAGE_ACTIVE_SUBMENU = "activeSubmenu";
const STORAGE_ACTIVE_MULTI_MENU = "activeMultiMenu";

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

const slugifyKey = (value = "") =>
  normalizePath(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getMenuKey = (item, index) => {
  const values = [
    item?.link,
    item?.title,
    item?.icon,
    item?.isHeadr ? "header" : "menu",
  ]
    .map((value) => slugifyKey(value))
    .filter(Boolean);

  return values.length ? values.join(":") : `menu:${index}`;
};

const getChildMenuKey = (subItem, parentKey, index) => {
  const values = [
    subItem?.childlink,
    subItem?.multiLink,
    subItem?.link,
    subItem?.childtitle,
    subItem?.multiTitle,
    subItem?.title,
    subItem?.childicon,
    subItem?.icon,
  ]
    .map((value) => slugifyKey(value))
    .filter(Boolean);

  return values.length
    ? `${parentKey}:${values.join(":")}`
    : `${parentKey}:${index}`;
};

const hasSubmenuKey = (menus, targetKey) =>
  Boolean(targetKey) &&
  menus.some((item, index) => getMenuKey(item, index) === targetKey);

const normalizeStoredMultiMenus = (value) => {
  if (!value || value === "null") return [];

  try {
    const parsedValue = JSON.parse(value);
    if (Array.isArray(parsedValue)) return parsedValue.filter(Boolean);
  } catch {
    // Keep supporting the previous single-string localStorage format.
  }

  return [value];
};

const getNestedChildren = (item) => {
  if (Array.isArray(item?.child) && item.child.length) return item.child;
  if (Array.isArray(item?.multi_menu) && item.multi_menu.length) {
    return item.multi_menu;
  }
  return [];
};

const getNestedLink = (item) => item?.childlink || item?.multiLink || item?.link;
const getOriginalNestedLink = (item) =>
  item?.original_childlink || item?.originalMultiLink || item?.originalLink;
const isDividerMenu = (item) =>
  item?.isHeadr || item?.is_header || item?.menu_type === "DIVIDER";
const isGroupMenu = (item) => item?.isGroup || item?.menu_type === "GROUP";
const hasChildMenus = (item) =>
  Array.isArray(item?.child) && item.child.length > 0;

const hasMultiMenuKey = (menus, targetKey) =>
  Boolean(targetKey) &&
  menus.some((item, itemIndex) => {
    const walk = (items = [], parentKey) =>
      items.some((subItem, childIndex) => {
        const childKey = getChildMenuKey(subItem, parentKey, childIndex);
        return (
          childKey === targetKey || walk(getNestedChildren(subItem), childKey)
        );
      });

    return walk(getNestedChildren(item), getMenuKey(item, itemIndex));
  });

const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(() => {
    const stored = localStorage.getItem(STORAGE_ACTIVE_SUBMENU);
    return stored && stored !== "null" ? stored : null;
  });
  const [activeMultiMenu, setMultiMenu] = useState(() => {
    return normalizeStoredMultiMenus(
      localStorage.getItem(STORAGE_ACTIVE_MULTI_MENU),
    );
  });

  const persistSubmenu = (value) => {
    if (value) {
      localStorage.setItem(STORAGE_ACTIVE_SUBMENU, value);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_SUBMENU);
    }
  };

  const persistMultiMenu = (value) => {
    if (Array.isArray(value) && value.length) {
      localStorage.setItem(STORAGE_ACTIVE_MULTI_MENU, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_MULTI_MENU);
    }
  };

  const toggleSubmenu = (menuKey) => {
    const newValue = activeSubmenu === menuKey ? null : menuKey;
    setActiveSubmenu(newValue);
    persistSubmenu(newValue);

    if (!newValue) {
      setMultiMenu([]);
      persistMultiMenu([]);
    }
  };

  const toggleMultiMenu = (menuKey) => {
    const newValue = activeMultiMenu.includes(menuKey)
      ? activeMultiMenu.filter((item) => item !== menuKey)
      : [...activeMultiMenu, menuKey];
    setMultiMenu(newValue);
    persistMultiMenu(newValue);
  };

  const location = useLocation();
  const locationName = normalizePath(location.pathname);
  const dispatch = useDispatch();

  const isLocationMatch = (targetLocation) => {
    const target = normalizePath(targetLocation);
    if (!target) return false;

    return locationName === target || locationName.startsWith(`${target}/`);
  };

  useEffect(() => {
    let submenuKey = null;
    let multiMenuKeys = [];

    const collectActiveNestedKeys = (items = [], parentKey) => {
      const activeKeys = [];

      items.forEach((subItem, index) => {
        const childKey = getChildMenuKey(subItem, parentKey, index);
        const nestedChildren = getNestedChildren(subItem);
        const childActive =
          isLocationMatch(getNestedLink(subItem)) ||
          isLocationMatch(getOriginalNestedLink(subItem));
        const nestedActiveKeys = collectActiveNestedKeys(
          nestedChildren,
          childKey,
        );

        if (nestedChildren.length && (childActive || nestedActiveKeys.length)) {
          activeKeys.push(childKey);
        }

        activeKeys.push(...nestedActiveKeys);
      });

      return activeKeys;
    };

    menus.forEach((item, i) => {
      const itemKey = getMenuKey(item, i);

      if (isLocationMatch(item.link) || isLocationMatch(item.originalLink)) {
        submenuKey = itemKey;
      }

      if (item.child) {
        const nextNestedKeys = collectActiveNestedKeys(item.child, itemKey);
        if (nextNestedKeys.length) {
          submenuKey = itemKey;
          multiMenuKeys = nextNestedKeys;
        }
      }
    });
    const baseTitle =
      typeof window !== "undefined" && window.__APP_BASE_TITLE__
        ? window.__APP_BASE_TITLE__
        : "Maestro Swim";
    const pageTitle = locationName
      ? `${baseTitle} | ${locationName}`
      : baseTitle;
    document.title = pageTitle;

    setActiveSubmenu((current) => {
      const nextValue =
        submenuKey || (hasSubmenuKey(menus, current) ? current : null);
      persistSubmenu(nextValue);
      return nextValue;
    });
    setMultiMenu((current) => {
      const currentValues = Array.isArray(current) ? current : [current].filter(Boolean);
      const validCurrentValues = currentValues.filter((item) =>
        hasMultiMenuKey(menus, item),
      );
      const nextValue = [...new Set([...validCurrentValues, ...multiMenuKeys])];
      persistMultiMenu(nextValue);
      return nextValue;
    });
    dispatch(toggleActiveChat(false));
  }, [location, menus, dispatch]);

  return (
    <ul>
      {menus.map((item, i) => {
        const menuKey = getMenuKey(item, i);
        const isSubmenuOpen = activeSubmenu === menuKey;
        const isDivider = isDividerMenu(item);
        const isParentMenu = hasChildMenus(item) || isGroupMenu(item);
        const isMenuActive =
          !isDivider &&
          (isLocationMatch(item.link) || isLocationMatch(item.originalLink));

        return (
          <li
            key={menuKey}
            className={`single-sidebar-menu
            ${isParentMenu ? "item-has-children" : ""}
            ${isSubmenuOpen ? "open" : ""}
            ${isMenuActive ? "menu-item-active" : ""}`}
          >
            {/* Single menu without children */}
            {!isParentMenu && !isDivider && (
              <NavLink className="menu-link" to={toNavPath(item.link)}>
                <span className="menu-icon flex-grow-0">
                  <Icon icon={item.icon} />
                </span>
                <div className="text-box flex-grow">{item.title}</div>
                {item.badge && (
                  <span className="menu-badge">{item.badge}</span>
                )}
              </NavLink>
            )}
            {/* Menu label */}
            {isDivider && (
              <div className="menulabel">{item.title}</div>
            )}
            {/* Submenu parent */}
            {isParentMenu && !isDivider && (
              <button
                type="button"
                className={`menu-link w-full text-left ${
                  isSubmenuOpen ? "parent_active not-collapsed" : "collapsed"
                }`}
                onClick={() => hasChildMenus(item) && toggleSubmenu(menuKey)}
                aria-expanded={isSubmenuOpen}
              >
                <div className="flex-1 flex items-start">
                  <span className="menu-icon">
                    <Icon icon={item.icon} />
                  </span>
                  <div className="text-box">{item.title}</div>
                </div>
                <div className="flex-0">
                  {hasChildMenus(item) && (
                    <div
                      className={`menu-arrow transform transition-all duration-300 ${
                        isSubmenuOpen ? "rotate-90" : ""
                      }`}
                    >
                      <Icon icon="heroicons-outline:chevron-right" />
                    </div>
                  )}
                </div>
              </button>
            )}

            <Submenu
              activeSubmenu={activeSubmenu}
              item={item}
              i={menuKey}
              toggleMultiMenu={toggleMultiMenu}
              activeMultiMenu={activeMultiMenu}
              getChildMenuKey={getChildMenuKey}
            />
          </li>
        );
      })}
    </ul>
  );
};

export default Navmenu;
