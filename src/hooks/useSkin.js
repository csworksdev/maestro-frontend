import { useEffect } from "react";
import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useSkin = () => {
  const skin = useLayoutStore((state) => state.skin);
  const setSetting = useLayoutStore((state) => state.setSetting);

  const setSkin = (mod) => setSetting({ key: "skin", value: mod });

  useEffect(() => {
    const body = window.document.body;
    const classNames = {
      default: "skin--default",
      bordered: "skin--bordered",
    };

    if (skin === "default") {
      body.classList.add(classNames.default);
      body.classList.remove(classNames.bordered);
    } else if (skin === "bordered") {
      body.classList.add(classNames.bordered);
      body.classList.remove(classNames.default);
    }
  }, [skin]);

  return [skin, setSkin];
};

export default useSkin;
