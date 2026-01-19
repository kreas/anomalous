/**
 * Evidence CRUD operations for R2 storage
 * Implements US-2.2: Evidence Storage in R2
 */

import { getObject, putObject } from "./r2";
import { getUserEvidencePath } from "./paths";
import type {
  Evidence,
  EvidenceConnection,
  EvidenceInventory,
} from "@/types";
import { isValidEvidenceInventory } from "@/types";

/**
 * Create default empty evidence inventory
 */
export function createDefaultEvidenceInventory(): EvidenceInventory {
  return {
    items: [],
    connections: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get user's evidence inventory
 */
export async function getEvidenceInventory(
  userId: string
): Promise<EvidenceInventory | null> {
  const path = getUserEvidencePath(userId);
  const inventory = await getObject<EvidenceInventory>(path);

  if (inventory && isValidEvidenceInventory(inventory)) {
    return inventory;
  }
  return null;
}

/**
 * Get or create user's evidence inventory
 */
export async function getOrCreateEvidenceInventory(
  userId: string
): Promise<EvidenceInventory> {
  const existing = await getEvidenceInventory(userId);
  if (existing) {
    return existing;
  }

  const defaultInventory = createDefaultEvidenceInventory();
  await saveEvidenceInventory(userId, defaultInventory);
  return defaultInventory;
}

/**
 * Save user's evidence inventory
 */
export async function saveEvidenceInventory(
  userId: string,
  inventory: EvidenceInventory
): Promise<void> {
  const path = getUserEvidencePath(userId);
  const updated: EvidenceInventory = {
    ...inventory,
    lastUpdated: new Date().toISOString(),
  };
  await putObject(path, updated);
}

/**
 * Get all evidence items for a user
 */
export async function getAllEvidence(userId: string): Promise<Evidence[]> {
  const inventory = await getOrCreateEvidenceInventory(userId);
  return inventory.items;
}

/**
 * Add evidence to user's inventory
 */
export async function addEvidence(
  userId: string,
  evidence: Evidence
): Promise<void> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  // Check if evidence already exists
  if (inventory.items.some((e) => e.id === evidence.id)) {
    throw new Error(`Evidence already in inventory: ${evidence.id}`);
  }

  inventory.items.push(evidence);
  await saveEvidenceInventory(userId, inventory);
}

/**
 * Add multiple evidence items at once
 */
export async function addMultipleEvidence(
  userId: string,
  evidenceItems: Evidence[]
): Promise<void> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  for (const evidence of evidenceItems) {
    if (!inventory.items.some((e) => e.id === evidence.id)) {
      inventory.items.push(evidence);
    }
  }

  await saveEvidenceInventory(userId, inventory);
}

/**
 * Update an evidence item
 */
export async function updateEvidence(
  userId: string,
  evidenceId: string,
  updates: Partial<Evidence>
): Promise<Evidence> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  const index = inventory.items.findIndex((e) => e.id === evidenceId);
  if (index === -1) {
    throw new Error(`Evidence not found: ${evidenceId}`);
  }

  const updatedEvidence: Evidence = {
    ...inventory.items[index],
    ...updates,
  };

  inventory.items[index] = updatedEvidence;
  await saveEvidenceInventory(userId, inventory);

  return updatedEvidence;
}

/**
 * Remove evidence from inventory
 */
export async function removeEvidence(
  userId: string,
  evidenceId: string
): Promise<void> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  const index = inventory.items.findIndex((e) => e.id === evidenceId);
  if (index === -1) {
    throw new Error(`Evidence not found: ${evidenceId}`);
  }

  inventory.items.splice(index, 1);
  await saveEvidenceInventory(userId, inventory);
}

/**
 * Get a single evidence item by ID
 */
export async function getEvidenceById(
  userId: string,
  evidenceId: string
): Promise<Evidence | null> {
  const inventory = await getOrCreateEvidenceInventory(userId);
  return inventory.items.find((e) => e.id === evidenceId) || null;
}

/**
 * Get evidence items relevant to a specific case
 */
export async function getEvidenceForCase(
  userId: string,
  caseId: string
): Promise<Evidence[]> {
  const inventory = await getOrCreateEvidenceInventory(userId);
  return inventory.items.filter(
    (e) => e.caseRelevance && e.caseRelevance.includes(caseId)
  );
}

/**
 * Get unexamined evidence count
 */
export async function getUnexaminedCount(userId: string): Promise<number> {
  const inventory = await getOrCreateEvidenceInventory(userId);
  return inventory.items.filter((e) => !e.examined).length;
}

/**
 * Mark evidence as examined
 */
export async function examineEvidence(
  userId: string,
  evidenceId: string
): Promise<Evidence> {
  return updateEvidence(userId, evidenceId, {
    examined: true,
    examinedAt: new Date().toISOString(),
  });
}

/**
 * Get all discovered connections
 */
export async function getConnections(
  userId: string
): Promise<EvidenceConnection[]> {
  const inventory = await getOrCreateEvidenceInventory(userId);
  return inventory.connections;
}

/**
 * Add a new connection between evidence
 */
export async function addConnection(
  userId: string,
  connection: EvidenceConnection
): Promise<void> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  // Check if connection already exists (order-independent)
  const exists = inventory.connections.some(
    (c) =>
      (c.evidenceIds[0] === connection.evidenceIds[0] &&
        c.evidenceIds[1] === connection.evidenceIds[1]) ||
      (c.evidenceIds[0] === connection.evidenceIds[1] &&
        c.evidenceIds[1] === connection.evidenceIds[0])
  );

  if (exists) {
    throw new Error(
      `Connection already exists: ${connection.evidenceIds[0]} <-> ${connection.evidenceIds[1]}`
    );
  }

  inventory.connections.push(connection);
  await saveEvidenceInventory(userId, inventory);
}

/**
 * Check if two evidence items can be connected
 * Returns the insight if valid, null otherwise
 */
export async function checkConnection(
  userId: string,
  evidenceId1: string,
  evidenceId2: string
): Promise<{ valid: boolean; insight?: string; connection?: EvidenceConnection }> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  const evidence1 = inventory.items.find((e) => e.id === evidenceId1);
  const evidence2 = inventory.items.find((e) => e.id === evidenceId2);

  if (!evidence1) {
    return { valid: false, insight: `Evidence not found: ${evidenceId1}` };
  }
  if (!evidence2) {
    return { valid: false, insight: `Evidence not found: ${evidenceId2}` };
  }

  // Check if already connected
  const alreadyConnected = inventory.connections.some(
    (c) =>
      (c.evidenceIds[0] === evidenceId1 && c.evidenceIds[1] === evidenceId2) ||
      (c.evidenceIds[0] === evidenceId2 && c.evidenceIds[1] === evidenceId1)
  );

  if (alreadyConnected) {
    return { valid: false, insight: "These items are already connected." };
  }

  // Check if evidence1 lists evidence2 in connections or vice versa
  const connection1to2 = evidence1.connections?.includes(evidenceId2);
  const connection2to1 = evidence2.connections?.includes(evidenceId1);

  if (connection1to2 || connection2to1) {
    // Valid connection found - generate insight
    const insight = generateConnectionInsight(evidence1, evidence2);
    const connection: EvidenceConnection = {
      evidenceIds: [evidenceId1, evidenceId2],
      discoveredAt: new Date().toISOString(),
      insight,
      reward: {
        xp: calculateConnectionXP(evidence1, evidence2),
      },
    };

    return { valid: true, insight, connection };
  }

  return { valid: false, insight: "No clear connection between these items." };
}

/**
 * Attempt to connect two evidence items
 * Returns the connection if successful, throws if not
 */
export async function connectEvidence(
  userId: string,
  evidenceId1: string,
  evidenceId2: string
): Promise<EvidenceConnection> {
  const result = await checkConnection(userId, evidenceId1, evidenceId2);

  if (!result.valid || !result.connection) {
    throw new Error(result.insight || "Connection failed");
  }

  await addConnection(userId, result.connection);
  return result.connection;
}

/**
 * Generate insight text for a connection
 */
function generateConnectionInsight(
  evidence1: Evidence,
  evidence2: Evidence
): string {
  // This is a simple implementation - can be enhanced with templates
  const types = [evidence1.type, evidence2.type].sort().join(" + ");

  const insightTemplates: Record<string, string> = {
    "access_key + data_fragment":
      "The access key decrypts the data fragment, revealing hidden information.",
    "chat_log + testimony":
      "The testimony corroborates details mentioned in the chat log.",
    "chat_log + chat_log":
      "These conversations reference the same events from different perspectives.",
    "coordinates + data_fragment":
      "The coordinates point to the source of this data fragment.",
    "testimony + testimony":
      "These testimonies contradict each other on key details.",
    "access_key + coordinates":
      "The access key grants entry to the location specified.",
    "tool + data_fragment":
      "The tool can process this data fragment to extract more information.",
  };

  return (
    insightTemplates[types] ||
    `Connection discovered between ${evidence1.name} and ${evidence2.name}.`
  );
}

/**
 * Calculate XP reward for a connection
 */
function calculateConnectionXP(
  evidence1: Evidence,
  evidence2: Evidence
): number {
  const rarityScores: Record<string, number> = {
    common: 10,
    uncommon: 15,
    rare: 25,
    legendary: 50,
  };

  const score1 = rarityScores[evidence1.rarity] || 10;
  const score2 = rarityScores[evidence2.rarity] || 10;

  return Math.floor((score1 + score2) / 2);
}

/**
 * Get evidence grouped by type
 */
export async function getEvidenceByType(
  userId: string
): Promise<Record<string, Evidence[]>> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  const grouped: Record<string, Evidence[]> = {};
  for (const evidence of inventory.items) {
    if (!grouped[evidence.type]) {
      grouped[evidence.type] = [];
    }
    grouped[evidence.type].push(evidence);
  }

  return grouped;
}

/**
 * Get connections for a specific case
 */
export async function getConnectionsForCase(
  userId: string,
  caseId: string
): Promise<EvidenceConnection[]> {
  const inventory = await getOrCreateEvidenceInventory(userId);

  return inventory.connections.filter(
    (c) => c.reward?.caseProgress === caseId
  );
}
