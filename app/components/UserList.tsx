export interface User {
  id: string
  username: string
  status: 'online' | 'away' | 'offline'
}

interface UserListProps {
  users: User[]
  onClose?: () => void
}

const statusColors = {
  online: 'bg-[var(--join)]',
  away: 'bg-[var(--username-3)]',
  offline: 'bg-[var(--timestamp)]',
}

export function UserList({ users, onClose }: UserListProps) {
  const onlineUsers = users.filter((u) => u.status === 'online')
  const awayUsers = users.filter((u) => u.status === 'away')
  const offlineUsers = users.filter((u) => u.status === 'offline')

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)]">
      <div className="flex items-center justify-between p-3 border-b border-[var(--border-color)]">
        <h2 className="text-[var(--accent)] font-bold text-sm">
          USERS ({users.length})
        </h2>
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
        {onlineUsers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-[var(--timestamp)] px-2 mb-1">
              Online — {onlineUsers.length}
            </div>
            {onlineUsers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </div>
        )}
        {awayUsers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-[var(--timestamp)] px-2 mb-1">
              Away — {awayUsers.length}
            </div>
            {awayUsers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </div>
        )}
        {offlineUsers.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-[var(--timestamp)] px-2 mb-1">
              Offline — {offlineUsers.length}
            </div>
            {offlineUsers.map((user) => (
              <UserItem key={user.id} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UserItem({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--input-bg)] cursor-pointer text-sm">
      <span
        className={`w-2 h-2 rounded-full ${statusColors[user.status]}`}
      />
      <span
        className={
          user.status === 'offline' ? 'text-[var(--timestamp)]' : ''
        }
      >
        {user.username}
      </span>
    </div>
  )
}
