import { describe, it, expect } from "vitest";
import {
  getUserProfilePath,
  getEntityPath,
  getRelationshipPath,
  getConversationPath,
  getGameStatePath,
  getEntitiesPrefix,
  getRelationshipsPrefix,
} from "./paths";

describe("Path Helpers", () => {
  const userId = "user-123";
  const entityId = "anonymous";
  const timestamp = "2024-01-15T10:30:00Z";

  describe("getUserProfilePath", () => {
    it("returns correct profile path", () => {
      expect(getUserProfilePath(userId)).toBe("users/user-123/profile.json");
    });
  });

  describe("getEntityPath", () => {
    it("returns correct entity path", () => {
      expect(getEntityPath(userId, entityId)).toBe(
        "users/user-123/entities/anonymous.json"
      );
    });
  });

  describe("getRelationshipPath", () => {
    it("returns correct relationship path", () => {
      expect(getRelationshipPath(userId, entityId)).toBe(
        "users/user-123/relationships/anonymous.json"
      );
    });
  });

  describe("getConversationPath", () => {
    it("returns correct conversation path", () => {
      expect(getConversationPath(userId, entityId, timestamp)).toBe(
        "users/user-123/conversations/anonymous/2024-01-15T10:30:00Z.json"
      );
    });
  });

  describe("getGameStatePath", () => {
    it("returns correct game state path", () => {
      expect(getGameStatePath(userId)).toBe("users/user-123/game-state.json");
    });
  });

  describe("getEntitiesPrefix", () => {
    it("returns correct entities prefix", () => {
      expect(getEntitiesPrefix(userId)).toBe("users/user-123/entities/");
    });
  });

  describe("getRelationshipsPrefix", () => {
    it("returns correct relationships prefix", () => {
      expect(getRelationshipsPrefix(userId)).toBe(
        "users/user-123/relationships/"
      );
    });
  });
});
