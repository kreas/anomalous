"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage, Message } from "@/app/components/ChatMessage";
import { ChannelList, Channel } from "@/app/components/ChannelList";
import { UserList, User } from "@/app/components/UserList";
import { ChatInput } from "@/app/components/ChatInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Users } from "lucide-react";

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
    content:
      "Test... could be related to the encrypted broadcasts from last month.",
    type: "message",
  },
];

export default function HomeContent() {
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
          role="button"
          tabIndex={0}
          aria-label="Close channels sidebar"
          onKeyDown={(e) => e.key === "Escape" && setShowChannels(false)}
        />
      )}

      {/* Mobile overlay for users */}
      {showUsers && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowUsers(false)}
          role="button"
          tabIndex={0}
          aria-label="Close users sidebar"
          onKeyDown={(e) => e.key === "Escape" && setShowUsers(false)}
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
        <header className="flex items-center justify-between px-4 py-3 bg-irc-sidebar-bg border-b border-irc-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChannels(true)}
              className="lg:hidden text-irc-timestamp hover:text-foreground"
              aria-label="Open channels"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-primary font-bold">
              #{activeChannel?.name || "lobby"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUsers(true)}
            className="lg:hidden text-irc-timestamp hover:text-foreground"
            aria-label="Open users list"
          >
            <Users className="h-5 w-5" />
          </Button>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-background">
          <div className="py-2">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

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
