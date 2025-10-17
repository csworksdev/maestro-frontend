import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useNavbarType = () => {
  const navbarType = useLayoutStore((state) => state.navBarType);
  const setSetting = useLayoutStore((state) => state.setSetting);
  const setNavbarType = (val) =>
    setSetting({ key: "navBarType", value: val, persist: false });
  return [navbarType, setNavbarType];
};

export default useNavbarType;
