import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useSidebar = () => {
  const collapsed = useLayoutStore((state) => state.isCollapsed);
  const setSetting = useLayoutStore((state) => state.setSetting);

  // ** Toggles Menu Collapsed
  const setMenuCollapsed = (val) =>
    setSetting({ key: "isCollapsed", value: val });

  return [collapsed, setMenuCollapsed];
};

export default useSidebar;
