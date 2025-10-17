import { useEffect } from "react";
import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useDarkmode = () => {
  const isDark = useLayoutStore((state) => state.darkMode);
  const setSetting = useLayoutStore((state) => state.setSetting);

  // ** Return a wrapped version of useState's setter function
  const setDarkMode = (mode) => {
    setSetting({ key: "darkMode", value: mode });
  };

  useEffect(() => {
    // ** Get Body Tag
    const body = window.document.body;
    // define classNames
    const classNames = {
      dark: "dark",
      light: "light",
    };
    // ** Check if dark mode is enabled
    if (isDark) {
      body.classList.add(classNames.dark);
      body.classList.remove(classNames.light);
    } else {
      body.classList.add(classNames.light);
      body.classList.remove(classNames.dark);
    }
  }, [isDark]);

  return [isDark, setDarkMode];
};

export default useDarkmode;
