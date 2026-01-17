import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  channelName: string;
}

export function ChatInput({ onSendMessage, channelName }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed) {
      onSendMessage(trimmed);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-1 px-1 py-1 bg-irc-bg border-t border-irc-border safe-area-bottom">
      <span className="text-irc-cyan shrink-0">[#{channelName}]</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder=""
        className="flex-1 bg-transparent text-irc-white outline-none placeholder:text-irc-timestamp text-base"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  );
}
