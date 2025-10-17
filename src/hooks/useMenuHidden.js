import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useMenuHidden = () => {
  const menuHidden = useLayoutStore((state) => state.menuHidden);
  const setSetting = useLayoutStore((state) => state.setSetting);

  const setMenuHidden = (value) => {
    setSetting({ key: "menuHidden", value, persist: false });
  };

  return [menuHidden, setMenuHidden];
};

export default useMenuHidden;
