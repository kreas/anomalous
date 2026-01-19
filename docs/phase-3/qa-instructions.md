# Phase 3 QA Instructions: Investigation Mechanics

## Objective
Verify implementation of investigation mechanics focusing on cases, evidence, and player interactions. This phase introduces the core gameplay loop of discovering, investigating, and solving mysteries.

## Test Environment Setup
- **Platform**: Web browser (Chrome/Safari/Firefox)
- **Credentials**: Use test user account with access to all features
- **Initial State**: 
  - Cases available in #mysteries
  - Evidence inventory accessible
  - All investigation commands functional

## Test Scenarios

### 1. Case System Verification

#### 1.1 Case Listing
- [ ] Verify `/cases` command shows all active cases
- [ ] Confirm max 3 active cases allowed
- [ ] Check case details include:
  - Title
  - Type (Recovery, Missing Person, etc.)
  - Current evidence progress
  - Case status

#### 1.2 Case Acceptance
- [ ] Use `/accept <case_id>` to take a case
- [ ] Confirm case moves to active list
- [ ] Verify case briefing appears after acceptance
- [ ] Attempt to accept an already-accepted case (should fail)
- [ ] Attempt to accept over 3 active cases (should fail)

#### 1.3 Case Expiration
- [ ] Verify expiring cases show time remaining
- [ ] Confirm warning appears 24h before expiration
- [ ] Check cold case status after expiration
- [ ] Verify reduced rewards for cold cases

### 2. Evidence System

#### 2.1 Evidence Inventory
- [ ] Use `/evidence` to list all collected evidence
- [ ] Verify evidence grouped by type
- [ ] Check new evidence marked as `[NEW]`
- [ ] Confirm evidence count shown (e.g., "12 items, 3 new")

#### 2.2 Evidence Examination
- [ ] Use `/evidence <id>` to view evidence details
- [ ] Use `/evidence examine <id>` to reveal content
- [ ] Verify first examination triggers dramatic reveal
- [ ] Check XP awarded for first-time examinations
- [ ] Confirm different display for each evidence type:
  - Chat logs show conversation
  - Data fragments show corrupted text
  - Testimonies show quotes
  - Access keys reveal credentials
  - Tools describe capabilities
  - Coordinates show pointers

#### 2.3 Evidence Connections
- [ ] Use `/connect <evidence_id_1> <evidence_id_2>`
- [ ] Verify successful connections reveal insights
- [ ] Check failed connections provide clear message
- [ ] Confirm some connections unlock new evidence or case progress

### 3. Investigation Commands

#### 3.1 Case Resolution
- [ ] Use `/solve <case_id>` to attempt solving
- [ ] Verify theory submission prompt appears
- [ ] Enter a theory explaining the solution
- [ ] Check different outcomes:
  - Solved (all evidence, full rewards)
  - Partial (most evidence, reduced rewards)
  - Cold (insufficient evidence)
  - Twist (unexpected revelation)

#### 3.2 Case Abandonment
- [ ] Use `/abandon <case_id>`
- [ ] Confirm abandonment confirmation prompt
- [ ] Verify case returns to available pool if not expired
- [ ] Check no penalties for abandonment

### 4. Starter Case Experience

#### 4.1 Tutorial Case
- [ ] Verify "Welcome Protocol" available first
- [ ] Complete tutorial case step-by-step
- [ ] Check tutorial guides through each mechanic:
  - Case acceptance
  - Evidence collection
  - Evidence examination
  - Evidence connection
  - Case resolution

#### 4.2 Case Variety
- [ ] Confirm cases cover different types:
  - Missing Person
  - Information Brokering
  - Infiltration
  - Exposure
  - Recovery
  - Anomaly

- [ ] Verify rarity distribution
  - Several common cases
  - Few uncommon cases
  - Rare cases present

## Performance and Stability Checks

- [ ] Memory usage during long investigation sessions
- [ ] Response time for commands
- [ ] Concurrent case/evidence operations
- [ ] Handling of large evidence inventories

## Boundary and Edge Case Testing

- [ ] Maximum case slots (3)
- [ ] Maximum evidence types
- [ ] Evidence connections with complex requirements
- [ ] Rare case generation
- [ ] Twist condition triggers

## Reward Verification

- [ ] XP awarded correctly by case rarity and outcome
- [ ] Fragments distributed as expected
- [ ] Entity XP progression
- [ ] Bonus evidence awarded
- [ ] Channel unlocks triggered by specific cases

## Error Handling

- [ ] Invalid case IDs
- [ ] Attempting actions on non-existent evidence
- [ ] Connecting incompatible evidence
- [ ] Edge cases in theory submission
- [ ] R2 storage access failures

## Reporting

For each test:
- [ ] Pass/Fail status
- [ ] Detailed steps to reproduce
- [ ] Specific observations
- [ ] Recommended fixes

## Blockers and Risks

Critical areas requiring extra attention:
- Evidence connection logic
- Case outcome calculations
- R2 storage interactions
- Command parsing and execution

## Test Duration Estimate
- Comprehensive testing: 4-6 hours
- Minimum smoke test: 1-2 hours

## Additional Notes

- Focus on user experience and narrative flow
- Pay attention to IRC-style formatting
- Test on multiple browsers/devices
- Encourage creative theory submissions

**Happy investigating! 🕵️‍♀️🔍**