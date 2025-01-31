import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const useScrollRestoration = () => {
  const location = useLocation();
  const isLoading = useSelector((state) => state.loading.isLoading); // Global loading state
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    if (isLoading) return; // Don't restore if data is still loading

    const handleScrollRestoration = () => {
      const savedPosition = sessionStorage.getItem("scrollPosition");
      if (savedPosition && !isRestored) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(savedPosition, 10));
          setIsRestored(true);
        });
      }
    };

    const saveScrollPosition = () => {
      sessionStorage.setItem("scrollPosition", window.scrollY.toString());
    };

    // Save scroll position before navigation, refresh, or mobile app switch
    window.addEventListener("beforeunload", saveScrollPosition);
    window.addEventListener("pagehide", saveScrollPosition); // Mobile Safari fix
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") saveScrollPosition(); // Handles app switching on mobile
    });

    // Restore after route change (only when fully loaded)
    requestAnimationFrame(() => {
      handleScrollRestoration();
    });

    return () => {
      window.removeEventListener("beforeunload", saveScrollPosition);
      window.removeEventListener("pagehide", saveScrollPosition);
      document.removeEventListener("visibilitychange", saveScrollPosition);
    };
  }, [location.pathname, isLoading]); // Runs after data loading is finished

  return null;
};

export default useScrollRestoration;
