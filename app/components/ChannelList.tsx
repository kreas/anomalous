import type { Channel, QueryWindow } from "@/types";

export interface ChannelListItem {
  id: string;
  name: string;
  unreadCount: number;
  locked?: boolean;
  hidden?: boolean;
  isQuery?: boolean;
  targetUsername?: string;
}

interface ChannelListProps {
  channels: ChannelListItem[];
  queryWindows?: ChannelListItem[];
  activeChannelId: string;
  onChannelSelect: (channelId: string) => void;
  onLockedChannelClick?: (channelId: string) => void;
  onClose?: () => void;
}

/**
 * Convert Channel type to ChannelListItem
 */
export function channelToListItem(channel: Channel): ChannelListItem {
  return {
    id: channel.id,
    name: channel.name,
    unreadCount: channel.unreadCount,
    locked: channel.locked,
    hidden: channel.hidden,
    isQuery: false,
  };
}

/**
 * Convert QueryWindow type to ChannelListItem
 */
export function queryWindowToListItem(query: QueryWindow): ChannelListItem {
  return {
    id: query.id,
    name: query.targetUsername,
    unreadCount: query.unreadCount,
    locked: false,
    hidden: false,
    isQuery: true,
    targetUsername: query.targetUsername,
  };
}

export function ChannelList({
  channels,
  queryWindows = [],
  activeChannelId,
  onChannelSelect,
  onLockedChannelClick,
  onClose,
}: ChannelListProps) {
  // Filter out hidden channels
  const visibleChannels = channels.filter((c) => !c.hidden);

  const handleChannelClick = (channel: ChannelListItem) => {
    if (channel.locked) {
      onLockedChannelClick?.(channel.id);
    } else {
      onChannelSelect(channel.id);
    }
  };

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

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Regular channels */}
        {visibleChannels.map((channel) => {
          const isActive = activeChannelId === channel.id;
          const isLocked = channel.locked;

          return (
            <button
              key={channel.id}
              onClick={() => handleChannelClick(channel)}
              className={`w-full text-left px-1 py-0 leading-snug hover:bg-irc-sidebar-bg ${
                isActive ? "text-irc-bright-white" : ""
              } ${isLocked ? "opacity-50" : ""}`}
            >
              <span className="text-irc-timestamp">
                {isActive ? ">>" : "  "}
              </span>{" "}
              {isLocked && (
                <span className="text-irc-timestamp">[locked] </span>
              )}
              <span
                className={
                  isActive
                    ? "text-irc-bright-white"
                    : isLocked
                      ? "text-irc-timestamp"
                      : "text-irc-cyan"
                }
              >
                #{channel.name}
              </span>
              {channel.unreadCount > 0 && !isLocked && (
                <span className="text-irc-highlight ml-1">
                  {channel.unreadCount}
                </span>
              )}
            </button>
          );
        })}

        {/* Divider if there are query windows */}
        {queryWindows.length > 0 && (
          <div className="border-t border-irc-border my-1 mx-1" />
        )}

        {/* Query windows (private messages) */}
        {queryWindows.map((query) => {
          const isActive = activeChannelId === query.id;

          return (
            <button
              key={query.id}
              onClick={() => onChannelSelect(query.id)}
              className={`w-full text-left px-1 py-0 leading-snug hover:bg-irc-sidebar-bg ${
                isActive ? "text-irc-bright-white" : ""
              }`}
            >
              <span className="text-irc-timestamp">
                {isActive ? ">>" : "  "}
              </span>{" "}
              <span
                className={
                  isActive ? "text-irc-bright-white" : "text-irc-magenta"
                }
              >
                [{query.name}]
              </span>
              {query.unreadCount > 0 && (
                <span className="text-irc-highlight ml-1">
                  {query.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Re-export for backwards compatibility
export type { Channel };
