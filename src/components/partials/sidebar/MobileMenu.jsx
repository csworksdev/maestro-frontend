import React, { useRef, useEffect, useState } from "react";

import Navmenu from "./Navmenu";
// import { menuItems } from "@/constant/data";
import SimpleBar from "simplebar-react";
import useSemiDark from "@/hooks/useSemiDark";
import useSkin from "@/hooks/useSkin";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useMobileMenu from "@/hooks/useMobileMenu";
import Icon from "@/components/ui/Icon";

// import images
import MobileLogo from "@/assets/images/logo/logo.png";
import MobileLogoWhite from "@/assets/images/logo/logo-c-white.svg";
import svgRabitImage from "@/assets/images/svg/rabit.svg";
import { useDispatch } from "react-redux";
import { logOut } from "@/redux/slicers/authSlice";
import { useSelector } from "react-redux";
import Menu from "@/constant/menu";

const MobileMenu = ({ className = "custom-class" }) => {
  const scrollableNodeRef = useRef();
  const [scroll, setScroll] = useState(false);
  const dispatch = useDispatch();

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
    scrollableNodeRef.current.addEventListener("scroll", handleScroll);
  }, [scrollableNodeRef]);

  const [isSemiDark] = useSemiDark();
  // skin
  const [skin] = useSkin();
  const [isDark] = useDarkMode();
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const { user_id, user_name, roles } = useSelector((state) => state.auth.data);
  return (
    <div
      className={`${className} fixed  top-0 bg-white dark:bg-slate-800 shadow-lg  h-full   w-[248px]`}
    >
      <div className="logo-segment flex justify-between items-center bg-white dark:bg-slate-800 z-[9] h-[85px]  px-4 ">
        <Link to="/">
          <div className="flex items-center space-x-4">
            <div className="logo-icon h-16 w-16">
              {!isDark && !isSemiDark ? (
                <img src={MobileLogo} alt="" />
              ) : (
                <img src={MobileLogoWhite} alt="" />
              )}
            </div>
            <div>
              <span className="text-l font-semibold text-slate-900 dark:text-slate-100">
                hi, {user_name}
              </span>
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenu(!mobileMenu)}
          className="cursor-pointer text-slate-900 dark:text-white text-2xl"
        >
          <Icon icon="heroicons:x-mark" />
        </button>
      </div>

      <div
        className={`h-[60px]  absolute top-[80px] nav-shadow z-[1] w-full transition-all duration-200 pointer-events-none ${
          scroll ? " opacity-100" : " opacity-0"
        }`}
      ></div>
      <SimpleBar
        className="sidebar-menu px-4 h-[calc(100%-80px)]"
        scrollableNodeProps={{ ref: scrollableNodeRef }}
      >
        {menuItems.length > 0 && <Navmenu menus={menuItems} />}
        <div className="bg-slate-900 mb-24 lg:mb-10 mt-24 p-4 relative text-center rounded-2xl text-white">
          <button onClick={() => dispatch(logOut())}>
            <span>Logout</span>
          </button>
        </div>
      </SimpleBar>
    </div>
  );
};

export default MobileMenu;
