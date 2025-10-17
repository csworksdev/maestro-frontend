import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useSemiDark = () => {
  const isSemiDark = useLayoutStore((state) => state.semiDarkMode);
  const setSetting = useLayoutStore((state) => state.setSetting);

  const setSemiDark = (val) =>
    setSetting({ key: "semiDarkMode", value: val, storageKey: "semiDarkMode" });

  return [isSemiDark, setSemiDark];
};

export default useSemiDark;
