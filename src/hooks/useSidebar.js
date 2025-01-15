import { useSelector, useDispatch } from "react-redux";
import { handleSetting } from "@/redux/slicers/layoutSlice";

const useSidebar = () => {
  const dispatch = useDispatch();
  const collapsed = useSelector((state) => state.layout.isCollapsed);

  // ** Toggles Menu Collapsed
  // const setMenuCollapsed = (val) => dispatch(handleSidebarCollapsed(val));
  const setMenuCollapsed = (val) =>
    dispatch(handleSetting({ key: "isCollapsed", value: val }));

  return [collapsed, setMenuCollapsed];
};

export default useSidebar;
