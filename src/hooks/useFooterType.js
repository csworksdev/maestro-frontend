import { useLayoutStore } from "@/redux/slicers/layoutSlice";

const useFooterType = () => {
  const footerType = useLayoutStore((state) => state.footerType);
  const setSetting = useLayoutStore((state) => state.setSetting);
  const setFooterType = (val) =>
    setSetting({ key: "footerType", value: val, persist: false });
  return [footerType, setFooterType];
};

export default useFooterType;
