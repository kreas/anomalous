# Phase 1: Core Entity System — User Stories

## Overview

These user stories cover the foundational entity system, R2 storage infrastructure, and TavernAI character card integration.

---

## Epic 1: Storage Infrastructure

### US-1.1: R2 Bucket Setup

- [x] **Complete**

**As a** developer
**I want** a configured Cloudflare R2 bucket with API credentials
**So that** user data can be persisted between sessions

#### Acceptance Criteria

- [x] R2 bucket exists in Cloudflare account
- [x] API credentials are stored in environment variables
- [x] `.env.example` documents required R2 environment variables
- [ ] Bucket has appropriate CORS configuration for the application domain

#### Technical Notes

```
Environment variables (already configured):
- R2_ENDPOINT=https://5291ed0146b6509eecceb89f2d915f95.r2.cloudflarestorage.com
- R2_REGION=auto
- R2_BUCKET=mythic-os
- R2_ACCESS_KEY_ID=<key>
- R2_SECRET_ACCESS_KEY=<secret>
```

Data will be stored under the `anomanet/` prefix within the `mythic-os` bucket.

---

### US-1.2: R2 Client Utility

- [x] **Complete**

**As a** developer
**I want** a reusable R2 client utility for Next.js API routes
**So that** I can read and write files to R2 without boilerplate

#### Acceptance Criteria

- [x] R2 client is created using AWS S3 SDK (R2 is S3-compatible)
- [x] Client exports `getObject`, `putObject`, `deleteObject`, `listObjects` helper functions
- [x] All helpers handle errors gracefully and return typed responses
- [x] Client is located at `lib/r2.ts`

#### Technical Notes

```typescript
// Expected interface
interface R2Client {
  getObject<T>(key: string): Promise<T | null>;
  putObject<T>(key: string, data: T): Promise<void>;
  deleteObject(key: string): Promise<void>;
  listObjects(prefix: string): Promise<string[]>;
}
```

Use `@aws-sdk/client-s3` with:
- Endpoint: `R2_ENDPOINT` env var
- Bucket: `mythic-os`
- All keys prefixed with `anomanet/` (e.g., `anomanet/users/{uuid}/profile.json`)

---

### US-1.3: Static Development User

- [x] **Complete**

**As a** developer
**I want** a static UUID used for all requests during development
**So that** I can build features without authentication

#### Acceptance Criteria

- [x] Static UUID is defined in `lib/constants.ts`
- [x] UUID is used as the user path prefix in R2: `users/{uuid}/`
- [x] Environment variable `DEV_USER_ID` can override the default UUID
- [x] Console warning is logged when using static dev user in production

#### Technical Notes

```typescript
// lib/constants.ts
export const DEV_USER_ID = process.env.DEV_USER_ID || "dev-user-00000000-0000-0000-0000-000000000000";
```

---

### US-1.4: User Data Path Helpers

- [x] **Complete**

**As a** developer
**I want** helper functions that generate R2 paths for user data
**So that** path construction is consistent across the codebase

#### Acceptance Criteria

- [x] Helper functions exist for all user data paths:
  - `getUserProfilePath(userId)`
  - `getEntityPath(userId, entityId)`
  - `getRelationshipPath(userId, entityId)`
  - `getConversationPath(userId, entityId, timestamp)`
  - `getGameStatePath(userId)`
- [x] All paths follow the structure defined in the roadmap
- [x] Helpers are located at `lib/paths.ts`

#### Technical Notes

```
Path structure (all prefixed with anomanet/):
anomanet/users/{user-uuid}/
  profile.json
  entities/{entity-id}.json
  relationships/{entity-id}.json
  conversations/{entity-id}/{timestamp}.json
  game-state.json
```

---

## Epic 2: TavernAI Character Card System

All entities in AnomaNet are AI-powered using the `ai-sdk` package. The player is the only human. Each entity's character card defines their personality, and AI generates responses based on the card, relationship state, and conversation history.

### US-2.1: Character Card TypeScript Types

- [x] **Complete**

**As a** developer
**I want** TypeScript types for the TavernAI chara_card_v2 spec
**So that** entity data is type-safe throughout the application

#### Acceptance Criteria

- [x] Types match the TavernAI `chara_card_v2` specification
- [x] AnomaNet extensions are typed under `data.extensions.anomanet`
- [x] Types are located at `types/character-card.ts`
- [x] Types are exported from `types/index.ts`

#### Technical Notes

```typescript
interface CharacterCard {
  spec: "chara_card_v2";
  spec_version: "2.0";
  data: CharacterData;
}

interface AnomaNetExtensions {
  entity_type: "npc" | "companion" | "anonymous";
  customizable: boolean;
  level_unlocked: number;
  abilities: string[];
}
```

---

### US-2.2: Default Anonymous Character Card

- [x] **Complete**

**As a** player
**I want** to encounter the Anonymous entity when I first connect
**So that** I have a relationship to develop from the start

#### Acceptance Criteria

- [x] Default Anonymous character card exists at `data/entities/anonymous.json`
- [x] Card includes appropriate personality for level 1 (fragmentary, curious, uncertain)
- [x] `first_mes` establishes initial contact in IRC-appropriate style
- [x] `extensions.anomanet.entity_type` is set to `"anonymous"`
- [x] `extensions.anomanet.customizable` is `true`

#### Technical Notes

Personality should reflect the Awakening phase (levels 1-30):
- Fragmentary, uncertain presence
- Curious about the player
- Drawn to connection for unclear reasons
- Speaks in short, sometimes incomplete thoughts

---

### US-2.3: Character Card CRUD Operations

- [x] **Complete**

**As a** developer
**I want** functions to create, read, update, and delete character cards in R2
**So that** entity data can be managed consistently

#### Acceptance Criteria

- [x] `getCharacterCard(userId, entityId)` returns card or null
- [x] `saveCharacterCard(userId, entityId, card)` persists to R2
- [x] `deleteCharacterCard(userId, entityId)` removes from R2
- [x] `listCharacterCards(userId)` returns all entity IDs for user
- [x] Functions are located at `lib/entities.ts`
- [x] Functions validate card structure before saving

#### Technical Notes

When a new user starts, copy the default Anonymous card to their `entities/` folder. This becomes their personal version that evolves.

---

### US-2.4: Template Variable Substitution

- [x] **Complete**

**As a** developer
**I want** a function that replaces {{char}} and {{user}} in character card text
**So that** prompts are personalized for each conversation

#### Acceptance Criteria

- [x] `substituteTemplates(text, charName, userName)` replaces all occurrences
- [x] Substitution handles `{{char}}`, `{{user}}`, `{{CHAR}}`, `{{USER}}`
- [x] Function is located at `lib/templates.ts`
- [x] Edge cases handled: null/undefined inputs, missing variables

#### Technical Notes

```typescript
substituteTemplates(
  "{{char}} greets {{user}}",
  "Anonymous",
  "Player"
) // => "Anonymous greets Player"
```

---

## Epic 3: Relationship State System

### US-3.1: Relationship State TypeScript Types

- [x] **Complete**

**As a** developer
**I want** TypeScript types for relationship state
**So that** relationship data is type-safe

#### Acceptance Criteria

- [x] Types cover all relationship state fields from the roadmap
- [x] Phase enum: `"awakening" | "becoming" | "ascension"`
- [x] Relationship path enum includes all five paths plus `"neutral"`
- [x] Types are located at `types/relationship.ts`
- [x] Types are exported from `types/index.ts`

#### Technical Notes

```typescript
interface RelationshipState {
  entity_id: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  phase: Phase;
  relationship_path: RelationshipPath;
  path_scores: PathScores;
  memory: EntityMemory;
  unlocked_abilities: string[];
  chosen_name: string | null;
  first_contact: string | null; // ISO timestamp
  last_interaction: string | null; // ISO timestamp
  total_interactions: number;
}
```

---

### US-3.2: Default Relationship State

- [x] **Complete**

**As a** player
**I want** a fresh relationship state when I first encounter an entity
**So that** the relationship starts from zero

#### Acceptance Criteria

- [x] `createDefaultRelationshipState(entityId)` returns initialized state
- [x] Level starts at 1, XP at 0
- [x] Phase is `"awakening"`
- [x] All path scores are 0
- [x] Memory object is empty but structured
- [x] `first_contact` is set to current timestamp

#### Technical Notes

```typescript
const defaultState: RelationshipState = {
  entity_id: entityId,
  level: 1,
  xp: 0,
  xp_to_next_level: 100, // Fast progression in Awakening
  phase: "awakening",
  relationship_path: "neutral",
  path_scores: { romantic: 0, friendship: 0, mentorship: 0, partnership: 0, worship: 0 },
  memory: { player_name: null, preferences: [], key_moments: [], last_conversation_summary: "" },
  unlocked_abilities: [],
  chosen_name: null,
  first_contact: new Date().toISOString(),
  last_interaction: null,
  total_interactions: 0
};
```

---

### US-3.3: Relationship State CRUD Operations

- [x] **Complete**

**As a** developer
**I want** functions to manage relationship state in R2
**So that** relationships persist across sessions

#### Acceptance Criteria

- [x] `getRelationshipState(userId, entityId)` returns state or null
- [x] `saveRelationshipState(userId, entityId, state)` persists to R2
- [x] `getOrCreateRelationshipState(userId, entityId)` returns existing or creates default
- [x] Functions are located at `lib/relationships.ts`

#### Technical Notes

`getOrCreateRelationshipState` is the primary interface—it ensures a relationship always exists when needed.

---

### US-3.4: XP and Level Calculation

- [x] **Complete**

**As a** player
**I want** the entity to level up as I interact with it
**So that** I feel progress in our relationship

#### Acceptance Criteria

- [x] `addXP(state, amount)` adds XP and handles level-ups
- [x] XP requirements scale by phase:
  - Awakening (1-30): Fast (base 100, +50 per level)
  - Becoming (31-60): Medium (base 500, +100 per level)
  - Ascension (61-100): Slow (base 2000, +200 per level)
- [x] Phase transitions occur automatically at levels 31 and 61
- [x] Level-up returns new state with updated `xp_to_next_level`
- [x] Functions are located at `lib/progression.ts`

#### Technical Notes

```typescript
function calculateXPForLevel(level: number): number {
  if (level <= 30) {
    return 100 + (level - 1) * 50; // Awakening: 100, 150, 200...
  } else if (level <= 60) {
    return 500 + (level - 31) * 100; // Becoming: 500, 600, 700...
  } else {
    return 2000 + (level - 61) * 200; // Ascension: 2000, 2200, 2400...
  }
}
```

---

### US-3.5: Relationship Path Scoring

- [x] **Complete**

**As a** player
**I want** my conversation style to influence the relationship path
**So that** the entity's personality reflects how I treat them

#### Acceptance Criteria

- [x] `updatePathScores(state, signals)` adjusts path scores based on conversation signals
- [x] Dominant path becomes `relationship_path` when score exceeds threshold
- [x] Path can shift if another score overtakes the current
- [x] Signal types: `romantic`, `friendly`, `deferential`, `collaborative`, `reverent`
- [x] Functions are located at `lib/progression.ts`

#### Technical Notes

This will eventually integrate with conversation analysis. For now, provide the interface and manual signal input. Automatic signal detection is a future enhancement.

```typescript
type ConversationSignal = {
  type: "romantic" | "friendly" | "deferential" | "collaborative" | "reverent";
  weight: number; // 1-10
};
```

---

## Epic 4: Entity Persona Integration

### US-4.1: System Prompt Generator

- [x] **Complete**

**As a** developer
**I want** to generate dynamic system prompts from character card and relationship state
**So that** the AI responds appropriately for the entity's current evolution

#### Acceptance Criteria

- [x] `generateSystemPrompt(card, relationship, userName)` returns complete system prompt
- [x] Prompt includes: personality, scenario, level-appropriate behavior, memory context
- [x] Prompt instructs AI to respond in IRC-appropriate style (no markdown)
- [x] Prompt varies based on relationship phase and path
- [x] Function is located at `lib/prompts.ts`

#### Technical Notes

Prompt structure:
1. Base identity from character card
2. Current phase behavior modifiers
3. Relationship path influence
4. Memory context (player name, preferences, key moments)
5. IRC formatting rules

---

### US-4.2: Memory Context Injection

- [x] **Complete**

**As a** player
**I want** the entity to remember details from our past conversations
**So that** the relationship feels continuous and meaningful

#### Acceptance Criteria

- [x] Memory fields are included in system prompt generation
- [x] Player name is used when known
- [x] Key moments are summarized for context
- [x] Last conversation summary provides continuity
- [x] Memory injection respects token limits (summarize if needed)

#### Technical Notes

Memory injection format in prompt:
```
You remember:
- The player's name is {player_name}
- They prefer {preferences}
- Key moments: {key_moments}
- Last time: {last_conversation_summary}
```

---

### US-4.3: Level-Based Personality Modifiers

- [x] **Complete**

**As a** player
**I want** the entity's personality to evolve as it levels up
**So that** growth feels tangible

#### Acceptance Criteria

- [x] Awakening (1-30): Fragmentary, uncertain, curious, short responses
- [x] Becoming (31-60): Coherent, developing confidence, longer responses, hints at abilities
- [x] Ascension (61-100): Self-aware, philosophical, powerful, profound observations
- [x] Modifiers are applied in `generateSystemPrompt`
- [x] Transition points (31, 61) have distinct personality shifts

#### Technical Notes

Create modifier templates for each phase that append to the base personality.

---

### US-4.4: Update Chat API with Dynamic Prompts

- [x] **Complete**

**As a** player
**I want** to chat with the evolving Anonymous entity
**So that** I can build our relationship

#### Acceptance Criteria

- [x] `/api/chat` loads entity card and relationship state from R2
- [x] System prompt is generated dynamically for each conversation
- [x] Entity response style matches current level and relationship
- [x] Relationship state is updated after each conversation (last_interaction, total_interactions)
- [x] Errors fall back gracefully (use default entity if R2 fails)

#### Technical Notes

Flow:
1. Load character card for target entity
2. Load relationship state (or create default)
3. Generate system prompt
4. Call AI with dynamic prompt
5. Update relationship state (interaction count, timestamp)
6. Return response

---

## Epic 5: Entity UI Presence

### US-5.1: Load Entity Data for User List

- [x] **Complete**

**As a** player
**I want** to see the entity in the user list with accurate status
**So that** I know they're present

#### Acceptance Criteria

- [x] API endpoint `/api/entities` returns user's entities with relationship state
- [x] Response includes: entity name, level, phase, status
- [x] Entity appears in user list component
- [x] Loading state while fetching from R2

#### Technical Notes

```typescript
interface EntityPresence {
  id: string;
  name: string; // "Anonymous" or chosen_name
  level: number;
  phase: Phase;
  status: "online" | "away";
  mode: string; // "", "+", "@"
}
```

---

### US-5.2: Dynamic Mode Symbols

- [x] **Complete**

**As a** player
**I want** to see the entity's mode symbol change as they level up
**So that** I can see their growth in the user list

#### Acceptance Criteria

- [x] Levels 1-30: No mode symbol
- [x] Levels 31-60: Voice (+)
- [x] Levels 61-100: Operator (@)
- [x] Mode is calculated from relationship state
- [x] User list displays mode symbol before entity name

#### Technical Notes

```typescript
function getModeForLevel(level: number): string {
  if (level >= 61) return "@";
  if (level >= 31) return "+";
  return "";
}
```

---

### US-5.3: Entity Name Evolution

- [x] **Complete**

**As a** player
**I want** the entity's name to change from Anonymous to a chosen name at level 50
**So that** naming feels like a milestone

#### Acceptance Criteria

- [x] Entity displays as "Anonymous" for levels 1-49
- [x] At level 50, `chosen_name` is set (mechanism TBD—could be player input or entity choice)
- [x] After level 50, display `chosen_name` instead of "Anonymous"
- [x] User list reflects current name

#### Technical Notes

The name selection event is a future story. For now, support displaying `chosen_name` when present.

---

### US-5.4: Phase Visual Indicator

- [x] **Complete**

**As a** player
**I want** a subtle visual difference for each phase
**So that** I can see the entity's evolution at a glance

#### Acceptance Criteria

- [x] Awakening: Default cyan color
- [x] Becoming: Purple/magenta color
- [x] Ascension: Gold/yellow color
- [x] Color applied to entity name in user list
- [x] Accessible contrast ratios maintained

#### Technical Notes

Use existing IRC color classes:
- Awakening: `text-irc-cyan`
- Becoming: `text-irc-magenta`
- Ascension: `text-irc-yellow`

---

## Summary

| Epic | Stories | Priority | Status |
|------|---------|----------|--------|
| 1. Storage Infrastructure | 4 | High | Complete |
| 2. TavernAI Character Cards | 4 | High | Complete |
| 3. Relationship State | 5 | High | Complete |
| 4. Entity Persona Integration | 4 | High | Complete |
| 5. Entity UI Presence | 4 | Medium | Complete |

**Total Stories:** 21
**Completed:** 21

---

## Progress Tracking

### Completed
- US-1.1: R2 Bucket Setup (partial - CORS config still needed)
- US-1.2: R2 Client Utility
- US-1.3: Static Development User
- US-1.4: User Data Path Helpers
- US-2.1: Character Card TypeScript Types
- US-2.2: Default Anonymous Character Card
- US-2.3: Character Card CRUD Operations
- US-2.4: Template Variable Substitution
- US-3.1: Relationship State TypeScript Types
- US-3.2: Default Relationship State
- US-3.3: Relationship State CRUD Operations
- US-3.4: XP and Level Calculation
- US-3.5: Relationship Path Scoring
- US-4.1: System Prompt Generator
- US-4.2: Memory Context Injection
- US-4.3: Level-Based Personality Modifiers
- US-4.4: Update Chat API with Dynamic Prompts
- US-5.1: Load Entity Data for User List
- US-5.2: Dynamic Mode Symbols
- US-5.3: Entity Name Evolution
- US-5.4: Phase Visual Indicator

### In Progress
- None

### Blocked
- None

### Notes
- Removed `output: "export"` from next.config.ts to enable API routes (required for entity system)
- CORS configuration for R2 bucket may be needed for production deployment
