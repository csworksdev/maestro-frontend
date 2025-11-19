import React, { useEffect, useState, useRef } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "@headlessui/react";
import { axiosConfig } from "@/axios/config";
import { formatDistanceToNow } from "date-fns";
import { AUTH_COOKIE_KEYS, getCookie } from "@/utils/authCookies";
import { buildWsUrl } from "@/utils/wsUrl";

// helper untuk badge
const NotifyLabel = ({ unread }) => {
  return (
    <span className="relative lg:h-[32px] lg:w-[32px] lg:bg-slate-100 text-slate-900 lg:dark:bg-slate-900 dark:text-white cursor-pointer rounded-full text-[20px] flex flex-col items-center justify-center">
      <Icon
        icon="heroicons-outline:bell"
        className={`${unread > 0 ? "animate-tada" : ""}`}
      />
      {unread > 0 && (
        <span className="absolute lg:right-0 lg:top-0 -top-2 -right-2 h-4 w-4 bg-red-500 text-[10px] font-semibold flex items-center justify-center rounded-full text-white z-[99]">
          {unread}
        </span>
      )}
    </span>
  );
};

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  const resolveInternalRoute = (targetUrl) => {
    if (!targetUrl || typeof window === "undefined") {
      return null;
    }

    try {
      const candidate = new URL(targetUrl, window.location.origin);
      if (candidate.origin !== window.location.origin) {
        return null;
      }

      return `${candidate.pathname}${candidate.search}${candidate.hash}`;
    } catch (error) {
      console.warn("Ignored malformed notification target URL:", targetUrl);
      return null;
    }
  };

  // buka websocket
  useEffect(() => {
    const getTokenFromCookie = () => getCookie(AUTH_COOKIE_KEYS.access);
    const token = getTokenFromCookie();
    if (!token) {
      return undefined;
    }

    const openSocket = (tokenValue) => {
      const url = buildWsUrl(`/ws/notifications/?token=${tokenValue}`);
      if (!url) {
        console.error("Unable to resolve WebSocket URL for notifications");
        return null;
      }
      return new WebSocket(url);
    };

    socketRef.current = openSocket(token);
    if (!socketRef.current) {
      return undefined;
    }

    socketRef.current.onopen = () => {
      // console.log("🔔 WS connected");
    };
    socketRef.current.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "notification.created") {
        const n = payload.notification;
        setNotifications((prev) => [n, ...prev]);
        setUnread((u) => u + 1);
      }
      if (payload.type === "notification.initial") {
        setNotifications((prev) => [payload.notification, ...prev]);
        setUnread((u) => u + 1);
      }
    };
    socketRef.current.onclose = () => {
      setTimeout(() => {
        // auto reconnect
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
          const latestToken = getTokenFromCookie();
          if (latestToken) {
            socketRef.current = openSocket(latestToken);
          }
        }
      }, 5000);
    };

    return () => {
      socketRef.current?.close();
    };
  }, []);

  const handleClickNotif = async (id, targetUrl) => {
    await axiosConfig.post("/api/notifications/" + id + "/mark_read/");
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((u) => (u > 0 ? u - 1 : 0));
    if (targetUrl) {
      const internalRoute = resolveInternalRoute(targetUrl);
      if (internalRoute) {
        navigate(internalRoute);
      } else {
        console.warn(
          "Blocked navigation to external notification target:",
          targetUrl
        );
      }
    }
  };

  return (
    <Dropdown
      classMenuItems="md:w-[300px] top-[58px]"
      label={<NotifyLabel unread={unread} />}
    >
      <div className="flex justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-600">
        <div className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-6">
          Notifications
        </div>
        <div className="text-slate-800 dark:text-slate-200 text-xs md:text-right">
          <Link to="/notifications" className="underline">
            View all
          </Link>
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px] overflow-y-auto">
        {notifications.length === 0 && (
          <div className="px-4 py-2 text-xs text-slate-500">
            No notifications
          </div>
        )}
        {notifications.map((item, i) => (
          <Menu.Item key={item.id || i}>
            {({ active }) => (
              <div
                className={`${
                  active
                    ? "bg-slate-100 dark:bg-slate-700 dark:bg-opacity-70 text-slate-800"
                    : "text-slate-600 dark:text-slate-300"
                } block w-full px-4 py-2 text-sm  cursor-pointer`}
                onClick={() =>
                  !item.is_read && handleClickNotif(item.id, item.target_url)
                }
              >
                <div className="flex">
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs">{item.message}</div>
                    <div className="text-slate-400 dark:text-slate-400 text-xs mt-1">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  {!item.is_read && (
                    <div className="flex-0 pl-2">
                      <span className="h-[10px] w-[10px] bg-danger-500 border border-white dark:border-slate-400 rounded-full inline-block"></span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Menu.Item>
        ))}
      </div>
    </Dropdown>
  );
};

export default Notification;
