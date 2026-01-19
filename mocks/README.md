# Mock Data

This folder contains mock data for cases and evidence that can be seeded to R2 storage.

## Structure

```
mocks/
├── cases/           # Case definitions
│   ├── tutorial-welcome.json
│   ├── case-silent-user.json
│   ├── case-data-leak.json
│   ├── case-lost-creds.json
│   ├── case-broker-intro.json
│   └── case-locked-out.json
├── evidence/        # Evidence items
│   ├── tutorial-welcome-data.json
│   ├── chat-nightowl-final.json
│   ├── chat-dataminer-pitch.json
│   ├── chat-leaked-private.json
│   ├── testimony-curious-cat.json
│   ├── testimony-buyer.json
│   ├── data-sample-logs.json
│   ├── key-message-access.json
│   ├── key-oldtimer-backup.json
│   ├── key-vault7.json
│   └── coords-vault7.json
└── README.md
```

## Usage

### Preview changes (dry run)

```bash
pnpm seed:dry-run
```

### Seed cases to R2

```bash
pnpm seed
```

### Seed cases and evidence to a specific user

```bash
pnpm seed -- --user=<userId>
```

## R2 Storage Paths

- Cases are stored at: `anomanet/cases/available/{caseId}.json`
- User evidence is stored at: `anomanet/users/{userId}/evidence.json`

## Data Formats

### Case Schema

```json
{
  "id": "case-id",
  "title": "Case Title",
  "description": "Short description",
  "briefing": "Full briefing text",
  "type": "recovery|missing_person|exposure|infiltration|information_brokering",
  "rarity": "common|uncommon|rare|legendary",
  "status": "available",
  "requiredEvidence": [
    { "type": "chat_log", "count": 1, "hint": "description" }
  ],
  "rewards": {
    "xp": 50,
    "fragments": 25,
    "entityXp": 15
  },
  "source": "system_alert|anonymous_tip|npc_request"
}
```

### Evidence Schema

```json
{
  "id": "evidence-id",
  "name": "Evidence Name",
  "description": "Short description",
  "type": "chat_log|testimony|data_fragment|access_key|coordinates",
  "rarity": "common|uncommon|rare|legendary",
  "content": "The actual content/data",
  "caseRelevance": ["case-id"],
  "acquiredFrom": "exploration|tutorial",
  "examined": false,
  "connections": ["other-evidence-id"],
  "metadata": {}
}
```

## Adding New Content

1. Create a new JSON file in the appropriate folder
2. Follow the schema above
3. Run `pnpm seed:dry-run` to verify
4. Run `pnpm seed` to upload

## Environment Variables

Required for seeding:

- `R2_ENDPOINT` - Cloudflare R2 endpoint URL
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET` - Bucket name (defaults to "mythic-os")
