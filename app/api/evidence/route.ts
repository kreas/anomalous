/**
 * Evidence API endpoint
 * Handles evidence inventory and examination
 */

import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth-helpers";
import {
  getAllEvidence,
  getEvidenceById,
  examineEvidence,
  connectEvidence,
  checkConnection,
  getUnexaminedCount,
  getEvidenceByType,
  addEvidence,
  getConnections,
} from "@/lib/evidence";
import { formatEvidenceContent } from "@/lib/evidence-formatters";

/**
 * GET /api/evidence - Get user's evidence inventory
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const evidenceId = searchParams.get("id");

  try {
    const userId = await getUserId();

    if (evidenceId) {
      // Get specific evidence
      const evidence = await getEvidenceById(userId, evidenceId);
      if (!evidence) {
        return NextResponse.json(
          { error: "Evidence not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ evidence });
    }

    // Get full inventory
    const items = await getAllEvidence(userId);
    const byType = await getEvidenceByType(userId);
    const unexaminedCount = await getUnexaminedCount(userId);

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
      { status: 500 },
    );
  }
}

/**
 * POST /api/evidence - Examine, connect, or add evidence
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();
    const { action, evidenceId, evidenceId1, evidenceId2, evidence } = body;

    if (action === "examine") {
      if (!evidenceId) {
        return NextResponse.json(
          { error: "evidenceId required" },
          { status: 400 },
        );
      }

      const examined = await examineEvidence(userId, evidenceId);
      const formattedContent = formatEvidenceContent(examined);
      return NextResponse.json({ evidence: examined, formattedContent });
    }

    if (action === "connect") {
      if (!evidenceId1 || !evidenceId2) {
        return NextResponse.json(
          { error: "evidenceId1 and evidenceId2 required" },
          { status: 400 },
        );
      }

      // First check if connection is possible
      const checkResult = await checkConnection(
        userId,
        evidenceId1,
        evidenceId2,
      );

      if (!checkResult.valid) {
        return NextResponse.json({
          connected: false,
          insight: checkResult.insight || "No connection found.",
        });
      }

      // Create the connection
      const connection = await connectEvidence(
        userId,
        evidenceId1,
        evidenceId2,
      );
      return NextResponse.json({ connected: true, connection });
    }

    if (action === "add") {
      if (!evidence) {
        return NextResponse.json(
          { error: "evidence object required" },
          { status: 400 },
        );
      }

      await addEvidence(userId, evidence);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[API] Evidence POST error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
