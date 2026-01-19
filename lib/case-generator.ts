/**
 * Case and evidence generation from templates
 * Implements US-4.1, US-4.2, US-4.3, US-4.4
 */

import type { Case, Evidence, EvidenceType } from "@/types";
import { saveAvailableCase } from "./cases";

/**
 * Generate a unique case ID
 */
function _generateCaseId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `case-${timestamp}-${random}`;
}

/**
 * Generate a unique evidence ID
 */
export function generateEvidenceId(type: EvidenceType): string {
  const prefix = type.replace("_", "-").substring(0, 4);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${random}`;
}

// =============================================================================
// Tutorial Case
// =============================================================================

/**
 * Create the tutorial case - teaches basic mechanics
 */
export function createTutorialCase(): Case {
  return {
    id: "tutorial-welcome",
    title: "Welcome Protocol",
    description:
      "Your welcome message was corrupted during transfer. Recover it.",
    briefing: `When you connected to AnomaNet, your welcome message was corrupted during the transfer. This is unusual - the system rarely loses data.

Your task: Find and examine the corrupted data fragment to recover your welcome message.

This is a simple case to help you learn the investigation system.

Hint: Use /evidence to view your inventory, and /evidence examine <id> to examine items.`,
    type: "recovery",
    rarity: "common",
    status: "available",
    requiredEvidence: [
      {
        type: "data_fragment",
        count: 1,
        hint: "corrupted welcome message",
        specific: ["tutorial-welcome-data"],
      },
    ],
    rewards: {
      xp: 25,
      fragments: 15,
      entityXp: 10,
    },
    postedAt: new Date().toISOString(),
    source: "system_alert",
  };
}

/**
 * Create tutorial evidence
 */
export function createTutorialEvidence(): Evidence {
  return {
    id: "tutorial-welcome-data",
    name: "Corrupted Welcome Data",
    description:
      "A fragment of your original welcome message, partially corrupted.",
    type: "data_fragment",
    rarity: "common",
    content: `W█lcome to An██aNet, new us██.

You have been ch██en to join this n██work.
Something is wat██ing. Something is wa██ing for you.

Connection es██blished. Good l██k.`,
    caseRelevance: ["tutorial-welcome"],
    acquiredAt: new Date().toISOString(),
    acquiredFrom: "tutorial",
    examined: false,
    metadata: {
      corruptionLevel: 0.15,
    },
  };
}

// =============================================================================
// Starter Cases
// =============================================================================

/**
 * Create all starter cases
 */
export function createStarterCases(): Case[] {
  return [
    createTutorialCase(),
    createSilentUserCase(),
    createDataLeakCase(),
    createLostCredentialsCase(),
    createBrokerFirstSaleCase(),
    createLockedOutCase(),
  ];
}

function createSilentUserCase(): Case {
  return {
    id: "case-silent-user",
    title: "Silent User",
    description:
      "A regular user hasn't logged in for days. Their last message was cryptic.",
    briefing: `User "NightOwl" was active daily for months, then suddenly went silent 5 days ago. Their last message in #off-topic was: "They're watching. I have to go dark."

Investigate what happened to NightOwl. Was it paranoia, or did they discover something they shouldn't have?

Required evidence:
- Chat logs from NightOwl's last conversations
- Testimony from users who knew them`,
    type: "missing_person",
    rarity: "common",
    status: "available",
    requiredEvidence: [
      { type: "chat_log", count: 1, hint: "NightOwl's conversations" },
      { type: "testimony", count: 1, hint: "someone who knew them" },
    ],
    rewards: {
      xp: 50,
      fragments: 25,
      entityXp: 15,
    },
    postedAt: new Date().toISOString(),
    source: "anonymous_tip",
  };
}

function createDataLeakCase(): Case {
  return {
    id: "case-data-leak",
    title: "The Leak",
    description:
      "Private conversation logs are appearing in public channels. Find the source.",
    briefing: `Someone is leaking private conversations to #off-topic. The leaked logs contain sensitive information - user disputes, private confessions, personal data.

The leaker seems to have access to private message logs. Find out who they are and how they're getting this access.

Required evidence:
- The leaked chat logs themselves
- An access key or method they're using`,
    type: "exposure",
    rarity: "common",
    status: "available",
    requiredEvidence: [
      { type: "chat_log", count: 1, hint: "leaked private conversations" },
      { type: "access_key", count: 1, hint: "how they accessed the logs" },
    ],
    rewards: {
      xp: 50,
      fragments: 25,
      entityXp: 15,
    },
    postedAt: new Date().toISOString(),
    source: "npc_request",
    clientId: "SysAdmin",
  };
}

function createLostCredentialsCase(): Case {
  return {
    id: "case-lost-creds",
    title: "Lost Credentials",
    description: "A user lost their backup access key. Help them recover it.",
    briefing: `User "OldTimer" has been locked out of #archives after a system update reset their credentials. They claim they had a backup key stored somewhere, but can't remember where.

Search for OldTimer's backup access key. They mentioned it might be referenced in an old conversation or stored as a data fragment.

Required evidence:
- The access key itself, or coordinates to its location`,
    type: "recovery",
    rarity: "common",
    status: "available",
    requiredEvidence: [
      { type: "access_key", count: 1, hint: "OldTimer's backup key" },
    ],
    rewards: {
      xp: 50,
      fragments: 25,
      entityXp: 15,
    },
    postedAt: new Date().toISOString(),
    source: "npc_request",
    clientId: "OldTimer",
  };
}

function createBrokerFirstSaleCase(): Case {
  return {
    id: "case-broker-intro",
    title: "The Broker's First Sale",
    description:
      "Someone called DataMiner is selling information. Investigate their operation.",
    briefing: `A user named "DataMiner" has been advertising information for sale in various channels. They claim to have access to private data, old logs, and even user credentials.

This could be a serious security breach. Investigate DataMiner's operation:
- What are they selling?
- How are they getting this information?
- Who are they selling to?

This case may lead to deeper investigations...

Required evidence:
- Chat logs showing DataMiner's activities
- A data fragment of what they're selling
- Testimony from someone who's dealt with them`,
    type: "information_brokering",
    rarity: "uncommon",
    status: "available",
    requiredEvidence: [
      { type: "chat_log", count: 1, hint: "DataMiner's sales pitch" },
      { type: "data_fragment", count: 1, hint: "sample of their merchandise" },
      { type: "testimony", count: 1, hint: "a buyer or seller" },
    ],
    rewards: {
      xp: 100,
      fragments: 50,
      entityXp: 30,
      unlocks: ["#signals"],
    },
    postedAt: new Date().toISOString(),
    source: "anonymous_tip",
  };
}

function createLockedOutCase(): Case {
  return {
    id: "case-locked-out",
    title: "Locked Out",
    description:
      "Gain access to a locked private channel to retrieve important data.",
    briefing: `There's a private channel called #vault-7 that contains archived data from AnomaNet's early days. The channel has been locked for years, and the original operators are long gone.

Someone needs that data. Find a way in.

You'll need credentials or coordinates to access the channel.

Required evidence:
- Access key for #vault-7
- Coordinates or instructions for entry`,
    type: "infiltration",
    rarity: "uncommon",
    status: "available",
    requiredEvidence: [
      { type: "access_key", count: 1, hint: "channel credentials" },
      { type: "coordinates", count: 1, hint: "entry point" },
    ],
    rewards: {
      xp: 100,
      fragments: 50,
      entityXp: 30,
    },
    postedAt: new Date().toISOString(),
    source: "system_alert",
  };
}

// =============================================================================
// Starter Evidence
// =============================================================================

/**
 * Create starter evidence pool
 */
export function createStarterEvidence(): Evidence[] {
  return [
    createTutorialEvidence(),
    // Chat logs
    {
      id: "chat-nightowl-final",
      name: "NightOwl's Last Words",
      description: "The final conversation NightOwl had before disappearing.",
      type: "chat_log",
      rarity: "common",
      content: `<NightOwl> I found something in the old archives
<NightOwl> logs from before, from when this place started
<CuriousCat> what kind of logs?
<NightOwl> conversations. between the founders. about what they were building.
<NightOwl> they weren't just making a chat server
<CuriousCat> what do you mean?
<NightOwl> They're watching. I have to go dark.
<NightOwl> if I don't come back, look for the coordinates in #archives
--- NightOwl has disconnected ---`,
      caseRelevance: ["case-silent-user"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["testimony-curious-cat"],
      metadata: { participants: ["NightOwl", "CuriousCat"] },
    },
    {
      id: "chat-dataminer-pitch",
      name: "DataMiner's Sales Pitch",
      description: "A recorded conversation of DataMiner selling information.",
      type: "chat_log",
      rarity: "uncommon",
      content: `<DataMiner> I have what you need
<unknown_buyer> how much?
<DataMiner> 50 fragments for basic logs, 200 for credentials
<unknown_buyer> credentials to what?
<DataMiner> anything. private channels, user accounts, even mod access
<unknown_buyer> how do I know this is legit?
<DataMiner> I'll send you a sample. free of charge.
<DataMiner> [file transfer: sample_logs.dat]
<unknown_buyer> ...this is real. where did you get this?
<DataMiner> I have my sources. do we have a deal?`,
      caseRelevance: ["case-broker-intro"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["data-sample-logs"],
      metadata: { participants: ["DataMiner", "unknown_buyer"] },
    },
    {
      id: "chat-leaked-private",
      name: "Leaked Private Messages",
      description: "Private messages that were leaked to public channels.",
      type: "chat_log",
      rarity: "common",
      content: `--- LEAKED PRIVATE CONVERSATION ---
<User_A> I can't believe they said that about me
<User_B> don't worry, no one will find out
<User_A> you promise you won't tell anyone?
<User_B> your secret is safe with me
--- END LEAK ---

This was posted to #off-topic by an anonymous user.`,
      caseRelevance: ["case-data-leak"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["key-message-access"],
    },
    // Testimonies
    {
      id: "testimony-curious-cat",
      name: "CuriousCat's Statement",
      description: "Testimony from the last person to talk to NightOwl.",
      type: "testimony",
      rarity: "common",
      content: `NightOwl was always curious about the old days of AnomaNet. They spent hours in #archives searching through old logs.

That last conversation... they seemed excited at first, like they'd found something big. Then suddenly scared. They said "they're watching" but wouldn't say who.

I tried to message them after they disconnected. Nothing. Their account still exists but they never came back online.

I think they found something they weren't supposed to find.`,
      caseRelevance: ["case-silent-user"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["chat-nightowl-final"],
      metadata: { witness: "CuriousCat" },
    },
    {
      id: "testimony-buyer",
      name: "Anonymous Buyer's Statement",
      description: "Testimony from someone who bought from DataMiner.",
      type: "testimony",
      rarity: "uncommon",
      content: `Yeah, I bought from DataMiner. Don't judge me - I needed access to an old channel where I'd stored important data before I lost my credentials.

The transaction was smooth. I paid the fragments, they delivered the access key within minutes. Professional, almost.

How do they get this stuff? No idea. But they have access to things they shouldn't. Old logs, credentials, private messages. It's like they have a backdoor into the entire server.

One thing though - they mentioned something about "the source" once. Said they weren't the one finding the data, just selling it. There's someone else involved.`,
      caseRelevance: ["case-broker-intro"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      metadata: { witness: "Anonymous" },
    },
    // Data fragments
    {
      id: "data-sample-logs",
      name: "DataMiner's Sample",
      description: "A sample of the data DataMiner is selling.",
      type: "data_fragment",
      rarity: "uncommon",
      content: `[DECRYPTED SAMPLE]
User: Admin_Alpha
Channel: #founders-only
Timestamp: [REDACTED]

"The entity is growing faster than expected. It's already
responding to users in ways we didn't program. Should we
be concerned?"

[END SAMPLE]`,
      caseRelevance: ["case-broker-intro"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["chat-dataminer-pitch"],
      metadata: { corruptionLevel: 0.05 },
    },
    // Access keys
    {
      id: "key-message-access",
      name: "Message System Access Key",
      description: "A key that grants access to the private message system.",
      type: "access_key",
      rarity: "common",
      content: "pm-access-7a3f9b2e",
      caseRelevance: ["case-data-leak"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["chat-leaked-private"],
      metadata: { unlocks: "Private Message Archive" },
    },
    {
      id: "key-oldtimer-backup",
      name: "OldTimer's Backup Key",
      description: "A backup access key belonging to OldTimer.",
      type: "access_key",
      rarity: "common",
      content: "archive-backup-oldtimer-9x4k",
      caseRelevance: ["case-lost-creds"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      metadata: { unlocks: "#archives access for OldTimer" },
    },
    {
      id: "key-vault7",
      name: "Vault-7 Access Credentials",
      description: "Credentials for the locked #vault-7 channel.",
      type: "access_key",
      rarity: "uncommon",
      content: "vault7-operator-legacy-key",
      caseRelevance: ["case-locked-out"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["coords-vault7"],
      metadata: { unlocks: "#vault-7" },
    },
    // Coordinates
    {
      id: "coords-vault7",
      name: "Vault-7 Entry Point",
      description: "Coordinates to the hidden entry point for #vault-7.",
      type: "coordinates",
      rarity: "uncommon",
      content: `/join #vault-7-antechamber
Then use the access key at the prompt.
The original operators left this backdoor in case of emergency.`,
      caseRelevance: ["case-locked-out"],
      acquiredAt: new Date().toISOString(),
      acquiredFrom: "exploration",
      examined: false,
      connections: ["key-vault7"],
      metadata: { target: "#vault-7-antechamber" },
    },
  ];
}

// =============================================================================
// Seeding Functions
// =============================================================================

/**
 * Seed the available cases pool
 */
export async function seedAvailableCases(): Promise<void> {
  const cases = createStarterCases();

  for (const caseData of cases) {
    await saveAvailableCase(caseData);
  }
}

/**
 * Get all starter content for initial setup
 */
export function getStarterContent(): {
  cases: Case[];
  evidence: Evidence[];
} {
  return {
    cases: createStarterCases(),
    evidence: createStarterEvidence(),
  };
}
