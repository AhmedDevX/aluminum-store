import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import NavBar from "../../components/NavBar/NavBar.jsx";
import { useChatSocket } from "../../hooks/useChatSocket.js";
import "./Chat.css";

export default function Chat() {
  const { t } = useLanguage();
  const { status, messages, sendMessage } = useChatSocket();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(draft);
    setDraft("");
  }

  return (
    <div className="chat-page">
      <NavBar />

      <div className="chat-page__body">
        <div className="chat-panel">
          <div className="chat-panel__header">
            <div>
              <h1 className="chat-panel__title">{t("chatTitle")}</h1>
              <p className="chat-panel__subtitle">{t("chatSubtitle")}</p>
            </div>
            <span className={`chat-status chat-status--${status}`}>
              <span className="chat-status__dot" />
              {status === "connected"
                ? t("chatConnected")
                : status === "error"
                ? t("chatError")
                : t("chatConnecting")}
            </span>
          </div>

          <div className="chat-thread" ref={scrollRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-bubble chat-bubble--${message.sender}`}
              >
                <p className="chat-bubble__sender">
                  {message.sender === "customer" ? t("chatYou") : t("chatSupport")}
                </p>
                <p className="chat-bubble__text">{message.text}</p>
                <span className="chat-bubble__time">{message.time}</span>
              </div>
            ))}
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chat-composer__input"
              placeholder={t("chatPlaceholder")}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" className="chat-composer__send">
              {t("chatSend")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
