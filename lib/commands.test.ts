import { describe, it, expect } from "vitest";
import {
  parseCommand,
  executeCommand,
  getCommand,
  getCommandHelp,
  listCommands,
  type CommandContext,
} from "./commands";
import { createDefaultChannelState } from "./channels";

describe("commands", () => {
  const createTestContext = (): CommandContext => ({
    userId: "test-user",
    currentChannel: "lobby",
    channelState: createDefaultChannelState(),
    entityUsers: [
      { id: "anonymous", name: "Anonymous" },
      { id: "npc-1", name: "TestNPC" },
    ],
  });

  describe("parseCommand", () => {
    it("should parse a simple command", () => {
      const parsed = parseCommand("/help");

      expect(parsed).not.toBeNull();
      expect(parsed?.command).toBe("help");
      expect(parsed?.args).toEqual([]);
      expect(parsed?.raw).toBe("/help");
    });

    it("should parse a command with arguments", () => {
      const parsed = parseCommand("/join #mysteries");

      expect(parsed).not.toBeNull();
      expect(parsed?.command).toBe("join");
      expect(parsed?.args).toEqual(["#mysteries"]);
    });

    it("should parse a command with multiple arguments", () => {
      const parsed = parseCommand("/msg Anonymous hello world");

      expect(parsed).not.toBeNull();
      expect(parsed?.command).toBe("msg");
      expect(parsed?.args).toEqual(["Anonymous", "hello", "world"]);
    });

    it("should return null for non-commands", () => {
      expect(parseCommand("hello")).toBeNull();
      expect(parseCommand("")).toBeNull();
      expect(parseCommand("hello /world")).toBeNull();
    });

    it("should handle leading spaces", () => {
      const parsed = parseCommand("  /help");

      expect(parsed).not.toBeNull();
      expect(parsed?.command).toBe("help");
    });
  });

  describe("getCommand", () => {
    it("should find a command by name", () => {
      const command = getCommand("help");

      expect(command).toBeDefined();
      expect(command?.name).toBe("help");
    });

    it("should find a command by alias", () => {
      const command = getCommand("j");

      expect(command).toBeDefined();
      expect(command?.name).toBe("join");
    });

    it("should be case-insensitive", () => {
      const command = getCommand("HELP");

      expect(command).toBeDefined();
      expect(command?.name).toBe("help");
    });

    it("should return undefined for unknown commands", () => {
      const command = getCommand("unknown");

      expect(command).toBeUndefined();
    });
  });

  describe("getCommandHelp", () => {
    it("should return help text for a command", () => {
      const help = getCommandHelp("help");

      expect(help).toBeDefined();
      expect(help).toContain("help");
      expect(help).toContain("Usage:");
    });

    it("should return null for unknown commands", () => {
      const help = getCommandHelp("unknown");

      expect(help).toBeNull();
    });
  });

  describe("listCommands", () => {
    it("should return all registered commands", () => {
      const commands = listCommands();

      expect(commands.length).toBeGreaterThan(0);
      expect(commands.find((c) => c.name === "help")).toBeDefined();
      expect(commands.find((c) => c.name === "join")).toBeDefined();
      expect(commands.find((c) => c.name === "msg")).toBeDefined();
    });

    it("should not include duplicates from aliases", () => {
      const commands = listCommands();
      const names = commands.map((c) => c.name);
      const uniqueNames = [...new Set(names)];

      expect(names.length).toBe(uniqueNames.length);
    });
  });

  describe("executeCommand", () => {
    describe("/help", () => {
      it("should list all commands when called without args", async () => {
        const context = createTestContext();
        const result = await executeCommand("/help", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("system_message");
        expect(result.message).toContain("Available commands:");
      });

      it("should show help for a specific command", async () => {
        const context = createTestContext();
        const result = await executeCommand("/help join", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("system_message");
        expect(result.message).toContain("join");
      });
    });

    describe("/join", () => {
      it("should switch to an unlocked channel", async () => {
        const context = createTestContext();
        const result = await executeCommand("/join #mysteries", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("switch_channel");
        expect(result.data?.channelId).toBe("mysteries");
      });

      it("should reject joining a locked channel", async () => {
        const context = createTestContext();
        const result = await executeCommand("/join #signals", context);

        expect(result.success).toBe(false);
        expect(result.action).toBe("system_message");
        expect(result.message).toContain("locked");
      });

      it("should reject unknown channels", async () => {
        const context = createTestContext();
        const result = await executeCommand("/join #unknown", context);

        expect(result.success).toBe(false);
        expect(result.action).toBe("system_message");
        expect(result.message).toContain("not found");
      });

      it("should show usage when no channel provided", async () => {
        const context = createTestContext();
        const result = await executeCommand("/join", context);

        expect(result.success).toBe(false);
        expect(result.message).toContain("Usage:");
      });
    });

    describe("/me", () => {
      it("should create an action message", async () => {
        const context = createTestContext();
        const result = await executeCommand("/me waves", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("action_message");
        expect(result.data?.messageContent).toBe("waves");
      });

      it("should show usage when no action provided", async () => {
        const context = createTestContext();
        const result = await executeCommand("/me", context);

        expect(result.success).toBe(false);
        expect(result.message).toContain("Usage:");
      });
    });

    describe("/clear", () => {
      it("should trigger clear display action", async () => {
        const context = createTestContext();
        const result = await executeCommand("/clear", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("clear_display");
      });
    });

    describe("/msg", () => {
      it("should open a query window for a known user", async () => {
        const context = createTestContext();
        const result = await executeCommand("/msg Anonymous", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("open_query");
        expect(result.data?.targetUserId).toBe("anonymous");
        expect(result.data?.targetUsername).toBe("Anonymous");
      });

      it("should send a message when content is provided", async () => {
        const context = createTestContext();
        const result = await executeCommand(
          "/msg Anonymous hello there",
          context,
        );

        expect(result.success).toBe(true);
        expect(result.action).toBe("send_message");
        expect(result.data?.targetUserId).toBe("anonymous");
        expect(result.data?.messageContent).toBe("hello there");
      });

      it("should reject unknown users", async () => {
        const context = createTestContext();
        const result = await executeCommand("/msg UnknownUser hello", context);

        expect(result.success).toBe(false);
        expect(result.message).toContain("not found");
      });

      it("should show usage when no user provided", async () => {
        const context = createTestContext();
        const result = await executeCommand("/msg", context);

        expect(result.success).toBe(false);
        expect(result.message).toContain("Usage:");
      });
    });

    describe("/part", () => {
      it("should close a query window", async () => {
        const context = createTestContext();
        context.currentChannel = "query-anonymous";
        const result = await executeCommand("/part", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("close_query");
        expect(result.data?.channelId).toBe("query-anonymous");
      });

      it("should reject parting from a regular channel", async () => {
        const context = createTestContext();
        context.currentChannel = "lobby";
        const result = await executeCommand("/part", context);

        expect(result.success).toBe(false);
        expect(result.message).toContain("query windows");
      });
    });

    describe("/list", () => {
      it("should list all visible channels", async () => {
        const context = createTestContext();
        const result = await executeCommand("/list", context);

        expect(result.success).toBe(true);
        expect(result.action).toBe("system_message");
        expect(result.message).toContain("Channels:");
        expect(result.message).toContain("#lobby");
      });
    });

    describe("unknown command", () => {
      it("should return an error for unknown commands", async () => {
        const context = createTestContext();
        const result = await executeCommand("/unknowncommand", context);

        expect(result.success).toBe(false);
        expect(result.action).toBe("system_message");
        expect(result.message).toContain("Unknown command");
      });
    });
  });
});
