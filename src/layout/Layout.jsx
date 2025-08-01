import React, { useEffect, Suspense, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "@/components/partials/header";
import Sidebar from "@/components/partials/sidebar";
import useWidth from "@/hooks/useWidth";
import useSidebar from "@/hooks/useSidebar";
import useContentWidth from "@/hooks/useContentWidth";
import useMenulayout from "@/hooks/useMenulayout";
import useMenuHidden from "@/hooks/useMenuHidden";
import Footer from "@/components/partials/footer";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import MobileMenu from "@/components/partials/sidebar/MobileMenu";
import useMobileMenu from "@/hooks/useMobileMenu";
import MobileFooterCoach from "@/components/partials/footer/MobileFooterCoach";
import MobileFooterAdmin from "@/components/partials/footer/MobileFooterAdmin";
import { ToastContainer } from "react-toastify";
import { useSelector } from "react-redux";
import Loading from "@/components/Loading";
import { motion } from "framer-motion";
import Info from "@/components/partials/info";
import useScrollRestoration from "@/hooks/useScrollRestoration";

const Layout = () => {
  const { width, breakpoints } = useWidth();
  const [collapsed] = useSidebar();
  const { isAuth } = useSelector((state) => state.auth);
  const { user_id, roles } = useSelector((state) => state.auth.data);
  const navigate = useNavigate();

  useScrollRestoration();
  // const roles = localStorage.getItem("roles");

  const [contentWidth] = useContentWidth();
  const [menuType] = useMenulayout();
  const [menuHidden] = useMenuHidden();
  const [mobileMenu, setMobileMenu] = useMobileMenu();
  const nodeRef = useRef(null);

  useEffect(() => {
    if (!isAuth || !user_id) {
      navigate("/");
    }
  }, [isAuth, user_id, navigate]);

  const switchHeaderClass = () => {
    if (menuType === "horizontal" || menuHidden) {
      return "ltr:ml-0 rtl:mr-0";
    }
    return collapsed
      ? "ltr:ml-[72px] rtl:mr-[72px]"
      : "ltr:ml-[248px] rtl:mr-[248px]";
  };

  // const handleMobileMenuClose = () => setMobileMenu(false);
  return (
    <>
      <ToastContainer />

      <Header className={width > breakpoints.xl ? switchHeaderClass() : ""} />

      {menuType === "vertical" && width > breakpoints.xl && !menuHidden && (
        <Sidebar />
      )}

      <MobileMenu
        className={`transition-all duration-150 py-4 ${
          width < breakpoints.xl && mobileMenu
            ? "left-0 visible opacity-100 z-[9999]"
            : "left-[-300px] invisible opacity-0 z-[-999]"
        }`}
      />

      {width < breakpoints.xl && mobileMenu && (
        <div
          className="overlay bg-slate-900/50 backdrop-filter backdrop-blur-sm opacity-100 fixed inset-0 z-[999]"
          onClick={() => setMobileMenu(!mobileMenu)}
        ></div>
      )}

      <div
        className={`content-wrapper transition-all duration-150 ${
          width > 1280 ? switchHeaderClass() : ""
        }`}
      >
        <div className="page-content page-min-height">
          <div
            className={
              contentWidth === "boxed" ? "container mx-auto" : "container-fluid"
            }
          >
            {/* {roles === "Trainer" && <Info />} */}
            <Suspense fallback={<Loading />}>
              <motion.div
                key={location.pathname}
                initial="pageInitial"
                animate="pageAnimate"
                exit="pageExit"
                variants={{
                  pageInitial: { opacity: 0, y: 50 },
                  pageAnimate: { opacity: 1, y: 0 },
                  pageExit: { opacity: 0, y: -50 },
                }}
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.5,
                }}
              >
                <Breadcrumbs />
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </div>
      </div>

      {width < breakpoints.md ? (
        roles == "Trainer" ? (
          <MobileFooterCoach />
        ) : (
          <MobileFooterAdmin />
        )
      ) : // <Footer className={width > breakpoints.xl ? switchHeaderClass() : ""} />
      null}
    </>
  );
};

export default Layout;
