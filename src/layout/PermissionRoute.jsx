import { Navigate } from "react-router-dom";
import Loading from "@/components/Loading";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { hasAnyPermission } from "@/utils/accessControl";

const PermissionRoute = ({ permission, anyPermission, children }) => {
  const isAuth = useAuthStore((state) => state.isAuth);
  const accessLoading = useAuthStore((state) => state.accessLoading);
  const accessLoaded = useAuthStore((state) => state.accessLoaded);
  const accessError = useAuthStore((state) => state.accessError);
  const permissionCodes = useAuthStore((state) => state.permissionCodes);
  const can = useAuthStore((state) => state.can);

  if (!isAuth) {
    return <Navigate to="/auth/login" replace />;
  }

  if (accessLoading) {
    return <Loading />;
  }

  if (!accessLoaded || accessError || !permissionCodes.length) {
    return children;
  }

  const isAllowed = anyPermission
    ? hasAnyPermission(permissionCodes, anyPermission)
    : can(permission);

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionRoute;
