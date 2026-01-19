import { describe, it, expect } from "vitest";
import {
  calculateEvidenceCompleteness,
  getMissingEvidenceHints,
  checkTwistConditions,
  calculateOutcome,
  calculateRewards,
  resolveCase,
} from "./case-resolution";
import type { Case, Evidence, EvidenceConnection } from "@/types";

// Helper to create test case
function createTestCase(overrides: Partial<Case> = {}): Case {
  return {
    id: "test-case",
    title: "Test Case",
    description: "Test description",
    briefing: "Test briefing",
    type: "recovery",
    rarity: "common",
    status: "in_progress",
    requiredEvidence: [
      { type: "data_fragment", count: 2, hint: "data files" },
      { type: "testimony", count: 1, hint: "witness statement" },
    ],
    rewards: {
      xp: 100,
      fragments: 50,
      entityXp: 20,
    },
    postedAt: "2026-01-18T12:00:00.000Z",
    source: "system_alert",
    ...overrides,
  };
}

// Helper to create test evidence
function createTestEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "ev-1",
    name: "Test Evidence",
    description: "Test description",
    type: "data_fragment",
    rarity: "common",
    acquiredAt: "2026-01-18T12:00:00.000Z",
    examined: true,
    ...overrides,
  };
}

describe("case-resolution", () => {
  describe("calculateEvidenceCompleteness", () => {
    it("returns 1 for case with no requirements", () => {
      const caseData = createTestCase({ requiredEvidence: [] });
      const evidence: Evidence[] = [];

      const result = calculateEvidenceCompleteness(caseData, evidence);
      expect(result).toBe(1);
    });

    it("returns 0 when no evidence matches", () => {
      const caseData = createTestCase();
      const evidence: Evidence[] = [];

      const result = calculateEvidenceCompleteness(caseData, evidence);
      expect(result).toBe(0);
    });

    it("returns partial score for partial evidence", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        // Missing: 1 data_fragment, 1 testimony
      ];

      const result = calculateEvidenceCompleteness(caseData, evidence);
      // 1 out of 3 total required
      expect(result).toBeCloseTo(0.333, 2);
    });

    it("returns 1 when all requirements satisfied", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];

      const result = calculateEvidenceCompleteness(caseData, evidence);
      expect(result).toBe(1);
    });

    it("caps at requirement count (no bonus for extra)", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "data_fragment" }), // Extra
        createTestEvidence({ id: "ev-4", type: "testimony" }),
      ];

      const result = calculateEvidenceCompleteness(caseData, evidence);
      expect(result).toBe(1);
    });
  });

  describe("getMissingEvidenceHints", () => {
    it("returns empty array when all requirements met", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];

      const hints = getMissingEvidenceHints(caseData, evidence);
      expect(hints).toEqual([]);
    });

    it("returns hints for missing evidence", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
      ];

      const hints = getMissingEvidenceHints(caseData, evidence);
      expect(hints).toHaveLength(2);
      expect(hints[0]).toContain("data files");
      expect(hints[1]).toContain("witness statement");
    });
  });

  describe("checkTwistConditions", () => {
    it("returns false when evidence incomplete", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
      ];
      const connections: EvidenceConnection[] = [];

      const result = checkTwistConditions(caseData, evidence, connections);
      expect(result).toBe(false);
    });

    it("returns false when no relevant connections", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];
      const connections: EvidenceConnection[] = [];

      const result = checkTwistConditions(caseData, evidence, connections);
      expect(result).toBe(false);
    });

    it("returns true when evidence complete and relevant connection found", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];
      const connections: EvidenceConnection[] = [
        {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
          reward: { caseProgress: "test-case" },
        },
      ];

      const result = checkTwistConditions(caseData, evidence, connections);
      expect(result).toBe(true);
    });
  });

  describe("calculateOutcome", () => {
    it("returns cold for insufficient evidence", () => {
      const caseData = createTestCase();
      const evidence: Evidence[] = [];
      const connections: EvidenceConnection[] = [];

      const result = calculateOutcome(caseData, evidence, connections);
      expect(result).toBe("cold");
    });

    it("returns partial for 50-89% evidence", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        // Missing testimony - 2/3 = 66%
      ];
      const connections: EvidenceConnection[] = [];

      const result = calculateOutcome(caseData, evidence, connections);
      expect(result).toBe("partial");
    });

    it("returns solved for 90%+ evidence", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];
      const connections: EvidenceConnection[] = [];

      const result = calculateOutcome(caseData, evidence, connections);
      expect(result).toBe("solved");
    });

    it("returns twist when conditions met", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];
      const connections: EvidenceConnection[] = [
        {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
          reward: { caseProgress: "test-case" },
        },
      ];

      const result = calculateOutcome(caseData, evidence, connections);
      expect(result).toBe("twist");
    });

    it("returns cold for expired/cold status cases", () => {
      const caseData = createTestCase({ status: "cold" });
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
      ];
      const connections: EvidenceConnection[] = [];

      const result = calculateOutcome(caseData, evidence, connections);
      expect(result).toBe("cold");
    });
  });

  describe("calculateRewards", () => {
    it("returns full rewards for solved", () => {
      const caseData = createTestCase();
      const rewards = calculateRewards(caseData, "solved");

      expect(rewards.xp).toBe(100);
      expect(rewards.fragments).toBe(50);
      expect(rewards.entityXp).toBe(20);
    });

    it("returns 60% rewards for partial", () => {
      const caseData = createTestCase();
      const rewards = calculateRewards(caseData, "partial");

      expect(rewards.xp).toBe(60);
      expect(rewards.fragments).toBe(30);
      expect(rewards.entityXp).toBe(12);
    });

    it("returns 30% rewards for cold", () => {
      const caseData = createTestCase();
      const rewards = calculateRewards(caseData, "cold");

      expect(rewards.xp).toBe(30);
      expect(rewards.fragments).toBe(15);
      expect(rewards.entityXp).toBe(6);
    });

    it("returns 150% rewards for twist", () => {
      const caseData = createTestCase();
      const rewards = calculateRewards(caseData, "twist");

      expect(rewards.xp).toBe(150);
      expect(rewards.fragments).toBe(75);
      expect(rewards.entityXp).toBe(30);
    });

    it("includes bonus evidence for twist", () => {
      const caseData = createTestCase({
        rewards: {
          xp: 100,
          fragments: 50,
          entityXp: 20,
          bonusEvidence: ["bonus-ev-1"],
        },
      });
      const rewards = calculateRewards(caseData, "twist");

      expect(rewards.bonusEvidence).toEqual(["bonus-ev-1"]);
    });

    it("includes unlocks for solved and twist", () => {
      const caseData = createTestCase({
        rewards: {
          xp: 100,
          fragments: 50,
          entityXp: 20,
          unlocks: ["#archives"],
        },
      });

      const solvedRewards = calculateRewards(caseData, "solved");
      expect(solvedRewards.unlocks).toEqual(["#archives"]);

      const twistRewards = calculateRewards(caseData, "twist");
      expect(twistRewards.unlocks).toEqual(["#archives"]);

      const partialRewards = calculateRewards(caseData, "partial");
      expect(partialRewards.unlocks).toBeUndefined();
    });
  });

  describe("resolveCase", () => {
    it("returns cold with hints when insufficient evidence", () => {
      const caseData = createTestCase();
      const evidence: Evidence[] = [];
      const connections: EvidenceConnection[] = [];

      const result = resolveCase(caseData, evidence, connections, "My theory");

      expect(result.outcome).toBe("cold");
      expect(result.missingHints).toBeDefined();
      expect(result.missingHints!.length).toBeGreaterThan(0);
    });

    it("returns full resolution for adequate evidence", () => {
      const caseData = createTestCase();
      const evidence = [
        createTestEvidence({ id: "ev-1", type: "data_fragment" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "testimony" }),
      ];
      const connections: EvidenceConnection[] = [];

      const result = resolveCase(
        caseData,
        evidence,
        connections,
        "The data was corrupted"
      );

      expect(result.outcome).toBe("solved");
      expect(result.rewards.xp).toBe(100);
      expect(result.description).toContain("solved");
      expect(result.formattedRewards).toContain("+100 XP");
    });
  });
});
