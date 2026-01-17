"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, Message } from "@/app/components/ChatMessage";
import { ChannelList, Channel } from "@/app/components/ChannelList";
import { UserList, User } from "@/app/components/UserList";
import { ChatInput } from "@/app/components/ChatInput";
import { Keyboard } from "@capacitor/keyboard";

// Mock data
const mockChannels: Channel[] = [
  { id: "1", name: "lobby", unreadCount: 0 },
  { id: "2", name: "mysteries", unreadCount: 3 },
  { id: "3", name: "tech-support", unreadCount: 0 },
  { id: "4", name: "off-topic", unreadCount: 1 },
  { id: "5", name: "signals", unreadCount: 0 },
  { id: "6", name: "archive", unreadCount: 0 },
];

const mockUsers: User[] = [
  { id: "1", username: "CipherY", status: "online", mode: "@" },
  { id: "2", username: "NightOwl44", status: "online", mode: "+" },
  { id: "3", username: "DataMiner", status: "online" },
  { id: "4", username: "GhostInShell", status: "away" },
  { id: "5", username: "ByteRunner", status: "away" },
  { id: "6", username: "ShadowNet", status: "offline" },
];

const mockMessages: Message[] = [
  {
    id: "1",
    timestamp: new Date("2003-09-15T02:15:00"),
    username: "CipherY",
    content: "Anyone here know about the signal anomaly from last night?",
    type: "message",
  },
  {
    id: "2",
    timestamp: new Date("2003-09-15T02:16:00"),
    username: "NightOwl42",
    content: "Yeah, I caught some weird packets around 3 AM. Still analyzing.",
    type: "message",
  },
  {
    id: "3",
    timestamp: new Date("2003-09-15T02:17:00"),
    username: "DataMiner",
    content: "",
    type: "join",
  },
  {
    id: "4",
    timestamp: new Date("2003-09-15T02:18:00"),
    username: "DataMiner",
    content: "Did someone say anomaly? I might have logs from that timeframe.",
    type: "message",
  },
  {
    id: "5",
    timestamp: new Date("2003-09-15T02:19:00"),
    username: "SYSTEM",
    content: "Network latency detected. Some messages may be delayed.",
    type: "system",
  },
  {
    id: "6",
    timestamp: new Date("2003-09-15T02:20:00"),
    username: "CipherY",
    content:
      "Check sector 7-G. The frequency pattern matches nothing in our database.",
    type: "message",
  },
  {
    id: "7",
    timestamp: new Date("2003-09-15T02:21:00"),
    username: "GhostInShell",
    content: "",
    type: "leave",
  },
  {
    id: "8",
    timestamp: new Date("2003-09-15T02:22:00"),
    username: "NightOwl45",
    content: "Could be related to the encrypted broadcasts from last month.",
    type: "message",
  },
  {
    id: "9",
    timestamp: new Date("2003-09-15T02:23:00"),
    username: "Lord_of_Life_",
    content: "",
    oldNick: "Lord_of_Life",
    type: "nick",
  },
  {
    id: "10",
    timestamp: new Date("2003-09-15T02:24:00"),
    username: "DataMiner",
    content: "pulls up the frequency analysis",
    type: "action",
  },
];

export default function HomeContent() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [activeChannelId, setActiveChannelId] = useState("1");
  const [users] = useState<User[]>(mockUsers);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [showChannels, setShowChannels] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  // Handle keyboard show/hide for iOS
  useEffect(() => {
    let showListener:
      | Promise<import("@capacitor/core").PluginListenerHandle>
      | undefined;
    let hideListener:
      | Promise<import("@capacitor/core").PluginListenerHandle>
      | undefined;

    const setupKeyboardListeners = async () => {
      try {
        showListener = Keyboard.addListener("keyboardWillShow", (info) => {
          setKeyboardHeight(info.keyboardHeight);
        });
        hideListener = Keyboard.addListener("keyboardWillHide", () => {
          setKeyboardHeight(0);
        });
      } catch {
        // Keyboard plugin not available (web)
      }
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
  }, [messages]);

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [keyboardHeight]);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      timestamp: new Date(),
      username: "You",
      content,
      type: "message",
    };
    setMessages((prev) => [...prev, newMessage]);
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
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={handleSendMessage}
            channelName={activeChannel?.name || "lobby"}
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
