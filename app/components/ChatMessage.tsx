export interface Message {
  id: string;
  timestamp: Date;
  username: string;
  content: string;
  type: "message" | "join" | "leave" | "system" | "action" | "nick";
  oldNick?: string;
}

const usernameColors = [
  "text-irc-cyan",
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

// Fixed width for username column to align messages like WeeChat
const USERNAME_WIDTH = "w-24";

export function ChatMessage({ message }: ChatMessageProps) {
  const timeStr = formatTime(message.timestamp);

  if (message.type === "join") {
    return (
      <div className="flex leading-snug">
        <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
        <span
          className={`${USERNAME_WIDTH} text-right shrink-0 px-1 text-irc-green`}
        >
          --&gt;
        </span>
        <span className="text-irc-green">
          {message.username} has joined the channel
        </span>
      </div>
    );
  }

  if (message.type === "leave") {
    return (
      <div className="flex leading-snug">
        <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
        <span
          className={`${USERNAME_WIDTH} text-right shrink-0 px-1 text-irc-red`}
        >
          &lt;--
        </span>
        <span className="text-irc-red">
          {message.username} has left the channel
        </span>
      </div>
    );
  }

  if (message.type === "nick") {
    return (
      <div className="flex leading-snug">
        <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
        <span
          className={`${USERNAME_WIDTH} text-right shrink-0 px-1 text-irc-magenta`}
        >
          --
        </span>
        <span className="text-irc-magenta">
          {message.oldNick} is now known as {message.username}
        </span>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="flex leading-snug">
        <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
        <span
          className={`${USERNAME_WIDTH} text-right shrink-0 px-1 text-irc-timestamp`}
        >
          --
        </span>
        <span className="text-irc-timestamp">{message.content}</span>
      </div>
    );
  }

  if (message.type === "action") {
    const usernameColor = getUsernameColor(message.username);
    return (
      <div className="flex leading-snug">
        <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
        <span
          className={`${USERNAME_WIDTH} text-right shrink-0 px-1 text-irc-magenta`}
        >
          *
        </span>
        <span>
          <span className={usernameColor}>{message.username}</span>
          <span className="text-irc-white"> {message.content}</span>
        </span>
      </div>
    );
  }

  // Regular message
  const usernameColor = getUsernameColor(message.username);

  return (
    <div className="flex leading-snug hover:bg-irc-sidebar-bg">
      <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
      <span
        className={`${USERNAME_WIDTH} text-right shrink-0 px-1 ${usernameColor} truncate`}
      >
        {message.username}
      </span>
      <span className="text-irc-white break-words min-w-0">
        {message.content}
      </span>
    </div>
  );
}
