import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface User {
  id: string;
  username: string;
  status: "online" | "away" | "offline";
}

interface UserListProps {
  users: User[];
  onClose?: () => void;
}

const statusColors = {
  online: "bg-irc-join",
  away: "bg-irc-username-3",
  offline: "bg-irc-timestamp",
};

export function UserList({ users, onClose }: UserListProps) {
  const onlineUsers = users.filter((u) => u.status === "online");
  const awayUsers = users.filter((u) => u.status === "away");
  const offlineUsers = users.filter((u) => u.status === "offline");

  return (
    <div className="flex flex-col h-full bg-irc-sidebar-bg">
      <div className="flex items-center justify-between p-3 border-b border-irc-border">
        <h2 className="text-primary font-bold text-sm">
          USERS ({users.length})
        </h2>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden h-6 w-6 text-irc-timestamp hover:text-foreground"
          >
            ✕
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {onlineUsers.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-irc-timestamp px-2 mb-1">
                Online — {onlineUsers.length}
              </div>
              {onlineUsers.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </div>
          )}
          {awayUsers.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-irc-timestamp px-2 mb-1">
                Away — {awayUsers.length}
              </div>
              {awayUsers.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </div>
          )}
          {offlineUsers.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-irc-timestamp px-2 mb-1">
                Offline — {offlineUsers.length}
              </div>
              {offlineUsers.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function UserItem({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-irc-input-bg cursor-pointer text-sm">
      <span className={`w-2 h-2 rounded-full ${statusColors[user.status]}`} />
      <span className={user.status === "offline" ? "text-irc-timestamp" : ""}>
        {user.username}
      </span>
    </div>
  );
}
