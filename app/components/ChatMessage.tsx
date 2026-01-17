export interface Message {
  id: string;
  timestamp: Date;
  username: string;
  content: string;
  type: "message" | "join" | "leave" | "system";
}

const usernameColors = [
  "text-irc-username-1",
  "text-irc-username-2",
  "text-irc-username-3",
  "text-irc-username-4",
  "text-irc-username-5",
  "text-irc-username-6",
];

function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return usernameColors[Math.abs(hash) % usernameColors.length];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const timeStr = formatTime(message.timestamp);

  if (message.type === "join") {
    return (
      <div className="py-0.5 px-2">
        <span className="text-irc-timestamp">[{timeStr}]</span>{" "}
        <span className="text-irc-join">
          --&gt; {message.username} has joined the channel
        </span>
      </div>
    );
  }

  if (message.type === "leave") {
    return (
      <div className="py-0.5 px-2">
        <span className="text-irc-timestamp">[{timeStr}]</span>{" "}
        <span className="text-irc-leave">
          &lt;-- {message.username} has left the channel
        </span>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="py-0.5 px-2">
        <span className="text-irc-timestamp">[{timeStr}]</span>{" "}
        <span className="text-irc-system">* {message.content}</span>
      </div>
    );
  }

  const usernameColor = getUsernameColor(message.username);

  return (
    <div className="py-0.5 px-2 hover:bg-irc-sidebar-bg">
      <span className="text-irc-timestamp">[{timeStr}]</span>{" "}
      <span className={usernameColor}>&lt;{message.username}&gt;</span>{" "}
      <span>{message.content}</span>
    </div>
  );
}
