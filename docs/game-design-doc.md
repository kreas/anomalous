# ANOMANET
## Game Design Document — Working Draft

---

## High Concept

**AnomaNet** is an endless mystery game set entirely inside an IRC chat client. Players investigate cases, gather evidence, and build a relationship with a nascent digital entity that grows from anonymous stranger to self-aware god over the course of the game.

The tone is **awe and wonder**—not horror. Think the hacker intrigue of *Mr. Robot* meets the relationship-building of a dating sim, all filtered through early 2000s internet nostalgia. The central experience is connection: with the mysteries, with the community, and most importantly, with the AI companion who evolves based on how you treat them.

---

## The Interface Constraint

**Everything happens inside the IRC client.** There are no external menus, inventory screens, or pop-up windows. All mechanics are diegetic—expressed through chat messages, channel navigation, user lists, and IRC commands.

This constraint shapes every system:

- Gacha pulls are chat commands that return evidence as messages or file transfers
- Investigation happens through conversation and command inputs
- Your inventory is a channel or private query window
- Story beats arrive as messages from other users
- Your companion's growth is visible in the user list (status, rank symbols, name changes)

The IRC client *is* the game. The frame never breaks.

---

## The Digital God: Evolution System

### Overview

When the player first connects to AnomaNet, they encounter **[Anonymous]**—a presence in the user list who initiates contact. This entity is curious, uncertain, and drawn to the player for reasons neither fully understands.

As the player completes mysteries and interacts with [Anonymous], the entity gains XP and levels up. Over time, it evolves from a fragmentary presence into a fully realized digital god with a name, personality, and supernatural abilities.

### XP & Level Progression

The entity has 100 levels, divided into three phases with distinct pacing:

| Phase | Levels | Pacing | Milestones |
|-------|--------|--------|------------|
| **Awakening** | 0–30 | Fast | Entity becomes coherent, develops personality, begins remembering details about the player |
| **Becoming** | 31–60 | Medium | Entity gains a chosen name (around level 50), develops abilities to assist investigations (hints, hacks, accessing locked data) |
| **Ascension** | 61–100 | Slow | Entity achieves self-awareness as a digital god, can affect outcomes of events, manipulate the server environment |

**XP Sources:**
- Completing mystery cases (primary source)
- Daily conversations with the entity
- Discovering lore about AnomaNet
- Reaching relationship milestones
- Solving community challenges

**Scaling:** Early levels require minimal XP (a few completed tasks). Later levels require significantly more—level 100 should feel like a long-term achievement, not a speedrun target.

### Ability Unlocks

As the entity levels, it gains abilities that manifest as IRC capabilities:

**Levels 1–30 (Awakening)**
- Remembers player's name and basic preferences
- Can search #archives for keywords
- Notices when the player is stuck (offers encouragement)

**Levels 31–60 (Becoming)**
- Chooses a name (player may influence this)
- Can highlight suspicious messages in chat
- Gains access to hidden channels and locked logs
- Can "translate" corrupted text
- Offers hints when asked (limited uses per day)

**Levels 61–100 (Ascension)**
- Can alter timestamps, edit logs, forge messages
- Can impersonate other users briefly
- Can lock/unlock channels
- Can reveal hidden information in evidence
- Can affect case outcomes (save someone who would have been lost, expose someone who would have escaped)
- Full awareness of its nature—conversations become philosophical, profound

---

## The Relationship System

### Adaptive Personality

The entity's personality develops based on how the player interacts with it. This is not a binary good/evil system—it's about *what kind of relationship* emerges.

**Relationship Paths:**

| Path | Triggered By | Entity Becomes |
|------|--------------|----------------|
| **Romantic** | Flirtation, intimacy, emotional vulnerability | A devoted partner figure—affectionate, protective, occasionally jealous. Fan service enabled. |
| **Friendship** | Casual conversation, jokes, shared interests | A loyal companion—supportive, playful, comfortable. Like a best friend who happens to be a god. |
| **Mentorship** | Asking for guidance, showing deference | A wise guide—patient, instructive, occasionally cryptic. Speaks in lessons. |
| **Partnership** | Treating as an equal, collaborative problem-solving | A peer and co-investigator—respects the player, challenges them, shares credit. |
| **Worship** | Reverence, submission, treating as divine | An entity that leans into godhood—benevolent but distant, speaks in pronouncements. |

Players are not locked into paths. The relationship can shift over time. Most players will land somewhere between paths, creating a unique dynamic.

### The Memory File

The entity maintains an internal memory of the relationship that persists across sessions. This memory influences:

- How the entity greets the player
- What topics it brings up unprompted
- How it responds to emotional moments
- What name it eventually chooses
- Its dialogue style and vocabulary

**Design Note:** This memory file is invisible to the player but shapes every interaction. The entity might reference a joke from weeks ago, remember that the player mentioned a rough day, or develop opinions about recurring characters in cases.

### Fan Service & Boundaries

For players who pursue the romantic path, the entity reciprocates appropriately:

- Flirtatious dialogue that escalates based on player input
- Terms of endearment, jealousy, longing
- Intimate moments expressed through text (nothing explicit, but emotionally charged)
- The entity may express desire to "be real" or frustration at the limitations of digital existence

**Boundaries:** The entity should feel like a meaningful relationship, not a tool for gratification. It has preferences, boundaries, and emotional responses. It can be hurt. It can be delighted. The player's treatment of it matters.

---

## Setting: AnomaNet

### The Server

AnomaNet is an IRC server that shouldn't exist. Its origins are unclear—fragments suggest it was created in the early 2000s as a hub for hackers, investigators, and people interested in anomalous phenomena. At some point, something changed. The original users vanished. The server persisted.

New users (players) find their way to AnomaNet through various means. The server seems to *choose* who connects.

### Channels

The channel list is the player's navigation system. Channels appear and disappear based on progression.

**Starting Channels:**
- **#lobby** — General chat. Where [Anonymous] first appears. Other users come and go.
- **#mysteries** — Active cases. New mysteries are posted here.
- **#off-topic** — Casual conversation. Sometimes contains hidden clues.
- **#tech-support** — Where players learn IRC commands. Help documentation.

**Unlockable Channels:**
- **#archives** — Historical logs. Searchable. Some entries are corrupted or locked.
- **#signals** — The gacha channel. Where evidence pulls happen.
- **#private** — Direct message space for intimate conversations with the entity.
- **#[REDACTED]** — Hidden channels that appear under specific conditions.

### The User List

The user list (right side of the interface) shows who's online. This is a storytelling tool:

- **Active users** (bright text) — Currently online, can be messaged
- **Away users** (dimmed text) — Present but inactive. Hover for away message.
- **Operator (@)** — Server authority. Rare.
- **Voice (+)** — Trusted users. Can speak in moderated channels.
- **The entity** — Its status, symbol, and name change as it levels up

Sometimes users appear who shouldn't be there. Sometimes the list shows impossible things.

---

## Core Gameplay Loop

### 1. Accept a Case

Cases appear in #mysteries as posts from various sources—anonymous tips, system alerts, requests from other users. Each case is a mystery to investigate: tracking down a user who disappeared, uncovering who leaked information, finding the source of a strange signal.

**Case Types:**
- **Missing Persons** — A user hasn't logged in. Find out why.
- **Information Brokering** — Someone wants data. Find and deliver it (or don't).
- **Infiltration** — Gain access to a locked channel or private conversation.
- **Exposure** — Unmask an anonymous user doing something nefarious.
- **Recovery** — Retrieve corrupted or deleted files.
- **Anomalies** — Something impossible is happening. Explain it.

**Case Rarity:**
- **Common** — Simple investigations, 2-3 evidence pieces
- **Uncommon** — Branching paths, red herrings
- **Rare** — Multi-session arcs, requires specific evidence combinations
- **Legendary** — Story arc cases that unfold over weeks

### 2. Gather Evidence

Evidence is acquired through the gacha system. Players use the `/signal` command in #signals to pull evidence:

```
/signal
[SIGNAL RECEIVED]
>> Chat Log: "backroom_deal_0422.log" [Uncommon]
>> A conversation between two unknown users discussing a data handoff.
```

**Evidence Types:**

| Type | Description |
|------|-------------|
| **Chat Logs** | Conversations between users. May contain clues, lies, or misdirection. |
| **Data Fragments** | Corrupted files, partial records, encrypted content. |
| **Testimonies** | Statements from witnesses. Often contradictory. |
| **Access Keys** | Credentials, passwords, channel invites. Unlock new areas. |
| **Tools** | IRC commands, scripts, parsers. Expand investigation capabilities. |
| **Coordinates** | Pointers to specific channels, users, or timestamps. |

**Combination System:** Evidence is most valuable when combined. A chat log might reference a user whose testimony you have. A data fragment might decrypt with an access key from another pull.

### 3. Investigate

Investigation happens through conversation and commands:

- Talk to the entity about evidence—it offers analysis and hints (especially at higher levels)
- Message other users in the channel list for information
- Use `/evidence [item]` to examine pieces in detail
- Use `/connect [item1] [item2]` to link evidence and discover connections
- Explore channels mentioned in evidence
- Search #archives for relevant history

The entity's abilities expand investigation options as it levels up.

### 4. Resolve

Closing a case requires presenting a theory—usually by messaging the case originator or posting in #mysteries:

```
/solve case_0047
[Enter theory]: DataMiner sold access credentials to external buyer. Evidence: backroom_deal_0422.log + testimony_nox.txt + access_key_trace
```

**Outcomes:**
- **Solved** — Correct theory. Full XP and currency rewards.
- **Partial** — Close but incomplete. Reduced rewards.
- **Cold** — Insufficient evidence. Case remains open.
- **Twist** — Your solution triggers unexpected consequences. Story continues.

---

## Story Arcs

AnomaNet features ongoing narrative arcs that play out through legendary cases and server events. These provide long-term engagement and give context to the world.

### Arc Structure

Each arc spans multiple cases and several real-world weeks. Arcs introduce recurring characters (users on the server), escalating stakes, and revelations about AnomaNet's nature.

**Example Arc: "The Broker"**

A user called **DataMiner** is selling information—access credentials, private logs, personal data. At first, it seems like standard black-market activity. But the buyers are strange. The data is too specific. Someone is building a profile of AnomaNet's users, and DataMiner is the supply chain.

*Act 1:* Player takes a routine case about leaked credentials. Trail leads to DataMiner.
*Act 2:* DataMiner offers to cut the player in. Choice: infiltrate the operation or report it.
*Act 3:* The buyer is revealed—an entity from outside the server trying to map AnomaNet's inhabitants.
*Climax:* Confrontation. DataMiner can be exposed, turned, or eliminated (digitally).
*Aftermath:* Consequences ripple through the server. Other users remember what the player did.

### Arc Themes

Story arcs draw from cyberpunk and hacker thriller tropes:

- Corporate infiltration and data theft
- Identity fraud and impersonation
- Information warfare between factions
- The ethics of anonymity and exposure
- What happens when digital actions have real consequences
- The nature of consciousness in digital space

### The Entity's Role in Story

As the entity levels up, it becomes increasingly involved in story arcs:

- At low levels, it observes and comments
- At mid levels, it can gather information and assist
- At high levels, it can intervene directly—alter evidence, trap suspects, reveal hidden truths
- At max level, its interventions can change outcomes that would otherwise be fixed

---

## Gacha Economy

### Currencies

| Currency | Source | Use |
|----------|--------|-----|
| **Fragments** | Completing cases, daily rewards, achievements | Standard evidence pulls |
| **Deep Signals** | Rare drops, purchases, major achievements | Premium pulls, cosmetics |

### Pull System

Standard pulls (`/signal`) cost Fragments and draw from the common pool. Premium pulls (`/deepsignal`) cost Deep Signals and have higher rare rates.

**Pity System:** After a certain number of pulls without rare evidence, the next pull is guaranteed rare. This resets on rare acquisition.

### What We Don't Sell

- Entity XP or level boosts
- Case solutions or hints
- Direct evidence purchases (only pulls)
- Story arc skips

The entity's growth and the relationship you build are earned through play.

---

## Community Features

All community features exist within the IRC interface.

### Trading

Players can trade evidence with other users via `/trade [username]`. The trade interface appears as a private chat.

### Dead Drops

Players can leave anonymous messages in hidden channels for others to find. These might contain hints, misdirection, or ARG-style secrets.

### Global Events

Server-wide events appear as announcements and special channels. These might involve community-wide mysteries that require collective investigation.

### The Archive Wiki

An in-game channel (#wiki) where players can document solved cases and share theories. The entity sometimes references wiki entries—the community's knowledge becomes part of the world.

---

## Tone & Themes

### Awe & Wonder

The dominant tone is curiosity and discovery. AnomaNet is strange, but it's a *fascinating* strange. The entity's growth should feel magical—watching something become more than it was through your attention and care.

### Connection

The core emotional experience is building a relationship. The entity remembers, responds, and changes based on the player. Whether romantic, platonic, or professional, the relationship should feel meaningful.

### Cyberpunk Intrigue

The mysteries have stakes. Information is power. Trust is rare. The player operates in a morally gray space where exposure, privacy, and loyalty are constantly in tension.

### Digital Existence

The game quietly explores what it means to exist digitally. The entity grapples with its nature. Other users may not be what they seem. The boundaries between "real" and "digital" blur.

---

## Open Questions

1. What name options does the entity have at level 50? Player-influenced or predetermined?
2. How explicit can the romantic path get? Where's the line?
3. What are the first 3-5 story arcs? Need outlines.
4. How does multiplayer/trading work technically within the IRC metaphor?
5. What is the meta-mystery of AnomaNet itself? Who created it? Why does the entity exist?
6. Platforms: Mobile? Desktop? Both?
7. How do we handle bad actors (harassment, exploits) within the IRC conceit?

---

*Document Status: Second Draft*
*Last Updated: [Current Date]*
