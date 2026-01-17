export interface Channel {
  id: string
  name: string
  unreadCount: number
}

interface ChannelListProps {
  channels: Channel[]
  activeChannelId: string
  onChannelSelect: (channelId: string) => void
  onClose?: () => void
}

export function ChannelList({
  channels,
  activeChannelId,
  onChannelSelect,
  onClose,
}: ChannelListProps) {
  return (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)]">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
        <h2 className="text-[var(--accent)] font-bold text-sm">CHANNELS</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--timestamp)] hover:text-[var(--foreground)]"
          >
            ✕
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => onChannelSelect(channel.id)}
            className={`w-full text-left px-3 py-1.5 rounded text-sm flex items-center justify-between ${
              activeChannelId === channel.id
                ? 'bg-[var(--border-color)] text-[var(--accent)]'
                : 'hover:bg-[var(--input-bg)] text-[var(--foreground)]'
            }`}
          >
            <span># {channel.name}</span>
            {channel.unreadCount > 0 && (
              <span className="bg-[var(--accent-secondary)] text-white text-xs px-1.5 py-0.5 rounded-full">
                {channel.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-[var(--border-color)] text-xs text-[var(--timestamp)]">
        AnomaNet v2.1.3
      </div>
    </div>
  )
}
