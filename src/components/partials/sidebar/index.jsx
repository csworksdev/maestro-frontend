import React, { useRef, useEffect, useState } from "react";
import SidebarLogo from "./Logo";
import Navmenu from "./Navmenu";
// import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSidebar from "@/hooks/useSidebar";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import { useSelector } from "react-redux";
import Menu from "@/constant/menu";

const Sidebar = () => {
  const scrollableNodeRef = useRef(null);
  const [scroll, setScroll] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  // let menuItems = JSON.parse(localStorage.getItem("menuItems"));

  const data = useSelector((state) => state.auth.data); // ✅ DI SINI BENAR

  useEffect(() => {
    if (data?.roles?.length) {
      const generatedMenu = Menu(data.roles);
      setMenuItems(generatedMenu);
    }
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollableNodeRef.current.scrollTop > 0) {
        setScroll(true);
      } else {
        setScroll(false);
      }
    };
    const node = scrollableNodeRef.current;
    if (node) {
      node.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (node) {
        node.removeEventListener("scroll", handleScroll);
      }
    };
  }, [scrollableNodeRef]);

  const [collapsed, setMenuCollapsed] = useSidebar();
  const [menuHover, setMenuHover] = useState(false);

  // semi dark option
  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();

  const handleMenuClick = (menuItem) => {
    // Implement any specific logic needed when a submenu is clicked
    // Ensure it does not inadvertently collapse the sidebar
    console.log("Menu item clicked:", menuItem);
  };

  return (
    <div className={isSemiDark ? "dark" : ""}>
      <div
        className={`sidebar-wrapper bg-white dark:bg-slate-800 ${
          collapsed ? "w-[72px] close_sidebar" : "w-[248px]"
        } ${menuHover ? "sidebar-hovered" : ""} ${
          skin === "bordered"
            ? "border-r border-slate-200 dark:border-slate-700"
            : "shadow-base"
        }`}
        onMouseEnter={() => {
          setMenuHover(true);
        }}
        onMouseLeave={() => {
          setMenuHover(false);
        }}
      >
        <SidebarLogo menuHover={menuHover} />
        <div
          className={`h-[60px] absolute top-[80px] nav-shadow z-[1] w-full transition-all duration-200 pointer-events-none ${
            scroll ? " opacity-100" : " opacity-0"
          }`}
        ></div>

        <SimpleBar
          className="sidebar-menu px-4 h-[calc(100%-90px)] pb-7"
          scrollableNodeProps={{ ref: scrollableNodeRef }}
        >
          {menuItems.length > 0 && (
            <Navmenu menus={menuItems} onMenuClick={handleMenuClick} />
          )}
        </SimpleBar>
      </div>
    </div>
  );
};

export default Sidebar;
