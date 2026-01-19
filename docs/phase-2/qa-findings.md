# Phase 2 QA Findings

**Date:** January 18, 2026
**Tester:** Claude (Automated QA via Chrome browser tools)

## Summary

| Test | Result | Notes |
|------|--------|-------|
| Test 1: Channel State Loading | ✅ PASS | Channels load correctly, locked channels dimmed with `[locked]` prefix, intro message shows |
| Test 2: Channel Switching | ✅ PASS | Switching channels works, message history cached correctly |
| Test 3: Locked Channel Behavior | ✅ PASS | Clicking/joining locked channels shows proper error |
| Test 4: IRC Commands | ✅ PASS | `/help`, `/help join`, `/join`, `/j`, `/me`, `/clear`, `/list`, `/users` all work |
| Test 5: Private Messaging (Entity) | ✅ PASS | `/msg Anonymous` opens query window, entity responds, `/part` closes it |
| Test 6: Private Messaging with Initial Message | ✅ PASS | `/msg Anonymous hello there` opens query and sends message |
| Test 7: Status Bar Updates | ✅ PASS | Status bar shows current channel/query with appropriate colors |
| Test 8: Message Persistence | ❌ FAIL | Messages do NOT persist after page reload |
| Test 9: Unknown Command | ✅ PASS | Shows proper error message |
| Test 10: NPC Private Message | ❌ FAIL | Shows "User not found: DataMiner" instead of opening query window |

**Overall: 8/10 tests passing**

---

## Detailed Test Results

### Test 1: Channel State Loading ✅ PASS

**Expected:** Channels load from R2 (or defaults are created)

**Results:**
- ✅ Channel list shows: #lobby, #mysteries, #tech-support, #off-topic (all in cyan)
- ✅ Locked channels appear dimmed with `[locked]` prefix: #signals, #archives, #private
- ✅ #lobby shows intro message: "Connected to AnomaNet. Welcome to #lobby."

---

### Test 2: Channel Switching ✅ PASS

**Expected:** Switching channels loads separate message history

**Results:**
- ✅ Sent message in #lobby
- ✅ Switched to #mysteries using click
- ✅ Returned to #lobby - previous message still visible (cached)
- ✅ Status bar updates appropriately

---

### Test 3: Locked Channel Behavior ✅ PASS

**Expected:** Clicking locked channels shows error

**Results:**
- ✅ Clicking `[locked] #signals` shows: "Channel #signals is locked."
- ✅ Using `/join #signals` command shows same error message

---

### Test 4: IRC Commands ✅ PASS

**Expected:** Commands work as expected

| Command | Expected | Actual | Status |
|---------|----------|--------|--------|
| `/help` | Lists all available commands | Shows comprehensive command list | ✅ |
| `/help join` | Shows help for /join command | Shows: "join: Switch to a channel Usage: /join #channel" | ✅ |
| `/join #mysteries` | Switches to #mysteries channel | Successfully switches | ✅ |
| `/j #off-topic` | Switches to #off-topic (alias) | Successfully switches, shows intro "Casual chat. Be nice." | ✅ |
| `/me waves` | Shows action: "* You waves" | Shows: "* You waves" | ✅ |
| `/clear` | Clears message display | Clears all messages from display | ✅ |
| `/list` | Shows all channels with lock status | Shows channels with (current) and [locked] indicators | ✅ |
| `/users` | Lists users in the channel | Shows: "Users: Anonymous" | ✅ |

---

### Test 5: Private Messaging (Entity) ✅ PASS

**Expected:** /msg opens query window with AI conversation

**Results:**
- ✅ `/msg Anonymous` opens query window `[Anonymous]` in channel list
- ✅ Query window appears below channels in the channel list
- ✅ Switched to the query window automatically
- ✅ Sent message and Anonymous (entity) responded with contextual reply
- ✅ `/part` closed the query window and returned to #lobby

---

### Test 6: Private Messaging with Initial Message ✅ PASS

**Expected:** /msg with content opens query and sends message

**Results:**
- ✅ `/msg Anonymous hello there` opened query window
- ✅ "hello there" appeared as user's message
- ✅ Entity responded: "hello again... you keep reaching out. why? feels... familiar."

---

### Test 7: Status Bar Updates ✅ PASS

**Expected:** Status bar reflects current channel

**Results:**
- ✅ Status bar shows current channel name (#lobby, #mysteries, #off-topic)
- ✅ Query window shows `[Anonymous]` in status bar
- ✅ Query window name appears in magenta/pink color (different from cyan channel names)

---

### Test 8: Message Persistence ❌ FAIL

**Expected:** Messages persist across page reloads

**Results:**
- ❌ Sent "Persistence test message 12345" in #lobby
- ❌ After page refresh (F5), messages are NOT visible
- ❌ All messages from the session are lost

**Root Cause Analysis:**
- Messages are being stored in React state but not being persisted to R2
- OR messages are saved to R2 but not being loaded on page refresh
- No console errors visible

**Recommended Fix:**
- Investigate `saveChannelMessages` function in R2 service
- Check if messages are being saved on send
- Check if messages are being loaded on initial page load
- Add logging to track message persistence flow

---

### Test 9: Unknown Command ✅ PASS

**Expected:** Error message for invalid commands

**Results:**
- ✅ `/unknowncommand` shows: "Unknown command: /unknowncommand. Type /help for available commands."

---

### Test 10: NPC Private Message ❌ FAIL

**Expected:** NPCs are not yet AI-powered, but query window should open

**Results:**
- ❌ `/msg DataMiner hello` shows: "User not found: DataMiner"
- ❌ Query window does NOT open for NPC
- Note: DataMiner is visible in the user list on the right side

**Root Cause Analysis:**
- The `/msg` command likely only checks for the entity ("Anonymous")
- NPCs in the user list are not being recognized as valid message targets
- Possible case sensitivity issue or NPCs not registered in user lookup

**Recommended Fix:**
- Update `/msg` command handler to recognize NPCs from the user list
- NPCs should be valid targets for `/msg` even if they don't respond (Phase 6 feature)

---

## Issues Summary

### Critical Issues (Blocking)

1. **Message Persistence Not Working (Test 8)**
   - Severity: HIGH
   - Impact: All messages lost on page refresh
   - User experience severely impacted

### Medium Issues

2. **NPC Private Messaging Not Working (Test 10)**
   - Severity: MEDIUM
   - Impact: Cannot initiate conversations with NPCs
   - Note: NPC responses are Phase 6, but query windows should open now

### Minor Observations

3. **Private message history shows in lobby after /part**
   - When returning from a query window to #lobby, some private messages appear in the lobby message history
   - Low severity, cosmetic issue

---

## Recommendations

1. **Priority 1:** Fix message persistence to R2
   - This is the most critical issue affecting user experience
   - Messages must persist across page reloads

2. **Priority 2:** Fix NPC message targeting
   - Update `/msg` command to recognize all users in the user list
   - Allow opening query windows for NPCs even without AI responses

3. **Priority 3:** Investigate message history isolation
   - Ensure private messages don't leak into channel message history
