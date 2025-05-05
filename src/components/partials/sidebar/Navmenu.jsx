import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Collapse } from "react-collapse";
import Icon from "@/components/ui/Icon";
import { toggleActiveChat } from "@/pages/app/chat/store";
import { useDispatch } from "react-redux";
import useMobileMenu from "@/hooks/useMobileMenu";
import Submenu from "./Submenu";

const Navmenu = ({ menus }) => {
  const [activeSubmenu, setActiveSubmenu] = useState(() => {
    const stored = localStorage.getItem("activeSubmenu");
    return stored !== null ? parseInt(stored) : null;
  });
  const [activeMultiMenu, setMultiMenu] = useState(() => {
    const stored = localStorage.getItem("activeMultiMenu");
    return stored !== null ? parseInt(stored) : null;
  });

  const toggleSubmenu = (i) => {
    const newValue = activeSubmenu === i ? null : i;
    setActiveSubmenu(newValue);
    localStorage.setItem("activeSubmenu", newValue);
  };

  const toggleMultiMenu = (j) => {
    const newValue = activeMultiMenu === j ? null : j;
    setMultiMenu(newValue);
    localStorage.setItem("activeMultiMenu", newValue);
  };

  const location = useLocation();
  const locationName = location.pathname.replace("/", "");
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const dispatch = useDispatch();

  const isLocationMatch = (targetLocation) => {
    return (
      locationName === targetLocation ||
      locationName.startsWith(`${targetLocation}/`)
    );
  };

  useEffect(() => {
    let submenuIndex = null;
    let multiMenuIndex = null;
    menus.forEach((item, i) => {
      if (isLocationMatch(item.link)) {
        submenuIndex = i;
      }

      if (item.child) {
        item.child.forEach((childItem, j) => {
          if (isLocationMatch(childItem.childlink)) {
            submenuIndex = i;
          }

          if (childItem.multi_menu) {
            childItem.multi_menu.forEach((nestedItem) => {
              if (isLocationMatch(nestedItem.multiLink)) {
                submenuIndex = i;
                multiMenuIndex = j;
              }
            });
          }
        });
      }
    });
    document.title = `Maestro Swim  | ${locationName}`;

    setActiveSubmenu(submenuIndex);
    setMultiMenu(multiMenuIndex);
    dispatch(toggleActiveChat(false));
    // if (mobileMenu) {
    //   setMobileMenu(false);
    // }

    localStorage.setItem("activeSubmenu", submenuIndex);
    localStorage.setItem("activeMultiMenu", multiMenuIndex);
  }, [location, menus, dispatch, mobileMenu, setMobileMenu]);

  return (
    <ul>
      {menus.map((item, i) => (
        <li
          key={i}
          className={`single-sidebar-menu 
            ${item.child ? "item-has-children" : ""}
            ${activeSubmenu === i ? "open" : ""}
            ${locationName === item.link ? "menu-item-active" : ""}`}
        >
          {/* Single menu without children */}
          {!item.child && !item.isHeadr && (
            <NavLink className="menu-link" to={item.link}>
              <span className="menu-icon flex-grow-0">
                <Icon icon={item.icon} />
              </span>
              <div className="text-box flex-grow">{item.title}</div>
              {item.badge && <span className="menu-badge">{item.badge}</span>}
            </NavLink>
          )}
          {/* Menu label */}
          {item.isHeadr && !item.child && (
            <div className="menulabel">{item.title}</div>
          )}
          {/* Submenu parent */}
          {item.child && (
            <div
              className={`menu-link ${
                activeSubmenu === i
                  ? "parent_active not-collapsed"
                  : "collapsed"
              }`}
              onClick={() => toggleSubmenu(i)}
            >
              <div className="flex-1 flex items-start">
                <span className="menu-icon">
                  <Icon icon={item.icon} />
                </span>
                <div className="text-box">{item.title}</div>
              </div>
              <div className="flex-0">
                <div
                  className={`menu-arrow transform transition-all duration-300 ${
                    activeSubmenu === i ? "rotate-90" : ""
                  }`}
                >
                  <Icon icon="heroicons-outline:chevron-right" />
                </div>
              </div>
            </div>
          )}

          <Submenu
            activeSubmenu={activeSubmenu}
            item={item}
            i={i}
            toggleMultiMenu={toggleMultiMenu}
            activeMultiMenu={activeMultiMenu}
          />
        </li>
      ))}
    </ul>
  );
};

export default Navmenu;
