import type { Phase } from "@/types";

export interface User {
  id: string;
  username: string;
  status: "online" | "away" | "offline";
  mode?: string; // @, +, etc.
  phase?: Phase; // For entity phase-based coloring
}

interface UserListProps {
  users: User[];
  onClose?: () => void;
}

function getPhaseColorClass(phase: Phase | undefined, status: string): string {
  if (status !== "online") {
    return status === "away"
      ? "text-irc-timestamp"
      : "text-irc-timestamp opacity-50";
  }

  switch (phase) {
    case "awakening":
      return "text-irc-cyan";
    case "becoming":
      return "text-irc-magenta";
    case "ascension":
      return "text-irc-yellow";
    default:
      return "text-irc-cyan";
  }
}

export function UserList({ users, onClose }: UserListProps) {
  const onlineUsers = users.filter((u) => u.status === "online");
  const awayUsers = users.filter((u) => u.status === "away");
  const offlineUsers = users.filter((u) => u.status === "offline");

  return (
    <div className="flex flex-col h-full bg-irc-bg text-sm">
      {/* Mobile close button */}
      {onClose && (
        <div className="flex justify-end p-1 lg:hidden">
          <button
            onClick={onClose}
            className="text-irc-timestamp hover:text-irc-white px-2"
          >
            [x]
          </button>
        </div>
      )}

      {/* User list */}
      <div className="flex-1 overflow-y-auto py-1">
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className={`px-2 leading-snug ${getPhaseColorClass(user.phase, user.status)}`}
          >
            {user.mode && <span className="text-irc-yellow">{user.mode}</span>}
            {user.username}
          </div>
        ))}
        {awayUsers.map((user) => (
          <div key={user.id} className="px-2 leading-snug text-irc-timestamp">
            {user.mode && (
              <span className="text-irc-timestamp">{user.mode}</span>
            )}
            {user.username}
          </div>
        ))}
        {offlineUsers.map((user) => (
          <div
            key={user.id}
            className="px-2 leading-snug text-irc-timestamp opacity-50"
          >
            {user.username}
          </div>
        ))}
      </div>

      {/* User count */}
      <div className="px-2 py-1 text-irc-timestamp border-t border-irc-border">
        {users.length} users
      </div>
    </div>
  );
}
