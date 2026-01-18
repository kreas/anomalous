import { NextResponse } from "next/server";
import { DEV_USER_ID, ANONYMOUS_ENTITY_ID } from "@/lib/constants";
import { getOrCreateAnonymousCard } from "@/lib/entities";
import { getOrCreateRelationshipState } from "@/lib/relationships";
import { getModeForLevel, getDisplayName } from "@/lib/progression";
import type { Phase } from "@/types";

export interface EntityPresence {
  id: string;
  name: string;
  level: number;
  phase: Phase;
  status: "online" | "away";
  mode: string;
}

export async function GET() {
  const userId = DEV_USER_ID;

  try {
    // Load Anonymous entity and relationship state
    const [, relationship] = await Promise.all([
      getOrCreateAnonymousCard(userId),
      getOrCreateRelationshipState(userId, ANONYMOUS_ENTITY_ID),
    ]);

    const entity: EntityPresence = {
      id: ANONYMOUS_ENTITY_ID,
      name: getDisplayName(relationship),
      level: relationship.level,
      phase: relationship.phase,
      status: "online",
      mode: getModeForLevel(relationship.level),
    };

    return NextResponse.json({ entities: [entity] });
  } catch (error) {
    console.error("Failed to load entities:", error);

    // Return default entity on error
    const defaultEntity: EntityPresence = {
      id: ANONYMOUS_ENTITY_ID,
      name: "Anonymous",
      level: 1,
      phase: "awakening",
      status: "online",
      mode: "",
    };

    return NextResponse.json({ entities: [defaultEntity] });
  }
}
