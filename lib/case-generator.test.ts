import { describe, it, expect } from "vitest";
import {
  createTutorialCase,
  createTutorialEvidence,
  createStarterCases,
  createStarterEvidence,
  getStarterContent,
  generateEvidenceId,
} from "./case-generator";

describe("case-generator", () => {
  describe("generateEvidenceId", () => {
    it("generates unique IDs with type prefix", () => {
      const id1 = generateEvidenceId("chat_log");
      const id2 = generateEvidenceId("chat_log");

      expect(id1).toMatch(/^chat-/);
      expect(id2).toMatch(/^chat-/);
      expect(id1).not.toBe(id2);
    });

    it("handles different evidence types", () => {
      expect(generateEvidenceId("data_fragment")).toMatch(/^data-/);
      expect(generateEvidenceId("testimony")).toMatch(/^test-/);
      expect(generateEvidenceId("access_key")).toMatch(/^acce-/);
    });
  });

  describe("createTutorialCase", () => {
    it("creates a valid tutorial case", () => {
      const tutorialCase = createTutorialCase();

      expect(tutorialCase.id).toBe("tutorial-welcome");
      expect(tutorialCase.title).toBe("Welcome Protocol");
      expect(tutorialCase.type).toBe("recovery");
      expect(tutorialCase.rarity).toBe("common");
      expect(tutorialCase.status).toBe("available");
      expect(tutorialCase.requiredEvidence).toHaveLength(1);
      expect(tutorialCase.rewards.xp).toBeGreaterThan(0);
    });

    it("requires the tutorial evidence specifically", () => {
      const tutorialCase = createTutorialCase();
      const req = tutorialCase.requiredEvidence[0];

      expect(req.type).toBe("data_fragment");
      expect(req.specific).toContain("tutorial-welcome-data");
    });
  });

  describe("createTutorialEvidence", () => {
    it("creates valid tutorial evidence", () => {
      const evidence = createTutorialEvidence();

      expect(evidence.id).toBe("tutorial-welcome-data");
      expect(evidence.type).toBe("data_fragment");
      expect(evidence.rarity).toBe("common");
      expect(evidence.examined).toBe(false);
      expect(evidence.content).toBeDefined();
      expect(evidence.caseRelevance).toContain("tutorial-welcome");
    });

    it("has corruption metadata for visual effect", () => {
      const evidence = createTutorialEvidence();

      expect(evidence.metadata?.corruptionLevel).toBeDefined();
      expect(evidence.metadata?.corruptionLevel).toBeLessThan(1);
    });
  });

  describe("createStarterCases", () => {
    it("creates multiple starter cases", () => {
      const cases = createStarterCases();

      expect(cases.length).toBeGreaterThanOrEqual(5);
    });

    it("includes tutorial case", () => {
      const cases = createStarterCases();
      const tutorial = cases.find((c) => c.id === "tutorial-welcome");

      expect(tutorial).toBeDefined();
    });

    it("has variety of case types", () => {
      const cases = createStarterCases();
      const types = new Set(cases.map((c) => c.type));

      expect(types.size).toBeGreaterThanOrEqual(3);
    });

    it("has variety of rarities", () => {
      const cases = createStarterCases();
      const rarities = new Set(cases.map((c) => c.rarity));

      expect(rarities.has("common")).toBe(true);
      expect(rarities.has("uncommon")).toBe(true);
    });

    it("all cases have valid structure", () => {
      const cases = createStarterCases();

      for (const c of cases) {
        expect(c.id).toBeDefined();
        expect(c.title).toBeDefined();
        expect(c.description).toBeDefined();
        expect(c.briefing).toBeDefined();
        expect(c.type).toBeDefined();
        expect(c.rarity).toBeDefined();
        expect(c.status).toBe("available");
        expect(c.requiredEvidence.length).toBeGreaterThan(0);
        expect(c.rewards.xp).toBeGreaterThan(0);
        expect(c.rewards.fragments).toBeGreaterThan(0);
        expect(c.rewards.entityXp).toBeGreaterThan(0);
      }
    });
  });

  describe("createStarterEvidence", () => {
    it("creates multiple evidence items", () => {
      const evidence = createStarterEvidence();

      expect(evidence.length).toBeGreaterThanOrEqual(10);
    });

    it("includes tutorial evidence", () => {
      const evidence = createStarterEvidence();
      const tutorial = evidence.find((e) => e.id === "tutorial-welcome-data");

      expect(tutorial).toBeDefined();
    });

    it("has variety of evidence types", () => {
      const evidence = createStarterEvidence();
      const types = new Set(evidence.map((e) => e.type));

      expect(types.has("chat_log")).toBe(true);
      expect(types.has("data_fragment")).toBe(true);
      expect(types.has("testimony")).toBe(true);
      expect(types.has("access_key")).toBe(true);
      expect(types.has("coordinates")).toBe(true);
    });

    it("evidence links to cases", () => {
      const evidence = createStarterEvidence();
      const withRelevance = evidence.filter(
        (e) => e.caseRelevance && e.caseRelevance.length > 0
      );

      expect(withRelevance.length).toBeGreaterThan(0);
    });

    it("some evidence has connections", () => {
      const evidence = createStarterEvidence();
      const withConnections = evidence.filter(
        (e) => e.connections && e.connections.length > 0
      );

      expect(withConnections.length).toBeGreaterThan(0);
    });

    it("all evidence has valid structure", () => {
      const evidence = createStarterEvidence();

      for (const e of evidence) {
        expect(e.id).toBeDefined();
        expect(e.name).toBeDefined();
        expect(e.description).toBeDefined();
        expect(e.type).toBeDefined();
        expect(e.rarity).toBeDefined();
        expect(e.examined).toBe(false);
        expect(e.acquiredAt).toBeDefined();
      }
    });
  });

  describe("getStarterContent", () => {
    it("returns both cases and evidence", () => {
      const content = getStarterContent();

      expect(content.cases).toBeDefined();
      expect(content.evidence).toBeDefined();
      expect(content.cases.length).toBeGreaterThan(0);
      expect(content.evidence.length).toBeGreaterThan(0);
    });

    it("evidence covers all case requirements", () => {
      const { cases, evidence } = getStarterContent();

      // Check that at least tutorial case can be completed
      const tutorialCase = cases.find((c) => c.id === "tutorial-welcome");
      const tutorialEvidence = evidence.find(
        (e) => e.id === "tutorial-welcome-data"
      );

      expect(tutorialCase).toBeDefined();
      expect(tutorialEvidence).toBeDefined();
      expect(tutorialEvidence?.caseRelevance).toContain("tutorial-welcome");
    });
  });
});
