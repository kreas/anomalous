"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, Message } from "@/app/components/ChatMessage";
import { ChannelList, Channel } from "@/app/components/ChannelList";
import { UserList, User } from "@/app/components/UserList";
import { ChatInput } from "@/app/components/ChatInput";

// Mock data
const mockChannels: Channel[] = [
  { id: "1", name: "lobby", unreadCount: 0 },
  { id: "2", name: "mysteries", unreadCount: 3 },
  { id: "3", name: "tech-support", unreadCount: 0 },
  { id: "4", name: "off-topic", unreadCount: 1 },
];

const mockUsers: User[] = [
  { id: "1", username: "CipherY", status: "online" },
  { id: "2", username: "NightOwl44", status: "online" },
  { id: "3", username: "DataMiner", status: "online" },
  { id: "4", username: "GhostInShell", status: "away" },
  { id: "5", username: "ByteRunner", status: "away" },
  { id: "6", username: "ShadowNet", status: "offline" },
];

const mockMessages: Message[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 3600000),
    username: "CipherX",
    content: "Anyone here know about the signal anomaly from last night?",
    type: "message",
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 3500000),
    username: "NightOwl42",
    content: "Yeah, I caught some weird packets around 3 AM. Still analyzing.",
    type: "message",
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 3400000),
    username: "DataMiner",
    content: "",
    type: "join",
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 3300000),
    username: "DataMiner",
    content: "Did someone say anomaly? I might have logs from that timeframe.",
    type: "message",
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 3200000),
    username: "SYSTEM",
    content: "Network latency detected. Some messages may be delayed.",
    type: "system",
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 3100000),
    username: "CipherY",
    content:
      "Check sector 7-G. The frequency pattern matches nothing in our database.",
    type: "message",
  },
  {
    id: "7",
    timestamp: new Date(Date.now() - 3000000),
    username: "GhostInShell",
    content: "",
    type: "leave",
  },
  {
    id: "8",
    timestamp: new Date(Date.now() - 2900000),
    username: "NightOwl45",
    content:
      "Interesting... could be related to the encrypted broadcasts from last month.",
    type: "message",
  },
];

export default function Home() {
  const [channels] = useState<Channel[]>(mockChannels);
  const [activeChannelId, setActiveChannelId] = useState("1");
  const [users] = useState<User[]>(mockUsers);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [showChannels, setShowChannels] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  return (
    <div className="flex h-screen w-screen overflow-hidden safe-area-top">
      {/* Mobile overlay for channels */}
      {showChannels && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowChannels(false)}
        />
      )}

      {/* Mobile overlay for users */}
      {showUsers && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowUsers(false)}
        />
      )}

      {/* Channel sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-50 w-56 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          showChannels ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[var(--sidebar-bg)] border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChannels(true)}
              className="lg:hidden text-[var(--timestamp)] hover:text-[var(--foreground)]"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h1 className="text-[var(--accent)] font-bold">
              #{activeChannel?.name || "lobby"}
            </h1>
          </div>
          <button
            onClick={() => setShowUsers(true)}
            className="lg:hidden text-[var(--timestamp)] hover:text-[var(--foreground)]"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto bg-[var(--background)]">
          <div className="py-2">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          channelName={activeChannel?.name || "lobby"}
        />
      </main>

      {/* User sidebar */}
      <aside
        className={`fixed lg:relative inset-y-0 right-0 z-50 w-48 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          showUsers ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <UserList users={users} onClose={() => setShowUsers(false)} />
      </aside>
    </div>
  );
}
