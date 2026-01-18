"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Capacitor } from "@capacitor/core";
import { ChatMessage, Message } from "@/app/components/ChatMessage";
import { ChannelList, Channel } from "@/app/components/ChannelList";
import { UserList, User } from "@/app/components/UserList";
import { ChatInput } from "@/app/components/ChatInput";

// Mock data for channels
const mockChannels: Channel[] = [
  { id: "1", name: "lobby", unreadCount: 0 },
  { id: "2", name: "mysteries", unreadCount: 3 },
  { id: "3", name: "tech-support", unreadCount: 0 },
  { id: "4", name: "off-topic", unreadCount: 1 },
  { id: "5", name: "signals", unreadCount: 0 },
  { id: "6", name: "archive", unreadCount: 0 },
];

// Mock users including Grok
const mockUsers: User[] = [
  { id: "0", username: "Grok", status: "online", mode: "@" },
  { id: "1", username: "CipherY", status: "online", mode: "@" },
  { id: "2", username: "NightOwl44", status: "online", mode: "+" },
  { id: "3", username: "DataMiner", status: "online" },
  { id: "4", username: "GhostInShell", status: "away" },
  { id: "5", username: "ByteRunner", status: "away" },
  { id: "6", username: "ShadowNet", status: "offline" },
];

// Initial IRC-style messages for flavor
const initialIRCMessages: Message[] = [
  {
    id: "sys-1",
    timestamp: new Date(),
    username: "SYSTEM",
    content: "Connected to AnomaNet. Welcome to #lobby.",
    type: "system",
  },
  {
    id: "join-1",
    timestamp: new Date(),
    username: "Grok",
    content: "",
    type: "join",
  },
];

export default function HomeContent() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [activeChannelId, setActiveChannelId] = useState("1");
  const [users] = useState<User[]>(mockUsers);
  const [ircMessages] = useState<Message[]>(initialIRCMessages);
  const [showChannels, setShowChannels] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // AI Chat hook - v5+ API with DefaultChatTransport
  const {
    messages: aiMessages,
    sendMessage,
    status,
    error,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  // Convert AI messages to IRC format and merge with IRC-only messages
  const allMessages = useMemo(() => {
    const convertedAIMessages: Message[] = aiMessages.map((msg) => {
      // AI SDK v5+ uses parts array instead of content string
      let content = "";
      if (typeof msg.content === "string") {
        content = msg.content;
      } else if (msg.parts) {
        // Extract text from parts array
        content = msg.parts
          .filter(
            (part): part is { type: "text"; text: string } =>
              part.type === "text",
          )
          .map((part) => part.text)
          .join("");
      }

      return {
        id: msg.id,
        timestamp: new Date(),
        username: msg.role === "user" ? "You" : "Grok",
        content,
        type: "message" as const,
      };
    });

    return [...ircMessages, ...convertedAIMessages];
  }, [ircMessages, aiMessages]);

  // Check if streaming
  const isStreaming = status === "streaming";

  // Handle keyboard show/hide for iOS (native only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let showListener:
      | Promise<import("@capacitor/core").PluginListenerHandle>
      | undefined;
    let hideListener:
      | Promise<import("@capacitor/core").PluginListenerHandle>
      | undefined;

    const setupKeyboardListeners = async () => {
      const { Keyboard } = await import("@capacitor/keyboard");
      showListener = Keyboard.addListener("keyboardWillShow", (info) => {
        setKeyboardHeight(info.keyboardHeight);
      });
      hideListener = Keyboard.addListener("keyboardWillHide", () => {
        setKeyboardHeight(0);
      });
    };

    setupKeyboardListeners();

    return () => {
      showListener?.then((handle) => handle.remove());
      hideListener?.then((handle) => handle.remove());
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [allMessages, isStreaming]);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [keyboardHeight]);

  // Handle sending a message
  const handleSendMessage = (content: string) => {
    if (content.trim() && !isStreaming) {
      sendMessage({ text: content });
      setInput("");
    }
  };

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    setShowChannels(false);
  };

  // Format current time for status bar
  const formatStatusTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const [statusTime, setStatusTime] = useState(formatStatusTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusTime(formatStatusTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex flex-col w-screen overflow-hidden bg-irc-bg safe-area-top transition-[height] duration-200"
      style={{
        height:
          keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px)` : "100vh",
      }}
    >
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay for channels */}
        {showChannels && (
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setShowChannels(false)}
            role="button"
            tabIndex={0}
            aria-label="Close channels sidebar"
            onKeyDown={(e) => e.key === "Escape" && setShowChannels(false)}
          />
        )}

        {/* Mobile overlay for users */}
        {showUsers && (
          <div
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
            onClick={() => setShowUsers(false)}
            role="button"
            tabIndex={0}
            aria-label="Close users sidebar"
            onKeyDown={(e) => e.key === "Escape" && setShowUsers(false)}
          />
        )}

        {/* Channel sidebar */}
        <aside
          className={`fixed lg:relative inset-y-0 left-0 z-50 w-40 transform transition-transform duration-200 ease-in-out lg:transform-none border-r border-irc-border ${
            showChannels
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <ChannelList
            channels={channels}
            activeChannelId={activeChannelId}
            onChannelSelect={handleChannelSelect}
            onClose={() => setShowChannels(false)}
          />
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-1 py-1">
            {allMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex leading-snug">
                <span className="text-irc-timestamp">[{statusTime}]</span>
                <span className="w-24 text-right shrink-0 px-1 text-irc-magenta">
                  --
                </span>
                <span className="text-irc-timestamp animate-pulse">
                  Grok is typing...
                </span>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex leading-snug">
                <span className="text-irc-timestamp">[{statusTime}]</span>
                <span className="w-24 text-right shrink-0 px-1 text-irc-red">
                  !!
                </span>
                <span className="text-irc-red">Error: {error.message}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onSendMessage={handleSendMessage}
            channelName={activeChannel?.name || "lobby"}
            keyboardVisible={keyboardHeight > 0}
            disabled={isStreaming}
          />
        </main>

        {/* User sidebar */}
        <aside
          className={`fixed lg:relative inset-y-0 right-0 z-50 w-32 transform transition-transform duration-200 ease-in-out lg:transform-none border-l border-irc-border ${
            showUsers ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          <UserList users={users} onClose={() => setShowUsers(false)} />
        </aside>
      </div>

      {/* Status bar - WeeChat style */}
      <div className="flex items-center justify-between px-2 py-0.5 bg-irc-sidebar-bg border-t border-irc-border text-xs">
        {/* Left: time and network info */}
        <div className="flex items-center gap-2">
          <span className="text-irc-timestamp">[{statusTime}]</span>
          <span className="text-irc-timestamp">[</span>
          <span className="text-irc-green">AnomaNet</span>
          <span className="text-irc-timestamp">]</span>
          <span className="text-irc-cyan">#{activeChannel?.name}</span>
          <span className="text-irc-timestamp">(+cnt)</span>
        </div>

        {/* Center: channel activity indicators */}
        <div className="hidden md:flex items-center gap-1">
          {channels.map((ch, i) => (
            <span
              key={ch.id}
              className={
                ch.unreadCount > 0
                  ? "text-irc-highlight"
                  : ch.id === activeChannelId
                    ? "text-irc-bright-white"
                    : "text-irc-timestamp"
              }
            >
              {i + 1}
              {ch.unreadCount > 0 && `(${ch.unreadCount})`}
              {i < channels.length - 1 && ","}
            </span>
          ))}
        </div>

        {/* Right: mobile menu buttons */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setShowChannels(true)}
            className="text-irc-cyan hover:text-irc-bright-white"
          >
            [ch]
          </button>
          <button
            onClick={() => setShowUsers(true)}
            className="text-irc-cyan hover:text-irc-bright-white"
          >
            [usr]
          </button>
        </div>

        {/* Right: user count (desktop) */}
        <div className="hidden lg:block text-irc-timestamp">
          {users.filter((u) => u.status === "online").length}/{users.length}{" "}
          users
        </div>
      </div>
    </div>
  );
}
