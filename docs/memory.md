# AnomaNet Development Memory

A running log of design and coding decisions made during development.

---

## 2026-01-18: Storage Architecture - Cloudflare R2 with Shared Bucket

**Context:** Needed to decide on persistent storage for user data, entity cards, and game state.

**Decision:** Use Cloudflare R2 with the existing `mythic-os` bucket, storing AnomaNet data under the `anomanet/` prefix.

**Rationale:**
- R2 is already configured and available (credentials in .env.local)
- S3-compatible API allows use of standard AWS SDK
- Prefix-based isolation (`anomanet/`) keeps data organized within shared bucket
- No database needed for MVP - JSON files are sufficient for single-user dev mode
- Easy migration path to per-user isolation when auth is added

---

## 2026-01-18: Entity Format - TavernAI Character Card Spec

**Context:** Needed a standard format for defining AI entity personalities (Anonymous, NPCs, companions).

**Decision:** Adopt the TavernAI `chara_card_v2` specification with custom AnomaNet extensions.

**Rationale:**
- Industry-standard format with broad tooling support
- Designed specifically for AI character roleplay
- Extensible via `extensions` field for game-specific data
- Template variables ({{char}}, {{user}}) provide personalization
- Separates character definition from relationship state

---

## 2026-01-18: Static Dev User for Phase 1

**Context:** Authentication is Phase 8, but we need user-scoped storage now.

**Decision:** Use a static UUID (`dev-user-00000000-0000-0000-0000-000000000000`) for all requests during development.

**Rationale:**
- Allows building full user-scoped storage without auth complexity
- Path structure (`users/{uuid}/`) is ready for real users later
- Environment variable override available for testing multiple users
- Console warning in production prevents accidental use

---

## 2026-01-18: Removed Static Export for API Routes

**Context:** Phase 1 implementation requires API routes (`/api/chat`, `/api/entities`) for entity system, but Next.js was configured with `output: "export"` for Capacitor mobile builds.

**Decision:** Removed `output: "export"` from `next.config.ts` to enable server-side API routes.

**Rationale:**
- Static export doesn't support API routes - they require a Node.js server
- Entity system needs server-side R2 access (credentials can't be exposed to client)
- Mobile deployment strategy will need to be revisited:
  - Option 1: Deploy Next.js to a server (Vercel, Cloudflare Workers)
  - Option 2: Use client-side R2 access with signed URLs
  - Option 3: Separate API backend for mobile
- For development, server-side API routes are the simplest approach

---

## 2026-01-18: Phase 2 Channel System - Hourly Message Chunking

**Context:** Need to persist channel message history to R2 without creating excessive small files.

**Decision:** Chunk messages by hour using timestamp-based keys (e.g., `2026-01-18T15.json`).

**Rationale:**
- One file per message would create too many R2 operations
- One file per channel would grow unboundedly large
- Hourly chunks balance file count vs. file size
- Easy pagination: load latest 1-2 chunks for initial view
- Chunks can be cleaned up or archived independently

---

## 2026-01-18: Phase 2 Command System - Extensible Registry Pattern

**Context:** IRC-style commands need to be easy to add across different phases.

**Decision:** Implement command registry with standardized interfaces (`Command`, `CommandContext`, `CommandResult`).

**Rationale:**
- Single `registerCommand()` call to add new commands
- Command handlers return action types for UI to process
- Context object provides all necessary state
- Easy to add Phase 3+ commands (`/signal`, `/search`, `/solve`)
- Aliases support multiple command names (e.g., `/j` for `/join`)

---

## 2026-01-18: Phase 2 Query Windows - Channel-like Private Messages

**Context:** IRC /msg creates "query windows" for private conversations.

**Decision:** Model query windows as a special channel type stored alongside regular channels.

**Rationale:**
- Reuses existing channel infrastructure (unread counts, switching, etc.)
- Query window ID format `query-{targetUserId}` clearly identifies target
- Separate `queryWindows` array in channel state keeps them organized
- Same message persistence path pattern works for queries
- Entity private conversations can have different AI prompt context

---
