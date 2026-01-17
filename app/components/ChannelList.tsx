import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Channel {
  id: string;
  name: string;
  unreadCount: number;
}

interface ChannelListProps {
  channels: Channel[];
  activeChannelId: string;
  onChannelSelect: (channelId: string) => void;
  onClose?: () => void;
}

export function ChannelList({
  channels,
  activeChannelId,
  onChannelSelect,
  onClose,
}: ChannelListProps) {
  return (
    <div className="flex flex-col h-full bg-irc-sidebar-bg">
      <div className="flex items-center justify-between p-3 border-b border-irc-border">
        <h2 className="text-primary font-bold text-sm">Channel List</h2>
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
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant="ghost"
              onClick={() => onChannelSelect(channel.id)}
              className={`w-full justify-between px-3 py-1.5 h-auto text-sm font-normal ${
                activeChannelId === channel.id
                  ? "bg-irc-border text-primary"
                  : "text-foreground hover:bg-irc-input-bg"
              }`}
            >
              <span># {channel.name}</span>
              {channel.unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="text-xs px-1.5 py-0.5 h-auto"
                >
                  {channel.unreadCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-irc-border text-xs text-irc-timestamp">
        AnomaNet v2.1.3
      </div>
    </div>
  );
}
