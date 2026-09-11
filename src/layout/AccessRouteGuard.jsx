import { useLocation } from "react-router-dom";
import Loading from "@/components/Loading";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { canAccessPath } from "@/utils/permissionRoutes";
import { isSuperuserRole } from "@/utils/sidebarPreviewMenu";

const normalizePath = (value = "") =>
  String(value || "")
    .replace(/^\/+|\/+$/g, "")
    .trim()
    .toLowerCase();

const SUPERUSER_ALLOWED_PATHS = [
  "role-user",
  "role-menu",
  "permissions",
  "departments",
  "loker",
  "jobs",
  "career/jobs",
  "api/career/jobs",
  "rekruitmen",
  "applications",
  "career/applications",
  "api/career/applications",
  "cek-cv",
  "interview-user",
  "validasi-video-renang",
  "interview-owner",
  "kontrak",
  "tahapan",
];

const isSuperuserAllowedPath = (path) =>
  SUPERUSER_ALLOWED_PATHS.some(
    (allowedPath) =>
      path === allowedPath || path.startsWith(`${allowedPath}/`),
  );

const AccessRouteGuard = ({ children }) => {
  const location = useLocation();
  const menus = useAuthStore((state) => state.menus);
  const permissionCodes = useAuthStore((state) => state.permissionCodes);
  const accessLoading = useAuthStore((state) => state.accessLoading);
  const accessLoaded = useAuthStore((state) => state.accessLoaded);
  const accessError = useAuthStore((state) => state.accessError);
  const roles = useAuthStore((state) => state.data?.roles);
  const rawRoles = useAuthStore((state) => state.data?.raw_roles);
  const roleIds = useAuthStore((state) => state.roleIds);

  if (accessLoading) {
    return <Loading />;
  }

  const normalizedPath = normalizePath(location.pathname);
  const isSuperuser = isSuperuserRole(rawRoles ?? roles, roleIds);
  const allowed =
    isSuperuser && isSuperuserAllowedPath(normalizedPath)
      ? true
      : canAccessPath({
          pathname: location.pathname,
          menus,
          permissionCodes,
          accessLoaded,
          accessError,
        });

  if (!allowed) {
    return (
      <div className="rounded border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="text-lg font-semibold text-slate-900 dark:text-white">
          Akses tidak tersedia
        </div>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Halaman ini tidak tersedia untuk role atau permission akun ini.
        </p>
      </div>
    );
  }

  return children;
};

export default AccessRouteGuard;
