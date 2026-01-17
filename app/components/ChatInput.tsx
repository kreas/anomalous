import { useState, KeyboardEvent } from 'react'

interface ChatInputProps {
  onSendMessage: (content: string) => void
  channelName: string
}

export function ChatInput({ onSendMessage, channelName }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSend = () => {
    const trimmed = input.trim()
    if (trimmed) {
      onSendMessage(trimmed)
      setInput('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--input-bg)] border-t border-[var(--border-color)] safe-area-bottom">
      <span className="text-[var(--timestamp)] text-sm hidden sm:inline">
        [{channelName}]
      </span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="flex-1 bg-transparent border border-[var(--border-color)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--timestamp)]"
      />
      <button
        onClick={handleSend}
        disabled={!input.trim()}
        className="px-4 py-2 bg-[var(--accent)] text-[var(--background)] rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        Send
      </button>
    </div>
  )
}
