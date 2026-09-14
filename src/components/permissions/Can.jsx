import { useAuthStore } from "@/redux/slicers/authSlice";
import { hasAnyPermission, hasPermission } from "@/utils/accessControl";

const Can = ({
  permission,
  anyPermission,
  fallback = null,
  children,
  requirePermissionData = false,
}) => {
  const permissionCodes = useAuthStore((state) => state.permissionCodes);
  const accessLoaded = useAuthStore((state) => state.accessLoaded);
  const accessError = useAuthStore((state) => state.accessError);

  if (!requirePermissionData && (!accessLoaded || accessError || !permissionCodes.length)) {
    return children;
  }

  const allowed = anyPermission
    ? hasAnyPermission(permissionCodes, anyPermission)
    : hasPermission(permissionCodes, permission);

  return allowed ? children : fallback;
};

export default Can;
