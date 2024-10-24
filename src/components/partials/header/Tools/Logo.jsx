import React from "react";
import useDarkMode from "@/hooks/useDarkMode";
import { Link } from "react-router-dom";
import useWidth from "@/hooks/useWidth";

import MainLogo from "@/assets/images/logo/logo.png";
const Logo = () => {
  const [isDark] = useDarkMode();
  const { width, breakpoints } = useWidth();

  return (
    <div>
      <Link to="/">
        {width >= breakpoints.xl ? (
          <img
            src={MainLogo}
            alt=""
            style={{ width: "64px", height: "64px" }}
          />
        ) : (
          <img
            src={MainLogo}
            alt=""
            style={{ width: "64px", height: "64px" }}
          />
        )}
      </Link>
    </div>
  );
};

export default Logo;
