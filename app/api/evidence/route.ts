/**
 * Evidence API endpoint
 * Handles evidence inventory and examination
 */

import { NextResponse } from "next/server";
import { DEV_USER_ID } from "@/lib/constants";
import {
  getAllEvidence,
  getEvidenceById,
  examineEvidence,
  connectEvidence,
  getUnexaminedCount,
  getEvidenceByType,
  addEvidence,
} from "@/lib/evidence";

/**
 * GET /api/evidence - Get user's evidence inventory
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const evidenceId = searchParams.get("id");

  try {
    if (evidenceId) {
      // Get specific evidence
      const evidence = await getEvidenceById(DEV_USER_ID, evidenceId);
      if (!evidence) {
        return NextResponse.json(
          { error: "Evidence not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ evidence });
    }

    // Get full inventory
    const items = await getAllEvidence(DEV_USER_ID);
    const byType = await getEvidenceByType(DEV_USER_ID);
    const unexaminedCount = await getUnexaminedCount(DEV_USER_ID);

    return NextResponse.json({
      items,
      byType,
      unexaminedCount,
      total: items.length,
    });
  } catch (error) {
    console.error("[API] Evidence GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/evidence - Examine, connect, or add evidence
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, evidenceId, evidenceId1, evidenceId2, evidence } = body;

    if (action === "examine") {
      if (!evidenceId) {
        return NextResponse.json(
          { error: "evidenceId required" },
          { status: 400 }
        );
      }

      const examined = await examineEvidence(DEV_USER_ID, evidenceId);
      return NextResponse.json({ evidence: examined });
    }

    if (action === "connect") {
      if (!evidenceId1 || !evidenceId2) {
        return NextResponse.json(
          { error: "evidenceId1 and evidenceId2 required" },
          { status: 400 }
        );
      }

      const connection = await connectEvidence(
        DEV_USER_ID,
        evidenceId1,
        evidenceId2
      );
      return NextResponse.json({ connection });
    }

    if (action === "add") {
      if (!evidence) {
        return NextResponse.json(
          { error: "evidence object required" },
          { status: 400 }
        );
      }

      await addEvidence(DEV_USER_ID, evidence);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] Evidence POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
