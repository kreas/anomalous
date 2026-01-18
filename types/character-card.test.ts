import { describe, it, expect } from "vitest";
import { isValidCharacterCard } from "./character-card";
import defaultAnonymous from "@/data/entities/anonymous.json";

describe("isValidCharacterCard", () => {
  it("validates the default anonymous card", () => {
    expect(isValidCharacterCard(defaultAnonymous)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidCharacterCard(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isValidCharacterCard(undefined)).toBe(false);
  });

  it("rejects non-objects", () => {
    expect(isValidCharacterCard("string")).toBe(false);
    expect(isValidCharacterCard(123)).toBe(false);
    expect(isValidCharacterCard([])).toBe(false);
  });

  it("rejects invalid spec", () => {
    expect(
      isValidCharacterCard({
        spec: "chara_card_v1",
        spec_version: "2.0",
        data: { name: "Test", personality: "Test", extensions: { anomanet: { entity_type: "npc" } } },
      })
    ).toBe(false);
  });

  it("rejects invalid spec_version", () => {
    expect(
      isValidCharacterCard({
        spec: "chara_card_v2",
        spec_version: "1.0",
        data: { name: "Test", personality: "Test", extensions: { anomanet: { entity_type: "npc" } } },
      })
    ).toBe(false);
  });

  it("rejects missing data", () => {
    expect(
      isValidCharacterCard({
        spec: "chara_card_v2",
        spec_version: "2.0",
      })
    ).toBe(false);
  });

  it("rejects missing name", () => {
    expect(
      isValidCharacterCard({
        spec: "chara_card_v2",
        spec_version: "2.0",
        data: { personality: "Test", extensions: { anomanet: { entity_type: "npc" } } },
      })
    ).toBe(false);
  });

  it("rejects invalid entity_type", () => {
    expect(
      isValidCharacterCard({
        spec: "chara_card_v2",
        spec_version: "2.0",
        data: {
          name: "Test",
          personality: "Test",
          extensions: { anomanet: { entity_type: "invalid" } },
        },
      })
    ).toBe(false);
  });

  it("accepts valid minimal card", () => {
    expect(
      isValidCharacterCard({
        spec: "chara_card_v2",
        spec_version: "2.0",
        data: {
          name: "Test",
          personality: "Test",
          extensions: {
            anomanet: {
              entity_type: "npc",
              customizable: false,
              level_unlocked: 0,
              abilities: [],
            },
          },
        },
      })
    ).toBe(true);
  });
});
