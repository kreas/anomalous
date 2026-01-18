import { describe, it, expect } from "vitest";
import { substituteTemplates } from "./templates";

describe("substituteTemplates", () => {
  it("replaces {{char}} with character name", () => {
    const result = substituteTemplates("Hello {{char}}", "Anonymous", "Player");
    expect(result).toBe("Hello Anonymous");
  });

  it("replaces {{user}} with user name", () => {
    const result = substituteTemplates("Hello {{user}}", "Anonymous", "Player");
    expect(result).toBe("Hello Player");
  });

  it("replaces both {{char}} and {{user}}", () => {
    const result = substituteTemplates(
      "{{char}} greets {{user}}",
      "Anonymous",
      "Player"
    );
    expect(result).toBe("Anonymous greets Player");
  });

  it("handles case-insensitive replacements", () => {
    const result = substituteTemplates(
      "{{CHAR}} and {{USER}} and {{Char}} and {{User}}",
      "Anonymous",
      "Player"
    );
    expect(result).toBe("Anonymous and Player and Anonymous and Player");
  });

  it("handles multiple occurrences", () => {
    const result = substituteTemplates(
      "{{char}} said hello to {{user}}. {{user}} replied to {{char}}.",
      "Anonymous",
      "Player"
    );
    expect(result).toBe(
      "Anonymous said hello to Player. Player replied to Anonymous."
    );
  });

  it("returns empty string for null/undefined input", () => {
    expect(substituteTemplates("", "Anonymous", "Player")).toBe("");
  });

  it("returns original text when no templates present", () => {
    const result = substituteTemplates("Hello world", "Anonymous", "Player");
    expect(result).toBe("Hello world");
  });
});
