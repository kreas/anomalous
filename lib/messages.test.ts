import { describe, it, expect } from "vitest";
import {
  generateMessageId,
  createChannelMessage,
  createSystemMessage,
} from "./messages";

describe("messages", () => {
  describe("generateMessageId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateMessageId();
      const id2 = generateMessageId();

      expect(id1).not.toBe(id2);
    });

    it("should start with 'msg-'", () => {
      const id = generateMessageId();

      expect(id.startsWith("msg-")).toBe(true);
    });
  });

  describe("createChannelMessage", () => {
    it("should create a message with correct properties", () => {
      const message = createChannelMessage(
        "lobby",
        "user-123",
        "TestUser",
        "Hello, world!"
      );

      expect(message.channelId).toBe("lobby");
      expect(message.userId).toBe("user-123");
      expect(message.username).toBe("TestUser");
      expect(message.content).toBe("Hello, world!");
      expect(message.type).toBe("message");
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
    });

    it("should accept custom message type", () => {
      const message = createChannelMessage(
        "lobby",
        "user-123",
        "TestUser",
        "waves",
        "action"
      );

      expect(message.type).toBe("action");
    });

    it("should set timestamp to current time", () => {
      const before = new Date().toISOString();
      const message = createChannelMessage(
        "lobby",
        "user-123",
        "TestUser",
        "Hello"
      );
      const after = new Date().toISOString();

      expect(message.timestamp >= before).toBe(true);
      expect(message.timestamp <= after).toBe(true);
    });
  });

  describe("createSystemMessage", () => {
    it("should create a system message with correct properties", () => {
      const message = createSystemMessage("lobby", "Welcome to the channel!");

      expect(message.channelId).toBe("lobby");
      expect(message.userId).toBe("system");
      expect(message.username).toBe("***");
      expect(message.content).toBe("Welcome to the channel!");
      expect(message.type).toBe("system");
    });
  });
});
