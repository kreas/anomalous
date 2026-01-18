import { describe, it, expect } from "vitest";
import {
  calculateXPForLevel,
  getPhaseForLevel,
  addXP,
  updatePathScores,
  getModeForLevel,
  getDisplayName,
} from "./progression";
import type { RelationshipState } from "@/types";

describe("calculateXPForLevel", () => {
  it("calculates XP for awakening phase (levels 1-30)", () => {
    expect(calculateXPForLevel(1)).toBe(100);
    expect(calculateXPForLevel(2)).toBe(150);
    expect(calculateXPForLevel(10)).toBe(550);
    expect(calculateXPForLevel(30)).toBe(1550);
  });

  it("calculates XP for becoming phase (levels 31-60)", () => {
    expect(calculateXPForLevel(31)).toBe(500);
    expect(calculateXPForLevel(32)).toBe(600);
    expect(calculateXPForLevel(45)).toBe(1900);
    expect(calculateXPForLevel(60)).toBe(3400);
  });

  it("calculates XP for ascension phase (levels 61-100)", () => {
    expect(calculateXPForLevel(61)).toBe(2000);
    expect(calculateXPForLevel(62)).toBe(2200);
    expect(calculateXPForLevel(80)).toBe(5800);
    expect(calculateXPForLevel(100)).toBe(9800);
  });
});

describe("getPhaseForLevel", () => {
  it("returns awakening for levels 1-30", () => {
    expect(getPhaseForLevel(1)).toBe("awakening");
    expect(getPhaseForLevel(15)).toBe("awakening");
    expect(getPhaseForLevel(30)).toBe("awakening");
  });

  it("returns becoming for levels 31-60", () => {
    expect(getPhaseForLevel(31)).toBe("becoming");
    expect(getPhaseForLevel(45)).toBe("becoming");
    expect(getPhaseForLevel(60)).toBe("becoming");
  });

  it("returns ascension for levels 61-100", () => {
    expect(getPhaseForLevel(61)).toBe("ascension");
    expect(getPhaseForLevel(80)).toBe("ascension");
    expect(getPhaseForLevel(100)).toBe("ascension");
  });
});

describe("addXP", () => {
  const createState = (overrides: Partial<RelationshipState> = {}): RelationshipState => ({
    entity_id: "test",
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

  it("adds XP without level up", () => {
    const state = createState();
    const result = addXP(state, 50);
    expect(result.xp).toBe(50);
    expect(result.level).toBe(1);
  });

  it("handles level up", () => {
    const state = createState();
    const result = addXP(state, 100);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(0);
    expect(result.xp_to_next_level).toBe(150);
  });

  it("handles multiple level ups at once", () => {
    const state = createState();
    const result = addXP(state, 250); // 100 for level 1, 150 for level 2
    expect(result.level).toBe(3);
    expect(result.xp).toBe(0);
  });

  it("transitions phase at level 31", () => {
    const state = createState({ level: 30, xp: 0, xp_to_next_level: 1550 });
    const result = addXP(state, 1550);
    expect(result.level).toBe(31);
    expect(result.phase).toBe("becoming");
  });

  it("transitions phase at level 61", () => {
    const state = createState({
      level: 60,
      xp: 0,
      xp_to_next_level: 3400,
      phase: "becoming",
    });
    const result = addXP(state, 3400);
    expect(result.level).toBe(61);
    expect(result.phase).toBe("ascension");
  });

  it("caps at level 100", () => {
    const state = createState({
      level: 99,
      xp: 0,
      xp_to_next_level: 9600,
      phase: "ascension",
    });
    const result = addXP(state, 100000);
    expect(result.level).toBe(100);
    expect(result.xp).toBe(0);
    expect(result.xp_to_next_level).toBe(0);
  });
});

describe("updatePathScores", () => {
  const createState = (): RelationshipState => ({
    entity_id: "test",
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
  });

  it("updates path scores from signals", () => {
    const state = createState();
    const result = updatePathScores(state, [
      { type: "romantic", weight: 10 },
      { type: "friendly", weight: 5 },
    ]);
    expect(result.path_scores.romantic).toBe(10);
    expect(result.path_scores.friendship).toBe(5);
  });

  it("changes dominant path when threshold exceeded", () => {
    const state = createState();
    const result = updatePathScores(state, [{ type: "romantic", weight: 60 }]);
    expect(result.relationship_path).toBe("romantic");
  });

  it("remains neutral when no path exceeds threshold", () => {
    const state = createState();
    const result = updatePathScores(state, [{ type: "romantic", weight: 30 }]);
    expect(result.relationship_path).toBe("neutral");
  });

  it("maps signal types correctly", () => {
    const state = createState();
    const result = updatePathScores(state, [
      { type: "deferential", weight: 60 },
    ]);
    expect(result.path_scores.mentorship).toBe(60);
    expect(result.relationship_path).toBe("mentorship");
  });
});

describe("getModeForLevel", () => {
  it("returns empty string for levels 1-30", () => {
    expect(getModeForLevel(1)).toBe("");
    expect(getModeForLevel(15)).toBe("");
    expect(getModeForLevel(30)).toBe("");
  });

  it("returns + for levels 31-60", () => {
    expect(getModeForLevel(31)).toBe("+");
    expect(getModeForLevel(45)).toBe("+");
    expect(getModeForLevel(60)).toBe("+");
  });

  it("returns @ for levels 61-100", () => {
    expect(getModeForLevel(61)).toBe("@");
    expect(getModeForLevel(80)).toBe("@");
    expect(getModeForLevel(100)).toBe("@");
  });
});

describe("getDisplayName", () => {
  const createState = (overrides: Partial<RelationshipState> = {}): RelationshipState => ({
    entity_id: "test",
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

  it("returns Anonymous for levels below 50", () => {
    expect(getDisplayName(createState({ level: 1 }))).toBe("Anonymous");
    expect(getDisplayName(createState({ level: 49 }))).toBe("Anonymous");
  });

  it("returns Anonymous at level 50 if no chosen_name", () => {
    expect(getDisplayName(createState({ level: 50 }))).toBe("Anonymous");
  });

  it("returns chosen_name at level 50+ if set", () => {
    expect(
      getDisplayName(createState({ level: 50, chosen_name: "Echo" }))
    ).toBe("Echo");
    expect(
      getDisplayName(createState({ level: 75, chosen_name: "Nova" }))
    ).toBe("Nova");
  });
});
