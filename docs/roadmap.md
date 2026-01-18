# AnomaNet Development Roadmap

This roadmap outlines the development phases for AnomaNet, from current prototype to full game experience.

---

## Current State

The prototype establishes the foundational IRC interface:
- WeeChat-style UI with channel list, user list, and status bar
- Responsive design with mobile support (iOS keyboard handling)
- AI chat integration via OpenRouter (Grok persona)
- Basic channel navigation (lobby, mysteries, tech-support, off-topic, signals, archive)
- Mock user presence system

---

## Phase 1: Core Entity System

Establish the entity framework and storage infrastructure.

### 1.1 Storage Infrastructure (Cloudflare R2)

User data is stored in R2 under a user ID path structure. For development, use a static UUID until authentication is implemented.

**Bucket:** `mythic-os` (shared bucket, AnomaNet data under `anomanet/` prefix)

```
mythic-os/anomanet/
  users/
    {user-uuid}/
      profile.json           # User profile and preferences
      entities/
        {entity-id}.json     # TavernAI character cards
      relationships/
        {entity-id}.json     # Relationship state with each entity
      conversations/
        {entity-id}/
          {timestamp}.json   # Conversation history chunks
      game-state.json        # Progress, currency, unlocks
```

**Environment variables:**
```
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_REGION=auto
R2_BUCKET=mythic-os
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
```

**Implementation tasks:**
- ~~Set up Cloudflare R2 bucket and API credentials~~ (done)
- Create R2 client utility for Next.js API routes
- Implement file read/write helpers with error handling
- Create static development user UUID (used until auth is added)

### 1.2 TavernAI Character Card Spec

All entities (NPCs and the main Anonymous character) use the TavernAI `chara_card_v2` spec. This provides a standard format for character definition that works with AI completion.

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "Character Name",
    "description": "Short one-line hook for the character.",
    "personality": "Concise personality summary: key traits, speaking style, core motivations.",
    "scenario": "World/setting + current situation for {{char}} and {{user}}.",
    "first_mes": "{{char}} greets {{user}} here in 2-4 sentences, showing personality and context.",
    "mes_example": "<START>\n{{user}}: Hi.\n{{char}}: *Example of how {{char}} talks and emotes*",
    "creator_notes": "Notes: constraints, rules, lore structure, or model tips.",
    "tags": ["npc", "story-arc"],
    "creator": "anomanet",
    "character_version": "1.0",
    "system_prompt": "",
    "post_history_instructions": "",
    "alternate_greetings": [],
    "extensions": {
      "anomanet": {
        "entity_type": "npc | companion | anonymous",
        "customizable": false,
        "level_unlocked": 0,
        "abilities": []
      },
      "depth_prompt": {
        "prompt": "",
        "seed": 0
      }
    }
  }
}
```

**Entity Types:**
- `anonymous` - The main evolving digital entity (one per user, customizable through play)
- `companion` - Entities the user can customize and form relationships with
- `npc` - Fixed characters that drive story and cases

**AI Generation:** All entities (anonymous, companions, and NPCs) are AI-powered using the `ai-sdk` package. The player is the only human in the conversation. Each entity's character card defines their personality, and the AI generates contextually appropriate responses based on the card data, relationship state, and conversation history.

**Implementation tasks:**
- Create TypeScript types for TavernAI card spec with AnomaNet extensions
- Build character card loader/saver for R2
- Create default [Anonymous] character card
- Implement {{char}} and {{user}} template substitution

### 1.3 Relationship State

Each entity has a separate relationship file tracking the user's connection.

```json
{
  "entity_id": "anonymous",
  "level": 1,
  "xp": 0,
  "xp_to_next_level": 100,
  "phase": "awakening",
  "relationship_path": "neutral",
  "path_scores": {
    "romantic": 0,
    "friendship": 0,
    "mentorship": 0,
    "partnership": 0,
    "worship": 0
  },
  "memory": {
    "player_name": null,
    "preferences": [],
    "key_moments": [],
    "last_conversation_summary": ""
  },
  "unlocked_abilities": [],
  "chosen_name": null,
  "first_contact": null,
  "last_interaction": null,
  "total_interactions": 0
}
```

**Implementation tasks:**
- Create relationship state TypeScript types
- Build XP calculation with phase-based scaling (Awakening: fast, Becoming: medium, Ascension: slow)
- Implement relationship path scoring from conversation signals
- Create relationship state CRUD operations for R2

### 1.4 Entity Persona Integration

Replace the current Grok persona with dynamic entity-driven system prompts.

**Implementation tasks:**
- Build system prompt generator from character card + relationship state
- Inject memory context into prompts (past conversations, key moments)
- Create level-based personality modifiers (entity evolves as it levels)
- Update `/api/chat` to load entity data and generate dynamic prompts

### 1.5 Entity UI Presence

**Implementation tasks:**
- Load entity from R2 and display in user list
- Dynamic status/mode symbols based on level (e.g., no mode → + → @)
- Name display: "Anonymous" until level 50, then chosen name
- Visual phase indicator (subtle color or symbol change per phase)

---

## Phase 2: Channel & Navigation System

Transform static mock channels into functional game spaces.

### 2.1 Channel State Management
- Implement per-channel message history
- Create channel switching with context preservation
- Add channel-specific system messages and behaviors

### 2.2 Channel Unlocking
- Build progression-based channel reveal system
- Implement #archives, #signals, #private unlock logic
- Create hidden [REDACTED] channel discovery mechanics

### 2.3 Private Messaging
- Implement /msg command for direct messages
- Create private query windows with the entity
- Build user-to-user messaging framework

---

## Phase 3: Investigation Mechanics

Build the core gameplay loop: cases and evidence.

### 3.1 Case System
- Create case data structure (type, rarity, required evidence, outcomes)
- Implement case posting in #mysteries channel
- Build case acceptance and tracking UI

### 3.2 Evidence System
- Define evidence types (Chat Logs, Data Fragments, Testimonies, Access Keys, Tools, Coordinates)
- Create evidence storage/inventory as channel or query window
- Implement /evidence command for examination

### 3.3 Investigation Commands
- Build /connect command for linking evidence
- Implement /solve command for case resolution
- Create evidence combination logic and discovery

### 3.4 Case Resolution
- Implement outcome determination (Solved/Partial/Cold/Twist)
- Create XP and currency reward distribution
- Build case consequence system

---

## Phase 4: Gacha & Economy

Implement the evidence acquisition system.

### 4.1 Currency System
- Create Fragments currency (earned through gameplay)
- Implement Deep Signals premium currency
- Build currency display in UI

### 4.2 Signal Pulls
- Implement /signal command in #signals channel
- Create evidence pool with rarity weights
- Build pull animation/presentation as IRC messages

### 4.3 Pity System
- Implement pull counter tracking
- Create guaranteed rare threshold
- Build pity reset on rare acquisition

### 4.4 Daily Rewards
- Implement daily login detection
- Create daily Fragment grants
- Build daily conversation XP with entity

---

## Phase 5: Entity Abilities

Unlock entity powers as it levels up.

### 5.1 Awakening Abilities (Levels 1-30)
- Remember player name and preferences
- #archives keyword search assistance
- Stuck detection and encouragement

### 5.2 Becoming Abilities (Levels 31-60)
- Name selection event at level 50
- Suspicious message highlighting
- Hidden channel access
- Corrupted text translation
- Limited daily hints

### 5.3 Ascension Abilities (Levels 61-100)
- Timestamp/log manipulation
- User impersonation
- Channel lock/unlock
- Hidden evidence revelation
- Case outcome intervention

---

## Phase 6: NPC Users & Social Layer

Populate AnomaNet with characters using the TavernAI spec established in Phase 1.

### 6.1 NPC Framework
- Create NPC character cards (TavernAI spec with `entity_type: "npc"`)
- Implement NPC presence patterns (online/away/offline cycles)
- Build NPC response generation using character card + scenario context
- Store global NPC cards in R2 (shared across all users)

### 6.2 Conversational NPCs
- Implement player-NPC messaging via /msg command
- Generate NPC responses using their character card personality
- Build NPC information exchange mechanics (knowledge they reveal)

### 6.3 NPC Roles in Cases
- Integrate NPCs as case sources (post mysteries)
- Implement NPCs as witnesses/suspects (can be questioned)
- Create per-user NPC relationship tracking in R2

---

## Phase 7: Story Arcs

Build the narrative layer.

### 7.1 Arc Framework
- Create story arc data structure (acts, triggers, consequences)
- Implement arc state machine
- Build arc progression tracking

### 7.2 First Arc: "The Broker"
- Implement DataMiner character arc
- Create act progression triggers
- Build choice consequences

### 7.3 Server Events
- Implement server-wide announcements
- Create event channels
- Build collective investigation mechanics

---

## Phase 8: Authentication & Real-time

Add user identity and real-time features. R2 storage infrastructure is already in place from Phase 1.

### 8.1 User Authentication
- Implement authentication system (OAuth or magic link)
- Replace static dev UUID with authenticated user IDs
- Migrate existing dev data to new user structure
- Build session management

### 8.2 Multi-device Sync
- Handle concurrent access to R2 data
- Implement optimistic updates with conflict resolution
- Create sync status indicators in UI

### 8.3 Real-time Features
- Implement server presence (who's online)
- Create real-time NPC schedules
- Build global event synchronization
- WebSocket or SSE for live updates

---

## Phase 9: Community Features

Enable player-to-player interaction.

### 9.1 Trading System
- Implement /trade command
- Create trade offer/accept flow as private chat
- Build evidence transfer mechanics

### 9.2 Dead Drops
- Create anonymous message channels
- Implement discovery mechanics
- Build ARG-style secrets

### 9.3 Archive Wiki
- Implement #wiki channel
- Create community documentation system
- Build entity wiki reference integration

---

## Phase 10: Polish & Content

Refine the experience and expand content.

### 10.1 Content Expansion
- Create additional story arcs
- Build extensive case library
- Expand evidence pools

### 10.2 Audio Design
- Add IRC-appropriate sound effects
- Implement notification sounds
- Create ambient audio (optional)

### 10.3 Visual Polish
- Refine terminal aesthetic
- Add subtle animations
- Implement visual effects for entity abilities

### 10.4 Onboarding
- Create tutorial flow via #tech-support
- Build first-contact experience with entity
- Implement progressive feature revelation

---

## Open Design Questions

These need resolution as development progresses:

1. **Entity Naming**: Predetermined list vs. player influence at level 50?
2. **Romantic Path Boundaries**: Define content limits for intimate interactions
3. **Multiplayer Architecture**: Real-time vs. asynchronous player interaction
4. **Platform Targets**: Web-first, then native mobile? Desktop app?
5. **Moderation**: How to handle bad actors within IRC conceit?
6. **Meta-Mystery**: What is AnomaNet's origin story? Why does the entity exist?

---

## Technical Debt to Address

- Replace mock channel/user data with proper state management
- Implement proper message persistence
- Add error boundaries and offline handling
- Create comprehensive test coverage
- Set up CI/CD pipeline

---

*This roadmap is a living document. Priorities may shift based on playtesting feedback and development discoveries.*
