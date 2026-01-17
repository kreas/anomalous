import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-2 p-3 bg-irc-input-bg border-t border-irc-border safe-area-bottom">
      <span className="text-irc-timestamp text-sm hidden sm:inline">
        [{channelName}]
      </span>
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 bg-transparent border-irc-border focus-visible:ring-ring placeholder:text-irc-timestamp"
      />
      <Button onClick={handleSend} disabled={!input.trim()} size="sm">
        Send
      </Button>
    </div>
  );
}
