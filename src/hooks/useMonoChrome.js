import { useEffect } from "react";
import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useMonoChrome = () => {
  const isMonoChrome = useLayoutStore((state) => state.isMonochrome);
  const setSetting = useLayoutStore((state) => state.setSetting);

  const setMonoChrome = (val) =>
    setSetting({ key: "isMonochrome", value: val, storageKey: "monochrome" });

  useEffect(() => {
    const element = document.getElementsByTagName("html")[0];

    if (isMonoChrome) {
      element.classList.add("grayscale");
    } else {
      element.classList.remove("grayscale");
    }
  }, [isMonoChrome]);

  return [isMonoChrome, setMonoChrome];
};

export default useMonoChrome;
