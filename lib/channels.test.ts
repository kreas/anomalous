import { describe, it, expect } from "vitest";
import {
  createDefaultChannelState,
  getChannelById,
  isChannelUnlocked,
  getVisibleChannels,
} from "./channels";

describe("channels", () => {
  describe("createDefaultChannelState", () => {
    it("should create default channel state with correct channels", () => {
      const state = createDefaultChannelState();

      expect(state.channels).toHaveLength(7);
      expect(state.queryWindows).toHaveLength(0);
      expect(state.lastUpdated).toBeDefined();
    });

    it("should have lobby, mysteries, tech-support, off-topic unlocked", () => {
      const state = createDefaultChannelState();

      const lobby = state.channels.find((c) => c.id === "lobby");
      const mysteries = state.channels.find((c) => c.id === "mysteries");
      const techSupport = state.channels.find((c) => c.id === "tech-support");
      const offTopic = state.channels.find((c) => c.id === "off-topic");

      expect(lobby?.locked).toBe(false);
      expect(mysteries?.locked).toBe(false);
      expect(techSupport?.locked).toBe(false);
      expect(offTopic?.locked).toBe(false);
    });

    it("should have signals, archives, private locked", () => {
      const state = createDefaultChannelState();

      const signals = state.channels.find((c) => c.id === "signals");
      const archives = state.channels.find((c) => c.id === "archives");
      const privateChannel = state.channels.find((c) => c.id === "private");

      expect(signals?.locked).toBe(true);
      expect(archives?.locked).toBe(true);
      expect(privateChannel?.locked).toBe(true);
    });

    it("should initialize all channels with zero unread count", () => {
      const state = createDefaultChannelState();

      for (const channel of state.channels) {
        expect(channel.unreadCount).toBe(0);
      }
    });
  });

  describe("getChannelById", () => {
    it("should find a channel by ID", () => {
      const state = createDefaultChannelState();

      const channel = getChannelById(state, "lobby");
      expect(channel).toBeDefined();
      expect(channel?.id).toBe("lobby");
      expect(channel?.name).toBe("lobby");
    });

    it("should find a query window by ID", () => {
      const state = createDefaultChannelState();
      state.queryWindows.push({
        id: "query-test",
        name: "TestUser",
        type: "query",
        locked: false,
        unreadCount: 0,
        targetUserId: "test",
        targetUsername: "TestUser",
      });

      const queryWindow = getChannelById(state, "query-test");
      expect(queryWindow).toBeDefined();
      expect(queryWindow?.id).toBe("query-test");
    });

    it("should return undefined for non-existent channel", () => {
      const state = createDefaultChannelState();

      const channel = getChannelById(state, "nonexistent");
      expect(channel).toBeUndefined();
    });
  });

  describe("isChannelUnlocked", () => {
    it("should return true for unlocked channels", () => {
      const state = createDefaultChannelState();

      expect(isChannelUnlocked(state, "lobby")).toBe(true);
      expect(isChannelUnlocked(state, "mysteries")).toBe(true);
    });

    it("should return false for locked channels", () => {
      const state = createDefaultChannelState();

      expect(isChannelUnlocked(state, "signals")).toBe(false);
      expect(isChannelUnlocked(state, "archives")).toBe(false);
    });

    it("should return false for non-existent channels", () => {
      const state = createDefaultChannelState();

      expect(isChannelUnlocked(state, "nonexistent")).toBe(false);
    });
  });

  describe("getVisibleChannels", () => {
    it("should return all non-hidden channels", () => {
      const state = createDefaultChannelState();

      const visible = getVisibleChannels(state);
      expect(visible).toHaveLength(7);
    });

    it("should exclude hidden channels", () => {
      const state = createDefaultChannelState();
      // Mark a channel as hidden
      const lobby = state.channels.find((c) => c.id === "lobby");
      if (lobby) {
        lobby.hidden = true;
      }

      const visible = getVisibleChannels(state);
      expect(visible).toHaveLength(6);
      expect(visible.find((c) => c.id === "lobby")).toBeUndefined();
    });
  });
});
