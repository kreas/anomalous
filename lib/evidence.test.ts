import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDefaultEvidenceInventory,
  getEvidenceInventory,
  getOrCreateEvidenceInventory,
  saveEvidenceInventory,
  getAllEvidence,
  addEvidence,
  addMultipleEvidence,
  updateEvidence,
  removeEvidence,
  getEvidenceById,
  getEvidenceForCase,
  getUnexaminedCount,
  examineEvidence,
  getConnections,
  addConnection,
  checkConnection,
  connectEvidence,
  getEvidenceByType,
} from "./evidence";
import type { Evidence, EvidenceInventory, EvidenceConnection } from "@/types";

// Mock the R2 module
vi.mock("./r2", () => ({
  getObject: vi.fn(),
  putObject: vi.fn(),
}));

import { getObject, putObject } from "./r2";

const mockGetObject = vi.mocked(getObject);
const mockPutObject = vi.mocked(putObject);

// Helper to create test evidence
function createTestEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "test-evidence-001",
    name: "Test Evidence",
    description: "A piece of test evidence",
    type: "data_fragment",
    rarity: "common",
    acquiredAt: "2026-01-18T12:00:00.000Z",
    examined: false,
    ...overrides,
  };
}

// Helper to create test inventory
function createTestInventory(
  overrides: Partial<EvidenceInventory> = {}
): EvidenceInventory {
  return {
    items: [],
    connections: [],
    lastUpdated: "2026-01-18T12:00:00.000Z",
    ...overrides,
  };
}

describe("evidence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDefaultEvidenceInventory", () => {
    it("creates empty inventory with timestamp", () => {
      const inventory = createDefaultEvidenceInventory();
      expect(inventory.items).toEqual([]);
      expect(inventory.connections).toEqual([]);
      expect(inventory.lastUpdated).toBeDefined();
    });
  });

  describe("getEvidenceInventory", () => {
    it("returns inventory when exists", async () => {
      const inventory = createTestInventory({
        items: [createTestEvidence()],
      });
      mockGetObject.mockResolvedValue(inventory);

      const result = await getEvidenceInventory("user-123");
      expect(result).toEqual(inventory);
    });

    it("returns null when not found", async () => {
      mockGetObject.mockResolvedValue(null);

      const result = await getEvidenceInventory("user-123");
      expect(result).toBeNull();
    });
  });

  describe("getOrCreateEvidenceInventory", () => {
    it("returns existing inventory", async () => {
      const inventory = createTestInventory();
      mockGetObject.mockResolvedValue(inventory);

      const result = await getOrCreateEvidenceInventory("user-123");
      expect(result).toEqual(inventory);
      expect(mockPutObject).not.toHaveBeenCalled();
    });

    it("creates default when none exists", async () => {
      mockGetObject.mockResolvedValue(null);

      const result = await getOrCreateEvidenceInventory("user-123");
      expect(result.items).toEqual([]);
      expect(result.connections).toEqual([]);
      expect(mockPutObject).toHaveBeenCalled();
    });
  });

  describe("addEvidence", () => {
    it("adds evidence to inventory", async () => {
      const inventory = createTestInventory();
      mockGetObject.mockResolvedValue(inventory);

      const evidence = createTestEvidence();
      await addEvidence("user-123", evidence);

      expect(mockPutObject).toHaveBeenCalled();
      const savedInventory = mockPutObject.mock.calls[0][1] as EvidenceInventory;
      expect(savedInventory.items).toHaveLength(1);
      expect(savedInventory.items[0].id).toBe("test-evidence-001");
    });

    it("throws when evidence already exists", async () => {
      const evidence = createTestEvidence();
      const inventory = createTestInventory({ items: [evidence] });
      mockGetObject.mockResolvedValue(inventory);

      await expect(addEvidence("user-123", evidence)).rejects.toThrow(
        "already in inventory"
      );
    });
  });

  describe("addMultipleEvidence", () => {
    it("adds multiple evidence items", async () => {
      const inventory = createTestInventory();
      mockGetObject.mockResolvedValue(inventory);

      const items = [
        createTestEvidence({ id: "ev-1" }),
        createTestEvidence({ id: "ev-2" }),
      ];
      await addMultipleEvidence("user-123", items);

      const savedInventory = mockPutObject.mock.calls[0][1] as EvidenceInventory;
      expect(savedInventory.items).toHaveLength(2);
    });

    it("skips duplicates", async () => {
      const existing = createTestEvidence({ id: "ev-1" });
      const inventory = createTestInventory({ items: [existing] });
      mockGetObject.mockResolvedValue(inventory);

      const items = [
        createTestEvidence({ id: "ev-1" }), // duplicate
        createTestEvidence({ id: "ev-2" }), // new
      ];
      await addMultipleEvidence("user-123", items);

      const savedInventory = mockPutObject.mock.calls[0][1] as EvidenceInventory;
      expect(savedInventory.items).toHaveLength(2);
    });
  });

  describe("updateEvidence", () => {
    it("updates evidence in inventory", async () => {
      const evidence = createTestEvidence();
      const inventory = createTestInventory({ items: [evidence] });
      mockGetObject.mockResolvedValue(inventory);

      const result = await updateEvidence("user-123", "test-evidence-001", {
        examined: true,
      });

      expect(result.examined).toBe(true);
    });

    it("throws when evidence not found", async () => {
      const inventory = createTestInventory();
      mockGetObject.mockResolvedValue(inventory);

      await expect(
        updateEvidence("user-123", "nonexistent", { examined: true })
      ).rejects.toThrow("Evidence not found");
    });
  });

  describe("removeEvidence", () => {
    it("removes evidence from inventory", async () => {
      const evidence = createTestEvidence();
      const inventory = createTestInventory({ items: [evidence] });
      mockGetObject.mockResolvedValue(inventory);

      await removeEvidence("user-123", "test-evidence-001");

      const savedInventory = mockPutObject.mock.calls[0][1] as EvidenceInventory;
      expect(savedInventory.items).toHaveLength(0);
    });

    it("throws when evidence not found", async () => {
      const inventory = createTestInventory();
      mockGetObject.mockResolvedValue(inventory);

      await expect(removeEvidence("user-123", "nonexistent")).rejects.toThrow(
        "Evidence not found"
      );
    });
  });

  describe("getEvidenceById", () => {
    it("returns evidence when found", async () => {
      const evidence = createTestEvidence();
      const inventory = createTestInventory({ items: [evidence] });
      mockGetObject.mockResolvedValue(inventory);

      const result = await getEvidenceById("user-123", "test-evidence-001");
      expect(result).toEqual(evidence);
    });

    it("returns null when not found", async () => {
      const inventory = createTestInventory();
      mockGetObject.mockResolvedValue(inventory);

      const result = await getEvidenceById("user-123", "nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("getEvidenceForCase", () => {
    it("returns evidence relevant to case", async () => {
      const relevant = createTestEvidence({
        id: "ev-1",
        caseRelevance: ["case-001"],
      });
      const irrelevant = createTestEvidence({ id: "ev-2" });
      const inventory = createTestInventory({ items: [relevant, irrelevant] });
      mockGetObject.mockResolvedValue(inventory);

      const result = await getEvidenceForCase("user-123", "case-001");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ev-1");
    });
  });

  describe("getUnexaminedCount", () => {
    it("returns count of unexamined evidence", async () => {
      const items = [
        createTestEvidence({ id: "ev-1", examined: false }),
        createTestEvidence({ id: "ev-2", examined: true }),
        createTestEvidence({ id: "ev-3", examined: false }),
      ];
      const inventory = createTestInventory({ items });
      mockGetObject.mockResolvedValue(inventory);

      const count = await getUnexaminedCount("user-123");
      expect(count).toBe(2);
    });
  });

  describe("examineEvidence", () => {
    it("marks evidence as examined", async () => {
      const evidence = createTestEvidence({ examined: false });
      const inventory = createTestInventory({ items: [evidence] });
      mockGetObject.mockResolvedValue(inventory);

      const result = await examineEvidence("user-123", "test-evidence-001");

      expect(result.examined).toBe(true);
      expect(result.examinedAt).toBeDefined();
    });
  });

  describe("connections", () => {
    describe("getConnections", () => {
      it("returns all connections", async () => {
        const connection: EvidenceConnection = {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
        };
        const inventory = createTestInventory({ connections: [connection] });
        mockGetObject.mockResolvedValue(inventory);

        const result = await getConnections("user-123");
        expect(result).toHaveLength(1);
        expect(result[0].insight).toBe("Test insight");
      });
    });

    describe("addConnection", () => {
      it("adds connection to inventory", async () => {
        const inventory = createTestInventory();
        mockGetObject.mockResolvedValue(inventory);

        const connection: EvidenceConnection = {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
        };
        await addConnection("user-123", connection);

        const savedInventory = mockPutObject.mock
          .calls[0][1] as EvidenceInventory;
        expect(savedInventory.connections).toHaveLength(1);
      });

      it("throws when connection already exists", async () => {
        const connection: EvidenceConnection = {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
        };
        const inventory = createTestInventory({ connections: [connection] });
        mockGetObject.mockResolvedValue(inventory);

        await expect(addConnection("user-123", connection)).rejects.toThrow(
          "already exists"
        );
      });

      it("detects reverse order duplicates", async () => {
        const connection: EvidenceConnection = {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
        };
        const inventory = createTestInventory({ connections: [connection] });
        mockGetObject.mockResolvedValue(inventory);

        const reverseConnection: EvidenceConnection = {
          evidenceIds: ["ev-2", "ev-1"], // Reversed order
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Test insight",
        };

        await expect(
          addConnection("user-123", reverseConnection)
        ).rejects.toThrow("already exists");
      });
    });

    describe("checkConnection", () => {
      it("returns valid when connection exists in evidence", async () => {
        const ev1 = createTestEvidence({
          id: "ev-1",
          connections: ["ev-2"],
        });
        const ev2 = createTestEvidence({ id: "ev-2" });
        const inventory = createTestInventory({ items: [ev1, ev2] });
        mockGetObject.mockResolvedValue(inventory);

        const result = await checkConnection("user-123", "ev-1", "ev-2");
        expect(result.valid).toBe(true);
        expect(result.insight).toBeDefined();
        expect(result.connection).toBeDefined();
      });

      it("returns invalid when no connection defined", async () => {
        const ev1 = createTestEvidence({ id: "ev-1" });
        const ev2 = createTestEvidence({ id: "ev-2" });
        const inventory = createTestInventory({ items: [ev1, ev2] });
        mockGetObject.mockResolvedValue(inventory);

        const result = await checkConnection("user-123", "ev-1", "ev-2");
        expect(result.valid).toBe(false);
        expect(result.insight).toBe("No clear connection between these items.");
      });

      it("returns invalid when evidence not found", async () => {
        const inventory = createTestInventory();
        mockGetObject.mockResolvedValue(inventory);

        const result = await checkConnection("user-123", "ev-1", "ev-2");
        expect(result.valid).toBe(false);
        expect(result.insight).toContain("Evidence not found");
      });

      it("returns invalid when already connected", async () => {
        const ev1 = createTestEvidence({ id: "ev-1", connections: ["ev-2"] });
        const ev2 = createTestEvidence({ id: "ev-2" });
        const existingConnection: EvidenceConnection = {
          evidenceIds: ["ev-1", "ev-2"],
          discoveredAt: "2026-01-18T12:00:00.000Z",
          insight: "Already connected",
        };
        const inventory = createTestInventory({
          items: [ev1, ev2],
          connections: [existingConnection],
        });
        mockGetObject.mockResolvedValue(inventory);

        const result = await checkConnection("user-123", "ev-1", "ev-2");
        expect(result.valid).toBe(false);
        expect(result.insight).toBe("These items are already connected.");
      });
    });

    describe("connectEvidence", () => {
      it("creates and saves connection when valid", async () => {
        const ev1 = createTestEvidence({
          id: "ev-1",
          connections: ["ev-2"],
        });
        const ev2 = createTestEvidence({ id: "ev-2" });
        const inventory = createTestInventory({ items: [ev1, ev2] });
        mockGetObject.mockResolvedValue(inventory);

        const result = await connectEvidence("user-123", "ev-1", "ev-2");

        expect(result.evidenceIds).toEqual(["ev-1", "ev-2"]);
        expect(result.insight).toBeDefined();
        expect(mockPutObject).toHaveBeenCalled();
      });

      it("throws when connection invalid", async () => {
        const ev1 = createTestEvidence({ id: "ev-1" });
        const ev2 = createTestEvidence({ id: "ev-2" });
        const inventory = createTestInventory({ items: [ev1, ev2] });
        mockGetObject.mockResolvedValue(inventory);

        await expect(connectEvidence("user-123", "ev-1", "ev-2")).rejects.toThrow(
          "No clear connection"
        );
      });
    });
  });

  describe("getEvidenceByType", () => {
    it("groups evidence by type", async () => {
      const items = [
        createTestEvidence({ id: "ev-1", type: "chat_log" }),
        createTestEvidence({ id: "ev-2", type: "data_fragment" }),
        createTestEvidence({ id: "ev-3", type: "chat_log" }),
      ];
      const inventory = createTestInventory({ items });
      mockGetObject.mockResolvedValue(inventory);

      const result = await getEvidenceByType("user-123");

      expect(result["chat_log"]).toHaveLength(2);
      expect(result["data_fragment"]).toHaveLength(1);
    });
  });
});
