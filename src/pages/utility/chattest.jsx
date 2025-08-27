import { useEffect, useState } from "react";

export default function ChatTest() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_API_WS + "ws/chat/test/");

    ws.onopen = () => {
      console.log("✅ Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      console.log("📩 Message:", event.data);
      setMessages((prev) => [...prev, event.data]);
    };

    ws.onclose = () => {
      console.log("❌ Disconnected");
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ message: input }));
      setInput("");
    } else {
      console.warn("⚠️ WebSocket not connected yet");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-gray-100 rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">🔗 WebSocket Test</h2>

      <div className="h-40 overflow-y-auto border p-2 bg-white rounded">
        {messages.map((msg, idx) => (
          <p key={idx} className="text-sm text-gray-800">
            {msg}
          </p>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
