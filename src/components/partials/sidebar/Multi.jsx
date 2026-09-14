import Badge from "@/components/ui/Badge";
import React from "react";
import { Collapse } from "react-collapse";
import { NavLink, useLocation } from "react-router-dom";

const normalizePath = (value = "") =>
  String(value || "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

const toNavPath = (value = "") => {
  const path = String(value || "").trim();
  if (!path || path === "#") return "#";
  if (/^(https?:|mailto:|tel:)/i.test(path)) return path;
  return path.startsWith("/") ? path : `/${path}`;
};

const isSidebarLinkActive = (pathname, ...targets) => {
  const current = normalizePath(pathname);
  if (!current) return false;

  return targets.some((target) => {
    const normalizedTarget = normalizePath(target);
    if (!normalizedTarget) return false;

    return (
      current === normalizedTarget ||
      current.startsWith(`${normalizedTarget}/`)
    );
  });
};

const LockLink = ({ to, children, item }) => {
  const { multiTitle, badge } = item;
  return (
    <>
      {item.badge ? (
        <span
          className={`text-slate-600 dark:text-slate-300 opacity-50 cursor-not-allowed
           text-sm flex space-x-3 rtl:space-x-reverse items-center `}
        >
          <span className="h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none"></span>
          <span className="flex-1 flex  space-x-2 rtl:space-x-reverse  truncate">
            <span className=" grow   truncate">{multiTitle}</span>
            <span className="grow-0">
              <Badge className="bg-slate-900 px-2 py-[3px]  font-normal text-xs rounded-full text-slate-100  capitalize">
                {badge}
              </Badge>
            </span>
          </span>
        </span>
      ) : (
        <NavLink to={toNavPath(to)}>{children}</NavLink>
      )}
    </>
  );
};

const Multilevel = ({ activeMultiMenu, j, subItem }) => {
  const location = useLocation();

  return (
    <Collapse isOpened={activeMultiMenu === j}>
      <ul className="space-y-[14px] pl-4">
        {subItem?.multi_menu?.map((item, i) => (
          <li key={i} className=" first:pt-[14px]">
            <LockLink to={item.multiLink} item={item}>
              {({ isActive }) => {
                const isItemActive =
                  isActive ||
                  isSidebarLinkActive(
                    location.pathname,
                    item.multiLink,
                    item.originalMultiLink,
                  );

                return (
                  <span
                    className={`${
                      isItemActive
                        ? " text-black dark:text-white font-medium"
                        : "text-slate-600 dark:text-slate-300"
                    } text-sm flex space-x-3 rtl:space-x-reverse items-center transition-all duration-150`}
                  >
                    <span
                      className={`${
                        isItemActive
                          ? " bg-slate-900 dark:bg-slate-300 ring-4 ring-opacity-[15%] ring-black-500 dark:ring-slate-300 dark:ring-opacity-20"
                          : ""
                      } h-2 w-2 rounded-full border border-slate-600 dark:border-white inline-block flex-none`}
                    ></span>
                    <span className="flex-1">{item.multiTitle}</span>
                  </span>
                );
              }}
            </LockLink>
          </li>
        ))}
      </ul>
    </Collapse>
  );
};

export default Multilevel;
