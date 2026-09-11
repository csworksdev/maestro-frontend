import { matchPath, useLocation } from "react-router-dom";
import { useAuthStore } from "@/redux/slicers/authSlice";
import { resolveRoleMenuRouteAlias } from "@/utils/roleMenuPreviewStorage";

const normalizePath = (value = "") =>
  String(value || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

const toAbsolutePath = (value = "") => {
  const normalizedPath = normalizePath(value);
  return normalizedPath ? `/${normalizedPath}` : "";
};

const findRouteAlias = (targetPath, routeAliases = []) => {
  const normalizedTarget = normalizePath(targetPath);
  if (!normalizedTarget) return null;

  return routeAliases.find((routeAlias) =>
    matchPath(
      {
        path: toAbsolutePath(routeAlias.path),
        end: true,
      },
      toAbsolutePath(normalizedTarget),
    ),
  );
};

const getMenuChildren = (item) => [
  ...(Array.isArray(item?.child) ? item.child : []),
  ...(Array.isArray(item?.multi_menu) ? item.multi_menu : []),
];

const collectMenuRoutePairs = (menus = []) =>
  menus.flatMap((item) => {
    const current =
      item?.link ||
      item?.childlink ||
      item?.multiLink ||
      item?.route ||
      "";
    const original =
      item?.originalLink ||
      item?.original_childlink ||
      item?.originalMultiLink ||
      item?.original_route ||
      "";
    const routePairs = current
      ? [
          {
            current: normalizePath(current),
            original: normalizePath(original),
          },
        ]
      : [];

    return [...routePairs, ...collectMenuRoutePairs(getMenuChildren(item))];
  });

const resolveMenuRouteAlias = (pathname, menus = []) => {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) return "";

  const routePair = collectMenuRoutePairs(menus)
    .filter(
      ({ current, original }) => current && original && current !== original,
    )
    .sort((first, second) => second.current.length - first.current.length)
    .find(
      ({ current }) =>
        normalizedPath === current || normalizedPath.startsWith(`${current}/`),
    );

  if (!routePair) return "";

  const suffix = normalizedPath
    .slice(routePair.current.length)
    .replace(/^\/+/, "");
  const targetPath = suffix
    ? `${routePair.original}/${suffix}`
    : routePair.original;

  return toAbsolutePath(targetPath);
};

const findRouteAliasBySuffix = (pathname, routeAliases = []) => {
  const normalizedPath = normalizePath(pathname);
  if (!normalizedPath) return null;

  return (
    routeAliases
      .map((routeAlias) => ({
        routeAlias,
        path: normalizePath(routeAlias.path),
      }))
      .filter(
        ({ path }) =>
          path && (normalizedPath === path || normalizedPath.endsWith(`/${path}`)),
      )
      .sort((first, second) => second.path.length - first.path.length)[0]
      ?.routeAlias || null
  );
};

const RoleMenuRouteFallback = ({ fallback, routeAliases = [] }) => {
  const location = useLocation();
  const roles = useAuthStore((state) => state.data?.roles);
  const rawRoles = useAuthStore((state) => state.data?.raw_roles);
  const menus = useAuthStore((state) => state.menus);
  const previewTargetPath = resolveRoleMenuRouteAlias(
    location.pathname,
    rawRoles ?? roles,
  );
  const menuTargetPath = resolveMenuRouteAlias(location.pathname, menus);
  const routeAlias =
    findRouteAlias(previewTargetPath, routeAliases) ||
    findRouteAlias(menuTargetPath, routeAliases) ||
    findRouteAliasBySuffix(location.pathname, routeAliases);

  if (routeAlias) {
    return routeAlias.element;
  }

  return fallback;
};

export default RoleMenuRouteFallback;
