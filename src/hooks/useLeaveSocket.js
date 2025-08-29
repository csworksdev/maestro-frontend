import { useEffect, useRef, useState } from "react";

export const useLeaveSocket = (trainer_id, role, selectStatus) => {
  const socketRef = useRef(null);
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const connect = () => {
    const ws = new WebSocket(
      `${import.meta.env.VITE_API_WS}/ws/leave/${trainer_id}/`
    );
    socketRef.current = ws;

    ws.onopen = () => {
      // kirim initial request sesuai role
      ws.send(
        JSON.stringify({
          trainer_id: trainer_id,
          action:
            role === "Trainer" ? "get_trainer_leaves" : "get_pending_leaves",
          status: selectStatus,
        })
      );
    };

    function updateLeaveInState(newLeave) {
      setData((prevData) => {
        const idx = prevData.findIndex(
          (leave) => leave.leave_id === newLeave.leave_id
        );
        if (idx !== -1) {
          const updated = [...prevData];
          updated[idx] = newLeave;
          return updated;
        } else {
          return [newLeave, ...prevData];
        }
      });
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        switch (message.action) {
          case "leave.list":
            setData(message.data);
            break;
          case "leave.update":
            updateLeaveInState(message.data);
            break;
          default:
            console.warn("⚠️ Unknown action:", message);
        }
      } catch (err) {
        console.error("❌ WS parse error:", event.data, err);
      } finally {
        setIsLoading(false);
      }
    };

    ws.onclose = () => {
      // reconnect otomatis
      setTimeout(connect, 3000);
    };
  };

  useEffect(() => {
    connect();
    return () => socketRef.current?.close();
  }, []);

  // kirim update ketika selectStatus berubah
  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          trainer_id: trainer_id,
          action:
            role === "Trainer" ? "get_trainer_leaves" : "get_pending_leaves",
          status: selectStatus,
        })
      );
    }
  }, [selectStatus]);

  return { data, isLoading, socketRef };
};
