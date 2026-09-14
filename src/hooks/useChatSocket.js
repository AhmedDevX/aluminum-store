import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { api, SOCKET_URL } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";

function formatTime(isoLike) {
  // SQLite gives "YYYY-MM-DD HH:MM:SS" (UTC); Date parses it fine either way.
  const date = new Date(isoLike.replace(" ", "T") + "Z");
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

function toUiMessage(serverMessage) {
  return {
    id: serverMessage.id,
    sender: serverMessage.sender, // "customer" | "support"
    text: serverMessage.text,
    time: formatTime(serverMessage.createdAt)
  };
}

/**
 * Chat connection hook for the customer-facing Chat page.
 * Loads the conversation history over REST, then keeps it live via Socket.IO.
 */
export function useChatSocket() {
  const { token } = useAuth();
  const [status, setStatus] = useState("connecting"); // connecting | connected | error
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    api
      .getChatHistory(token)
      .then((data) => {
        if (!cancelled) setMessages(data.messages.map(toUiMessage));
      })
      .catch(() => {
        // Non-fatal: the live socket can still work even if history fails to load.
      });

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("connecting"));
    socket.on("connect_error", () => setStatus("error"));
    socket.on("message", (serverMessage) => {
      setMessages((prev) => [...prev, toUiMessage(serverMessage)]);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [token]);

  function sendMessage(text) {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit("message", { text: text.trim() });
  }

  return { status, messages, sendMessage };
}
