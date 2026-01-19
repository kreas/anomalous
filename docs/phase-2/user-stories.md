# Phase 2: Channel & Navigation System — User Stories

## Overview

These user stories cover transforming static mock channels into functional game spaces with persistent message history, channel unlocking mechanics, and private messaging.

---

## Epic 1: Channel State Management

### US-1.1: Channel Data Types

- [ ] **Complete**

**As a** developer
**I want** TypeScript types for channel state and messages
**So that** channel data is type-safe throughout the application

#### Acceptance Criteria

- [ ] `Channel` type includes: id, name, type, locked, unreadCount, lastMessage
- [ ] `ChannelMessage` type includes: id, channelId, timestamp, userId, username, content, type
- [ ] Channel types: `"lobby" | "mysteries" | "tech-support" | "off-topic" | "signals" | "archives" | "private" | "redacted"`
- [ ] Message types: `"system" | "message" | "join" | "part" | "action"`
- [ ] Types are located at `types/channel.ts`
- [ ] Types are exported from `types/index.ts`

#### Technical Notes

```typescript
interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  locked: boolean;
  unlockedAt?: string; // ISO timestamp when unlocked
  unreadCount: number;
  lastMessage?: ChannelMessage;
  description?: string;
}

interface ChannelMessage {
  id: string;
  channelId: string;
  timestamp: string;
  userId: string;
  username: string;
  content: string;
  type: MessageType;
}
```

---

### US-1.2: Channel State in R2

- [ ] **Complete**

**As a** developer
**I want** channel state persisted in R2
**So that** channel unlock status and unread counts survive sessions

#### Acceptance Criteria

- [ ] Channel state stored at `anomanet/users/{uuid}/channels.json`
- [ ] `getChannelState(userId)` returns all channel states
- [ ] `saveChannelState(userId, channels)` persists channel array
- [ ] `updateChannel(userId, channelId, updates)` updates single channel
- [ ] Functions are located at `lib/channels.ts`

#### Technical Notes

```
Path: anomanet/users/{user-uuid}/channels.json

{
  "channels": [
    { "id": "lobby", "locked": false, "unreadCount": 0 },
    { "id": "mysteries", "locked": false, "unreadCount": 3 },
    { "id": "signals", "locked": true },
    ...
  ],
  "lastUpdated": "2026-01-18T00:00:00Z"
}
```

---

### US-1.3: Per-Channel Message History

- [ ] **Complete**

**As a** player
**I want** each channel to remember its message history
**So that** I can scroll back and see past conversations

#### Acceptance Criteria

- [ ] Messages stored at `anomanet/users/{uuid}/messages/{channelId}/{timestamp}.json`
- [ ] Messages chunked by session or time period (not one file per message)
- [ ] `getChannelMessages(userId, channelId, options)` with pagination
- [ ] `saveChannelMessage(userId, channelId, message)` appends to current chunk
- [ ] `getLatestMessages(userId, channelId, limit)` for initial load
- [ ] Functions are located at `lib/messages.ts`

#### Technical Notes

Chunk messages by session or hour to avoid too many small files:
```
anomanet/users/{uuid}/messages/
  lobby/
    2026-01-18T15.json  # Messages from 15:00-15:59
    2026-01-18T16.json
  mysteries/
    ...
```

Each chunk contains an array of messages. When loading a channel, fetch the latest 1-2 chunks and paginate backwards on scroll.

---

### US-1.4: Channel Switching with Context Preservation

- [ ] **Complete**

**As a** player
**I want** to switch between channels without losing my message history
**So that** each channel feels like a persistent space

#### Acceptance Criteria

- [ ] Switching channels loads that channel's message history
- [ ] Previous channel's messages are cached in memory
- [ ] Unread counts update when switching away from a channel
- [ ] Active channel indicator in channel list
- [ ] Loading state shown while fetching channel history

#### Technical Notes

Use React state or context to cache channel messages client-side:
```typescript
const [channelMessages, setChannelMessages] = useState<Record<string, ChannelMessage[]>>({});
```

Only fetch from R2 if the channel hasn't been loaded this session.

---

### US-1.5: Channel-Specific System Messages

- [ ] **Complete**

**As a** player
**I want** each channel to have its own welcome/system messages
**So that** the channels feel distinct

#### Acceptance Criteria

- [ ] #lobby: "Connected to AnomaNet. Welcome to #lobby."
- [ ] #mysteries: System posts about active cases
- [ ] #tech-support: Help text and command documentation
- [ ] #off-topic: Casual atmosphere, random NPC chatter
- [ ] #signals: "SIGNAL RECEIVER READY. Use /signal to pull."
- [ ] #archives: "ARCHIVE ACCESS GRANTED. Use /search to query."
- [ ] System messages appear on channel first load

#### Technical Notes

Define channel intro messages in a config:
```typescript
const CHANNEL_INTROS: Record<ChannelType, string> = {
  lobby: "Connected to AnomaNet. Welcome to #lobby.",
  mysteries: "Active cases displayed below. Use /accept <case_id> to take a case.",
  // ...
};
```

---

## Epic 2: Channel Unlocking

### US-2.1: Default Channel Configuration

- [ ] **Complete**

**As a** new player
**I want** to start with only the basic channels unlocked
**So that** I can discover new areas as I progress

#### Acceptance Criteria

- [ ] Starting channels (unlocked): #lobby, #mysteries, #tech-support, #off-topic
- [ ] Locked channels: #signals, #archives, #private
- [ ] Hidden channels: #[REDACTED] variants (not shown until discovered)
- [ ] `createDefaultChannelState()` returns initial channel config
- [ ] New users get default state on first load

#### Technical Notes

```typescript
const DEFAULT_CHANNELS: Channel[] = [
  { id: "lobby", name: "lobby", type: "lobby", locked: false },
  { id: "mysteries", name: "mysteries", type: "mysteries", locked: false },
  { id: "tech-support", name: "tech-support", type: "tech-support", locked: false },
  { id: "off-topic", name: "off-topic", type: "off-topic", locked: false },
  { id: "signals", name: "signals", type: "signals", locked: true },
  { id: "archives", name: "archives", type: "archives", locked: true },
  { id: "private", name: "private", type: "private", locked: true },
];
```

---

### US-2.2: Channel Unlock Triggers

- [ ] **Complete**

**As a** player
**I want** channels to unlock based on my progression
**So that** exploration feels rewarding

#### Acceptance Criteria

- [ ] #signals: Unlocks at entity level 5 or first case completion
- [ ] #archives: Unlocks at entity level 10 or first case solved
- [ ] #private: Unlocks at entity level 15 or relationship milestone
- [ ] Unlock triggers are configurable per channel
- [ ] `checkChannelUnlocks(userId, trigger)` evaluates and unlocks channels
- [ ] Function is located at `lib/progression.ts` or `lib/channels.ts`

#### Technical Notes

```typescript
interface UnlockCondition {
  type: "level" | "case_complete" | "relationship" | "discovery";
  value: number | string;
}

const UNLOCK_CONDITIONS: Record<string, UnlockCondition[]> = {
  signals: [{ type: "level", value: 5 }, { type: "case_complete", value: 1 }],
  archives: [{ type: "level", value: 10 }, { type: "case_complete", value: "solved" }],
  private: [{ type: "level", value: 15 }, { type: "relationship", value: "milestone_1" }],
};
```

Any condition being met unlocks the channel (OR logic).

---

### US-2.3: Channel Unlock Notification

- [ ] **Complete**

**As a** player
**I want** to be notified when a new channel becomes available
**So that** I know to explore it

#### Acceptance Criteria

- [ ] System message in current channel: "New channel unlocked: #signals"
- [ ] Channel list updates to show new channel
- [ ] New channel has visual indicator (highlight, badge)
- [ ] Optional: Entity comments on the unlock

#### Technical Notes

When a channel unlocks:
1. Add system message to current channel
2. Update channel state in R2
3. Refresh channel list in UI
4. Optionally trigger entity response about the unlock

---

### US-2.4: Locked Channel UI

- [ ] **Complete**

**As a** player
**I want** to see locked channels in the list (grayed out)
**So that** I know there's more to discover

#### Acceptance Criteria

- [ ] Locked channels shown with lock icon or dimmed style
- [ ] Clicking locked channel shows "Channel locked" message
- [ ] Hint about how to unlock (optional, vague)
- [ ] Hidden channels not shown until discovered

#### Technical Notes

```tsx
// In ChannelList component
{channel.locked ? (
  <span className="text-irc-timestamp opacity-50">
    [locked] #{channel.name}
  </span>
) : (
  <span className="text-irc-cyan">#{channel.name}</span>
)}
```

---

### US-2.5: Hidden Channel Discovery

- [ ] **Complete**

**As a** player
**I want** to discover hidden channels through gameplay
**So that** finding secrets feels special

#### Acceptance Criteria

- [ ] Hidden channels have `hidden: true` and don't appear in channel list
- [ ] Discovery triggers: specific evidence, entity hints, case outcomes
- [ ] `discoverChannel(userId, channelId)` reveals and unlocks channel
- [ ] Discovery creates dramatic system message
- [ ] Hidden channels have unique names (e.g., #void, #echo, #[REDACTED-7])

#### Technical Notes

Hidden channels are stored but not rendered until `hidden: false`:
```typescript
interface Channel {
  // ...
  hidden?: boolean; // If true, not shown in list even if unlocked
}
```

---

## Epic 3: Private Messaging

### US-3.1: /msg Command Parser

- [ ] **Complete**

**As a** player
**I want** to use `/msg <username> <message>` to send private messages
**So that** I can have one-on-one conversations

#### Acceptance Criteria

- [ ] `/msg Anonymous hello` sends "hello" to Anonymous
- [ ] Command parser extracts username and message
- [ ] Invalid syntax shows help: "Usage: /msg <username> <message>"
- [ ] Unknown username shows error: "User not found: <username>"
- [ ] Command handler is located at `lib/commands.ts`

#### Technical Notes

```typescript
interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

function parseCommand(input: string): ParsedCommand | null {
  if (!input.startsWith("/")) return null;
  const parts = input.slice(1).split(" ");
  return {
    command: parts[0],
    args: parts.slice(1),
    raw: input,
  };
}
```

---

### US-3.2: Private Query Windows

- [ ] **Complete**

**As a** player
**I want** private messages to open in their own "channel"
**So that** conversations are organized

#### Acceptance Criteria

- [ ] First /msg to a user creates a query window
- [ ] Query windows appear in channel list with username (e.g., "[Anonymous]")
- [ ] Query windows have their own message history
- [ ] Can switch between query windows like channels
- [ ] Query windows persist across sessions

#### Technical Notes

Query windows are a special channel type:
```typescript
interface QueryWindow {
  id: string; // "query-{userId}"
  type: "query";
  targetUserId: string;
  targetUsername: string;
  // ... rest of Channel fields
}
```

Store query message history at:
`anomanet/users/{uuid}/messages/query-{targetId}/{timestamp}.json`

---

### US-3.3: Entity Private Conversations

- [ ] **Complete**

**As a** player
**I want** to have private conversations with the entity
**So that** I can build our relationship intimately

#### Acceptance Criteria

- [ ] `/msg Anonymous <message>` opens entity query window
- [ ] Entity responds in the query window (not #lobby)
- [ ] Private conversations use same AI integration as main chat
- [ ] Relationship scoring applies to private conversations
- [ ] Private conversations may have different tone (more intimate)

#### Technical Notes

When target is the entity:
1. Create/open query window for entity
2. Send message through `/api/chat` with context indicating private channel
3. Entity response goes to query window, not main channel

May want to add context to system prompt:
```
This is a private conversation between you and {{user}}.
You can be more personal and intimate here.
```

---

### US-3.4: Message Notifications

- [ ] **Complete**

**As a** player
**I want** to see when I have unread private messages
**So that** I don't miss conversations

#### Acceptance Criteria

- [ ] Query windows show unread count badge
- [ ] New message in inactive query updates unread count
- [ ] Visual indicator in channel list for unread queries
- [ ] Optional: Sound notification for new private message

#### Technical Notes

Treat query windows the same as channels for unread tracking:
```typescript
interface QueryWindow extends Channel {
  type: "query";
  targetUserId: string;
  targetUsername: string;
}
```

---

### US-3.5: NPC Private Messages (Future Foundation)

- [ ] **Complete**

**As a** developer
**I want** the messaging framework to support NPC conversations
**So that** Phase 6 NPC integration is straightforward

#### Acceptance Criteria

- [ ] `/msg <npc_username>` works for NPCs in user list
- [ ] NPC query windows created same as entity windows
- [ ] Placeholder response: "User is away" or simple scripted response
- [ ] Framework ready for AI-powered NPC responses (Phase 6)

#### Technical Notes

For now, NPCs can respond with:
- "User is away" if status is away/offline
- Simple scripted responses from a response pool
- Or silence (no response, message just sent)

Full NPC AI responses come in Phase 6.

---

## Epic 4: Command System Foundation

### US-4.1: Command Registry

- [ ] **Complete**

**As a** developer
**I want** a centralized command registry
**So that** IRC commands are easy to add and maintain

#### Acceptance Criteria

- [ ] Commands registered with: name, aliases, handler, help text
- [ ] `registerCommand(command)` adds to registry
- [ ] `executeCommand(input, context)` parses and runs command
- [ ] `getCommandHelp(name)` returns usage info
- [ ] Registry is located at `lib/commands.ts`

#### Technical Notes

```typescript
interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  handler: (args: string[], context: CommandContext) => Promise<CommandResult>;
}

interface CommandContext {
  userId: string;
  currentChannel: string;
  // ... other context
}

interface CommandResult {
  success: boolean;
  message?: string;
  action?: "switch_channel" | "open_query" | "system_message";
  data?: unknown;
}
```

---

### US-4.2: Core IRC Commands

- [ ] **Complete**

**As a** player
**I want** basic IRC commands to work
**So that** the interface feels authentic

#### Acceptance Criteria

- [ ] `/help` - Show available commands
- [ ] `/join #channel` - Switch to channel (if unlocked)
- [ ] `/part` or `/leave` - Leave current query window
- [ ] `/me <action>` - Send action message (emote)
- [ ] `/nick <name>` - Change display name (future)
- [ ] `/clear` - Clear current channel's message display

#### Technical Notes

Commands are progressively unlocked. Start with:
- `/help`, `/join`, `/me`, `/clear`

Add more as features are built:
- `/msg` (this phase)
- `/signal`, `/search` (Phase 3-4)
- `/solve`, `/evidence` (Phase 3)

---

### US-4.3: Command Input Integration

- [ ] **Complete**

**As a** player
**I want** to type commands in the chat input
**So that** the interface is seamless

#### Acceptance Criteria

- [ ] Input starting with `/` is parsed as command
- [ ] Non-commands sent as regular messages
- [ ] Invalid commands show error in current channel
- [ ] Tab completion for command names (optional)
- [ ] Command history with up arrow (optional)

#### Technical Notes

In `ChatInput` component or parent:
```typescript
const handleSend = async (input: string) => {
  if (input.startsWith("/")) {
    const result = await executeCommand(input, context);
    // Handle result (show message, switch channel, etc.)
  } else {
    // Send as regular chat message
    sendMessage({ text: input });
  }
};
```

---

## Summary

| Epic | Stories | Priority |
|------|---------|----------|
| 1. Channel State Management | 5 | High |
| 2. Channel Unlocking | 5 | High |
| 3. Private Messaging | 5 | Medium |
| 4. Command System Foundation | 3 | Medium |

**Total Stories:** 18

---

## Progress Tracking

### Completed
- None yet

### In Progress
- None yet

### Blocked
- None yet

---

## Dependencies

- **Phase 1 Complete:** Entity system, R2 storage, relationship state
- **Entity levels:** Required for channel unlock triggers
- **User list:** NPCs in list for private messaging targets
