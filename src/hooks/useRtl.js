import { useEffect } from "react";
import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useRtl = () => {
  const isRtl = useLayoutStore((state) => state.isRTL);
  const setSetting = useLayoutStore((state) => state.setSetting);

  const setRtl = (val) =>
    setSetting({ key: "isRTL", value: val, storageKey: "direction" });

  useEffect(() => {
    const element = document.getElementsByTagName("html")[0];

    if (isRtl) {
      element.setAttribute("dir", "rtl");
    } else {
      element.setAttribute("dir", "ltr");
    }
  }, [isRtl]);

  return [isRtl, setRtl];
};

export default useRtl;
