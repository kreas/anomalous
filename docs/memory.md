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
