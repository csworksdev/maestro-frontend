import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import Logo from "@/assets/images/logo/logo.svg";
import { useIsAuthenticated } from "@/redux/slicers/authSlice";
import PoolLoader from "@/components/PoolLoader";
const Loading = () => {
  const [isDark] = useDarkMode();
  const isAuth = useIsAuthenticated();
  return (
    <div className="flex flex-col items-center justify-center app_height">
      {!isAuth && (
        <div className="mb-3">
          <img src={isDark ? LogoWhite : Logo} alt="Logo" />
        </div>
      )}
      <PoolLoader size={isAuth ? "sm" : "lg"} />
      {isAuth && (
        <span className="inline-block mt-2 font-medium text-sm">
          Loading ...
        </span>
      )}
    </div>
  );
};

export default Loading;
