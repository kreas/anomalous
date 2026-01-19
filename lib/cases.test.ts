import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDefaultUserCaseState,
  getAvailableCases,
  getAvailableCase,
  saveAvailableCase,
  getUserCaseState,
  getOrCreateUserCaseState,
  acceptCase,
  updateUserCase,
  completeCase,
  abandonCase,
  getActiveCase,
  MAX_ACTIVE_CASES,
} from "./cases";
import type { Case, UserCaseState } from "@/types";

// Mock the R2 module
vi.mock("./r2", () => ({
  getObject: vi.fn(),
  putObject: vi.fn(),
  listObjects: vi.fn(),
}));

import { getObject, putObject, listObjects } from "./r2";

const mockGetObject = vi.mocked(getObject);
const mockPutObject = vi.mocked(putObject);
const mockListObjects = vi.mocked(listObjects);

// Helper to create a valid test case
function createTestCase(overrides: Partial<Case> = {}): Case {
  return {
    id: "test-case-001",
    title: "Test Case",
    description: "A test case description",
    briefing: "Full briefing for the test case",
    type: "recovery",
    rarity: "common",
    status: "available",
    requiredEvidence: [
      { type: "data_fragment", count: 1, hint: "Find the data" },
    ],
    rewards: {
      xp: 50,
      fragments: 25,
      entityXp: 10,
    },
    postedAt: "2026-01-18T12:00:00.000Z",
    source: "system_alert",
    ...overrides,
  };
}

describe("cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDefaultUserCaseState", () => {
    it("creates empty state with timestamp", () => {
      const state = createDefaultUserCaseState();
      expect(state.active).toEqual([]);
      expect(state.history).toEqual([]);
      expect(state.lastUpdated).toBeDefined();
    });
  });

  describe("getAvailableCases", () => {
    it("returns empty array when no cases exist", async () => {
      mockListObjects.mockResolvedValue([]);

      const cases = await getAvailableCases();
      expect(cases).toEqual([]);
    });

    it("returns cases sorted by posted date", async () => {
      const case1 = createTestCase({
        id: "case-1",
        postedAt: "2026-01-17T12:00:00.000Z",
      });
      const case2 = createTestCase({
        id: "case-2",
        postedAt: "2026-01-18T12:00:00.000Z",
      });

      mockListObjects.mockResolvedValue([
        "cases/available/case-1.json",
        "cases/available/case-2.json",
      ]);
      mockGetObject.mockResolvedValueOnce(case1).mockResolvedValueOnce(case2);

      const cases = await getAvailableCases();
      expect(cases).toHaveLength(2);
      expect(cases[0].id).toBe("case-2"); // Newer first
      expect(cases[1].id).toBe("case-1");
    });

    it("filters out invalid cases", async () => {
      mockListObjects.mockResolvedValue(["cases/available/case-1.json"]);
      mockGetObject.mockResolvedValue({ invalid: "data" });

      const cases = await getAvailableCases();
      expect(cases).toEqual([]);
    });
  });

  describe("getAvailableCase", () => {
    it("returns case when found", async () => {
      const testCase = createTestCase();
      mockGetObject.mockResolvedValue(testCase);

      const result = await getAvailableCase("test-case-001");
      expect(result).toEqual(testCase);
    });

    it("returns null when case not found", async () => {
      mockGetObject.mockResolvedValue(null);

      const result = await getAvailableCase("nonexistent");
      expect(result).toBeNull();
    });
  });

  describe("saveAvailableCase", () => {
    it("saves case to correct path", async () => {
      const testCase = createTestCase();
      await saveAvailableCase(testCase);

      expect(mockPutObject).toHaveBeenCalledWith(
        "cases/available/test-case-001.json",
        testCase,
      );
    });
  });

  describe("getUserCaseState", () => {
    it("returns state when exists", async () => {
      const state: UserCaseState = {
        active: [createTestCase({ status: "accepted" })],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };
      mockGetObject.mockResolvedValue(state);

      const result = await getUserCaseState("user-123");
      expect(result).toEqual(state);
    });

    it("returns null when not found", async () => {
      mockGetObject.mockResolvedValue(null);

      const result = await getUserCaseState("user-123");
      expect(result).toBeNull();
    });
  });

  describe("getOrCreateUserCaseState", () => {
    it("returns existing state", async () => {
      const state: UserCaseState = {
        active: [],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };
      mockGetObject.mockResolvedValue(state);

      const result = await getOrCreateUserCaseState("user-123");
      expect(result).toEqual(state);
      expect(mockPutObject).not.toHaveBeenCalled();
    });

    it("creates and saves default state when none exists", async () => {
      mockGetObject.mockResolvedValue(null);

      const result = await getOrCreateUserCaseState("user-123");
      expect(result.active).toEqual([]);
      expect(result.history).toEqual([]);
      expect(mockPutObject).toHaveBeenCalled();
    });
  });

  describe("acceptCase", () => {
    it("accepts available case", async () => {
      const availableCase = createTestCase();
      const userState: UserCaseState = {
        active: [],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      // First call: getAvailableCase, Second call: getUserCaseState
      mockGetObject
        .mockResolvedValueOnce(availableCase)
        .mockResolvedValueOnce(userState);

      const result = await acceptCase("user-123", "test-case-001");

      expect(result.status).toBe("accepted");
      expect(result.acceptedAt).toBeDefined();
      expect(mockPutObject).toHaveBeenCalled();
    });

    it("throws when case not found", async () => {
      mockGetObject.mockResolvedValue(null);

      await expect(acceptCase("user-123", "nonexistent")).rejects.toThrow(
        "Case not found",
      );
    });

    it("throws when case already accepted", async () => {
      const activeCase = createTestCase({ status: "accepted" });
      const userState: UserCaseState = {
        active: [activeCase],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject
        .mockResolvedValueOnce(createTestCase())
        .mockResolvedValueOnce(userState);

      await expect(acceptCase("user-123", "test-case-001")).rejects.toThrow(
        "already accepted",
      );
    });

    it("throws when max cases reached", async () => {
      const userState: UserCaseState = {
        active: [
          createTestCase({ id: "case-1", status: "accepted" }),
          createTestCase({ id: "case-2", status: "accepted" }),
          createTestCase({ id: "case-3", status: "accepted" }),
        ],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject
        .mockResolvedValueOnce(createTestCase({ id: "case-4" }))
        .mockResolvedValueOnce(userState);

      await expect(acceptCase("user-123", "case-4")).rejects.toThrow(
        `Maximum active cases (${MAX_ACTIVE_CASES})`,
      );
    });
  });

  describe("updateUserCase", () => {
    it("updates case in active list", async () => {
      const activeCase = createTestCase({ status: "accepted" });
      const userState: UserCaseState = {
        active: [activeCase],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      const result = await updateUserCase("user-123", "test-case-001", {
        status: "in_progress",
      });

      expect(result.status).toBe("in_progress");
      expect(mockPutObject).toHaveBeenCalled();
    });

    it("throws when case not in active list", async () => {
      const userState: UserCaseState = {
        active: [],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      await expect(
        updateUserCase("user-123", "nonexistent", { status: "in_progress" }),
      ).rejects.toThrow("Active case not found");
    });
  });

  describe("completeCase", () => {
    it("moves case to history with outcome", async () => {
      const activeCase = createTestCase({ status: "in_progress" });
      const userState: UserCaseState = {
        active: [activeCase],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      const result = await completeCase(
        "user-123",
        "test-case-001",
        "solved",
        "The data was corrupted by a rogue process",
      );

      expect(result.status).toBe("solved");
      expect(result.outcome).toBe("solved");
      expect(result.theory).toBe("The data was corrupted by a rogue process");
      expect(result.solvedAt).toBeDefined();

      // Check that putObject was called with correct state
      const savedState = mockPutObject.mock.calls[0][1] as UserCaseState;
      expect(savedState.active).toHaveLength(0);
      expect(savedState.history).toHaveLength(1);
    });

    it("handles twist outcome", async () => {
      const activeCase = createTestCase({ status: "in_progress" });
      const userState: UserCaseState = {
        active: [activeCase],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      const result = await completeCase(
        "user-123",
        "test-case-001",
        "twist",
        "The corruption was intentional",
      );

      expect(result.status).toBe("solved"); // Twist maps to solved
      expect(result.outcome).toBe("twist");
    });
  });

  describe("abandonCase", () => {
    it("moves case to history as abandoned", async () => {
      const activeCase = createTestCase({ status: "accepted" });
      const userState: UserCaseState = {
        active: [activeCase],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      const result = await abandonCase("user-123", "test-case-001");

      expect(result.status).toBe("abandoned");
      expect(result.solvedAt).toBeDefined();

      const savedState = mockPutObject.mock.calls[0][1] as UserCaseState;
      expect(savedState.active).toHaveLength(0);
      expect(savedState.history).toHaveLength(1);
    });
  });

  describe("getActiveCase", () => {
    it("returns case when found in active list", async () => {
      const activeCase = createTestCase({ status: "accepted" });
      const userState: UserCaseState = {
        active: [activeCase],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      const result = await getActiveCase("user-123", "test-case-001");
      expect(result).toEqual(activeCase);
    });

    it("returns null when not found", async () => {
      const userState: UserCaseState = {
        active: [],
        history: [],
        lastUpdated: "2026-01-18T12:00:00.000Z",
      };

      mockGetObject.mockResolvedValue(userState);

      const result = await getActiveCase("user-123", "nonexistent");
      expect(result).toBeNull();
    });
  });
});
