import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { api, SOCKET_URL } from "../../api/client.js";

function formatTime(isoLike) {
  const date = new Date(isoLike.replace(" ", "T") + "Z");
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminChatPanel() {
  const { t } = useLanguage();
  const { token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const socketRef = useRef(null);
  const selectedUserIdRef = useRef(null);
  const threadRef = useRef(null);

  // Load the conversation list once, and keep one live socket connection
  // for the whole time the admin is on this tab.
  useEffect(() => {
    if (!token) return;

    api
      .getAdminConversations(token)
      .then((data) => setConversations(data.conversations))
      .catch(() => {});

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("message", (message) => {
      // Bump the relevant conversation to the top of the list.
      setConversations((prev) => {
        const exists = prev.some((c) => c.userId === message.conversationUserId);
        const updated = exists
          ? prev.map((c) =>
              c.userId === message.conversationUserId
                ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
                : c
            )
          : prev; // a brand-new conversation will show up next time the list refetches
        return [...updated].sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );
      });

      if (message.conversationUserId === selectedUserIdRef.current) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  function selectConversation(userId) {
    setSelectedUserId(userId);
    selectedUserIdRef.current = userId;
    socketRef.current?.emit("admin:watch", { userId });
    api
      .getAdminConversationHistory(userId, token)
      .then((data) => setMessages(data.messages))
      .catch(() => setMessages([]));
  }

  function handleSend(event) {
    event.preventDefault();
    if (!draft.trim() || !selectedUserId) return;
    socketRef.current?.emit("message", { toUserId: selectedUserId, text: draft.trim() });
    setDraft("");
  }

  const selectedConversation = conversations.find((c) => c.userId === selectedUserId);

  return (
    <section className="admin-panel">
      <h2 className="admin-panel__title">{t("adminNavChat")}</h2>

      <div className="admin-chat-layout">
        <div className="admin-chat-conversations">
          {conversations.length === 0 ? (
            <p className="admin-empty-state" style={{ padding: 16 }}>
              {t("adminChatNoConversations")}
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.userId}
                className={`admin-chat-conversation ${
                  conversation.userId === selectedUserId ? "is-active" : ""
                }`}
                onClick={() => selectConversation(conversation.userId)}
              >
                <span className="admin-chat-conversation__name">
                  {conversation.fullName}
                </span>
                <span className="admin-chat-conversation__preview">
                  {conversation.lastMessage}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="admin-chat-panel">
          {!selectedUserId ? (
            <div className="admin-chat-empty">{t("adminChatSelectConversation")}</div>
          ) : (
            <>
              <div className="admin-chat-panel__header">
                {selectedConversation?.fullName}
              </div>
              <div className="admin-chat-panel__thread" ref={threadRef}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`admin-chat-bubble admin-chat-bubble--${message.sender}`}
                  >
                    <p style={{ margin: 0 }}>{message.text}</p>
                    <span className="admin-chat-bubble__time">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
              <form className="admin-chat-panel__composer" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder={t("chatPlaceholder")}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="admin-primary-btn">
                  {t("chatSend")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
