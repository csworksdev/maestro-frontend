import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useMenuLayout = () => {
  const menuType = useLayoutStore((state) => state.type);
  const setSetting = useLayoutStore((state) => state.setSetting);

  const setMenuLayout = (value) => {
    setSetting({ key: "type", value });
  };

  return [menuType, setMenuLayout];
};

export default useMenuLayout;
