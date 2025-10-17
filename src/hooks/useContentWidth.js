import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useContentWidth = () => {
  const contentWidth = useLayoutStore((state) => state.contentWidth);
  const setSetting = useLayoutStore((state) => state.setSetting);

  // ** Toggles Content Width
  const setContentWidth = (val) =>
    setSetting({ key: "contentWidth", value: val, persist: false });

  return [contentWidth, setContentWidth];
};

export default useContentWidth;
