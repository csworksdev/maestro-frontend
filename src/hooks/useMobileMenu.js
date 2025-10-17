import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useMobileMenu = () => {
  const mobileMenu = useLayoutStore((state) => state.mobileMenu);
  const setSetting = useLayoutStore((state) => state.setSetting);

  // ** Toggles Mobile Menu
  const setMobileMenu = (val) => {
    setSetting({ key: "mobileMenu", value: val });
  };

  return [mobileMenu, setMobileMenu];
};

export default useMobileMenu;
