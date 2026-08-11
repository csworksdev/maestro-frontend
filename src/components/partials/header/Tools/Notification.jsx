import React, { useEffect, useMemo, useState, useRef } from "react";
import Dropdown from "@/components/ui/Dropdown";
import Icon from "@/components/ui/Icon";
import { Link } from "react-router-dom";
import { axiosConfig } from "@/axios/config";
import { formatDistanceToNow } from "date-fns";
import { AUTH_COOKIE_KEYS, getCookie } from "@/utils/authCookies";
import { buildWsUrl } from "@/utils/wsUrl";

const getNotificationKey = (notification) => {
  if (!notification) {
    return null;
  }

  if (notification.id != null) {
    return `id:${notification.id}`;
  }

  const title = notification.title || "";
  const message = notification.message || notification.body || "";
  const createdAt = notification.created_at || "";
  const targetUrl = notification.target_url || "";
  const fingerprint = `${title}|${message}|${createdAt}|${targetUrl}`;

  return fingerprint.replace(/\|/g, "").trim() ? `fp:${fingerprint}` : null;
};

const normalizeNotification = (notification) => {
  if (!notification || typeof notification !== "object") {
    return null;
  }

  const title = notification.title || notification.subject || "";
  const message =
    notification.message || notification.body || notification.notification_body || "";

  if (!String(title).trim() && !String(message).trim()) {
    return null;
  }

  return {
    ...notification,
    title: String(title || "Notification").trim(),
    message: String(message || "").trim(),
    is_read: Boolean(notification.is_read),
  };
};

const mergeUniqueNotifications = (currentNotifications, incomingNotifications) => {
  const normalizedIncoming = incomingNotifications
    .map(normalizeNotification)
    .filter(Boolean);
  const existingKeys = new Set(currentNotifications.map(getNotificationKey).filter(Boolean));
  const uniqueIncoming = normalizedIncoming.filter((notification) => {
    const key = getNotificationKey(notification);
    if (!key || existingKeys.has(key)) {
      return false;
    }
    existingKeys.add(key);
    return true;
  });

  return [...uniqueIncoming, ...currentNotifications];
};

const countUnread = (items) => items.filter((item) => !item.is_read).length;

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
  const reconnectTimerRef = useRef(null);

  const orderedNotifications = useMemo(() => {
    const getTime = (notification) => {
      const time = new Date(notification.created_at).getTime();
      return Number.isNaN(time) ? 0 : time;
    };

    return [...notifications].sort((a, b) => getTime(b) - getTime(a));
  }, [notifications]);

  // buka websocket
  useEffect(() => {
    const getTokenFromCookie = () => getCookie(AUTH_COOKIE_KEYS.access);
    const token = getTokenFromCookie();
    if (!token) {
      return undefined;
    }

    const addIncomingNotifications = (incoming) => {
      const incomingList = Array.isArray(incoming) ? incoming : [incoming];
      setNotifications((prev) => {
        const next = mergeUniqueNotifications(prev, incomingList);
        setUnread(countUnread(next));
        return next;
      });
    };

    const handleSocketMessage = (event) => {
      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch (error) {
        console.warn("Ignored malformed notification payload:", event.data);
        return;
      }

      if (payload.type === "notification.created") {
        addIncomingNotifications(payload.notification);
      }
      if (payload.type === "notification.initial") {
        addIncomingNotifications(payload.notifications || payload.notification);
      }
    };

    const openSocket = (tokenValue) => {
      const url = buildWsUrl(`/ws/notifications/?token=${tokenValue}`);
      if (!url) {
        console.error("Unable to resolve WebSocket URL for notifications");
        return null;
      }

      const socket = new WebSocket(url);
      socket.onopen = () => {
        // console.log("🔔 WS connected");
      };
      socket.onmessage = handleSocketMessage;
      socket.onclose = () => {
        reconnectTimerRef.current = setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            const latestToken = getTokenFromCookie();
            if (latestToken) {
              socketRef.current = openSocket(latestToken);
            }
          }
        }, 5000);
      };

      return socket;
    };

    socketRef.current = openSocket(token);
    if (!socketRef.current) {
      return undefined;
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      socketRef.current?.close();
    };
  }, []);

  const handleMarkAsRead = async (id) => {
    await axiosConfig.post("/api/notifications/" + id + "/mark_read/");
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((u) => (u > 0 ? u - 1 : 0));
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
        {orderedNotifications.map((item, i) => (
          <button
            type="button"
            key={item.id || i}
            className="block w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:bg-opacity-70 cursor-pointer"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (!item.is_read) {
                handleMarkAsRead(item.id);
              }
            }}
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
          </button>
        ))}
      </div>
    </Dropdown>
  );
};

export default Notification;
