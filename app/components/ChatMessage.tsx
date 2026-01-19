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

/**
 * Format a line of system message content with colors
 * Applies IRC-style coloring to special patterns
 */
function formatSystemLine(line: string): React.ReactNode {
  // Empty line
  if (!line.trim()) {
    return "\u00A0";
  }

  // Headers like "=== Title ===" or "--- HEADER ---"
  if (/^[=\-]{3,}\s*.+\s*[=\-]{3,}$/.test(line)) {
    return <span className="text-irc-cyan font-bold">{line}</span>;
  }

  // Section headers ending with colon
  if (
    /^(Evidence Required|Required evidence|Rewards|Missing|Status|Type|Briefing):/.test(
      line,
    )
  ) {
    const [label, ...rest] = line.split(":");
    return (
      <>
        <span className="text-irc-yellow">{label}:</span>
        <span className="text-irc-white">{rest.join(":")}</span>
      </>
    );
  }

  // Rarity tags like [COMMON], [UNCOMMON], [RARE], [LEGENDARY]
  const rarityMatch = line.match(/\[(COMMON|UNCOMMON|RARE|LEGENDARY)\]/);
  if (rarityMatch) {
    const rarityColors: Record<string, string> = {
      COMMON: "text-irc-white",
      UNCOMMON: "text-irc-green",
      RARE: "text-irc-cyan",
      LEGENDARY: "text-irc-yellow",
    };
    const rarity = rarityMatch[1];
    const color = rarityColors[rarity] || "text-irc-white";
    const parts = line.split(rarityMatch[0]);
    return (
      <>
        {parts[0]}
        <span className={`${color} font-bold`}>[{rarity}]</span>
        <span className="text-irc-bright-white">{parts[1]}</span>
      </>
    );
  }

  // Status tags like [IN_PROGRESS], [ACCEPTED], [SOLVED]
  const statusMatch = line.match(
    /\[(IN_PROGRESS|ACCEPTED|SOLVED|PARTIAL|COLD|AVAILABLE)\]/,
  );
  if (statusMatch) {
    const statusColors: Record<string, string> = {
      IN_PROGRESS: "text-irc-yellow",
      ACCEPTED: "text-irc-green",
      SOLVED: "text-irc-cyan",
      PARTIAL: "text-irc-yellow",
      COLD: "text-irc-red",
      AVAILABLE: "text-irc-white",
    };
    const status = statusMatch[1];
    const color = statusColors[status] || "text-irc-white";
    const parts = line.split(statusMatch[0]);
    return (
      <>
        {parts[0]}
        <span className={color}>[{status}]</span>
        <span className="text-irc-white">{parts[1]}</span>
      </>
    );
  }

  // Reward lines (contain "Fragments" or "XP")
  if (/\d+\s*(Fragments|XP|Entity XP)/i.test(line)) {
    return <span className="text-irc-green">{line}</span>;
  }

  // Commands like /accept, /evidence, /solve
  if (/\/[a-z]+/.test(line)) {
    const parts = line.split(/(\/[a-z]+\s*[a-z0-9-]*)/gi);
    return (
      <>
        {parts.map((part, i) =>
          /^\/[a-z]+/i.test(part) ? (
            <span key={i} className="text-irc-cyan">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    );
  }

  // List items starting with dash or bullet
  if (/^\s*[-•]\s/.test(line)) {
    return <span className="text-irc-white">{line}</span>;
  }

  // Numbered list items
  if (/^\s*\d+\.\s/.test(line)) {
    const match = line.match(/^(\s*\d+\.)\s(.*)$/);
    if (match) {
      return (
        <>
          <span className="text-irc-yellow">{match[1]}</span>
          <span className="text-irc-white"> {match[2]}</span>
        </>
      );
    }
  }

  // Evidence/case IDs (patterns like "chat-xxx", "case-xxx", "data-xxx")
  if (/\b(chat|case|data|test|key|coords|tutorial)-[a-z0-9-]+\b/i.test(line)) {
    const parts = line.split(
      /(\b(?:chat|case|data|test|key|coords|tutorial)-[a-z0-9-]+\b)/gi,
    );
    return (
      <>
        {parts.map((part, i) =>
          /^(chat|case|data|test|key|coords|tutorial)-/i.test(part) ? (
            <span key={i} className="text-irc-magenta">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
      </>
    );
  }

  // Default
  return line;
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
    // Split content by newlines to render multi-line system messages properly
    const lines = message.content.split("\n");

    return (
      <div className="leading-snug">
        {lines.map((line, index) => (
          <div key={index} className="flex">
            <span className="text-irc-timestamp shrink-0">[{timeStr}]</span>
            <span
              className={`${USERNAME_WIDTH} text-right shrink-0 px-1 text-irc-timestamp`}
            >
              --
            </span>
            <span className="whitespace-pre-wrap break-words min-w-0">
              {formatSystemLine(line)}
            </span>
          </div>
        ))}
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
        &lt;{message.username}&gt;
      </span>
      <span className="text-irc-white break-words min-w-0">
        {message.content}
      </span>
    </div>
  );
}
