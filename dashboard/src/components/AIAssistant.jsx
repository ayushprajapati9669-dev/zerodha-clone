import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "../styles/AIAssistant.css";

const suggestions = [
  {
    title: "Portfolio",
    question: "What is my total portfolio P&L?",
    icon: "📊",
  },
  {
    title: "Holdings",
    question: "Show me my current holdings",
    icon: "📈",
  },
  {
    title: "Funds",
    question: "How much available balance do I have?",
    icon: "💰",
  },
  {
    title: "Orders",
    question: "Explain the difference between market and limit orders",
    icon: "⚡",
  },
];

const AIAssistant = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isChatsLoading, setIsChatsLoading] = useState(false);

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // ---------------- FETCH CHATS ----------------
  const fetchChats = async () => {
    try {
      setIsChatsLoading(true);

      const response = await axios.get("http://localhost:3000/api/ai/chats", {
        withCredentials: true,
      });

      setChats(response.data?.chats || []);
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setIsChatsLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // ---------------- AUTO SCROLL ----------------
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // ---------------- SELECT CHAT ----------------
  const handleSelectChat = async (chatId) => {
    if (isLoading) return;

    try {
      setSelectedChatId(chatId);

      const response = await axios.get(
        `http://localhost:3000/api/ai/chats/${chatId}`,
        {
          withCredentials: true,
        },
      );

      setMessages(response.data?.chat?.messages || []);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }, 0);
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  };

  // ---------------- NEW CHAT ----------------
  const handleNewChat = () => {
    if (isLoading) return;

    setSelectedChatId(null);
    setMessages([]);
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // ---------------- DELETE CHAT ----------------
  const handleDeleteChat = async (event, chatId) => {
    event.stopPropagation();

    if (isLoading) return;

    try {
      await axios.delete(`http://localhost:3000/api/ai/chats/${chatId}`, {
        withCredentials: true,
      });

      setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));

      if (selectedChatId === chatId) {
        setSelectedChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  // ---------------- TEXTAREA ----------------
  const handleTextareaChange = (event) => {
    const value = event.target.value;

    setMessage(value);

    const textarea = event.target;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // ---------------- SEND MESSAGE ----------------
  const handleSendMessage = async (customMessage = null) => {
    const userMessage = (
      customMessage !== null ? customMessage : message
    ).trim();

    if (!userMessage || isLoading) return;

    const userMessageObject = {
      id: Date.now(),
      role: "user",
      content: userMessage,
    };

    setMessages((prev) => [...prev, userMessageObject]);
    setMessage("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3000/api/ai/chat",
        {
          message: userMessage,
          chatId: selectedChatId,
        },
        {
          withCredentials: true,
        },
      );

      const assistantMessage =
        response.data?.message || "Sorry, I couldn't generate a response.";

      const returnedChatId = response.data?.chatId;

      const assistantMessageObject = {
        id: Date.now() + 1,
        role: "assistant",
        content: assistantMessage,
      };

      setMessages((prev) => [...prev, assistantMessageObject]);

      if (!selectedChatId && returnedChatId) {
        setSelectedChatId(returnedChatId);
      }

      await fetchChats();
    } catch (error) {
      console.error("AI request failed:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- ENTER KEY ----------------
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="ai-assistant">
      <div className="ai-chat-layout">
        {/* ================= SIDEBAR ================= */}
        <aside className="ai-chat-sidebar">
          <div className="ai-sidebar-top">
            <div className="ai-sidebar-brand">
              <div className="ai-brand-icon">✦</div>

              <div>
                <h3>AI Assistant</h3>
                <span>Portfolio Copilot</span>
              </div>
            </div>

            <button
              className="ai-new-chat-btn"
              onClick={handleNewChat}
              disabled={isLoading}
            >
              <span className="new-chat-icon">＋</span>
              <span>New chat</span>
            </button>
          </div>

          <div className="ai-history">
            <div className="ai-history-heading">
              <span>Recent chats</span>

              {chats.length > 0 && (
                <span className="ai-chat-count">{chats.length}</span>
              )}
            </div>

            <div className="ai-history-list">
              {isChatsLoading ? (
                <div className="ai-history-loading">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : chats.length === 0 ? (
                <div className="ai-no-chats">
                  <div className="ai-no-chat-icon">💬</div>

                  <p>No conversations yet</p>

                  <span>Start a new conversation with your AI assistant.</span>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`ai-chat-history-item ${
                      selectedChatId === chat._id ? "active" : ""
                    }`}
                    onClick={() => handleSelectChat(chat._id)}
                  >
                    <div className="ai-history-chat-icon">
                      <span>💬</span>
                    </div>

                    <div className="ai-history-chat-info">
                      <span className="ai-history-chat-title">
                        {chat.title || "New conversation"}
                      </span>

                      <span className="ai-history-chat-time">
                        {chat.updatedAt
                          ? new Date(chat.updatedAt).toLocaleDateString()
                          : ""}
                      </span>
                    </div>

                    <button
                      className="ai-delete-chat"
                      onClick={(event) => handleDeleteChat(event, chat._id)}
                      title="Delete chat"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v5" />
                        <path d="M14 11v5" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ai-sidebar-footer">
            <div className="ai-powered">
              <span className="ai-status-dot"></span>
              <span>AI Assistant is ready</span>
            </div>
          </div>
        </aside>

        {/* ================= MAIN ================= */}
        <main className="ai-main">
          {/* HEADER */}
          <header className="ai-header">
            <div className="ai-header-left">
              <div className="ai-header-avatar">✦</div>

              <div>
                <h2>AI Assistant</h2>

                <div className="ai-online-status">
                  <span></span>
                  Online
                </div>
              </div>
            </div>

            <div className="ai-header-badge">Portfolio AI</div>
          </header>

          {/* ================= CHAT AREA ================= */}
          <div className="ai-chat">
            <div className="ai-chat-content">
              {messages.length === 0 ? (
                <div className="ai-empty-state">
                  <div className="ai-welcome-icon">
                    <span>✦</span>
                  </div>

                  <h1>How can I help you today?</h1>

                  <p>
                    Ask me about your portfolio, holdings, funds, orders, or the
                    market.
                  </p>

                  <div className="ai-suggestions">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="ai-suggestion-card"
                        onClick={() => handleSendMessage(suggestion.question)}
                        disabled={isLoading}
                      >
                        <div className="suggestion-icon">{suggestion.icon}</div>

                        <div className="suggestion-content">
                          <span>{suggestion.title}</span>

                          <p>{suggestion.question}</p>
                        </div>

                        <span className="suggestion-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ai-messages">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`ai-message-row ${
                        msg.role === "user" ? "user-row" : "assistant-row"
                      }`}
                    >
                      {msg.role === "assistant" && (
                        <div className="ai-message-avatar">✦</div>
                      )}

                      <div
                        className={`ai-message ${
                          msg.role === "user"
                            ? "user-message"
                            : "assistant-message"
                        } ${msg.isError ? "error-message" : ""}`}
                      >
                        {msg.role === "assistant" ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* TYPING */}
                  {isLoading && (
                    <div className="ai-message-row assistant-row">
                      <div className="ai-message-avatar">✦</div>

                      <div className="ai-message assistant-message ai-typing-message">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* ================= COMPOSER ================= */}
          <div className="ai-composer-area">
            <div className="ai-composer">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="Message your AI assistant..."
                rows="1"
                disabled={isLoading}
              />

              <button
                className={`ai-send-btn ${message.trim() ? "active" : ""}`}
                onClick={() => handleSendMessage()}
                disabled={!message.trim() || isLoading}
                title="Send message"
              >
                {isLoading ? (
                  <span className="send-spinner"></span>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="ai-composer-hint">
              <span>Enter</span> to send · <span>Shift + Enter</span> for new
              line
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIAssistant;
