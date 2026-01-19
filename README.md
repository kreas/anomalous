# Anomalous

An IRC-style mystery investigation game built with Next.js 16 and React 19.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Mock Data & Seeding

The `mocks/` folder contains case and evidence data for development:

```bash
# Preview what would be uploaded
pnpm seed:dry-run

# Seed cases to R2
pnpm seed

# Seed cases and evidence to a specific user
pnpm seed -- --user=<userId>
```

See `mocks/README.md` for data formats and structure.

## System Message Color Formatting

System messages in the chat use IRC-style color coding for readability:

| Element | Color |
|---------|-------|
| Headers (`=== Title ===`) | Cyan, bold |
| Section labels (`Evidence Required:`, `Rewards:`, etc.) | Yellow label, white content |
| `[COMMON]` rarity | White, bold |
| `[UNCOMMON]` rarity | Green, bold |
| `[RARE]` rarity | Cyan, bold |
| `[LEGENDARY]` rarity | Yellow, bold |
| `[IN_PROGRESS]` status | Yellow |
| `[ACCEPTED]` status | Green |
| `[SOLVED]` status | Cyan |
| `[COLD]` status | Red |
| Reward lines (XP, Fragments) | Green |
| Commands (`/accept`, `/solve`, etc.) | Cyan |
| Numbered list items (`1.`, `2.`) | Yellow number, white text |
| Evidence/case IDs (`case-xxx`, `chat-xxx`) | Magenta |

## Project Structure

```
app/                  # Next.js App Router pages and components
lib/                  # Core libraries and utilities
  commands/           # Command registry and handlers
  cases.ts            # Case management
  evidence.ts         # Evidence system
  r2.ts               # R2 storage client
mocks/                # Mock data for development
  cases/              # Case JSON files
  evidence/           # Evidence JSON files
scripts/              # Utility scripts
  seed-r2.ts          # R2 seeding script
docs/                 # Documentation and design docs
types/                # TypeScript type definitions
```

## Environment Variables

Required for R2 storage:

- `R2_ENDPOINT` - Cloudflare R2 endpoint URL
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET` - Bucket name (defaults to "mythic-os")
