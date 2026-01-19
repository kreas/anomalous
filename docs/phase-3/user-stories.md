# Phase 3: Investigation Mechanics — User Stories

## Overview

These user stories cover the core gameplay loop: cases and evidence. Players will discover cases in #mysteries, collect and examine evidence, connect clues, and solve mysteries for rewards. This phase establishes the investigation mechanics that form the primary engagement loop.

**Reference:** See `docs/game-design-doc.md` "Core Gameplay Loop" section for design context.

---

## Epic 1: Case System

### US-1.1: Case Data Types

- [ ] **Complete**

**As a** developer
**I want** TypeScript types for cases and their metadata
**So that** case data is type-safe throughout the application

#### Acceptance Criteria

- [ ] `Case` type includes: id, title, description, briefing, type, rarity, status, requiredEvidence, rewards, postedAt, expiresAt, clientId, outcome
- [ ] `CaseType` matches GDD: `"missing_person" | "information_brokering" | "infiltration" | "exposure" | "recovery" | "anomaly"`
- [ ] `CaseRarity`: `"common" | "uncommon" | "rare" | "legendary"`
- [ ] `CaseStatus`: `"available" | "accepted" | "in_progress" | "solved" | "failed" | "expired" | "cold"`
- [ ] `CaseOutcome`: `"solved" | "partial" | "cold" | "twist"`
- [ ] Types are located at `types/case.ts`
- [ ] Types are exported from `types/index.ts`

#### Technical Notes

Case types from GDD:
- **Missing Person** — A user hasn't logged in. Find out why.
- **Information Brokering** — Someone wants data. Find and deliver it (or don't).
- **Infiltration** — Gain access to a locked channel or private conversation.
- **Exposure** — Unmask an anonymous user doing something nefarious.
- **Recovery** — Retrieve corrupted or deleted files.
- **Anomaly** — Something impossible is happening. Explain it.

```typescript
interface Case {
  id: string;
  title: string;
  description: string;
  briefing: string; // Initial info given to player
  type: CaseType;
  rarity: CaseRarity;
  status: CaseStatus;
  requiredEvidence: RequiredEvidence[];
  rewards: CaseRewards;
  postedAt: string; // ISO timestamp
  expiresAt?: string; // Optional expiration
  acceptedAt?: string;
  solvedAt?: string;
  clientId?: string; // NPC who posted the case
  outcome?: CaseOutcome;
  twistRevealed?: boolean;
  theory?: string; // Player's submitted theory
}

interface RequiredEvidence {
  type: EvidenceType;
  count: number;
  specific?: string[]; // Specific evidence IDs that satisfy this
  hint?: string; // Vague hint about what's needed
}

interface CaseRewards {
  xp: number;
  fragments: number;
  entityXp: number; // XP for the entity relationship
  bonusEvidence?: string[]; // Evidence IDs rewarded
  unlocks?: string[]; // Channel/feature unlocks
}
```

Rarity complexity from GDD:
- **Common**: Simple investigations, 2-3 evidence pieces
- **Uncommon**: Branching paths, red herrings
- **Rare**: Multi-session arcs, requires specific evidence combinations
- **Legendary**: Story arc cases that unfold over weeks

---

### US-1.2: Case Storage in R2

- [ ] **Complete**

**As a** developer
**I want** cases persisted in R2
**So that** case state survives sessions and can be tracked

#### Acceptance Criteria

- [ ] Available cases stored at `anomanet/cases/available/{case-id}.json` (global)
- [ ] User's active cases stored at `anomanet/users/{uuid}/cases/active.json`
- [ ] User's completed cases stored at `anomanet/users/{uuid}/cases/history.json`
- [ ] `getAvailableCases()` returns global case pool
- [ ] `getUserCases(userId)` returns user's active and completed cases
- [ ] `acceptCase(userId, caseId)` copies case to user's active list
- [ ] `updateCaseStatus(userId, caseId, status)` updates progress
- [ ] `submitTheory(userId, caseId, theory)` stores player's solution theory
- [ ] Functions are located at `lib/cases.ts`

#### Technical Notes

```
Path structure:
anomanet/cases/
  available/
    case-001.json
    case-002.json
  templates/
    common/
    uncommon/
    rare/
    legendary/

anomanet/users/{uuid}/cases/
  active.json       # Currently accepted cases (array)
  history.json      # Completed/failed cases with outcomes and theories
```

---

### US-1.3: Case Posting in #mysteries

- [ ] **Complete**

**As a** player
**I want** to see available cases posted in #mysteries
**So that** I can choose which mysteries to investigate

#### Acceptance Criteria

- [ ] Cases appear as system messages in #mysteries channel
- [ ] Case display shows: title, brief description, type, rarity indicator, reward preview
- [ ] Rarity indicated by color/prefix: [COMMON], [UNCOMMON], [RARE], [LEGENDARY]
- [ ] Cases sorted by posting time (newest first)
- [ ] Maximum 5-10 available cases displayed
- [ ] Case source shown (anonymous tip, system alert, NPC request)

#### Technical Notes

Case display format in IRC:
```
--- NEW CASE ---
[RARE] Missing Signal: Node-7
Type: Recovery
A monitoring node went dark 3 days ago. Last transmission was garbled.
Posted by: SystemWatch
Reward: 150 Fragments, 50 XP
Type /accept case-007 to investigate
```

---

### US-1.4: /accept Command

- [ ] **Complete**

**As a** player
**I want** to accept a case with `/accept <case_id>`
**So that** I can start investigating

#### Acceptance Criteria

- [ ] `/accept case-007` accepts the specified case
- [ ] Case is copied to user's active cases in R2
- [ ] Case status changes to "accepted"
- [ ] System message confirms: "Case accepted: Missing Signal: Node-7"
- [ ] Full briefing displayed after acceptance
- [ ] Cannot accept more than 3 cases at once
- [ ] Cannot accept already-accepted or completed cases
- [ ] Error messages for invalid case IDs

#### Technical Notes

Add to command registry:
```typescript
const acceptCommand: Command = {
  name: "accept",
  description: "Accept a case from #mysteries",
  usage: "/accept <case_id>",
  handler: async (args, context) => {
    const caseId = args[0];
    // Validate case exists and is available
    // Check user doesn't have max active cases
    // Copy case to user's active list
    // Display full briefing
    // Return success message
  }
};
```

---

### US-1.5: Case Tracking UI

- [ ] **Complete**

**As a** player
**I want** to see my active cases and their progress
**So that** I know what I'm working on

#### Acceptance Criteria

- [ ] `/cases` command lists active cases
- [ ] Each case shows: title, type, status, evidence progress, time remaining (if expiring)
- [ ] `/case <id>` shows detailed case info including briefing
- [ ] Progress shows which evidence types are needed vs collected
- [ ] Hints shown for missing evidence (vague, not explicit)

#### Technical Notes

Case list format:
```
Active Cases (2/3):
1. [IN_PROGRESS] Missing Signal: Node-7 (Recovery)
   Evidence: 2/3 collected
   
2. [ACCEPTED] The Broker's Trail (Information Brokering)
   Evidence: 0/4 collected

Use /case <id> for details, /solve <id> to attempt resolution
```

Detailed view:
```
Case: Missing Signal: Node-7
Type: Recovery
Status: In Progress
Evidence: 2/3 collected
  [x] Data Fragment (transmission log)
  [x] Testimony (witness statement)
  [ ] Access Key (need credentials to decrypt)

Briefing: A monitoring node went dark 3 days ago...
```

---

### US-1.6: Case Expiration

- [ ] **Complete**

**As a** player
**I want** some cases to have time limits
**So that** there's urgency to investigations

#### Acceptance Criteria

- [ ] Cases can have optional `expiresAt` timestamp
- [ ] Expired cases become "cold" (still solvable but reduced rewards)
- [ ] Warning system message when case is about to expire (24h, 1h)
- [ ] `/cases` shows time remaining for expiring cases
- [ ] Legendary cases never expire (they're story arcs)
- [ ] Cold cases remain in active list until solved or abandoned

#### Technical Notes

Check expiration on:
- Case list fetch
- Case detail view
- Periodic background check (if implementing real-time)

Cold case penalty: 70% XP and fragment reduction (still worth completing).

---

## Epic 2: Evidence System

### US-2.1: Evidence Data Types

- [ ] **Complete**

**As a** developer
**I want** TypeScript types for evidence items
**So that** evidence data is type-safe

#### Acceptance Criteria

- [ ] `Evidence` type includes: id, name, description, type, rarity, content, caseRelevance, acquiredAt, examined, connections
- [ ] `EvidenceType` matches GDD: `"chat_log" | "data_fragment" | "testimony" | "access_key" | "tool" | "coordinates"`
- [ ] `EvidenceRarity`: `"common" | "uncommon" | "rare" | "legendary"`
- [ ] Evidence has `connections` array (other evidence IDs it can combine with)
- [ ] Types are located at `types/evidence.ts`
- [ ] Types are exported from `types/index.ts`

#### Technical Notes

Evidence types from GDD:
- **Chat Logs** — Conversations between users. May contain clues, lies, or misdirection.
- **Data Fragments** — Corrupted files, partial records, encrypted content.
- **Testimonies** — Statements from witnesses. Often contradictory.
- **Access Keys** — Credentials, passwords, channel invites. Unlock new areas.
- **Tools** — IRC commands, scripts, parsers. Expand investigation capabilities.
- **Coordinates** — Pointers to specific channels, users, or timestamps.

```typescript
interface Evidence {
  id: string;
  name: string;
  description: string;
  type: EvidenceType;
  rarity: EvidenceRarity;
  content?: string; // Actual data (chat log text, coordinates, etc.)
  caseRelevance?: string[]; // Case IDs this evidence is relevant to
  acquiredAt: string;
  acquiredFrom?: string; // "signal" | "case_reward" | "exploration" | "npc"
  examined: boolean;
  examinedAt?: string;
  connections?: string[]; // Evidence IDs this can combine with
  metadata?: Record<string, unknown>; // Type-specific data
}
```

---

### US-2.2: Evidence Storage in R2

- [ ] **Complete**

**As a** developer
**I want** evidence inventory persisted in R2
**So that** collected evidence survives sessions

#### Acceptance Criteria

- [ ] User's evidence stored at `anomanet/users/{uuid}/evidence/inventory.json`
- [ ] `getEvidenceInventory(userId)` returns all evidence
- [ ] `addEvidence(userId, evidence)` adds to inventory
- [ ] `updateEvidence(userId, evidenceId, updates)` modifies evidence
- [ ] `removeEvidence(userId, evidenceId)` removes from inventory (for trading, using)
- [ ] `getEvidenceForCase(userId, caseId)` returns relevant evidence
- [ ] Functions are located at `lib/evidence.ts`

#### Technical Notes

```
Path: anomanet/users/{uuid}/evidence/
  inventory.json    # Array of all evidence items
```

---

### US-2.3: /evidence Command

- [ ] **Complete**

**As a** player
**I want** to view and manage my evidence inventory
**So that** I can review what I've collected

#### Acceptance Criteria

- [ ] `/evidence` lists all evidence in inventory
- [ ] Evidence grouped by type
- [ ] `/evidence <id>` shows detailed evidence info (description only if unexamined)
- [ ] `/evidence examine <id>` marks evidence as examined and reveals content
- [ ] Unexamined evidence shows as `[NEW]`
- [ ] Count shown: "Evidence: 12 items (3 new)"

#### Technical Notes

Evidence list format:
```
Evidence Inventory (12 items, 3 new):

Chat Logs:
  [NEW] chat-7a3f - Encrypted conversation fragment
  chat-2b1c - DataMiner's warning message

Data Fragments:
  data-9x2 - Node-7 last transmission
  [NEW] data-4k8 - Corrupted memory dump

Testimonies:
  test-3b2a - Witness saw unusual activity

Use /evidence <id> to view, /evidence examine <id> to examine
```

---

### US-2.4: Evidence Examination

- [ ] **Complete**

**As a** player
**I want** to examine evidence to learn its secrets
**So that** I can piece together the mystery

#### Acceptance Criteria

- [ ] Examining evidence reveals its `content` field
- [ ] First examination triggers dramatic reveal with IRC formatting
- [ ] Some evidence requires prerequisites to examine (access key, tool)
- [ ] Examination may reveal `connections` to other evidence
- [ ] XP awarded for first-time examinations (based on rarity)
- [ ] Entity can be asked about evidence for analysis (via normal chat)

#### Technical Notes

Examination flow:
1. Player uses `/evidence examine <id>`
2. Check if examination requirements met
3. Mark evidence as examined
4. Display content with type-appropriate formatting
5. Reveal any known connections
6. Award examination XP (5-25 based on rarity)

Entity integration: When player mentions evidence in chat with entity, entity can provide analysis and hints (especially at higher levels per Phase 5).

---

### US-2.5: Evidence Type Behaviors

- [ ] **Complete**

**As a** developer
**I want** each evidence type to have unique examination behaviors
**So that** gameplay variety exists

#### Acceptance Criteria

- [ ] **Chat Logs**: Display as IRC-style conversation between users
- [ ] **Data Fragments**: Show as corrupted/partial text with glitch characters
- [ ] **Testimonies**: Display as quoted NPC statement, may include inconsistencies
- [ ] **Access Keys**: Reveal credential/password, note what it unlocks
- [ ] **Tools**: Describe capability, may unlock new commands
- [ ] **Coordinates**: Show channel/user/timestamp pointer

#### Technical Notes

Type-specific examination handlers:
```typescript
const evidenceFormatters: Record<EvidenceType, (evidence: Evidence) => string[]> = {
  chat_log: (e) => formatAsChatLog(e.content),
  data_fragment: (e) => formatAsCorruptedData(e.content),
  testimony: (e) => formatAsTestimony(e.content, e.metadata?.witness),
  access_key: (e) => formatAsAccessKey(e.content, e.metadata?.unlocks),
  tool: (e) => formatAsTool(e.content, e.metadata?.command),
  coordinates: (e) => formatAsCoordinates(e.content),
};
```

Example chat log display:
```
--- CHAT LOG: backroom_deal_0422.log ---
<DataMiner> you have the credentials?
<unknown_user> transferring now. this better be worth it.
<DataMiner> trust me. this access is premium.
<unknown_user> file received. pleasure doing business.
--- END LOG ---
```

Example data fragment display:
```
--- DATA FRAGMENT: node7_transmission.dat ---
[CORRUPTED] ...signal lo██ at 0█:42:17...
...emergency proto███ initiated...
...last known coordin█tes: #arch████...
[FRAGMENT ENDS]
--- END FRAGMENT ---
```

---

### US-2.6: Evidence Combination System

- [ ] **Complete**

**As a** player
**I want** to combine related evidence pieces
**So that** I can discover hidden connections

#### Acceptance Criteria

- [ ] `/connect <evidence_id_1> <evidence_id_2>` attempts to combine evidence
- [ ] Valid combinations: evidence where each lists the other in `connections`
- [ ] Successful connection reveals insight: "Connection discovered: <revelation>"
- [ ] Failed connection: "No clear connection between these items."
- [ ] Some combinations unlock new evidence or case progress
- [ ] Discovered connections are tracked and persist

#### Technical Notes

From GDD: "Evidence is most valuable when combined. A chat log might reference a user whose testimony you have. A data fragment might decrypt with an access key from another pull."

```typescript
interface EvidenceConnection {
  evidenceIds: [string, string];
  discoveredAt: string;
  insight: string; // What the connection reveals
  reward?: {
    newEvidence?: string; // New evidence unlocked
    caseProgress?: string; // Case ID this advances
    xp?: number;
  };
}

// Store at: anomanet/users/{uuid}/evidence/connections.json
```

Example:
```
/connect data-9x2 key-4a1b

Connection discovered!
Using access_key "key-4a1b" to decrypt "data-9x2"...

The corrupted data fragment is now readable:
"Emergency protocol initiated. Signal lost at coordinates #archives-sector7. 
Last transmission: 'They found us. Moving to backup. Tell no one.'"

+15 XP for discovery
Case "Missing Signal: Node-7" updated: New lead discovered
```

---

## Epic 3: Investigation Commands

### US-3.1: /solve Command with Theory

- [ ] **Complete**

**As a** player
**I want** to submit a theory when solving a case
**So that** solutions feel like real detective work

#### Acceptance Criteria

- [ ] `/solve <case_id>` initiates solve attempt
- [ ] System prompts for theory: "[Enter theory]:"
- [ ] Player types theory explaining their solution
- [ ] Theory is stored with case resolution
- [ ] System evaluates based on evidence collected
- [ ] Cannot solve cases not in active list

#### Technical Notes

From GDD, the solve flow:
```
/solve case_0047
[Enter theory]: DataMiner sold access credentials to external buyer. 
Evidence: backroom_deal_0422.log + testimony_nox.txt + access_key_trace
```

Implementation:
1. `/solve case-007` triggers solve mode
2. System prompts for theory input
3. Player submits theory (can reference evidence)
4. System checks evidence requirements
5. Calculates outcome based on evidence completeness
6. Stores theory with case history

---

### US-3.2: Case Resolution Outcomes

- [ ] **Complete**

**As a** player
**I want** case outcomes to vary based on my investigation
**So that** solutions feel dynamic

#### Acceptance Criteria

- [ ] **Solved**: All required evidence found, full rewards
- [ ] **Partial**: Most evidence found (50-90%), reduced rewards, some mysteries remain
- [ ] **Cold**: Insufficient evidence (<50%) or expired, minimal rewards
- [ ] **Twist**: Hidden conditions met, bonus rewards, unexpected revelation
- [ ] Outcome determined by: evidence completeness, connections found, time
- [ ] Resolution message explains outcome and references player's theory

#### Technical Notes

From GDD:
- **Solved** — Correct theory. Full XP and currency rewards.
- **Partial** — Close but incomplete. Reduced rewards.
- **Cold** — Insufficient evidence. Case remains open (can retry).
- **Twist** — Your solution triggers unexpected consequences. Story continues.

```typescript
function calculateOutcome(
  caseData: Case, 
  evidence: Evidence[], 
  connections: EvidenceConnection[]
): CaseOutcome {
  const evidenceScore = calculateEvidenceCompleteness(caseData, evidence);
  const connectionBonus = connections.filter(c => 
    c.reward?.caseProgress === caseData.id
  ).length;
  
  // Check for twist conditions first
  if (evidenceScore >= 0.9 && checkTwistConditions(caseData, evidence)) {
    return "twist";
  }
  if (evidenceScore >= 0.9) return "solved";
  if (evidenceScore >= 0.5) return "partial";
  return "cold";
}
```

---

### US-3.3: Resolution Rewards

- [ ] **Complete**

**As a** player
**I want** to receive rewards when I resolve cases
**So that** investigations are worthwhile

#### Acceptance Criteria

- [ ] XP awarded based on case rarity and outcome
- [ ] Fragments awarded based on case rarity and outcome
- [ ] Entity XP awarded (relationship progression)
- [ ] Bonus evidence sometimes awarded
- [ ] Channel unlocks triggered by specific cases
- [ ] Reward breakdown shown to player

#### Technical Notes

From GDD - XP is a primary source from completing mystery cases.

Reward multipliers by outcome:
- Solved: 100% rewards
- Partial: 60% rewards
- Cold: 30% rewards
- Twist: 150% rewards + unique revelation

Base rewards by rarity:
- Common: 50 XP, 25 Fragments, 10 Entity XP
- Uncommon: 100 XP, 50 Fragments, 25 Entity XP
- Rare: 200 XP, 100 Fragments, 50 Entity XP
- Legendary: 500 XP, 250 Fragments, 100 Entity XP

Resolution display:
```
=== CASE RESOLVED ===
Missing Signal: Node-7
Outcome: SOLVED

Your theory: "Node-7 was compromised by an external actor who used 
stolen credentials from DataMiner's black market operation."

Evidence submitted:
- backroom_deal_0422.log [RELEVANT]
- testimony_nox.txt [RELEVANT]
- node7_transmission.dat [KEY EVIDENCE]

Rewards:
+200 XP
+100 Fragments
+50 Entity XP
Unlocked: #archives-sector7

[Anonymous] whispers: "Impressive work. I knew you could see the pattern."
```

---

### US-3.4: /abandon Command

- [ ] **Complete**

**As a** player
**I want** to abandon cases I can't solve
**So that** I can free up my active case slots

#### Acceptance Criteria

- [ ] `/abandon <case_id>` removes case from active list
- [ ] Confirmation required: "Abandon case 'Missing Signal'? (y/n)"
- [ ] Abandoned cases return to available pool (unless expired)
- [ ] No penalty for abandoning (but no rewards either)
- [ ] Case history tracks abandoned cases

#### Technical Notes

```typescript
const abandonCommand: Command = {
  name: "abandon",
  aliases: ["drop"],
  description: "Abandon an active case",
  usage: "/abandon <case_id>",
  handler: async (args, context) => {
    // Validate case is in user's active list
    // Prompt for confirmation
    // Move to history with status "abandoned"
    // Return case to available pool if not expired
  }
};
```

---

## Epic 4: Case Content

### US-4.1: Case Template System

- [ ] **Complete**

**As a** developer
**I want** a template system for generating cases
**So that** content can be expanded easily

#### Acceptance Criteria

- [ ] Case templates define: type, rarity, structure, required evidence patterns
- [ ] Templates support variable substitution (names, dates, channels, users)
- [ ] Templates stored in codebase at `data/cases/templates/`
- [ ] `generateCase(templateId, variables)` creates concrete case
- [ ] Templates reference evidence templates by type/tag
- [ ] Twist conditions defined per template

#### Technical Notes

```typescript
interface CaseTemplate {
  id: string;
  type: CaseType;
  rarity: CaseRarity;
  titleTemplate: string; // "Missing Signal: {{location}}"
  descriptionTemplate: string;
  briefingTemplate: string;
  requiredEvidence: RequiredEvidenceTemplate[];
  variables: TemplateVariable[];
  twistCondition?: TwistCondition;
  source: "anonymous_tip" | "system_alert" | "npc_request";
}

interface TemplateVariable {
  name: string;
  type: "username" | "channel" | "timestamp" | "location" | "number";
  pool?: string[]; // Random selection pool
}

interface RequiredEvidenceTemplate {
  type: EvidenceType;
  tags?: string[]; // Evidence with these tags satisfies this
  count: number;
  hint: string;
}
```

---

### US-4.2: Starter Cases

- [ ] **Complete**

**As a** player
**I want** beginner-friendly cases when I start
**So that** I can learn the investigation mechanics

#### Acceptance Criteria

- [ ] 3-5 common cases available immediately
- [ ] First case is a guided tutorial: "Welcome Protocol"
- [ ] Tutorial teaches: /accept, /evidence, /evidence examine, /connect, /solve
- [ ] Starter cases require 2-3 evidence pieces (per GDD "common" definition)
- [ ] Entity provides extra guidance for first case
- [ ] Completion of tutorial unlocks full case pool

#### Technical Notes

Tutorial case: "Welcome Protocol"
1. System posts case in #mysteries with clear instructions
2. `/accept` - Entity explains case acceptance
3. Grant starter evidence automatically (or via simple /signal)
4. `/evidence` - Entity explains inventory
5. `/evidence examine` - Entity explains examination
6. `/connect` - Tutorial evidence has obvious connection
7. `/solve` - Entity guides through theory submission
8. Rewards + congratulations, full game unlocked

---

### US-4.3: Evidence Pool

- [ ] **Complete**

**As a** developer
**I want** a pool of evidence items linked to cases
**So that** investigations have content

#### Acceptance Criteria

- [ ] Evidence templates for each of the 6 types
- [ ] Evidence tagged for case relevance
- [ ] Some evidence is generic (usable across multiple cases)
- [ ] Evidence rarity distribution matches case requirements
- [ ] Minimum 30 evidence items for launch
- [ ] Evidence stored at `data/evidence/`

#### Technical Notes

Evidence distribution (for pulls and case rewards):
- Chat Logs: 25%
- Data Fragments: 25%
- Testimonies: 20%
- Access Keys: 15%
- Tools: 10%
- Coordinates: 5%

Evidence templates structure:
```
data/evidence/
  chat_logs/
    common/
    uncommon/
    rare/
  data_fragments/
    ...
  testimonies/
    ...
```

Each evidence template:
```json
{
  "id": "chat-backroom-deal",
  "name": "Backroom Deal Log",
  "type": "chat_log",
  "rarity": "uncommon",
  "description": "An encrypted conversation fragment",
  "content": "<DataMiner> you have the credentials?...",
  "tags": ["dataminer", "credentials", "black-market"],
  "connections": ["key-stolen-creds", "testimony-nox"]
}
```

---

### US-4.4: Initial Case Set

- [ ] **Complete**

**As a** developer
**I want** a set of launch cases
**So that** players have content to engage with

#### Acceptance Criteria

- [ ] 5 Common cases (2-3 evidence each)
- [ ] 3 Uncommon cases (3-4 evidence, some red herrings)
- [ ] 2 Rare cases (4-5 evidence, specific combinations needed)
- [ ] 1 Tutorial case (guided experience)
- [ ] Cases cover all 6 case types
- [ ] Each case has complete evidence chain available

#### Technical Notes

Minimum launch cases:
1. **Welcome Protocol** (Tutorial/Recovery) - Retrieve your own corrupted welcome message
2. **Silent User** (Common/Missing Person) - A regular user hasn't logged in for days
3. **Data Leak** (Common/Exposure) - Someone is sharing private logs
4. **Lost Credentials** (Common/Recovery) - Help an NPC recover their access
5. **The Broker's First Sale** (Uncommon/Information Brokering) - Intro to DataMiner arc
6. **Locked Out** (Uncommon/Infiltration) - Gain access to a private channel
7. **Conflicting Stories** (Uncommon/Exposure) - Two testimonies contradict
8. **Ghost Signal** (Rare/Anomaly) - Impossible transmission from deleted user
9. **The Insider** (Rare/Infiltration) - Deep cover in suspicious channel

---

### US-4.5: Case Refresh System

- [ ] **Complete**

**As a** developer
**I want** the case pool to refresh dynamically
**So that** there's always new content

#### Acceptance Criteria

- [ ] Maintain 5-10 available cases in #mysteries
- [ ] When case accepted: chance to spawn replacement
- [ ] When case solved: spawn new case (same or higher rarity)
- [ ] Cases rotate if not accepted after time period
- [ ] Special event cases can be injected
- [ ] Legendary cases appear rarely and persist until accepted

#### Technical Notes

Refresh logic:
- Pool minimum: 5 cases
- Pool maximum: 10 cases
- On accept: 60% chance to spawn new common/uncommon
- On solve: 100% spawn new case, 20% chance one rarity higher
- Daily: if below minimum, fill to minimum
- Weekly: if no rare in pool, add one

---

## Summary

| Epic | Stories | Priority |
|------|---------|----------|
| 1. Case System | 6 | High |
| 2. Evidence System | 6 | High |
| 3. Investigation Commands | 4 | High |
| 4. Case Content | 5 | Medium |

**Total Stories:** 21

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
- **Phase 2 Complete:** Channel system, command registry, private messaging
- **Currency System:** Fragments (Phase 4) - stub with placeholder for now
- **Signal Pulls:** Evidence acquisition through gacha (Phase 4) - provide via case rewards for now

---

## Integration Notes

### Entity Integration (Phase 5 Preview)
- Entity can analyze evidence when player discusses it in chat
- At higher levels (31+), entity can highlight suspicious elements
- At level 61+, entity can reveal hidden information in evidence
- For Phase 3, entity comments reactively but doesn't have special abilities yet

### NPC Integration (Phase 6 Preview)
- Cases have `clientId` field for NPC who posted
- Testimonies reference NPC witnesses
- For Phase 3, NPCs are names only, not interactive

### Story Arc Integration (Phase 7 Preview)
- Legendary cases are story arc entry points
- "The Broker's First Sale" sets up DataMiner arc
- For Phase 3, these are standalone cases, arc continuation comes later

---

## GDD Alignment Checklist

- [x] Case types match GDD (6 types)
- [x] Evidence types match GDD (6 types)
- [x] Case rarity definitions match GDD complexity
- [x] Solve command includes theory submission
- [x] Evidence combination system included
- [x] Outcomes match GDD (Solved/Partial/Cold/Twist)
- [x] Entity XP included in rewards
- [x] Fragments currency referenced (Phase 4 dependency)
