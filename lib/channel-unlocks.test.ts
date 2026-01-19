import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  getUnlockableChannels,
  getUnlockHints,
  createUnlockNotification,
  createDiscoveryNotification,
  type UnlockCondition,
  type UnlockContext,
} from "./channel-unlocks";
import { createDefaultChannelState } from "./channels";
import type { RelationshipState } from "@/types";

describe("channel-unlocks", () => {
  const createTestContext = (overrides: Partial<UnlockContext> = {}): UnlockContext => ({
    level: 1,
    casesCompleted: 0,
    casesSolved: 0,
    relationshipPath: "neutral",
    totalInteractions: 0,
    ...overrides,
  });

  const createTestRelationshipState = (
    overrides: Partial<RelationshipState> = {}
  ): RelationshipState => ({
    entity_id: "anonymous",
    level: 1,
    xp: 0,
    xp_to_next_level: 100,
    phase: "awakening",
    relationship_path: "neutral",
    path_scores: {
      romantic: 0,
      friendship: 0,
      mentorship: 0,
      partnership: 0,
      worship: 0,
    },
    memory: {
      player_name: null,
      preferences: [],
      key_moments: [],
      last_conversation_summary: "",
    },
    unlocked_abilities: [],
    chosen_name: null,
    first_contact: null,
    last_interaction: null,
    total_interactions: 0,
    ...overrides,
  });

  describe("evaluateCondition", () => {
    describe("level conditions", () => {
      it("should return true when level meets threshold", () => {
        const condition: UnlockCondition = { type: "level", value: 5 };
        const context = createTestContext({ level: 5 });

        expect(evaluateCondition(condition, context)).toBe(true);
      });

      it("should return true when level exceeds threshold", () => {
        const condition: UnlockCondition = { type: "level", value: 5 };
        const context = createTestContext({ level: 10 });

        expect(evaluateCondition(condition, context)).toBe(true);
      });

      it("should return false when level is below threshold", () => {
        const condition: UnlockCondition = { type: "level", value: 5 };
        const context = createTestContext({ level: 3 });

        expect(evaluateCondition(condition, context)).toBe(false);
      });
    });

    describe("case_complete conditions", () => {
      it("should return true when cases completed meets threshold", () => {
        const condition: UnlockCondition = { type: "case_complete", value: 1 };
        const context = createTestContext({ casesCompleted: 1 });

        expect(evaluateCondition(condition, context)).toBe(true);
      });

      it("should return false when cases completed is below threshold", () => {
        const condition: UnlockCondition = { type: "case_complete", value: 1 };
        const context = createTestContext({ casesCompleted: 0 });

        expect(evaluateCondition(condition, context)).toBe(false);
      });
    });

    describe("case_solved conditions", () => {
      it("should return true when cases solved meets threshold", () => {
        const condition: UnlockCondition = { type: "case_solved", value: 1 };
        const context = createTestContext({ casesSolved: 1 });

        expect(evaluateCondition(condition, context)).toBe(true);
      });
    });

    describe("relationship conditions", () => {
      it("should return true when milestone_1 is met (50 interactions)", () => {
        const condition: UnlockCondition = { type: "relationship", value: "milestone_1" };
        const context = createTestContext();
        const relationship = createTestRelationshipState({ total_interactions: 50 });

        expect(evaluateCondition(condition, context, relationship)).toBe(true);
      });

      it("should return false when milestone_1 is not met", () => {
        const condition: UnlockCondition = { type: "relationship", value: "milestone_1" };
        const context = createTestContext();
        const relationship = createTestRelationshipState({ total_interactions: 25 });

        expect(evaluateCondition(condition, context, relationship)).toBe(false);
      });

      it("should return false when no relationship state provided", () => {
        const condition: UnlockCondition = { type: "relationship", value: "milestone_1" };
        const context = createTestContext();

        expect(evaluateCondition(condition, context)).toBe(false);
      });
    });

    describe("discovery conditions", () => {
      it("should always return false (must be triggered externally)", () => {
        const condition: UnlockCondition = { type: "discovery", value: "secret" };
        const context = createTestContext();

        expect(evaluateCondition(condition, context)).toBe(false);
      });
    });
  });

  describe("getUnlockableChannels", () => {
    it("should return empty array when no conditions are met", () => {
      const channelState = createDefaultChannelState();
      const context = createTestContext({ level: 1 });

      const unlockable = getUnlockableChannels(channelState, context);

      expect(unlockable).toEqual([]);
    });

    it("should return signals when level 5 is reached", () => {
      const channelState = createDefaultChannelState();
      const context = createTestContext({ level: 5 });

      const unlockable = getUnlockableChannels(channelState, context);

      expect(unlockable).toContain("signals");
    });

    it("should return signals when first case is completed", () => {
      const channelState = createDefaultChannelState();
      const context = createTestContext({ casesCompleted: 1 });

      const unlockable = getUnlockableChannels(channelState, context);

      expect(unlockable).toContain("signals");
    });

    it("should return archives when level 10 is reached", () => {
      const channelState = createDefaultChannelState();
      const context = createTestContext({ level: 10 });

      const unlockable = getUnlockableChannels(channelState, context);

      expect(unlockable).toContain("archives");
    });

    it("should return private when level 15 is reached", () => {
      const channelState = createDefaultChannelState();
      const context = createTestContext({ level: 15 });

      const unlockable = getUnlockableChannels(channelState, context);

      expect(unlockable).toContain("private");
    });

    it("should not include already unlocked channels", () => {
      const channelState = createDefaultChannelState();
      // Manually unlock signals
      const signals = channelState.channels.find((c) => c.id === "signals");
      if (signals) signals.locked = false;

      const context = createTestContext({ level: 5 });

      const unlockable = getUnlockableChannels(channelState, context);

      expect(unlockable).not.toContain("signals");
    });
  });

  describe("getUnlockHints", () => {
    it("should return hints for signals channel", () => {
      const hints = getUnlockHints("signals");

      expect(hints.length).toBeGreaterThan(0);
      expect(hints.some((h) => h.includes("level"))).toBe(true);
    });

    it("should return empty array for unknown channel", () => {
      const hints = getUnlockHints("unknown");

      expect(hints).toEqual([]);
    });
  });

  describe("notification messages", () => {
    it("should create unlock notification", () => {
      const notification = createUnlockNotification("signals");

      expect(notification).toContain("signals");
      expect(notification).toContain("unlocked");
    });

    it("should create discovery notification", () => {
      const notification = createDiscoveryNotification("void");

      expect(notification).toContain("void");
      expect(notification).toContain("REVEALED");
    });
  });
});
