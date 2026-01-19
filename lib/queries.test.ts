import { describe, it, expect } from "vitest";
import {
  getQueryWindowId,
  createQueryWindow,
  findQueryWindowByTarget,
  isQueryWindowId,
  getTargetUserIdFromQueryId,
} from "./queries";
import { createDefaultChannelState } from "./channels";

describe("queries", () => {
  describe("getQueryWindowId", () => {
    it("should generate query window ID from target user ID", () => {
      const id = getQueryWindowId("anonymous");
      expect(id).toBe("query-anonymous");
    });

    it("should handle complex user IDs", () => {
      const id = getQueryWindowId("user-123-456");
      expect(id).toBe("query-user-123-456");
    });
  });

  describe("createQueryWindow", () => {
    it("should create a query window with correct properties", () => {
      const queryWindow = createQueryWindow("user-123", "TestUser");

      expect(queryWindow.id).toBe("query-user-123");
      expect(queryWindow.name).toBe("TestUser");
      expect(queryWindow.type).toBe("query");
      expect(queryWindow.locked).toBe(false);
      expect(queryWindow.unreadCount).toBe(0);
      expect(queryWindow.targetUserId).toBe("user-123");
      expect(queryWindow.targetUsername).toBe("TestUser");
    });
  });

  describe("findQueryWindowByTarget", () => {
    it("should find a query window by target user ID", () => {
      const state = createDefaultChannelState();
      const queryWindow = createQueryWindow("test-user", "TestUser");
      state.queryWindows.push(queryWindow);

      const found = findQueryWindowByTarget(state, "test-user");

      expect(found).toBeDefined();
      expect(found?.targetUserId).toBe("test-user");
    });

    it("should return undefined when query window does not exist", () => {
      const state = createDefaultChannelState();

      const found = findQueryWindowByTarget(state, "nonexistent");

      expect(found).toBeUndefined();
    });
  });

  describe("isQueryWindowId", () => {
    it("should return true for query window IDs", () => {
      expect(isQueryWindowId("query-anonymous")).toBe(true);
      expect(isQueryWindowId("query-user-123")).toBe(true);
    });

    it("should return false for regular channel IDs", () => {
      expect(isQueryWindowId("lobby")).toBe(false);
      expect(isQueryWindowId("mysteries")).toBe(false);
      expect(isQueryWindowId("querynotvalid")).toBe(false);
    });
  });

  describe("getTargetUserIdFromQueryId", () => {
    it("should extract target user ID from query window ID", () => {
      expect(getTargetUserIdFromQueryId("query-anonymous")).toBe("anonymous");
      expect(getTargetUserIdFromQueryId("query-user-123")).toBe("user-123");
    });

    it("should return null for non-query IDs", () => {
      expect(getTargetUserIdFromQueryId("lobby")).toBeNull();
      expect(getTargetUserIdFromQueryId("mysteries")).toBeNull();
    });
  });
});
