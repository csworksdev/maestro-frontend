import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const WS_CLOSE_CODE_NORMAL = 1000;
const RECONNECT_DELAY = 3000;

const isAbsoluteWsUrl = (value = "") =>
  value.startsWith("ws://") || value.startsWith("wss://");

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_WS;
  if (envUrl && envUrl.trim().length) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const { protocol, host } = window.location;
    const wsProtocol = protocol === "https:" ? "wss" : "ws";
    return `${wsProtocol}://${host}`;
  }
  return null;
};

const buildWsUrl = (endpoint = "") => {
  if (!endpoint) {
    return null;
  }
  if (isAbsoluteWsUrl(endpoint)) {
    return endpoint;
  }

  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const normalizedPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${normalizedPath}`;
};

export const SOCKET_READY_STATE = {
  CONNECTING: "connecting",
  OPEN: "open",
  CLOSING: "closing",
  CLOSED: "closed",
};

const mapReadyState = (readyState) => {
  switch (readyState) {
    case WebSocket.CONNECTING:
      return SOCKET_READY_STATE.CONNECTING;
    case WebSocket.OPEN:
      return SOCKET_READY_STATE.OPEN;
    case WebSocket.CLOSING:
      return SOCKET_READY_STATE.CLOSING;
    case WebSocket.CLOSED:
    default:
      return SOCKET_READY_STATE.CLOSED;
  }
};

export const useSalesDashboardSocket = (endpoint) => {
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readyState, setReadyState] = useState(SOCKET_READY_STATE.CONNECTING);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!endpoint) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      const current = socketRef.current;
      socketRef.current = null;
      current.onopen = null;
      current.onmessage = null;
      current.onerror = null;
      current.onclose = null;
      if (
        current.readyState === WebSocket.OPEN ||
        current.readyState === WebSocket.CONNECTING
      ) {
        current.close(WS_CLOSE_CODE_NORMAL);
      }
    }

    const wsUrl = buildWsUrl(endpoint);
    if (!wsUrl) {
      setError("WebSocket base URL tidak valid. Cek konfigurasi VITE_API_WS.");
      setReadyState(SOCKET_READY_STATE.CLOSED);
      return;
    }

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;
    setIsLoading(true);
    setError(null);
    setReadyState(SOCKET_READY_STATE.CONNECTING);

    ws.onopen = () => {
      setReadyState(SOCKET_READY_STATE.OPEN);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message?.payload !== undefined) {
          setPayload(message.payload);
        } else {
          console.warn("⚠️ Unhandled websocket message:", message);
        }
      } catch (err) {
        console.error("❌ Failed to parse websocket payload:", err);
        setError("Gagal membaca data realtime");
      } finally {
        setIsLoading(false);
      }
    };

    ws.onerror = () => {
      setError("Koneksi websocket bermasalah");
    };

    ws.onclose = (evt) => {
      setReadyState(SOCKET_READY_STATE.CLOSED);
      if (evt.code !== WS_CLOSE_CODE_NORMAL) {
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };
  }, [endpoint]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close(WS_CLOSE_CODE_NORMAL);
      }
    };
  }, [connect]);

  useEffect(() => {
    if (!socketRef.current) {
      setReadyState(SOCKET_READY_STATE.CLOSED);
      return;
    }
    setReadyState(mapReadyState(socketRef.current.readyState));
  }, [payload]);

  const refresh = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ action: "refresh" }));
      setIsLoading(true);
      setError(null);
    } else {
      connect();
    }
  }, [connect]);

  const isConnected = useMemo(
    () => readyState === SOCKET_READY_STATE.OPEN,
    [readyState]
  );

  return {
    data: payload,
    isLoading,
    error,
    refresh,
    readyState,
    isConnected,
  };
};
