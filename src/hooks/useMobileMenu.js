import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
// import { handleMobileMenu } from "@/store/layout";
import { handleSetting } from "@/redux/slicers/layoutSlice";
import { useLocation } from "react-router-dom";

const useMobileMenu = () => {
  const dispatch = useDispatch();
  const mobileMenu = useSelector((state) => state.layout.mobileMenu);
  const location = useLocation();

  // ** Toggles Mobile Menu
  const setMobileMenu = (val) => {
    dispatch(handleSetting({ key: "mobileMenu", value: val }));
  };

  return [mobileMenu, setMobileMenu];
};

export default useMobileMenu;
