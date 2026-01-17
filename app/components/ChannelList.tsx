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
        {channels.map((channel) => {
          const isActive = activeChannelId === channel.id;
          return (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className={`w-full text-left px-1 py-0 leading-snug hover:bg-irc-sidebar-bg ${
                isActive ? "text-irc-bright-white" : ""
              }`}
            >
              <span className="text-irc-timestamp">
                {isActive ? ">>" : "  "}
              </span>{" "}
              <span
                className={isActive ? "text-irc-bright-white" : "text-irc-cyan"}
              >
                #{channel.name}
              </span>
              {channel.unreadCount > 0 && (
                <span className="text-irc-highlight ml-1">
                  {channel.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
